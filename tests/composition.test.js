// Parçaların bağımsız seçilmesini, eklenti kayıtlarını, silah değişimini ve senaryo yaşam süresini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { defineLevel, validateLevel, stars } from '../.build/src/world/model/definitions.js';
import { defineEnemy, registerEnemyType, enemyTypes } from '../.build/src/actors/enemies/EnemyCatalog.js';
import { registerEnemyBehavior, enemyBehaviors } from '../.build/src/actors/enemies/EnemyCatalog.js';
import { createHazards, updateHazards } from '../.build/src/actors/enemies/EnemyController.js';
import { createEnemyWeapons, updateEnemyWeapons, equipEnemyWeapon, resetEnemyWeapons } from '../.build/src/actors/enemies/WeaponController.js';
import { registerWeaponType, weaponTypes, resolveWeapon } from '../.build/src/actors/enemies/WeaponCatalog.js';
import { loadGameAssets } from '../.build/src/data/assets.js';
import { selectCharacterSkin } from '../.build/src/data/characters.js';
import { registerWeather, weatherTypes } from '../.build/src/world/scenery/weather.js';
import { registerTheme, themeStrategies } from '../.build/src/world/scenery/themes.js';
import { platformThemes, registerPlatformTheme } from '../.build/src/world/terrain/platforms.js';
import { createWorldCatalog } from '../.build/src/world/model/catalog.js';
import { createScenery } from '../.build/src/world/scenery/background.js';
import { registerScenario, scenarioTypes, validateScenarios, createLevelScenarios, updateLevelScenarios,
    destroyLevelScenarios, emitLevelEvent, preloadScenarios } from '../.build/src/game/LevelScenarios.js';
import { composedLevel } from '../.build/examples/composed-level.js';

function sceneFor(enemies, scenarios = []) {
    const sprite = (x, y, texture) => {
        const item = Object.assign(new EventEmitter(), { x, y, texture, alpha: 1, data: new Map() });
        for (const name of ['setDepth', 'setScale', 'setRotation', 'setTint', 'setFlipX']) item[name] = () => item;
        item.setTexture = value => { item.texture = value; return item; };
        item.setData = (key, value) => item.data.set(key, value);
        item.getData = key => item.data.get(key);
        item.setVelocityX = value => { item.vx = value; };
        item.setVelocityY = value => { item.vy = value; };
        item.disableBody = () => { item.active = false; };
        item.enableBody = (reset, x, y) => { item.active = true; item.x = x; item.y = y; };
        item.body = { checkCollision: {}, setCircle() {}, setSize() { return this; }, setOffset() {},
            reset(x, y) { item.x = x; item.y = y; } };
        return item;
    };
    const group = () => {
        const children = [];
        return { create(x, y, key) { const item = sprite(x, y, key); children.push(item); return item; }, getChildren: () => children };
    };
    return { elapsed: 0, player: { x: 100, y: 480 },
        level: { width: 4000, groundY: 520, platforms: [], fruits: [], enemies, scenarios },
        events: new EventEmitter(), textures: { exists: () => true },
        physics: { add: { group } }, cameras: { main: { flash() {} } } };
}

test('The composed example uses independent visuals, weather, costumes, surface physics and scenario data', () => {
    assert.equal(validateLevel(composedLevel), composedLevel);
    assert.equal(composedLevel.theme, 'moonwood');
    assert.equal(composedLevel.platformTheme, 'snow');
    assert.equal(composedLevel.platforms[1].ice, false);
    assert.equal(composedLevel.fruits.length, 5, 'No implicit fruit scattering');
    assert.equal(composedLevel.enemies[0].speed, 45, 'No implicit difficulty adjustment');
    assert.equal(selectCharacterSkin(composedLevel, {}, 'girl'), 'example-winter-girl');
    assert.equal(selectCharacterSkin({}, { characterSkins: { girl: 'ice_girl' } }, 'girl'), 'ice_girl');
    assert.equal(selectCharacterSkin({ player: { costume: 'boy' } }, { characterSkins: { boy: 'ice_boy' } }, 'boy'), 'boy');
});

