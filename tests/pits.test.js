// Çukurlarda fizik zemini oluşmadığını ve çukur görsellerinin doğru kurulduğunu doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTerrain } from '../src/world/terrain/terrain.js';
import { createPitArt } from '../src/world/terrain/pits.js';
import { brokenPass } from '../src/world/levels/world2.js';
import { levels } from '../src/world/levels/level.js';

test('The new jump chapter has twelve real holes with solid landing islands between them', () => {
    const floors = [];
    const scene = {
        level: brokenPass,
        physics: { add: { staticGroup: () => ({ add: body => floors.push(body) }) } },
        textures: { exists: () => true },
        add: {
            rectangle: (x, y, width) => ({ x, y, width, setVisible() { return this; } }),
            image: () => ({ setOrigin() { return this; }, setDepth() { return this; } })
        }
    };
    createTerrain(scene);
    assert.equal(brokenPass.gaps.length, 12);
    assert.equal(floors.length, 13);
    for (const gap of brokenPass.gaps) {
        assert.ok(floors.every(floor => floor.x + floor.width / 2 <= gap.x || floor.x - floor.width / 2 >= gap.x + gap.width));
    }
    assert.ok(brokenPass.gaps.at(-1).width > brokenPass.gaps[0].width);
    assert.equal(brokenPass.fireRain, undefined, 'Jump timing is the main challenge');
});

test('Pit drawing is cached per theme and width, and never creates a physical floor', () => {
    const cached = new Set();
    let generated = 0;
    let images = 0;
    const g = {};
    for (const name of ['fillStyle', 'fillPoints', 'fillTriangle', 'lineStyle', 'lineBetween', 'fillRect', 'fillEllipse', 'destroy']) g[name] = () => g;
    g.generateTexture = (key, width, height) => { generated++; cached.add(key); assert.ok(width >= 104 && height > 80); };
    const scene = {
        textures: { exists: key => cached.has(key) }, make: { graphics: () => g },
        add: { image() { images++; return { setOrigin() { return this; }, setDepth() { return this; } }; } }
    };
    for (const level of levels) {
        scene.level = level;
        for (const gap of level.gaps || []) createPitArt(scene, gap);
    }
    const firstPass = generated;
    for (const level of levels) {
        scene.level = level;
        for (const gap of level.gaps || []) createPitArt(scene, gap);
    }
    assert.equal(generated, firstPass);
    assert.ok(images > generated);
});
