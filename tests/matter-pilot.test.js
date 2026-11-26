// Ana oyunun motor seçimini, kapalı pilot akışını ve ortak Matter dünyasının temiz kurulumunu doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from '../node_modules/phaser/src/physics/matter-js/CustomMain.js';
import {levels, isPlayableLevel, worldForLevel} from '../.build/src/world/levels/level.js';
import {physicsForLevel, restartOrChangeLevel, isLocalMatterPreview} from '../.build/src/game/sceneRouting.js';
import {matterWorldForLevel, validateMatterLevel} from '../.build/src/physics/matter/levelWorld.js';
import {createLabWorld} from '../.build/src/physics/matter/MatterObjects.js';
import {labMotion} from '../.build/src/physics/matter/movement.js';
import {labPhysics, FixedStepSimulation} from '../.build/src/physics/matter/simulation.js';
import {labMotion as workshopMotion} from '../.build/examples/matter-lab/movement.js';
import {createGameState, recordFruit, takeKey} from '../.build/src/game/rules.js';
import {EventEmitter} from 'node:events';
import {MatterRuntime} from '../.build/src/physics/matter/MatterRuntime.js';

globalThis.Phaser = {Scene: class {}};
const {createLevelScene, levelPhysicsConfig} = await import('../.build/src/game/SceneFactory.js');
const {GameScene} = await import('../.build/src/game/GameScene.js');
const {MatterGameScene} = await import('../.build/src/game/MatterGameScene.js');
const pilotIndex = levels.findIndex(level => level?.id === 'matter-pilot');
const pilot = levels[pilotIndex];

test('Existing 45 chapters retain Arcade; private pilot is slot 46 and cannot unlock through progress', () => {
    assert.equal(pilotIndex, 45);
    assert.equal(worldForLevel(pilotIndex).id, 4);
    assert.ok(levels.slice(0, 45).every(level => physicsForLevel(level) === 'arcade'));
    assert.equal(physicsForLevel(pilot), 'matter');
    assert.equal(pilot.draft, true);
    assert.equal(isPlayableLevel(pilotIndex), false);
    for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
        assert.equal(isLocalMatterPreview({hostname, search: '?pilot=matter'}, pilot), true);
        assert.equal(isLocalMatterPreview({hostname, search: ''}, pilot), false);
    }
    assert.equal(isLocalMatterPreview({hostname: 'talhasavash.github.io', search: '?pilot=matter'}, pilot), false);
    assert.equal(isLocalMatterPreview({hostname: 'localhost', search: '?pilot=matter'}, levels[0]), false);
});

test('Scene factory selects only the requested engine and reuses accepted workshop settings', () => {
    assert.equal(labMotion, workshopMotion);
    const arcade = createLevelScene('girl', 12, 850);
    const matter = createLevelScene('girl', pilotIndex, 850);
    assert.ok(arcade instanceof GameScene);
    assert.ok(matter instanceof MatterGameScene);
    arcade.init(); matter.init();
    assert.equal(arcade.carriedScore, 850);
    assert.equal(matter.gameState.score, 850);
    assert.deepEqual(levelPhysicsConfig(0), {default: 'arcade', arcade: {gravity: {x: 0, y: 1600}, debug: false}});
    assert.deepEqual(levelPhysicsConfig(pilotIndex), {default: 'matter', matter: {
        ...labPhysics, gravity: {x: 0, y: labMotion.gravity}, autoUpdate: false, debug: true
    }});
});

test('Same-engine transitions restart; engine changes carry character and score through the main launcher', () => {
    const calls = [];
    const scene = {level: levels[0], character: 'girl', scene: {restart: data => calls.push(['restart', data])},
        game: {events: {emit: (...args) => calls.push(args)}}};
    restartOrChangeLevel(scene, {levelIndex: 1, score: 400});
    restartOrChangeLevel(scene, {levelIndex: pilotIndex, score: 800});
    scene.level = pilot;
    restartOrChangeLevel(scene, {levelIndex: pilotIndex, score: 800});
    restartOrChangeLevel(scene, {levelIndex: 0, score: 0});
    assert.deepEqual(calls, [['restart', {levelIndex: 1, score: 400}],
        ['level-change', {levelIndex: pilotIndex, score: 800, character: 'girl'}],
        ['restart', {levelIndex: pilotIndex, score: 800}],
        ['level-change', {levelIndex: 0, score: 0, character: 'girl'}]]);
});

