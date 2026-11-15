// Arka plan kurulumunun ve çizim dokularının tekrar kullanımının doğru çalıştığını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenery } from '../src/world/scenery/background.js';

test('Garden scenery stays within a small render-object budget and reuses cached textures', () => {
    const cached = new Set();
    let objects = 0;
    let generated = 0;
    const item = {};
    for (const method of ['setScrollFactor', 'setDepth', 'setOrigin']) item[method] = () => item;
    const graphics = {};
    for (const method of ['fillStyle', 'fillEllipse', 'fillRect', 'fillRoundedRect', 'fillCircle', 'destroy']) graphics[method] = () => graphics;
    graphics.generateTexture = key => { cached.add(key); generated++; };
    const scene = {
        cameras: { main: { setBackgroundColor() {} } },
        textures: { exists: key => cached.has(key) },
        make: { graphics: () => graphics },
        add: {}
    };
    for (const method of ['circle', 'image', 'tileSprite', 'rectangle']) {
        scene.add[method] = () => { objects++; return item; };
    }
    createScenery(scene, 3840);
    assert.ok(objects <= 20, `Too many background objects: ${objects}`);
    assert.equal(generated, 6);
    createScenery(scene, 3840);
    assert.equal(generated, 6, 'Restart must reuse textures rather than regenerate them');
});
