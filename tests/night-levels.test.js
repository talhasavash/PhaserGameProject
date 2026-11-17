// Yeni gece bölümlerinin sırasını, güvenli bekleme yerlerini ve çizim maliyetini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, worldForLevel } from '../src/world/levels/level.js';
import { nightLevels } from '../src/world/levels/nightLevels.js';
import { firstJourney } from '../src/world/levels/world3.js';
import { createScenery } from '../src/world/scenery/background.js';
import { createMosque } from '../src/world/scenery/background.js';
import { bossLift } from '../src/gameplay/hazards.js';

test('The first night chapters preserve 16–19 while the campaign now reaches chapter 30', () => {
    assert.equal(levels[15], firstJourney);
    assert.deepEqual(levels.slice(16, 19), nightLevels);
    assert.equal(nightLevels.length, 3);
    assert.equal(levels.length, 30);
    assert.equal(levels[30], undefined);
    for (let i = 16; i < 19; i++) assert.equal(worldForLevel(i).id, 2);
    assert.deepEqual(nightLevels.map(level => level.theme), ['moonwood', 'nightRuins', 'nightKeep']);
});

test('Night stars have slower, vanishing guards and fruit is scattered across the scene', () => {
    for (const level of nightLevels) {
        const guards = level.enemies.filter(enemy => enemy.platform !== undefined);
        assert.equal(guards.length, 3);
        assert.ok(guards.every(enemy => enemy.speed >= 120 && enemy.speed <= 170));
        assert.ok(guards.every(enemy => enemy.visibility.hiddenMs >= 2400));
        for (const star of level.fruits.filter(item => item.type === 'star')) {
            assert.ok(guards.some(enemy => {
                const platform = level.platforms[enemy.platform];
                return Math.abs(enemy.x - star.x) < 40 && platform.y - star.y === 35;
            }));
        }
        assert.ok(level.fruits.filter(item => ['apple', 'orange', 'grapes', 'pear', 'banana', 'strawberry'].includes(item.type)).length >= 20);
        assert.ok(level.enemies.every(enemy => enemy.visibility && enemy.visibility.hiddenMs >= 1800));
        assert.ok(level.enemies.every(enemy => enemy.speed <= 170));
        const scattered = level.fruits.filter(item => item.id.startsWith('scattered-'));
        assert.ok(new Set(scattered.map(item => item.y)).size >= 5);
        assert.ok(Math.max(...scattered.map(item => item.x)) - Math.min(...scattered.map(item => item.x)) > level.width * 0.7);
    }
});

test('Night mosques have one, two and four minarets with different facades', () => {
    const sizes = [];
    const towers = [];
    for (const level of nightLevels) {
        const calls = [];
        const shape = {};
        for (const method of ['setDepth', 'setOrigin', 'setStrokeStyle', 'setVisible', 'add']) shape[method] = () => shape;
        const scene = { add: Object.fromEntries(['rectangle', 'ellipse', 'circle', 'triangle', 'text', 'container'].map(type =>
            [type, (...args) => { calls.push({ type, args }); return shape; }])) };
        assert.equal(typeof createMosque(scene, 500, level.theme).open, 'function');
        towers.push(calls.filter(call => call.type === 'triangle').length);
        sizes.push(Math.max(...calls.filter(call => call.type === 'rectangle').map(call => call.args[2])));
    }
    assert.deepEqual(towers, [1, 2, 4]);
    assert.equal(new Set(sizes).size, 3);
});

test('Night patrols stay on their ledges and critical landmarks have clear ground', () => {
    for (const level of nightLevels) {
        for (const enemy of level.enemies) {
            assert.ok(enemy.x >= enemy.minX && enemy.x <= enemy.maxX);
            if (enemy.platform !== undefined) {
                const platform = level.platforms[enemy.platform];
                assert.ok(enemy.minX - 31 >= platform.x && enemy.maxX + 31 <= platform.x + platform.width);
                continue;
            }
            if (enemy.y !== undefined) continue; // Uçan ve sarkan düşmanlar çukur üzerinden geçebilir.
            for (const gap of level.gaps) {
                const halfWidth = enemy.type === 'ogre' ? 48 * enemy.scale : 31;
                assert.ok(enemy.maxX + halfWidth < gap.x || enemy.minX - halfWidth > gap.x + gap.width);
            }
        }
        for (const point of [level.spawn, level.checkpoint, level.key, level.exit, ...level.fountains]) {
            assert.ok(level.gaps.every(gap => point.x < gap.x - 30 || point.x > gap.x + gap.width + 30));
            assert.ok((level.columns || []).every(column => Math.abs(column.x - point.x) > column.width / 2 + 35));
        }
        const heights = level.platforms.map(platform => platform.y);
        assert.ok(Math.max(...heights) - Math.min(...heights) >= 140, 'Routes span multiple heights even when random offsets fall in the same rounded bucket');
    }
    const guardian = nightLevels[2].enemies.at(-1);
    let windowMs = 0;
    for (let time = 0; time < guardian.jump.period; time += 10) {
        if (bossLift(time, guardian.jump) > 85) windowMs += 10;
    }
    assert.ok(windowMs > (58 * guardian.scale + 24) / 265 * 1000 + 200);
    assert.ok(nightLevels[2].gaps.length > nightLevels[0].gaps.length);
});

test('All night scenes have distinct cached layers with a fixed object budget on restart', () => {
    const cached = new Set();
    let generated = 0;
    let objects = 0;
    const colors = [];
    const item = {};
    for (const method of ['setOrigin', 'setScrollFactor', 'setDepth']) item[method] = () => item;
    const graphics = {};
    for (const method of ['fillStyle', 'fillCircle', 'fillRect', 'fillTriangle', 'fillRoundedRect', 'fillEllipse', 'lineStyle', 'lineBetween', 'strokeRect', 'destroy']) graphics[method] = () => graphics;
    graphics.generateTexture = key => { cached.add(key); generated++; };
    const scene = {
        cameras: { main: { setBackgroundColor: color => colors.push(color) } },
        textures: { exists: key => cached.has(key) }, make: { graphics: () => graphics },
        add: Object.fromEntries(['circle', 'tileSprite'].map(method => [method, () => { objects++; return item; }]))
    };
    for (const level of nightLevels) {
        const before = objects;
        createScenery(scene, level.width, level.theme);
        assert.ok(objects - before <= 10, 'World width must not multiply render objects');
    }
    assert.equal(new Set(colors).size, 3);
    assert.equal(generated, 12);
    for (const level of nightLevels) createScenery(scene, level.width, level.theme);
    assert.equal(generated, 12, 'Restart reuses the existing layers');
});
