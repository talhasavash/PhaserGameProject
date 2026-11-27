// Ateş dünyasının tam rotalarını, lav boşluklarını, yeni saldırıları ve gerçek Matter kurulumunu doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from '../node_modules/phaser/src/physics/matter-js/CustomMain.js';
import {worldFourLevels} from '../.build/src/world/levels/world4.js';
import {levels, worlds, isPlayableLevel} from '../.build/src/world/levels/level.js';
import {validateLevel} from '../.build/src/world/model/definitions.js';
import {enemyBehaviors} from '../.build/src/actors/enemies/EnemyCatalog.js';
import {resolveWeapon} from '../.build/src/actors/enemies/WeaponCatalog.js';
import {matterWorldForLevel} from '../.build/src/physics/matter/levelWorld.js';
import {createLabWorld} from '../.build/src/physics/matter/MatterObjects.js';
import {BridgeMechanisms} from '../.build/src/physics/matter/BridgeMechanisms.js';
import {labPhysics, FixedStepSimulation} from '../.build/src/physics/matter/simulation.js';
import {labMotion} from '../.build/src/physics/matter/movement.js';
import {bossLift} from '../.build/src/actors/enemies/EnemyController.js';

function route(level) {
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
            const a = surfaces[from], b = surfaces[to], rise = a.y - b.y;
            const discriminant = 590 ** 2 - 2 * 1600 * rise;
            if (discriminant < 0) continue;
            const range = 265 * (590 + Math.sqrt(discriminant)) / 1600;
            const distance = Math.max(0, b.x - a.x - a.width, a.x - b.x - b.width);
            if (distance + 24 < range) {reached.add(to); changed = true;}
        }
    }
    return surfaces.filter((_, i) => reached.has(i));
}

test('World 4 fills chapters 46–60, preserves other worlds and keeps the private pilot out of production', () => {
    assert.equal(worldFourLevels.length, 15);
    assert.deepEqual(levels.slice(45, 60), worldFourLevels);
    assert.equal(worlds[3].start, 45);
    assert.equal(worlds[4].start, 60);
    assert.equal(worlds[5].start, 75);
    for (const level of worldFourLevels) assert.doesNotThrow(() => validateLevel(level));
    for (let i = 45; i < 60; i++) assert.ok(isPlayableLevel(i));
    assert.ok(!levels.some(level => level?.id === 'matter-pilot'));
    assert.equal(new Set(worldFourLevels.map(l => l.id)).size, 15);
    for (const key of ['platforms', 'mosqueStyle']) assert.equal(new Set(worldFourLevels.map(l => JSON.stringify(l[key]))).size, 15);
    assert.equal(new Set(worldFourLevels.map(l => JSON.stringify(l.environment.scenery))).size, 15);
});

test('Arcade stars, key and exit are reachable from the actual spawn rather than assuming all ground is reachable', () => {
    for (const level of worldFourLevels.filter(l => l.physics !== 'matter')) {
        const reached = route(level);
        for (const point of [...level.fruits.filter(f => f.type === 'star'), level.key, level.exit]) {
            assert.ok(reached.some(s => point.x > s.x && point.x < s.x + s.width &&
                point.y <= s.y && point.y > s.y - 65), `${level.name}: unreachable ${JSON.stringify(point)}`);
        }
        assert.ok(reached.length >= level.platforms.length, level.name);
        for (const point of [level.spawn, level.checkpoint, level.key, level.exit]) {
            assert.ok(level.gaps.every(g => point.x < g.x - 20 || point.x > g.x + g.width + 20), level.name);
        }
        assert.ok(level.fruits.length >= 14);
        const images = level.environment.scenery.parts.reduce((n, p) => n + (p.repeat?.count ?? 1), 0);
        assert.ok(images < 80);
    }
});

test('Three lava seas contain no ground between shores and all intervening landings are jumpable', () => {
    const seas = worldFourLevels.filter(l => l.gaps.some(g => g.width > 3000));
    assert.equal(seas.length, 3);
    for (const level of seas) {
        const definition = matterWorldForLevel(level), gap = level.gaps[0];
        const engine = Matter.Engine.create();
        const world = createLabWorld(Matter, definition, bodies => Matter.Composite.add(engine.world, bodies));
        for (let x = gap.x + 20; x < gap.x + gap.width - 20; x += 40) {
            assert.equal(Matter.Query.point(world.surfaces, {x, y: 530}).length, 0, `${level.name}: invisible floor`);
        }
        assert.equal(route(level).length, level.platforms.length + 2, level.name);
        assert.equal(gap.style, 'magma');
    }
});

test('Every fire chapter has a fountain on safe ground, outside columns, enemies and low ceilings', () => {
    for (const level of worldFourLevels) {
        assert.ok(level.fountains.length > 0, level.name);
        for (const fountain of level.fountains) {
            assert.ok(level.gaps.every(g => fountain.x + 50 < g.x || fountain.x - 50 > g.x + g.width), level.name);
            assert.ok((level.columns ?? []).every(c => Math.abs(c.x - fountain.x) > c.width / 2 + 70), level.name);
            assert.ok(level.enemies.filter(e => e.y === undefined).every(e =>
                fountain.x < Math.min(e.x, e.minX ?? e.x) - 85 ||
                fountain.x > Math.max(e.x, e.maxX ?? e.x) + 85), `${level.name}: enemy at the fountain`);
            assert.ok(level.platforms.every(p => p.y + 28 < 440 || fountain.x + 42 < p.x ||
                fountain.x - 42 > p.x + p.width), `${level.name}: low ceiling at the fountain`);
            assert.ok(fountain.x < level.exit.x - 100);
        }
    }
});