test('Pilot uses real Matter bodies; floors leave the authored pit open and restart restores props and bridge', () => {
    const before = JSON.stringify(pilot);
    const definition = matterWorldForLevel(pilot);
    const make = () => {
        const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
        const world = createLabWorld(Matter, definition, bodies => Matter.Composite.add(engine.world, bodies));
        return {world, engine};
    };
    const {world, engine} = make();
    const pit = pilot.gaps[0];
    assert.equal(Matter.Query.point(world.surfaces, {x: pit.x + pit.width / 2, y: pilot.groundY + 10}).length, 0);
    assert.equal(Matter.Query.point(world.surfaces, {x: 100, y: pilot.groundY + 10}).length, 1);
    for (const platform of pilot.platforms) assert.equal(Matter.Query.point(world.surfaces,
        {x: platform.x + platform.width / 2, y: platform.y + 2}).length, 1);
    Matter.Body.setVelocity(world.objects.get('free-box').body, {x: 6, y: -3});
    for (let step = 0; step < 120; step++) Matter.Engine.update(engine, FixedStepSimulation.stepMs);
    const fresh = make().world;
    assert.notEqual(fresh.player, world.player);
    for (const source of pilot.props) {
        const body = fresh.objects.get(source.id).body;
        assert.deepEqual(body.position, {x: source.x, y: source.y});
        assert.equal(body.angle, source.angle ?? 0);
    }
    assert.equal(fresh.links.length, 1);
    assert.equal(fresh.objects.get('step-box').body.inertia, Infinity);
    assert.ok(Number.isFinite(fresh.objects.get('free-box').body.inertia));
    assert.equal(JSON.stringify(pilot), before);
});

test('Matter rejects unimplemented Arcade behaviors and malformed props before loading the scene', () => {
    assert.doesNotThrow(() => validateMatterLevel(pilot));
    assert.throws(() => validateMatterLevel({...pilot, enemies: [{type: 'hedgehog', x: 500}]}), /desteklenmeyen/);
    assert.throws(() => validateMatterLevel({...pilot, props: [pilot.props[0], pilot.props[0]]}), /benzersiz/);
    assert.throws(() => validateMatterLevel({...pilot, props: [{...pilot.props[0], width: 0}]}), /boyutu/);
    assert.throws(() => validateMatterLevel({...pilot, links: [{...pilot.links[0], objectId: 'missing'}]}), /bulunamadı/);
});

test('Shared runtime walks, jumps, pauses and releases controls using real 120Hz physics', () => {
    const target = () => ({addEventListener() {}, removeEventListener() {}, classList: {toggle() {}}});
    globalThis.document = {...target(), getElementById: () => target()};
    globalThis.window = target();
    globalThis.Phaser.Physics = {Matter: {Matter}};
    globalThis.Phaser.Input = {Keyboard: {JustDown(key) {const down = key.justDown; key.justDown = false; return down;}}};
    const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
    const world = new EventEmitter();
    for (const name of ['beforeUpdate', 'collisionStart', 'collisionActive']) Matter.Events.on(engine, name,
        event => world.emit(name.toLowerCase(), event));
    Object.assign(world, {add: bodies => Matter.Composite.add(engine.world, bodies),
        step: delta => Matter.Engine.update(engine, delta), pause() {}, resume() {}});
    const sprite = {anims: {stop() {}}, setScale() {return this;}, setDepth() {return this;},
        setPosition() {}, setRotation() {}, setTexture() {}, setFlipX() {}, play() {}};
    const graphics = {setDepth() {return this;}, clear() {}, lineStyle() {}, lineBetween() {}};
    const scene = {matter: {world}, add: {sprite: () => sprite, graphics: () => graphics},
        anims: {exists: () => true, pauseAll() {}, resumeAll() {}}, time: {now: 0},
        input: {keyboard: {addKeys: names => Object.fromEntries(names.split(',').map(name => [name, {isDown: false}]))}}};
    const runtime = new MatterRuntime(scene, {...matterWorldForLevel(pilot), objects: [], links: []}, 'boy-');
    const step = frames => {for (let i = 0; i < frames; i++) {scene.time.now += 1000 / 60; runtime.update(scene.time.now, 1000 / 60);}};
    step(60);
    assert.ok(runtime.groundedAt > 800, 'Feet sensor observes support before walking or jumping');
    runtime.keys.RIGHT.isDown = true;
    step(40);
    runtime.keys.RIGHT.isDown = false;
    step(30);
    assert.ok(runtime.world.player.position.x > 200);
    let jumps = 0;
    runtime.onJump = () => jumps++;
    runtime.keys.UP.isDown = runtime.keys.UP.justDown = true;
    step(15);
    assert.equal(jumps, 1);
    assert.ok(runtime.world.player.position.y < 410, 'Held jump rises above the floor');
    const position = {...runtime.world.player.position};
    runtime.setPaused(true);
    step(30);
    assert.deepEqual(runtime.world.player.position, position);
    runtime.keys.UP.isDown = false;
    runtime.setPaused(false);
    step(90);
    assert.ok(runtime.world.player.position.y > 475);
    runtime.destroy();
});