test('Standard platform references place stars and guards without an ice or night template', () => {
    const level = defineLevel({ name: 'Platform', width: 3000,
        platforms: [{ x: 500, y: 400, width: 200 }],
        fruits: [{ id: 'star-1', type: 'star', platform: 0 }],
        enemies: [defineEnemy('penguin', { platform: 0, movement: { type: 'patrol', speed: 50 } })]
    });
    assert.equal(level.fruits[0].x, 600); assert.equal(level.fruits[0].y, 365);
    assert.equal(level.enemies[0].x, 600); assert.equal(level.enemies[0].minX, 565);
    assert.equal(level.platforms[0].ice, undefined);
});

test('A snowman can patrol and hop while using a bullet, and weapon:false disables its inherited shooting', () => {
    const scene = sceneFor([defineEnemy('snowman', { x: 500,
        movement: { type: 'patrol', minX: 400, maxX: 600, speed: 50 },
        behaviors: { hop: { walkMs: 2000, pauseMs: 300, height: 60, duration: 600 } },
        weapon: { type: 'bullet', period: 2000, speed: 250 }
    }), defineEnemy('snowman', { x: 900, weapon: false })]);
    createHazards(scene); createEnemyWeapons(scene);
    assert.equal(scene.weaponUsers.length, 1);
    scene.elapsed = 1800; updateHazards(scene, 16); updateEnemyWeapons(scene);
    assert.equal(scene.hazards.getChildren()[0].vx, 50);
    assert.equal(scene.weaponShots[0].sprite.texture, 'enemy-bullet');
    assert.equal(scene.weaponShots.filter(shot => shot.plan).length, 1);
    scene.elapsed = 2600; updateHazards(scene, 16);
    assert.equal(scene.hazards.getChildren()[0].vx, 0);
    assert.equal(scene.hazards.getChildren()[0].y, 520 - 36 * 0.8 - 60);
});

test('A new configured movement gets isolated state and cleans up exactly once', () => {
    let destroyed = 0;
    registerEnemyBehavior('test-configured', {
        create() { return { calls: 0 }; },
        update(scene, enemy, patrol, delta, options, state) { state.calls++; enemy.setVelocityX(options.speed * state.calls); },
        destroy() { destroyed++; }
    });
    try {
        const scene = sceneFor([20, 30].map((speed, index) => defineEnemy('fox', {
            x: 500 + index * 200, movement: { type: 'test-configured', speed }
        })));
        createHazards(scene); updateHazards(scene, 16);
        assert.deepEqual(scene.hazards.getChildren().map(enemy => enemy.vx), [20, 30]);
        updateHazards(scene, 16);
        assert.deepEqual(scene.hazards.getChildren().map(enemy => enemy.vx), [40, 60]);
        scene.events.emit('shutdown'); scene.events.emit('destroy');
        assert.equal(destroyed, 2);
    } finally { enemyBehaviors.delete('test-configured'); }
});

test('A new SVG enemy and weapon are loaded from their registered paths, once per weapon texture', () => {
    registerEnemyType('test-svg', { asset: { src: 'assets/images/enemy/snowman.svg', width: 64, height: 80 } });
    registerWeaponType('test-svg-shot', { texture: 'test-shot', asset: { src: 'assets/images/collect/star.svg', width: 30, height: 30 },
        launch: () => ({ x: 300, y: 400 }), frame: () => ({ x: 310, y: 400, done: false }) });
    try {
        const queued = [];
        const level = { fruits: [], enemies: [400, 600].map(x => defineEnemy('test-svg', { x, weapon: { type: 'test-svg-shot' } })) };
        loadGameAssets({ load: { svg(...args) { queued.push(args); }, audio() {} } }, 'example-winter-girl', level);
        assert.equal(queued.filter(([key]) => key === 'test-shot').length, 1);
        assert.equal(queued.find(([key]) => key === 'test-svg')[1], 'assets/images/enemy/snowman.svg');
        assert.ok(queued.some(([key]) => key === 'ice_girl-happy-5'));
        const scene = sceneFor(level.enemies); createHazards(scene); createEnemyWeapons(scene);
        scene.elapsed = 1800; updateEnemyWeapons(scene); scene.elapsed = 1900; updateEnemyWeapons(scene);
        assert.equal(scene.weaponShots[0].sprite.x, 310);
    } finally { enemyTypes.delete('test-svg'); weaponTypes.delete('test-svg-shot'); }
});

