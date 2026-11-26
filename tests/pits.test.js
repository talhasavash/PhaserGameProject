// Çukurlarda fizik zemini oluşmadığını ve çukur görsellerinin doğru kurulduğunu doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTerrain } from '../.build/src/world/terrain/terrain.js';
import { createPitArt } from '../.build/src/world/terrain/pits.js';
import { brokenPass } from '../.build/src/world/levels/world1.js';
import { levels } from '../.build/src/world/levels/level.js';
import { defineLevel, stars } from '../.build/src/world/model/definitions.js';
import { createWorldCatalog } from '../.build/src/world/model/catalog.js';
import { platformThemes } from '../.build/src/world/terrain/platforms.js';

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

test('Each pit can override its drawing style without changing the chapter theme or gap coordinates', () => {
    const cached = new Set();
    const colors = [];
    const drawn = [];
    const g = {};
    for (const name of ['fillPoints', 'lineStyle', 'lineBetween', 'fillRect', 'fillEllipse', 'destroy']) g[name] = () => g;
    g.fillStyle = color => { colors.push(color); return g; };
    g.generateTexture = key => cached.add(key);
    const scene = { level: { theme: 'glacier', groundY: 520 },
        textures: { exists: key => cached.has(key) }, make: { graphics: () => g },
        add: { image(x, y, key) { drawn.push({ x, y, key }); return { setOrigin() { return this; }, setDepth() { return this; } }; } }
    };
    const gap = { x: 2200, width: 140, style: 'lava' };
    createPitArt(scene, gap);
    assert.ok(colors.includes(0xe86f42), 'An explicit lava style draws lava at the bottom');
    assert.ok(colors.includes(platformThemes.lava.body));
    assert.equal(scene.level.theme, 'glacier');
    assert.equal(drawn[0].x, gap.x - 12);
    colors.length = 0;
    createPitArt(scene, { x: 2500, width: 140 });
    assert.ok(colors.includes(platformThemes.glacier.body), 'No override keeps the original icy palette');
    assert.ok(!colors.includes(0xe86f42));
    assert.notEqual(drawn[0].key, drawn[1].key);
    createPitArt(scene, { ...gap, x: 2800 });
    assert.equal(cached.size, 2, 'Matching explicit styles reuse the same texture');
    scene.level.theme = 'lava';
    createPitArt(scene, { x: 3000, width: 140 });
    assert.notEqual(drawn[0].key, drawn.at(-1).key, 'Legacy lava and explicit palette textures must not overwrite each other');
});

test('Pit and column styles support registered palettes and reject unknown names during catalog creation', () => {
    const level = defineLevel({ name: 'Pit styles', width: 3200, gaps: [{ x: 2200, width: 140, style: 'test-pit' }],
        columns: [{ x: 2700, width: 80, style: 'test-column' }],
        fruits: stars([{ x: 200, y: 480 }, { x: 800, y: 480 }, { x: 1600, y: 480 }]) });
    const definitions = [{ id: 1, title: 'Test', levels: [level] }];
    assert.throws(() => createWorldCatalog(definitions, { platformExists: name => Boolean(platformThemes[name]) }), /Bilinmeyen çukur stili: test-pit/);
    platformThemes['test-pit'] = { body: 0x123456, edge: 0xabcdef, detail: 0 };
    try {
        assert.throws(() => createWorldCatalog(definitions, { platformExists: name => Boolean(platformThemes[name]) }), /Bilinmeyen kolon stili: test-column/);
        platformThemes['test-column'] = { body: 0x123456, edge: 0xabcdef, detail: 0 };
        const catalog = createWorldCatalog(definitions, { platformExists: name => Boolean(platformThemes[name]) });
        assert.equal(catalog.levels[0].gaps[0].style, 'test-pit');
        assert.equal(catalog.levels[0].columns[0].style, 'test-column');
    } finally { delete platformThemes['test-pit']; delete platformThemes['test-column']; }
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
    for (const level of levels.filter(Boolean)) {
        scene.level = level;
        for (const gap of level.gaps || []) createPitArt(scene, gap);
    }
    const firstPass = generated;
    for (const level of levels.filter(Boolean)) {
        scene.level = level;
        for (const gap of level.gaps || []) createPitArt(scene, gap);
    }
    assert.equal(generated, firstPass);
    assert.ok(images > generated);
});
