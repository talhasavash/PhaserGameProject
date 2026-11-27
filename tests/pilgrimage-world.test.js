// Kâbe yolculuğunun rotalarını, farklı bölüm sonu görsellerini ve fizik/ilerleme akışını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from '../node_modules/phaser/src/physics/matter-js/CustomMain.js';
import {worldFiveLevels} from '../.build/src/world/levels/world5.js';
import {levels, worlds, isPlayableLevel} from '../.build/src/world/levels/level.js';
import {validateLevel} from '../.build/src/world/model/definitions.js';
import {kaabaDesign} from '../.build/src/world/scenery/kaaba.js';
import {createReligiousLandmark} from '../.build/src/world/scenery/background.js';
import {BackgroundBuilder} from '../.build/src/world/scenery/BackgroundBuilder.js';
import {matterWorldForLevel} from '../.build/src/physics/matter/levelWorld.js';
import {createLabWorld} from '../.build/src/physics/matter/MatterObjects.js';
import {BridgeMechanisms} from '../.build/src/physics/matter/BridgeMechanisms.js';
import {labPhysics, FixedStepSimulation} from '../.build/src/physics/matter/simulation.js';
import {labMotion} from '../.build/src/physics/matter/movement.js';
import {worldUnlockedLevels, unlockWorldNext} from '../.build/src/data/progress.js';

function reachableSurfaces(level) {
    const surfaces = [];
    let start = 0;
    for (const gap of [...level.gaps, {x: level.width, width: 0}]) {
        if (gap.x > start) surfaces.push({x: start, width: gap.x - start, y: level.groundY});
        start = gap.x + gap.width;
    }
    surfaces.push(...level.platforms);
    const reached = new Set(surfaces.flatMap((s, i) => level.spawn.x >= s.x && level.spawn.x <= s.x + s.width ? [i] : []));
    let changed = true;
    while (changed) {
        changed = false;
        for (const from of [...reached]) for (let to = 0; to < surfaces.length; to++) {
            if (reached.has(to)) continue;
            const a = surfaces[from], b = surfaces[to], discriminant = 590 ** 2 - 3200 * (a.y - b.y);
            if (discriminant < 0) continue;
            const distance = Math.max(0, b.x - a.x - a.width, a.x - b.x - b.width);
            if (distance + 24 < 265 * (590 + Math.sqrt(discriminant)) / 1600) {reached.add(to); changed = true;}
        }
    }
    return surfaces.filter((_, i) => reached.has(i));
}

test('World 5 fills 61–75; all 90 chapter slots now contain playable levels without shifting other worlds', () => {
    assert.equal(worldFiveLevels.length, 15);
    assert.deepEqual(levels.slice(60, 75), worldFiveLevels);
    assert.equal(worlds[4].start, 60);
    assert.equal(worlds[5].start, 75);
    assert.equal(levels.filter(Boolean).length, 90);
    for (let index = 0; index < 90; index++) assert.ok(isPlayableLevel(index));
    for (const level of worldFiveLevels) {
        assert.doesNotThrow(() => validateLevel(level));
        assert.equal(level.exitType, 'kaaba');
        assert.equal(level.fruits.filter(f => f.type === 'star').length, 3);
        assert.ok(level.fountains.length);
        assert.ok(level.fruits.some(f => ['bead', 'lantern', 'crescent', 'mat'].includes(f.type)));
        assert.ok(level.fruits.every(f => f.x < level.key.x));
    }
    for (const field of ['platforms', 'mosqueStyle']) assert.equal(new Set(worldFiveLevels.map(l => JSON.stringify(l[field]))).size, 15);
    assert.equal(new Set(worldFiveLevels.map(l => JSON.stringify(l.environment.scenery))).size, 15);
});

test('Every Arcade star, fountain and exit is reachable from spawn and no fountain stands in a pit', () => {
    for (const level of worldFiveLevels) {
        for (const fountain of level.fountains) {
            assert.ok(level.gaps.every(g => fountain.x + 50 < g.x || fountain.x - 50 > g.x + g.width), level.name);
        }
        if (level.physics === 'matter') continue;
        const surfaces = reachableSurfaces(level);
        for (const p of [...level.fruits.filter(f => f.type === 'star'), level.key, level.exit,
            ...level.fountains.map(f => ({x: f.x, y: 480}))]) {
            assert.ok(surfaces.some(s => p.x > s.x && p.x < s.x + s.width && p.y <= s.y && p.y > s.y - 65), `${level.name}: ${JSON.stringify(p)}`);
        }
        assert.equal(surfaces.length, level.platforms.length + level.gaps.length + 1, level.name);
    }
});