test('Weather is selected separately from the background and can be disabled', () => {
    let backgrounds = 0, weather = 0;
    registerTheme('test-composed', { scenery() { backgrounds++; }, platform: { body: 1, edge: 2, detail: 3 } });
    registerWeather('test-mist', { create(scene, options) { weather += options.density; } });
    try {
        const scene = { level: { environment: { weather: { type: 'test-mist', density: 2 } } } };
        createScenery(scene, 3000, 'test-composed');
        scene.level.environment.weather = false;
        createScenery(scene, 3000, 'test-composed');
        assert.equal(backgrounds, 2); assert.equal(weather, 2);
    } finally { themeStrategies.delete('test-composed'); delete platformThemes['test-composed']; weatherTypes.delete('test-mist'); }
});

test('Entering a scenario zone changes a weapon once; restarting creates fresh scenario state', () => {
    const scenario = { type: 'zones', zones: [{ x: 200, width: 150,
        actions: [{ type: 'weapon', enemyId: 'guard', weapon: { type: 'bullet' } }] }] };
    const scene = sceneFor([defineEnemy('snowman', { id: 'guard', x: 500, weapon: false })], [scenario]);
    validateScenarios(scene.level); createHazards(scene); createEnemyWeapons(scene); createLevelScenarios(scene);
    const guard = scene.hazards.getChildren()[0];
    scene.player.x = 240; updateLevelScenarios(scene, 16);
    assert.equal(guard.getData('patrol').weapon.type, 'bullet');
    const due = guard.getData('next-shot');
    scene.elapsed = 500; updateLevelScenarios(scene, 16);
    assert.equal(guard.getData('next-shot'), due);
    equipEnemyWeapon(scene, guard, false);
    destroyLevelScenarios(scene); createLevelScenarios(scene); updateLevelScenarios(scene, 16);
    assert.equal(guard.getData('patrol').weapon.type, 'bullet');
    assert.equal(scene.weaponShots.length, 6);
});

test('Custom scenarios receive game events, stop updating outside the scene loop and release their resources', () => {
    const calls = [];
    registerScenario('test-events', { create: () => ({ stars: 0 }),
        update(scene, state, delta) { calls.push(delta); },
        onEvent(scene, name, payload, state) { if (name === 'collect') state.stars++; },
        destroy(scene, state) { calls.push(state.stars); }
    });
    try {
        const scene = sceneFor([], [{ type: 'test-events' }]);
        createLevelScenarios(scene); updateLevelScenarios(scene, 16); emitLevelEvent(scene, 'collect', { type: 'star' });
        destroyLevelScenarios(scene); destroyLevelScenarios(scene); updateLevelScenarios(scene, 16);
        assert.deepEqual(calls, [16, 1]);
    } finally { scenarioTypes.delete('test-events'); }
});

test('Unregistered extensions fail with useful errors before a chapter starts', () => {
    assert.throws(() => defineEnemy('missing-svg', { x: 100 }), /registerEnemyType/);
    assert.throws(() => defineEnemy('fox', { x: 100, movement: { type: 'missing-movement' } }), /registerEnemyBehavior/);
    assert.throws(() => resolveWeapon({ weapon: { type: 'missing-weapon' } }), /registerWeaponType/);
    const level = defineLevel({ name: 'Invalid', width: 3000, fruits: stars([{ x: 100, y: 480 }, { x: 300, y: 480 }, { x: 500, y: 480 }]),
        environment: { weather: { type: 'missing-weather' } } });
    assert.throws(() => validateLevel(level), /hava olayı/);
});

