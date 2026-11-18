// Yeni dünya/bölüm oluşturucularını, eklenti kayıtlarını ve eski kayıtların sabit yuvalarını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { defineLevel, defineWorld, createLevelBuilder, stairs, stars, validateLevel } from '../src/world/model/definitions.js';
import { createWorldCatalog } from '../src/world/model/catalog.js';
import { defineEnemy, registerEnemyType, enemyTypes, createEnemySprite } from '../src/gameplay/enemyTypes.js';
import { registerEnemyBehavior, enemyBehaviors, createHazards, updateHazards } from '../src/gameplay/hazards.js';
import { registerTheme, themeStrategies } from '../src/world/scenery/themes.js';
import { createScenery } from '../src/world/scenery/background.js';
import { createPlatformArt, platformThemes } from '../src/world/terrain/platforms.js';
import { loadGameAssets } from '../src/data/assets.js';
import { exampleWorld } from '../examples/new-world.js';
import { levelTemplates, registerLevelTemplate } from '../src/world/model/templates.js';
import { registerCharacterSkin, characterSkins, characterPrefix } from '../src/data/characters.js';

const draft = overrides => ({ name: 'Örnek Bölüm', width: 2800,
    fruits: stars([{ x: 300, y: 480 }, { x: 700, y: 480 }, { x: 1100, y: 480 }]), ...overrides });

test('The unified Builder applies inherited templates once and keeps their defaults ahead of base defaults', () => {
    let calls = 0;
    registerLevelTemplate('test-night', { parent: 'night', defaults: { theme: 'moonwood', width: 4000 } });
    try {
        const level = defineLevel({ name: 'Gece Örneği', template: 'test-night',
            platforms: [{ x: 400, y: 430, width: 170 }],
            fruits: stars([{ x: 700, y: 480 }, { x: 900, y: 480 }, { x: 1100, y: 480 }])
        }, () => { calls++; return 0.5; });
        assert.equal(level.theme, 'moonwood');
        assert.equal(level.width, 4000);
        assert.deepEqual(level.fountains, [{ id: 'fountain-1', x: 2400 }]);
        const count = calls;
        assert.ok(count > 0);
        assert.equal(defineLevel(level), level);
        defineWorld({ id: 9, title: 'Deneme', levels: [level] });
        assert.equal(calls, count, 'Catalog and world registration must not scatter or shift objects twice');
        assert.throws(() => defineLevel(draft({ template: 'unknown-template' })), /Bilinmeyen/);
        registerLevelTemplate('test-cycle', { parent: 'test-cycle' });
        assert.throws(() => defineLevel(draft({ template: 'test-cycle' })), /Döngüsel/);
    } finally { levelTemplates.delete('test-night'); levelTemplates.delete('test-cycle'); }
});

test('New world costumes share one prefix registration for loading and all expression frames', () => {
    registerCharacterSkin('test-outfit', 'test_hero');
    try {
        assert.equal(characterPrefix('happy', 'test-outfit'), 'test_hero-happy-');
        const images = [];
        loadGameAssets({ level: { fruits: [], enemies: [] }, load: { svg(...args) { images.push(args); }, audio() {} } }, 'test-outfit');
        assert.ok(images.some(([key, path]) => key === 'test_hero-sad-5' && path === 'assets/images/hero/test_hero-sad-5.svg'));
        assert.ok(images.some(([key]) => key === 'test_hero-blink'));
    } finally { characterSkins.delete('test-outfit'); }
});

test('Level builders inherit nested defaults, replace arrays and never share mutable defaults', () => {
    const defaults = { theme: 'glacier', spawn: { x: 120, y: 480 }, gaps: [{ x: 1500, width: 120 }] };
    const build = createLevelBuilder(defaults);
    const input = draft({ spawn: { x: 140 }, gaps: [] });
    const level = build(input);
    assert.deepEqual(level.spawn, { x: 140, y: 480 });
    assert.deepEqual(level.gaps, []);
    assert.equal(level.theme, 'glacier');
    assert.deepEqual(input.spawn, { x: 140 });
    const other = build(draft());
    other.gaps[0].x = 1600;
    assert.equal(defaults.gaps[0].x, 1500);
    assert.equal(build(draft()).gaps[0].x, 1500);
    assert.equal(defineLevel(level), level, 'Normalized old levels keep their references');
});

test('World defaults apply even when a level was already built; explicit level choices win', () => {
    const automatic = defineLevel(draft());
    const explicit = defineLevel(draft({ theme: 'aurora' }));
    const world = defineWorld({ id: 6, title: 'Yeni Buz Dünyası', defaults: { theme: 'glacier' }, levels: [automatic, explicit] });
    assert.equal(world.levels[0].theme, 'glacier');
    assert.equal(world.levels[1].theme, 'aurora');
    assert.equal(automatic.theme, 'garden', 'World defaults do not change the original draft');
    assert.equal(world.count, 15);
    assert.throws(() => defineWorld({ id: 0, title: 'Hatalı' }));
    assert.throws(() => defineWorld({ id: 6, title: 'Taşma', count: 1, levels: [automatic, explicit] }));
});