test('Three fire chapters use accepted Matter settings and cargo-operated lava bridges reset cleanly', () => {
    const physical = worldFourLevels.filter(l => l.physics === 'matter');
    assert.equal(physical.length, 3);
    for (const level of physical) {
        const before = JSON.stringify(level);
        const make = () => {
            const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
            const world = createLabWorld(Matter, matterWorldForLevel(level), bodies => Matter.Composite.add(engine.world, bodies));
            const mechanism = new BridgeMechanisms(Matter, world, level.mechanisms);
            return {engine, world, mechanism};
        };
        const {engine, world, mechanism} = make();
        for (const m of level.mechanisms) {
            const plank = world.objects.get(m.plankId).body, cargo = world.objects.get(m.cargoId).body;
            assert.ok(plank.isStatic);
            const height = cargo.bounds.max.y - cargo.bounds.min.y;
            Matter.Body.setPosition(cargo, {x: m.plate.x, y: m.plate.y - height / 2});
            Matter.Body.setVelocity(cargo, {x: 0, y: 0});
            mechanism.update(500);
            assert.equal(plank.isStatic, false);
        }
        for (let step = 0; step < 120; step++) Matter.Engine.update(engine, FixedStepSimulation.stepMs);
        assert.ok(Number.isFinite(world.player.position.x));
        const fresh = make().world;
        for (const m of level.mechanisms) assert.ok(fresh.objects.get(m.plankId).body.isStatic);
        assert.equal(JSON.stringify(level), before);
    }
});

test('Overhead sun follows at bounded speed, stays above the route and does not invade safe shores', () => {
    const definition = enemyBehaviors.get('overhead');
    let velocity = {x: 0, y: 0};
    const enemy = {x: 900, y: 145, setVelocityX(x) {velocity.x = x;}, setVelocityY(y) {velocity.y = y;}};
    const patrol = {minX: 500, maxX: 3000, baseY: 145};
    const scene = {player: {x: 100}};
    for (const x of [100, 1500, 3900, 100]) {
        scene.player.x = x;
        for (let i = 0; i < 240; i++) {
            definition.update(scene, enemy, patrol, 16, {speed: 82, distance: 100});
            assert.ok(Math.abs(velocity.x) <= 82);
            enemy.x += velocity.x * .016;
            enemy.y += velocity.y * .016;
            assert.ok(enemy.x >= 500 && enemy.x <= 3000);
            assert.equal(enemy.y, 145);
        }
    }
    scene.cameras = {main: {scrollY: 280}};
    enemy.displayHeight = 100;
    for (let i = 0; i < 120; i++) {
        definition.update(scene, enemy, patrol, 16);
        enemy.y += velocity.y * .016;
    }
    assert.ok(enemy.y - 50 > 280, 'The whole sun enters the visible phone sky');
    scene.cameras.main.scrollY = 0;
    definition.update(scene, enemy, patrol, 16);
    assert.ok(velocity.y < 0, 'Climbing makes the sun return upward smoothly');
});

test('Mouth enemies face the player and the final drake leaves enough time to pass underneath', () => {
    const face = enemyBehaviors.get('face-player');
    let flipped;
    const sprite = {x: 500, setFlipX(value) {flipped = value;}};
    const patrol = {};
    face.update({player: {x: 100}}, sprite, patrol, 16);
    assert.equal(flipped, true);
    face.update({player: {x: 900}}, sprite, patrol, 16);
    assert.equal(flipped, false);
    const level = worldFourLevels.at(-1), boss = level.enemies.find(e => e.type === 'magma-drake');
    let clearMs = 0;
    for (let t = 0; t < boss.jump.period; t += 10) if (bossLift(t, boss.jump) > 120) clearMs += 10;
    assert.ok(clearMs > (85 * boss.scale + 50) / 265 * 1000 + 200);
    assert.ok(level.fruits.filter(f => f.type === 'star').every(f => f.x < boss.x - 500));
    assert.ok(level.gaps.every(g => g.x + g.width < boss.x - 350));
});

test('Fire mouths shoot both ways; sun embers aim down once and every shot expires', () => {
    for (const type of ['flame-orb', 'sun-ember']) {
        const {definition, config} = resolveWeapon({weapon: {type}});
        for (const direction of [-1, 1]) {
            const scene = {player: {x: 1000 + direction * 180, y: 480}};
            const enemy = {x: 1000, y: type === 'sun-ember' ? 145 : 470, displayWidth: 100, displayHeight: 80};
            const shot = {...definition.launch(scene, enemy, config, 0), startAt: 1000};
            const frame = definition.frame(1500, shot);
            assert.ok((frame.x - shot.x) * direction > 0);
            if (type === 'sun-ember') assert.ok(frame.y > shot.y);
            scene.player.x = 5000;
            assert.deepEqual(definition.frame(1500, shot), frame, 'Projectiles never home in after launch');
            assert.ok(definition.frame(4300, shot).done);
        }
    }
});
