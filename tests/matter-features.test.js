// Baskı plakasıyla köprü kurmayı, hafif düşmanları ve can/koruma akışını gerçek Matter gövdeleriyle doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from '../node_modules/phaser/src/physics/matter-js/CustomMain.js';
import {BridgeMechanisms, cargoOnPlate} from '../.build/src/physics/matter/BridgeMechanisms.js';
import {MatterEnemies, matterEnemyFrame} from '../.build/src/physics/matter/MatterEnemies.js';
import {makePhysicsPuzzle} from '../.build/src/world/model/physicsPuzzles.js';
import {worldSixLevels} from '../.build/src/world/levels/world6.js';
import {matterWorldForLevel} from '../.build/src/physics/matter/levelWorld.js';
import {createLabWorld, wakeTouchedObjects} from '../.build/src/physics/matter/MatterObjects.js';
import {labPhysics, FixedStepSimulation} from '../.build/src/physics/matter/simulation.js';
import {labMotion, moveLabPlayer} from '../.build/src/physics/matter/movement.js';

function bridgeWorld(variant = 0) {
    const puzzle = makePhysicsPuzzle('bridge', 0, 'test', variant);
    const level = {...worldSixLevels[0], spawn: {x: 20, y: 480}, props: puzzle.props, links: puzzle.links,
        mechanisms: puzzle.mechanisms, gaps: puzzle.gaps, platforms: [], matterSurfaces: []};
    const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
    const world = createLabWorld(Matter, matterWorldForLevel(level), objects => Matter.Composite.add(engine.world, objects));
    const mechanism = new BridgeMechanisms(Matter, world, puzzle.mechanisms);
    return {puzzle, world, mechanism, step(frames) {
        for (let i = 0; i < frames; i++) {mechanism.update(FixedStepSimulation.stepMs); Matter.Engine.update(engine, FixedStepSimulation.stepMs);}
    }};
}

test('A bridge stays latched until the correct cargo rests on the plate; player weight alone cannot release it', () => {
    for (const variant of [0, 1, 2]) {
        const {puzzle, world, mechanism, step} = bridgeWorld(variant);
        const d = puzzle.mechanisms[0], plank = world.objects.get(d.plankId).body;
        const cargo = world.objects.get(d.cargoId).body;
        Matter.Body.setPosition(world.player, {x: d.plate.x, y: 480});
        step(180);
        assert.equal(plank.isStatic, true);
        assert.equal(mechanism.states[0].released, false);
        assert.ok(Math.abs(plank.angle) < .1);
        Matter.Body.setPosition(world.player, {x: 20, y: 480});
        Matter.Body.setPosition(cargo, {x: d.plate.x, y: 520 - (cargo.bounds.max.y - cargo.bounds.min.y) / 2});
        Matter.Body.setVelocity(cargo, {x: 0, y: 0});
        assert.equal(cargoOnPlate(cargo, d.plate), true);
        step(30);
        assert.equal(plank.isStatic, true, 'A brief touch is not a completed placement');
        step(50);
        assert.equal(mechanism.states[0].released, true);
        assert.equal(plank.isStatic, false);
        step(600);
        assert.ok(plank.bounds.max.x > puzzle.gaps[0].x + puzzle.gaps[0].width + 25, 'Released timber creates a usable crossing');
        const fresh = bridgeWorld(variant);
        assert.equal(fresh.mechanism.states[0].released, false);
        assert.equal(fresh.world.objects.get(d.plankId).body.isStatic, true);
    }
});

test('Leaving a plate resets its hold timer and translated mechanisms keep the matching object IDs', () => {
    const {puzzle, world, mechanism} = bridgeWorld();
    const d = puzzle.mechanisms[0], cargo = world.objects.get(d.cargoId).body;
    Matter.Body.setPosition(cargo, {x: d.plate.x, y: 480});
    mechanism.update(200);
    assert.ok(mechanism.states[0].charge > 0);
    Matter.Body.setPosition(cargo, {x: d.plate.x - 120, y: 480});
    mechanism.update(100);
    assert.equal(mechanism.states[0].charge, 0);
    assert.equal(mechanism.states[0].released, false);
    const moved = makePhysicsPuzzle('bridge', 1500, 'moved');
    assert.equal(moved.mechanisms[0].plate.x, d.plate.x + 1500);
    assert.ok(moved.props.some(p => p.id === moved.mechanisms[0].cargoId));
    assert.ok(moved.props.some(p => p.id === moved.mechanisms[0].plankId));
});

