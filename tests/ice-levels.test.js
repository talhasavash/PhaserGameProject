// Buz dünyasının bölüm sırasını, platform kayganlığını ve kar yayıcısının sınırlarını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { levels, worldForLevel } from '../.build/src/world/levels/level.js';
import { worldThreeLevels as iceLevels } from '../.build/src/world/levels/world3.js';
import { isIcySurface } from '../.build/src/world/terrain/terrain.js';
import { createScenery } from '../.build/src/world/scenery/background.js';

test('World 3 fills chapters 31–45 and preserves the original ice layouts', () => {
    assert.equal(levels.length, 45);
    assert.equal(iceLevels.length, 15);
    assert.deepEqual(levels.slice(30), iceLevels);
    assert.deepEqual(iceLevels.slice(0, 5).map(level => level.theme), ['glacier', 'iceCave', 'aurora', 'crystalPalace', 'glacier']);
    for (const [index, level] of iceLevels.slice(0, 4).entries()) {
        assert.equal(worldForLevel(index + 30).id, 3);
        assert.ok(level.platforms.every(platform => platform.ice));
        assert.ok(level.ice.every(ice => level.gaps.every(gap => ice.x + ice.width <= gap.x || ice.x >= gap.x + gap.width)));
        assert.ok(level.fruits.filter(item => ['apple', 'orange', 'pear', 'grapes', 'banana', 'strawberry'].includes(item.type)).length >= 15);
        for (const enemy of level.enemies.filter(enemy => enemy.platform !== undefined)) {
            const platform = level.platforms[enemy.platform];
            assert.ok(enemy.minX - 31 >= platform.x && enemy.maxX + 31 <= platform.x + platform.width);
        }
    }
});

test('Ice applies on the supported platform as well as the ground, never through the air or a dry ledge', () => {
    const level = { groundY: 520, ice: [{ x: 100, width: 300 }],
        platforms: [{ x: 200, y: 350, width: 150, ice: true }, { x: 200, y: 250, width: 150 }] };
    const player = { x: 250, body: { bottom: 520, blocked: { down: true }, touching: { down: false } } };
    assert.equal(isIcySurface(level, player), true);
    player.body.bottom = 350;
    assert.equal(isIcySurface(level, player), true);
    player.body.bottom = 250;
    assert.equal(isIcySurface(level, player), false);
    player.body.bottom = 350;
    player.body.blocked.down = false;
    assert.equal(isIcySurface(level, player), false);
    player.body.touching.down = true;
    assert.equal(isIcySurface(level, player), true);
    player.x = 450;
    assert.equal(isIcySurface(level, player), false);
});

test('Snow uses one capped emitter, resizes with the screen and releases listeners on exit', () => {
    const cached = new Set();
    let generated = 0;
    let objects = 0;
    const emitters = [];
    const item = {};
    for (const method of ['setOrigin', 'setScrollFactor', 'setDepth']) item[method] = () => item;
    const graphics = {};
    for (const method of ['fillStyle', 'fillCircle', 'fillRect', 'fillTriangle', 'fillEllipse', 'lineStyle', 'lineBetween', 'destroy']) graphics[method] = () => graphics;
    graphics.generateTexture = key => { cached.add(key); generated++; };
    const scene = {
        cameras: { main: { setBackgroundColor() {} } },
        textures: { exists: key => cached.has(key) }, make: { graphics: () => graphics },
        scale: Object.assign(new EventEmitter(), { width: 900, height: 500 }), events: new EventEmitter(),
        tweens: { add() {} },
        add: {
            circle() { objects++; return item; }, tileSprite() { objects++; return item; },
            particles(x, y, key, config) {
                objects++;
                const emitter = { config, setConfig(next) { this.config = next; },
                    setScrollFactor(value) { this.scroll = value; return this; }, setDepth() { return this; } };
                emitters.push(emitter); return emitter;
            }
        }
    };
    for (const level of iceLevels) {
        const before = objects;
        createScenery(scene, level.width, level.theme);
        assert.ok(objects - before <= 7);
        const snow = emitters.at(-1);
        assert.equal(snow.scroll, 0, 'Snow stays in the viewport while the camera travels');
        assert.equal(snow.config.maxAliveParticles, 65);
        assert.ok(snow.config.frequency >= 140);
        scene.scale.width = 1100;
        scene.scale.emit('resize');
        assert.equal(snow.config.x.max, 1120);
        assert.equal(snow.config.advance, 0);
        scene.events.emit('shutdown');
        assert.equal(scene.scale.listenerCount('resize'), 0);
        assert.equal(scene.events.listenerCount('destroy'), 0);
    }
    assert.equal(generated, 17);
    createScenery(scene, iceLevels[0].width, iceLevels[0].theme);
    scene.events.emit('destroy');
    assert.equal(scene.scale.listenerCount('resize'), 0);
    assert.equal(generated, 17, 'Restart reuses snow and scenery textures');
});