test('A weapon used only by a future zone action is preloaded before the chapter starts', () => {
    registerWeaponType('test-future-shot', { texture: 'future-shot', asset: { src: 'assets/images/collect/star.svg', width: 30, height: 30 },
        launch: () => ({ x: 300, y: 400 }), frame: () => ({ x: 310, y: 400, done: false }) });
    try {
        const queued = [];
        const scene = sceneFor([defineEnemy('snowman', { id: 'guard', x: 500, weapon: false })], [{ type: 'zones', zones: [{
            x: 200, width: 100, actions: [
                { type: 'weapon', enemyId: 'guard', weapon: { type: 'test-future-shot' } },
                { type: 'weapon', enemyId: 'guard', weapon: { type: 'test-future-shot' } }
            ]
        }] }]);
        scene.textures.exists = () => false;
        scene.load = { svg(...args) { queued.push(args); }, audio() {} };
        loadGameAssets(scene, 'boy'); preloadScenarios(scene);
        assert.equal(queued.filter(([key]) => key === 'future-shot').length, 1);
    } finally { weaponTypes.delete('test-future-shot'); }
});

test('Custom weather cleanup runs once when a chapter shuts down and is destroyed', async () => {
    const { createWeather } = await import('../.build/src/world/scenery/weather.js');
    let cleaned = 0;
    registerWeather('test-resource', { create: () => ({ handle: 42 }), destroy(scene, state) { assert.equal(state.handle, 42); cleaned++; } });
    try {
        const scene = { events: new EventEmitter() };
        createWeather(scene, { type: 'test-resource' });
        scene.events.emit('shutdown'); scene.events.emit('destroy');
        assert.equal(cleaned, 1);
        assert.equal(scene.events.listenerCount('destroy'), 0);
    } finally { weatherTypes.delete('test-resource'); }
});

test('A platform-only style can be registered without a new background theme', () => {
    registerPlatformTheme('test-platform-only', { body: 1, edge: 2, detail: 3 });
    try {
        const level = defineLevel({ name: 'Independent style', width: 3000,
            environment: { background: 'garden', platformStyle: 'test-platform-only' },
            fruits: stars([{ x: 100, y: 480 }, { x: 300, y: 480 }, { x: 500, y: 480 }]) });
        const catalog = createWorldCatalog([{ id: 1, title: 'Test', levels: [level] }], {
            themeExists: name => themeStrategies.has(name), platformExists: name => Boolean(platformThemes[name])
        });
        assert.equal(catalog.levels[0].platformTheme, 'test-platform-only');
        assert.equal(themeStrategies.has('test-platform-only'), false);
    } finally { delete platformThemes['test-platform-only']; }
});

test('Respawn restores the initial bullet, removes flying snowballs and rearms the weapon-change zone', () => {
    const enemy = defineEnemy('snowman', { id: 'winter-guard', x: 1300, weapon: { type: 'bullet', period: 3000, speed: 190 } });
    const scenario = { type: 'zones', zones: [{ x: 1000, width: 400, actions: [
        { type: 'weapon', enemyId: 'winter-guard', weapon: { type: 'snowball', period: 2400, speed: 170 } }
    ] }] };
    const scene = sceneFor([enemy], [scenario]);
    createHazards(scene); createEnemyWeapons(scene); createLevelScenarios(scene);
    const guard = scene.hazards.getChildren()[0];
    scene.player.x = 1100; updateLevelScenarios(scene, 16);
    assert.equal(guard.getData('patrol').weapon.type, 'snowball');
    scene.elapsed = 2400; updateEnemyWeapons(scene);
    assert.ok(scene.weaponShots.some(shot => shot.plan));
    assert.equal(enemy.weapon.type, 'bullet', 'The chapter definition must remain unchanged');

    scene.player.x = 100;
    resetEnemyWeapons(scene); emitLevelEvent(scene, 'respawn', { x: 100, y: 480 });
    assert.equal(guard.getData('patrol').weapon.type, 'bullet');
    assert.ok(scene.weaponShots.every(shot => !shot.plan && !shot.sprite.active));
    assert.equal(guard.getData('next-shot'), 4200);
    updateLevelScenarios(scene, 16);
    assert.equal(guard.getData('patrol').weapon.type, 'bullet');
    scene.player.x = 1100; updateLevelScenarios(scene, 16);
    assert.equal(guard.getData('patrol').weapon.type, 'snowball');

    destroyLevelScenarios(scene);
    createHazards(scene); createEnemyWeapons(scene); createLevelScenarios(scene);
    assert.equal(scene.hazards.getChildren()[0].getData('patrol').weapon.type, 'bullet', 'A complete scene restart also starts with bullets');
});