function enemyFixture() {
    const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
    const world = createLabWorld(Matter, {width: 1000, groundY: 520, spawn: {x: 20, y: 480},
        surfaces: [{x: 500, y: 620, width: 1000, height: 200}],
        objects: [{type: 'crate', id: 'cargo', x: 100, y: 484, width: 72, height: 72, fixedRotation: true}], hinges: []},
        objects => Matter.Composite.add(engine.world, objects));
    for (const event of ['collisionStart', 'collisionActive']) Matter.Events.on(engine, event, e => wakeTouchedObjects(Matter, world.player, e.pairs));
    let hits = 0;
    const sprite = {setScale() {return this;}, setDepth() {return this;}, setPosition() {return this;}, setFlipX() {return this;}};
    const scene = {add: {sprite: () => ({...sprite})}, matter: {world: {add: body => Matter.Composite.add(engine.world, body)}},
        tweens: {add() {}}, sound: {play() {}}};
    const definition = {type: 'snail', x: 250, y: 502, minX: 225, maxX: 280, speed: 32, weapon: false};
    const enemies = new MatterEnemies(scene, Matter, world.player, [definition], () => hits++);
    return {engine, world, enemies, definition, hits: () => hits};
}

test('Enemy patrols turn continuously within short ranges and stationary enemies stay still', () => {
    const enemy = {x: 250, y: 502, minX: 225, maxX: 280, speed: 32};
    let previous = matterEnemyFrame(enemy, 0).x;
    for (let time = 10; time < 10000; time += 10) {
        const frame = matterEnemyFrame(enemy, time);
        assert.ok(frame.x >= 225 && frame.x <= 280);
        assert.ok(Math.abs(frame.x - previous) <= .321);
        previous = frame.x;
    }
    assert.equal(matterEnemyFrame({...enemy, movement: {type: 'stationary'}}, 5000).x, 250);
});

test('Enemy sensors do not block cargo; stomping disables a guard once and gives a small rebound', () => {
    const {engine, world, enemies, hits} = enemyFixture();
    for (let i = 0; i < 480; i++) {
        enemies.update(i * FixedStepSimulation.stepMs);
        moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs);
        Matter.Engine.update(engine, FixedStepSimulation.stepMs);
    }
    assert.ok(world.objects.get('cargo').body.position.x > 350);
    const guard = enemies.actors[0], touch = enemies.actionFor(guard.body);
    Matter.Body.setPosition(world.player, {x: guard.body.position.x, y: guard.body.position.y});
    Matter.Body.setVelocity(world.player, {x: 0, y: 0});
    touch();
    assert.equal(hits(), 1);
    Matter.Body.setPosition(world.player, {x: guard.body.position.x, y: guard.body.bounds.min.y - 25});
    Matter.Body.setVelocity(world.player, {x: 0, y: 2});
    touch(); touch();
    assert.equal(guard.active, false);
    assert.equal(guard.body.collisionFilter.mask, 0);
    assert.equal(world.player.velocity.y, -4.5);
    assert.equal(hits(), 1);
});

test('Matter damage costs one heart per protection window and resets with a fresh attempt', async () => {
    globalThis.Phaser = {Scene: class {}};
    const {MatterGameScene} = await import('../.build/src/game/MatterGameScene.js');
    const scene = new MatterGameScene('boy', 75);
    scene.init();
    let paused = false, sounds = 0;
    const nodes = new Map(['touch-controls', 'fall-result', 'retry-fall'].map(id => [id, {hidden: true, focus() {}}]));
    globalThis.document = {getElementById: id => nodes.get(id)};
    Object.assign(scene, {runtime: {world: {player: {position: {x: 0}}}, library: {Body: {setVelocity() {}}}, setPaused() {paused = true;}},
        sound: {play() {sounds++;}}, tweens: {add() {}}, player: {setTexture() {}, setAlpha() {}}, updateHud() {}});
    const enemy = {body: {position: {x: 20}}};
    scene.hitEnemy(enemy); scene.hitEnemy(enemy);
    assert.equal(scene.gameState.hearts, 2);
    scene.elapsed = 1999; scene.hitEnemy(enemy);
    assert.equal(scene.gameState.hearts, 2);
    scene.elapsed = 2000; scene.hitEnemy(enemy);
    assert.equal(scene.gameState.hearts, 1);
    scene.elapsed = 4000; scene.hitEnemy(enemy); scene.hitEnemy(enemy);
    assert.equal(scene.gameState.hearts, 0);
    assert.equal(paused, true);
    assert.equal(nodes.get('fall-result').hidden, false);
    assert.equal(sounds, 3);
    scene.init();
    assert.equal(scene.gameState.hearts, 3);
    assert.equal(scene.hurtUntil, 0);
});

test('Workshop guards leave stars, pressure plates and spawning areas clear; layouts include new physical routes', () => {
    assert.ok(worldSixLevels.some(level => level.platforms.some(p => p.y === 200)));
    assert.ok(worldSixLevels.some(level => level.props.some(p => p.type === 'metal' && p.height === 48)));
    for (const level of worldSixLevels) {
        assert.equal(level.enemies.length, 2);
        for (const enemy of level.enemies) {
            assert.ok(enemy.speed >= 30 && enemy.speed <= 45);
            assert.equal(enemy.weapon, false);
            assert.ok(level.gaps.every(g => enemy.minX > g.x + g.width || enemy.maxX < g.x));
            assert.ok(level.fruits.filter(p => p.type === 'star').every(star => Math.abs(enemy.x - star.x) > 100));
            assert.ok((level.mechanisms ?? []).every(m => Math.abs(enemy.x - m.plate.x) > 100));
        }
    }
});
