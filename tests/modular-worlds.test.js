// Yeni dünya/bölüm oluşturucularını, eklenti kayıtlarını ve eski kayıtların sabit yuvalarını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { defineLevel, defineWorld, createLevelBuilder, stairs, stars, validateLevel } from '../.build/src/world/model/definitions.js';
import { createWorldCatalog } from '../.build/src/world/model/catalog.js';
import { defineEnemy, registerEnemyType, enemyTypes, createEnemySprite } from '../.build/src/actors/enemies/EnemyCatalog.js';
import { registerEnemyBehavior, enemyBehaviors } from '../.build/src/actors/enemies/EnemyCatalog.js';
import { createHazards, updateHazards } from '../.build/src/actors/enemies/EnemyController.js';
import { registerTheme, themeStrategies } from '../.build/src/world/scenery/themes.js';
import { createScenery } from '../.build/src/world/scenery/background.js';
import { createPlatformArt, platformThemes } from '../.build/src/world/terrain/platforms.js';
import { loadGameAssets } from '../.build/src/data/assets.js';
import { exampleWorld } from '../.build/examples/new-world.js';
import { levelTemplates, registerLevelTemplate } from '../.build/src/world/model/templates.js';
import { registerCharacterSkin, characterSkins, characterPrefix } from '../.build/src/data/characters.js';
import { platform, item, gap, iceArea, column, outfits, point, belt, passage, fountain,
    weather, rain, movement, behavior, weapon, scenery, action, scenario } from '../.build/src/world/model/levelParts.js';

const draft = overrides => ({ name: 'Örnek Bölüm', width: 2800,
    fruits: stars([{ x: 300, y: 480 }, { x: 700, y: 480 }, { x: 1100, y: 480 }]), ...overrides });

test('One-line factories build the same playable chapter as explicit objects', () => {
    const short = defineLevel({ name: 'Parts', width: 4000, player: outfits.winter(),
        platforms: [platform.icy(250, 430, 160), platform.icy(500, 350, 180), platform.solid(780, 290, 200, { style: 'abyss' })],
        fruits: [item.onPlatform('star', 0), item.onPlatform('star', 1), item.at('star', 3200, 480), item.at('bead', 400, 480)],
        ice: [iceArea(1000, 300), iceArea(1800, 250)], gaps: [gap(2200, 140, { style: 'lava' })],
        columns: [column(2700, 80, { style: 'factory', raisedBottom: 200, openMs: 2200 })]
    });
    const explicit = defineLevel({ name: 'Parts', width: 4000, player: { costume: { boy: 'ice_boy', girl: 'ice_girl' } },
        platforms: [{ x: 250, y: 430, width: 160, ice: true }, { x: 500, y: 350, width: 180, ice: true },
            { x: 780, y: 290, width: 200, ice: false, style: 'abyss' }],
        fruits: [{ id: 'star-1', type: 'star', platform: 0 }, { id: 'star-2', type: 'star', platform: 1 },
            { id: 'star-3', type: 'star', x: 3200, y: 480 }, { id: 'bead-1', type: 'bead', x: 400, y: 480 }],
        ice: [{ x: 1000, width: 300 }, { x: 1800, width: 250 }], gaps: [{ x: 2200, width: 140, style: 'lava' }],
        columns: [{ x: 2700, width: 80, style: 'factory', raisedBottom: 200, openMs: 2200 }]
    });
    assert.deepEqual(short, explicit);
    validateLevel(short);
});

test('Automatic item ids are local, deterministic, preserve explicit ids and never modify authoring inputs', () => {
    const input = { name: 'Ids', width: 3000, fruits: [
        item.at('star', 300, 480, { id: 'star-2' }), item.at('star', 700, 480), item.at('star', 1100, 480),
        item.at('bead', 1400, 480, { id: 'bead-1' }), item.at('bead', 1500, 480)
    ] };
    const before = structuredClone(input);
    const first = defineLevel(input);
    assert.deepEqual(first.fruits.map(item => item.id), ['star-2', 'star-1', 'star-3', 'bead-1', 'bead-2']);
    validateLevel(first);
    assert.deepEqual(input, before);
    assert.equal(defineLevel(first), first);
    const second = defineLevel(structuredClone(input));
    assert.deepEqual(second.fruits, first.fruits);
    const world = defineWorld({ id: 9, title: 'Test', defaults: { theme: 'snow' }, levels: [first] });
    assert.deepEqual(world.levels[0].fruits, first.fruits);
    assert.throws(() => validateLevel(defineLevel({ name: 'Duplicate ids', width: 3000, fruits: [
        item.at('star', 100, 480, { id: 'same' }), item.at('star', 300, 480, { id: 'same' }), item.at('star', 500, 480)
    ] })), /benzersiz/);
});

test('Factories accept overrides and return independent objects for reuse between chapters', () => {
    const options = { style: 'snow', single: true };
    const first = platform.icy(200, 400, 100, options);
    const second = platform.icy(200, 400, 100, options);
    first.style = 'garden';
    assert.equal(second.style, 'snow');
    assert.deepEqual(options, { style: 'snow', single: true });
    const boy = outfits.winter(), girl = outfits.winter();
    boy.costume.boy = 'boy';
    assert.equal(girl.costume.boy, 'ice_boy');
    const fruit = item.onPlatform('orange', 2, { id: 'special-orange', x: 800 });
    assert.deepEqual(fruit, { id: 'special-orange', x: 800, type: 'orange', platform: 2 });
    assert.deepEqual(item.at('pear', 900, 480), { type: 'pear', x: 900, y: 480 });
});