function drawingScene() {
    const cached = new Set(), images = [], tweens = [], shapes = [];
    const graphic = new Proxy({}, {get(target, key) {
        if (key === 'generateTexture') return name => cached.add(name);
        return () => graphic;
    }});
    const shape = (...args) => {
        const object = {args, visible: true, setVisible(v) {this.visible = v; return this;}};
        for (const name of ['setOrigin', 'setDepth', 'setStrokeStyle', 'setScale', 'setAlpha', 'setScrollFactor']) object[name] = () => object;
        shapes.push(object); return object;
    };
    const scene = {level: {exitType: 'kaaba'}, textures: {exists: key => cached.has(key)},
        make: {graphics: () => graphic}, cameras: {main: {setBackgroundColor() {}}},
        add: {image(...args) {images.push(args); return shape(...args);}, ellipse: shape, rectangle: shape},
        tweens: {add(tween) {tweens.push(tween);}}};
    return {scene, cached, images, tweens, shapes};
}

test('All 15 Kaaba images differ, share cached textures and open once at the actual exit sensor', () => {
    const {scene, cached, images, tweens, shapes} = drawingScene();
    assert.equal(new Set(worldFiveLevels.map((_, i) => JSON.stringify(kaabaDesign(i)))).size, 15);
    for (const level of worldFiveLevels) {
        scene.level = level;
        const door = createReligiousLandmark(scene, level.exit.x, level.theme, level.mosqueStyle);
        const glow = shapes.findLast(s => s.visible === false);
        assert.equal(glow.args[0], level.exit.x);
        const before = tweens.length;
        door.open(); door.open();
        assert.equal(tweens.length, before + 1);
        assert.equal(glow.visible, true);
        assert.equal(tweens.at(-1).targets.args[0], level.exit.x);
    }
    assert.equal(cached.size, 15);
    for (const level of worldFiveLevels) createReligiousLandmark(scene, level.exit.x, level.theme, level.mosqueStyle);
    assert.equal(cached.size, 15);
    assert.equal(new Set(images.map(i => i[2])).size, 15);
});

test('Pilgrimage scenery renders its reusable motifs within a bounded object budget', () => {
    const {scene, cached} = drawingScene();
    for (const level of worldFiveLevels) {
        new BackgroundBuilder(scene).build(level.environment.scenery, level.width, level.groundY);
        assert.ok(level.environment.scenery.parts.some(p => p.type === 'minaret'));
        assert.ok(level.environment.scenery.parts.some(p => p.type === 'rosette'));
        assert.ok(level.environment.scenery.parts.reduce((n, p) => n + (p.repeat?.count ?? 1), 0) <= 80);
    }
    const first = cached.size;
    for (const level of worldFiveLevels) new BackgroundBuilder(scene).build(level.environment.scenery, level.width, level.groundY);
    assert.equal(cached.size, first);
});

test('Four Matter journeys settle with finite bodies and reset their cargo-operated bridges', () => {
    const chapters = worldFiveLevels.filter(l => l.physics === 'matter');
    assert.equal(chapters.length, 4);
    for (const level of chapters) {
        const before = JSON.stringify(level);
        const create = () => {
            const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
            const world = createLabWorld(Matter, matterWorldForLevel(level), bodies => Matter.Composite.add(engine.world, bodies));
            const mechanism = new BridgeMechanisms(Matter, world, level.mechanisms);
            return {engine, world, mechanism};
        };
        const {engine, world, mechanism} = create();
        for (const m of level.mechanisms) {
            const cargo = world.objects.get(m.cargoId).body;
            const half = (cargo.bounds.max.y - cargo.bounds.min.y) / 2;
            Matter.Body.setPosition(cargo, {x: m.plate.x, y: m.plate.y - half});
            Matter.Body.setVelocity(cargo, {x: 0, y: 0});
            mechanism.update(500);
            assert.equal(world.objects.get(m.plankId).body.isStatic, false);
        }
        for (let i = 0; i < 240; i++) Matter.Engine.update(engine, FixedStepSimulation.stepMs);
        for (const body of Matter.Composite.allBodies(engine.world)) assert.ok([body.position.x, body.position.y, body.angle].every(Number.isFinite));
        const fresh = create().world;
        for (const m of level.mechanisms) assert.ok(fresh.objects.get(m.plankId).body.isStatic);
        assert.equal(JSON.stringify(level), before);
    }
});

test('Completing 75 unlocks 76 through the existing global progress rule; the final courtyard is peaceful', () => {
    let saved = '75';
    globalThis.window = {localStorage: {getItem: () => saved, setItem(key, value) {saved = value;}}};
    assert.equal(worldUnlockedLevels(worlds[5], 90), 0);
    unlockWorldNext(worlds[4], 74, 90);
    assert.equal(worldUnlockedLevels(worlds[5], 90), 1);
    const last = worldFiveLevels.at(-1);
    assert.ok(last.enemies.every(e => Math.max(e.x, e.maxX ?? e.x) < 3000));
    assert.ok(last.gaps.every(g => g.x + g.width < last.exit.x - 1000));
});