test('Pilot completion requires stars and key, shows the shared result, and does not persist unlocks', () => {
    const run = createGameState();
    const calls = [];
    let delayed;
    const elements = new Map(['touch-controls', 'game-result', 'result-title', 'result-verse', 'next-level', 'play-again', 'menu-button']
        .map(id => [id, {hidden: true, focus() {}, click() {calls.push('menu');}}]));
    globalThis.document = {getElementById: id => elements.get(id)};
    globalThis.window = {localStorage: {getItem() {return '20';}, setItem() {assert.fail('Pilot must not save progress');}}};
    const glow = {setDepth() {return this;}};
    const scene = {level: pilot, levelIndex: pilotIndex, gameState: run, characterSkin: 'boy',
        runtime: {setPaused: state => calls.push(['paused', state]), library: {Body: {setVelocity() {}}}, world: {player: {}}},
        player: {anims: {stop() {}}, setTexture() {}}, add: {circle: () => glow},
        tweens: {add() {}}, sound: {play() {}}, time: {delayedCall(ms, callback) {assert.equal(ms, 1200); delayed = callback;}}};
    MatterGameScene.prototype.reachExit.call(scene);
    assert.equal(run.complete, false);
    for (let i = 0; i < 3; i++) recordFruit(run, `star-${i}`, 'star');
    MatterGameScene.prototype.reachExit.call(scene);
    assert.equal(run.complete, false);
    takeKey(run);
    MatterGameScene.prototype.reachExit.call(scene);
    MatterGameScene.prototype.reachExit.call(scene);
    assert.equal(run.complete, true);
    assert.deepEqual(calls, [['paused', true]]);
    assert.equal(elements.get('game-result').hidden, true);
    delayed();
    assert.equal(elements.get('game-result').hidden, false);
    assert.equal(elements.get('result-verse').textContent, pilot.verse.text);
    MatterGameScene.prototype.continueAfterResult.call(scene);
    assert.deepEqual(calls, [['paused', true], 'menu']);
});

test('Matter collectible sensors deactivate immediately and three distinct stars expose the key once', () => {
    const scene = new MatterGameScene('boy', pilotIndex);
    scene.init();
    const engine = Matter.Engine.create();
    const sounds = [];
    let opened = 0;
    const image = () => ({visible: false, x: 0, y: 0, scaleX: .75, scaleY: .75,
        setScale() {return this;}, setDepth() {return this;}, setVisible(value) {this.visible = value; return this;}});
    Object.assign(scene, {runtime: {library: Matter}, keySprite: image(), door: {open() {opened++;}},
        matter: {world: {add: body => Matter.Composite.add(engine.world, body), remove: body => Matter.Composite.remove(engine.world, body)}},
        add: {image}, tweens: {add() {}, killTweensOf() {}}, collectSparks: {emitParticleAt() {}},
        sound: {play: key => sounds.push(key)}, updateHud() {}});
    const stars = pilot.fruits.filter(item => item.type === 'star');
    for (const star of stars) scene.createItem(star);
    const actions = [...scene.sensors.values()];
    for (const [index, collect] of actions.entries()) {
        collect(); collect();
        assert.equal(scene.gameState.stars, index + 1);
        assert.equal(scene.keySprite.visible, index === 2);
    }
    assert.equal(scene.sensors.size, 1, 'Collected bodies are removed; only the key remains');
    const take = [...scene.sensors.values()][0];
    take(); take();
    assert.equal(scene.gameState.hasKey, true);
    assert.equal(scene.sensors.size, 0);
    assert.equal(opened, 1);
    assert.deepEqual(sounds, ['collect', 'collect', 'collect', 'key']);
});