test('Weather, enemy, background and scenario factories preserve the explicit chapter contract', () => {
    const base = draft({ width: 4000 });
    const short = defineLevel({ ...base,
        spawn: point(100, 480), checkpoint: point(2000, 480),
        belt: belt(1500, 180, -100), passages: [passage(1800, 400, 160)], fountains: [fountain(2500, 'rest')],
        environment: { background: 'glacier', platformStyle: 'snow', weather: weather.snow({ wind: -15 }),
            scenery: scenery.background(0xcbe8f6, [scenery.sun(650, 140),
                scenery.repeat(scenery.cloud(200, 110, { color: 0xf5faf3 }), 8, 500),
                scenery.pine(350, 400)], { body: 0xaacbdc, edge: 0xf0f9ff }) },
        fireRain: [rain.snow({ period: 5000 })],
        enemies: [defineEnemy('snowman', { id: 'guard', x: 1300, movement: movement.patrol(1150, 1450, 45),
            behaviors: { hop: behavior.hop(2500, 350, { height: 65, duration: 700 }),
                visibility: behavior.visibility(2800, 1800, { offset: 500 }), vertical: behavior.vertical(20, { period: 2100 }) },
            weapon: weapon.bullet({ period: 3000, speed: 190 }) })],
        scenarios: [scenario.changeWeapon(1000, 400, 'guard', weapon.snowball({ period: 2400, speed: 170 }), { once: false }),
            scenario.zone(2500, 120, [action.emit('rest-reached', { score: 10 })])]
    });
    const explicit = defineLevel({ ...base,
        spawn: { x: 100, y: 480 }, checkpoint: { x: 2000, y: 480 },
        belt: { x: 1500, width: 180, speed: -100 }, passages: [{ x: 1800, y: 400, width: 160 }], fountains: [{ id: 'rest', x: 2500 }],
        environment: { background: 'glacier', platformStyle: 'snow', weather: { type: 'snow', wind: -15 },
            scenery: { sky: 0xcbe8f6, ground: { body: 0xaacbdc, edge: 0xf0f9ff }, parts: [
                { type: 'sun', x: 650, y: 140 }, { type: 'cloud', x: 200, y: 110, color: 0xf5faf3, repeat: { count: 8, stepX: 500 } },
                { type: 'pine', x: 350, y: 400 } ] } },
        fireRain: [{ kind: 'snow', period: 5000, speed: 310, offset: 4500 }],
        enemies: [defineEnemy('snowman', { id: 'guard', x: 1300, movement: { type: 'patrol', minX: 1150, maxX: 1450, speed: 45 },
            behaviors: { hop: { walkMs: 2500, pauseMs: 350, height: 65, duration: 700 },
                visibility: { visibleMs: 2800, hiddenMs: 1800, offset: 500 }, vertical: { bob: 20, period: 2100 } },
            weapon: { type: 'bullet', period: 3000, speed: 190 } })],
        scenarios: [{ type: 'zones', zones: [{ x: 1000, width: 400, once: false,
            actions: [{ type: 'weapon', enemyId: 'guard', weapon: { type: 'snowball', period: 2400, speed: 170 } }] }] },
            { type: 'zones', zones: [{ x: 2500, width: 120, actions: [{ type: 'emit', event: 'rest-reached', data: { score: 10 } }] }] }]
    });
    assert.deepEqual(short, explicit);
    validateLevel(short);
});

test('Remaining factories preserve extension options and isolate reusable arrays and defaults', () => {
    const drops = rain.fire({ speed: 280, offset: 0 });
    assert.equal(drops.kind, undefined);
    assert.equal(drops.offset, 0);
    assert.equal(rain.snow().period, 10000);
    assert.deepEqual(movement.stationary(), { type: 'stationary' });
    assert.deepEqual(movement.chase(100, 500, { speed: 70 }), { type: 'chase', minX: 100, maxX: 500, speed: 70 });
    assert.deepEqual(movement.of('custom-movement', { strength: 5 }), { type: 'custom-movement', strength: 5 });
    assert.deepEqual(behavior.of('custom-behavior', { radius: 100 }), { type: 'custom-behavior', radius: 100 });
    assert.deepEqual(weather.of('custom-weather', { intensity: 2 }), { type: 'custom-weather', intensity: 2 });
    assert.deepEqual(weapon.of('custom-weapon', { range: 600 }), { type: 'custom-weapon', range: 600 });
    assert.equal(weapon.iceShard().type, 'ice-shard');
    assert.deepEqual(behavior.jump(210, 1600, 3500), { height: 210, duration: 1600, period: 3500, offset: 0 });
    const shots = [100, 400], breath = behavior.breath(shots, 250, 600);
    breath.shots.push(500);
    assert.deepEqual(shots, [100, 400]);
    const cloud = scenery.repeat(scenery.cloud(200, 110), 8, 500);
    const background = scenery.background(0, [cloud]);
    background.parts[0].repeat.count = 2;
    assert.equal(cloud.repeat.count, 8);
    for (const type of ['sun', 'moon', 'cloud', 'hill', 'mountain', 'tree', 'pine', 'circle', 'triangle']) {
        assert.equal(scenery[type](100, 200).type, type);
    }
    const selection = weapon.snowball(), actions = [action.weapon('guard', selection)];
    const zone = scenario.zone(1000, 400, actions);
    zone.zones[0].actions.push(action.emit('test'));
    assert.equal(actions.length, 1);
    selection.type = 'bullet';
    assert.equal(actions[0].weapon.type, 'snowball');
    assert.equal(scenario.changeWeapon(1000, 400, 'guard', false).zones[0].actions[0].weapon, false);
    assert.deepEqual(scenario.of('custom-scenario', { score: 10 }), { type: 'custom-scenario', score: 10 });
    assert.equal(fountain(2500).id, 'fountain-2500');
});

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
