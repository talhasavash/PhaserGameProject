// Arka plan kurulumunun ve çizim dokularının tekrar kullanımının doğru çalıştığını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenery } from '../.build/src/world/scenery/background.js';
import { BackgroundBuilder, validateBackground } from '../.build/src/world/scenery/BackgroundBuilder.js';
import { themeStrategies } from '../.build/src/world/scenery/themes.js';
import { EventEmitter } from 'node:events';

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

function composedScene() {
    const textures = new Set();
    const images = [];
    const grounds = [];
    const emitted = [];
    const graphics = {};
    for (const method of ['fillStyle', 'fillEllipse', 'fillRect', 'fillTriangle', 'fillCircle', 'destroy']) {
        graphics[method] = () => graphics;
    }
    graphics.generateTexture = key => textures.add(key);
    const scene = {
        cameras: { main: { setBackgroundColor(color) { scene.sky = color; } } },
        textures: { exists: key => textures.has(key) }, make: { graphics: () => graphics },
        scale: Object.assign(new EventEmitter(), { width: 900 }), events: new EventEmitter(),
        add: {
            rectangle(...args) { const shape = { args, setDepth(depth) { this.depth = depth; return this; } }; grounds.push(shape); return shape; },
            image(x, y, key) {
                const shape = { x, y, key };
                for (const method of ['setOrigin', 'setScale', 'setAlpha', 'setDepth', 'setScrollFactor']) {
                    shape[method] = value => { shape[method.slice(3)] = value; return shape; };
                }
                images.push(shape); return shape;
            },
            particles(x, y, key, config) {
                const emitter = { config, setScrollFactor() { return this; }, setDepth() { return this; }, setConfig() {} };
                emitted.push(emitter); return emitter;
            }
        }
    };
    return { scene, textures, images, grounds, emitted };
}

test('Composed parts share textures across repeats and restarts, preserve placement, and keep parallax separate', () => {
    const { scene, textures, images, grounds } = composedScene();
    const definition = { sky: 0xcbe8f6, ground: { body: 0x92715d, edge: 0x9fc67b }, parts: [
        { type: 'sun', x: 650, y: 150, width: 120, height: 120 },
        { type: 'tree', x: 250, y: 410, repeat: { count: 3, stepX: 600, stepY: -10 }, depth: -35, scrollFactor: 0.7 },
        { type: 'tree', x: 2400, y: 400, scale: 0.8, alpha: 0.6 }
    ] };
    const original = structuredClone(definition);
    const builder = new BackgroundBuilder(scene);
    builder.build(definition, 4000, 520);
    assert.equal(scene.sky, definition.sky);
    assert.deepEqual(grounds[0].args, [2000, 560, 4000, 80, definition.ground.body]);
    assert.equal(grounds[0].depth, -5, 'Ground remains behind existing pit graphics');
    assert.deepEqual(images.slice(1, 4).map(image => [image.x, image.y]), [[250, 410], [850, 400], [1450, 390]]);
    assert.equal(images[1].Origin, 0.5, 'All part coordinates refer to the center');
    assert.equal(images[1].ScrollFactor, 0.7);
    assert.equal(images[1].Depth, -35);
    assert.equal(textures.size, 2, 'Scaling and repeating an identical tree must not generate another texture');
    builder.build(definition, 4000, 520);
    assert.equal(textures.size, 2);
    assert.deepEqual(definition, original, 'Building and restarting never change the chapter definition');
});

test('All built-in background shapes can be selected and a style change uses its own texture', () => {
    const { scene, textures, images } = composedScene();
    const types = ['sun', 'moon', 'cloud', 'hill', 'mountain', 'tree', 'pine', 'circle', 'triangle'];
    new BackgroundBuilder(scene).build({ sky: 0, parts: [
        ...types.map(type => ({ type, x: 100, y: 100 })), { type: 'cloud', x: 200, y: 200, color: 0xabcdef }
    ] }, 4000, 520);
    assert.equal(images.length, 10);
    assert.equal(textures.size, 10);
});

test('A composed background replaces only the drawing, preserves explicit snowfall and leaves legacy themes untouched', () => {
    const { scene, images, emitted } = composedScene();
    let legacyDraws = 0;
    themeStrategies.set('test-legacy-background', { scenery() { legacyDraws++; } });
    try {
        scene.level = { groundY: 520, environment: { scenery: { sky: 0, parts: [{ type: 'moon', x: 500, y: 100 }] },
            weather: { type: 'snow', intensity: 1, wind: -15 } } };
        createScenery(scene, 4000, 'test-legacy-background');
        assert.equal(legacyDraws, 0);
        assert.equal(images.length, 1);
        assert.equal(emitted.length, 1);
        assert.equal(emitted[0].config.speedX.min, -33);
        scene.events.emit('shutdown');
        scene.level.environment = {};
        createScenery(scene, 4000, 'test-legacy-background');
        assert.equal(legacyDraws, 1, 'Old chapters still run the original theme function');
        assert.equal(images.length, 1);
        assert.equal(emitted.length, 1);
    } finally { themeStrategies.delete('test-legacy-background'); }
});

test('Invalid background parts fail before any scene objects are added', () => {
    const { scene, images, grounds } = composedScene();
    const base = { type: 'cloud', x: 100, y: 100 };
    for (const part of [{ ...base, type: 'unknown' }, { ...base, x: '100' }, { ...base, width: -20 },
        { ...base, repeat: { count: 0, stepX: 500 } }, { ...base, alpha: 2 }, { ...base, depth: 10 }]) {
        assert.throws(() => new BackgroundBuilder(scene).build({ sky: 0, parts: [part] }, 4000, 520), /Arka plan:/);
    }
    assert.throws(() => validateBackground({ sky: -1, parts: [] }), /Arka plan:/);
    assert.equal(images.length, 0);
    assert.equal(grounds.length, 0);
});