test('A new world automatically gets stable slots and does not move past or reserved chapter numbers', () => {
    const catalog = createWorldCatalog([
        { id: 1, title: 'İlk Dünya', count: 15, levels: [defineLevel(draft())] },
        { id: 2, title: 'Hazırlanıyor', count: 15 },
        exampleWorld
    ]);
    assert.equal(catalog.levels[1], undefined);
    assert.equal(catalog.levels[15], undefined);
    assert.deepEqual(catalog.levels[30], exampleWorld.levels[0]);
    assert.equal(catalog.worldForLevel(30).id, 6);
    assert.equal(catalog.slotCount, 45);
    assert.deepEqual(catalog.worlds.map(world => world.start), [0, 15, 30]);
    assert.throws(() => createWorldCatalog([{ id: 1, title: 'A' }, { id: 1, title: 'B' }]), /Tekrarlanan/);
});

test('Invalid definitions fail before Phaser starts, and the working example needs no engine edits', () => {
    const level = exampleWorld.levels[0];
    assert.equal(validateLevel(level), level);
    assert.equal(level.platforms.length, 3);
    assert.deepEqual(level.platforms, stairs({ x: 400, y: 440, count: 3, width: 150 }));
    assert.equal(level.enemies[0].snowball.period, 3100, 'Snowman shooting defaults come from its archetype');
    assert.throws(() => defineLevel(draft({ width: NaN })), /genişlik/);
    assert.throws(() => validateLevel(defineLevel(draft({ fruits: [] }))), /yıldız/);
    assert.throws(() => validateLevel(defineLevel(draft({ enemies: [{ type: 'bee', x: 200, platform: 99 }] }))), /platform/);
    assert.throws(() => createWorldCatalog([exampleWorld], { themeExists: () => false }), /tema/);
    assert.throws(() => createWorldCatalog([exampleWorld], { enemyExists: () => false }), /düşman/);
});

test('One enemy registration supplies both its asset loader and physical factory', () => {
    registerEnemyType('test-crystal', { asset: { width: 40, height: 60 }, groundOffset: 28,
        body: { width: 20, height: 40, x: 10, y: 12 }, defaults: { speed: 55 } });
    const enemy = defineEnemy('test-crystal', { x: 200, behaviors: { patrol: { minX: 100, maxX: 300 } } });
    let spawned, size, offset;
    const sprite = { body: { setSize(...args) { size = args; return this; }, setOffset(...args) { offset = args; } },
        setDepth() { return this; }, setScale() {} };
    const scene = { level: { groundY: 520, platforms: [] }, hazards: { create(...args) { spawned = args; return sprite; } } };
    try {
        createEnemySprite(scene, enemy);
        assert.deepEqual(spawned, [200, 520 - 28 * 0.8, 'test-crystal']);
        assert.deepEqual(size, [20, 40]); assert.deepEqual(offset, [10, 12]);
        assert.equal(enemy.speed, 55);
        const queued = [];
        loadGameAssets({ level: { fruits: [], enemies: [enemy] }, load: { svg(...args) { queued.push(args); }, audio() {} } }, 'boy');
        assert.deepEqual(queued.find(([key]) => key === 'test-crystal'), ['test-crystal', 'assets/images/enemy/test-crystal.svg', { width: 40, height: 60 }]);
        assert.throws(() => registerEnemyType('test-crystal', {}), /zaten/);
    } finally { enemyTypes.delete('test-crystal'); }
});

test('An extra behavior composes with patrol and receives the scene clock without altering the engine', () => {
    let called = 0;
    registerEnemyBehavior('test-pulse', { update(scene, enemy, patrol, delta) { called++; assert.equal(delta, 16); assert.equal(patrol.type, 'fox'); } });
    const data = new Map();
    const sprite = { x: 200, y: 500, body: { setSize() { return this; }, setOffset() { return this; } },
        setDepth() { return this; }, setScale() {}, setData(key, value) { data.set(key, value); }, getData: key => data.get(key),
        setVelocityX(value) { this.speed = value; }, setFlipX() {} };
    const group = { create: () => sprite, getChildren: () => [sprite] };
    const scene = { elapsed: 0, level: { groundY: 520, platforms: [], enemies: [defineEnemy('fox', { x: 200, speed: 60, minX: 100, maxX: 300, components: ['test-pulse'] })] },
        physics: { add: { group: () => group } } };
    try {
        createHazards(scene); updateHazards(scene, 16);
        assert.equal(sprite.speed, 60); assert.equal(called, 1);
    } finally { enemyBehaviors.delete('test-pulse'); }
});

test('A registered theme supplies both scenery and custom platform art', () => {
    let scenery = 0, drawn = 0;
    registerTheme('test-theme', { scenery(scene, width) { scenery = width; },
        platform: { body: 1, edge: 2, detail: 3 }, drawPlatform(g, width, palette) { drawn = width; assert.equal(palette.edge, 2); } });
    const image = { setOrigin() { return this; }, setDepth() { return this; } };
    const graphics = { generateTexture() {}, destroy() {} };
    const scene = { textures: { exists: () => false }, make: { graphics: () => graphics }, add: { image: () => image } };
    try {
        createScenery(scene, 3000, 'test-theme');
        createPlatformArt(scene, { x: 100, y: 400, width: 160 }, 'test-theme');
        assert.equal(scenery, 3000); assert.equal(drawn, 160);
    } finally { themeStrategies.delete('test-theme'); delete platformThemes['test-theme']; }
});
