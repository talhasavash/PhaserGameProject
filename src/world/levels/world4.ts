// 46–60: farklı lav parkurları, platform denizleri ve kabul edilmiş Matter düzenekleri.
import {createLevelBuilder} from '../model/definitions.js';
import type {LevelInput, Platform, EnemyDefinition, Gap} from '../model/contracts.js';
import {defineEnemy} from '../../actors/enemies/EnemyCatalog.js';
import {makePhysicsPuzzle} from '../model/physicsPuzzles.js';
import type {PhysicsPuzzleName} from '../model/physicsPuzzles.js';
import {fireBackground} from '../scenery/world4Scenery.js';
import type {FireScenery} from '../scenery/world4Scenery.js';
import {verses} from '../../data/verses.js';

type Ledge = [x: number, y: number, width: number];
const ledges = (route: Ledge[]): Platform[] => route.map(([x, y, width]) => ({x, y, width}));
const lava = (...holes: [number, number][]): Gap[] => holes.map(([x, width]) => ({x, width, style: 'magma'}));
const walk = (type: EnemyDefinition['type'], x: number, minX: number, maxX: number, speed = 65) =>
    defineEnemy(type, {x, minX, maxX, speed, scale: .8});
const flyer = (x: number, y: number, minX: number, maxX: number) =>
    defineEnemy('ember-bat', {x, y, minX, maxX, speed: 75, bob: 16});
const fireMouth = (x: number) => defineEnemy('fire-salamander', {
    x, speed: 0, scale: .9, components: ['face-player'],
    weapon: {type: 'flame-orb', period: 3500, speed: 185, initialDelay: 2600}
});
const sun = (minX: number, maxX: number, y = 145) => defineEnemy('cinder-sun', {
    x: minX + 180, y, minX, maxX, scale: .9,
    movement: {type: 'overhead', minX, maxX, speed: 100, distance: 260},
    weapon: {type: 'sun-ember', period: 4100, speed: 150, initialDelay: 3200}
});
const build = createLevelBuilder({theme: 'lava', width: 4000, groundY: 520,
    spawn: {x: 100, y: 480}, checkpoint: {x: 100, y: 480}});
// 46–60 sırasıyla; lav denizlerinde çeşme karşı kıyıdaki sağlam zemindedir.
const fountainPositions = [1840, 2860, 2260, 3090, 3660, 1110, 1830, 3660, 3090, 1640, 1900, 3090, 3660, 1690, 3360];

function chapter(index: number, setting: FireScenery, input: LevelInput) {
    const platforms = input.platforms ?? [], gaps = input.gaps ?? [];
    const types = ['orange', 'apple', 'pear', 'banana', 'grapes', 'strawberry'];
    const fruit = platforms.map((p, i) => ({type: types[(i + index) % types.length], x: p.x + 26, y: p.y - 36}));
    for (let x = 220; x < (input.width ?? 4000) - 500; x += 185) {
        if (gaps.some(g => x > g.x - 30 && x < g.x + g.width + 30)) continue;
        if ((input.columns ?? []).some(c => Math.abs(c.x - x) < c.width + 35)) continue;
        fruit.push({type: types[(fruit.length + index) % types.length], x, y: 480});
    }
    const trim = [0xf5c477, 0xefb795, 0xe5c999][index % 3];
    return build({...input, id: `fire-${index + 1}`,
        fountains: [{id: 'fountain-1', x: fountainPositions[index]}],
        fruits: [...(input.fruits ?? []), ...fruit],
        environment: {scenery: fireBackground(index, setting), weather: {type: 'embers'},
            platformStyle: ['magma', 'basalt', 'furnace'][index % 3]},
        verse: verses[index % verses.length],
        mosqueStyle: {wall: [0xe5c6ad, 0xd7bfcc, 0xeadbc1][index % 3],
            roof: [0x785267, 0x4e566e, 0x94634e][index % 3], trim, width: 180 + index * 3,
            towers: index % 2 ? [-125, 125] : [120],
            domes: [[0, 421 - index, 110 + index * 2, 85 + index * 2]]}
    });
}
const stars = (...platforms: number[]) => platforms.map(platform => ({type: 'star', platform}));

const emberValley = chapter(0, 'volcano', {
    name: 'Kor Vadisi',
    platforms: ledges([[380, 440, 170], [610, 365, 210], [1340, 440, 180],
        [1590, 355, 230], [2370, 440, 150], [2590, 365, 180], [2840, 285, 220]]),
    gaps: lava([940, 140], [1990, 160], [3200, 165]), fruits: stars(1, 3, 6),
    enemies: [walk('basalt-crab', 1300, 1150, 1280), fireMouth(2300), flyer(2900, 390, 2790, 3090)]
});
const ashTunnels = chapter(1, 'cavern', {
    name: 'Kül Tünelleri',
    platforms: ledges([[320, 445, 130], [510, 365, 220], [1150, 430, 190],
        [1630, 440, 130], [1810, 360, 230], [2500, 430, 140], [2700, 350, 230], [3130, 435, 170]]),
    gaps: lava([820, 145], [1420, 125], [2200, 150], [3020, 90]), fruits: stars(1, 4, 6),
    columns: [{x: 1070, width: 65, style: 'lava', raisedBottom: 245, openMs: 2400},
        {x: 2410, width: 70, style: 'lava', raisedBottom: 220, offset: 1400}],
    enemies: [flyer(1300, 335, 1160, 1400), walk('basalt-crab', 2130, 2080, 2160), fireMouth(3400)]
});
const sunRoad = chapter(2, 'sunset', {
    name: 'Kor Güneşin Yolu',
    platforms: ledges([[400, 440, 160], [640, 355, 230], [1320, 430, 170],
        [1560, 345, 240], [2380, 445, 150], [2610, 360, 210], [3100, 435, 170]]),
    gaps: lava([1010, 160], [2000, 160], [2900, 135]), fruits: stars(1, 3, 5),
    enemies: [sun(500, 3250), walk('fire-salamander', 1880, 1830, 1930), walk('basalt-crab', 3410, 3350, 3470)]
});

function physicsChapter(index: number, name: string, setting: FireScenery, recipes: PhysicsPuzzleName[]) {
    const puzzles = recipes.map((type, i) => makePhysicsPuzzle(type, [120, 1180, 2240][i], `fire-${index}-${i}`, 0));
    return chapter(index, setting, {name, physics: 'matter', width: 3600,
        key: {x: 3200, y: 477}, exit: {x: 3420, y: 468},
        platforms: puzzles.flatMap(p => p.platforms), gaps: puzzles.flatMap(p => p.gaps).map(g => ({...g, style: 'magma'})),
        props: puzzles.flatMap(p => p.props), links: puzzles.flatMap(p => p.links),
        matterSurfaces: puzzles.flatMap(p => p.surfaces), mechanisms: puzzles.flatMap(p => p.mechanisms),
        fruits: puzzles.map(p => ({...p.star, type: 'star'})),
        enemies: [walk('basalt-crab', 1020, 990, 1070, 32), walk('fire-salamander', 2110, 2070, 2160, 35)]
    });
}

// Ortada hiçbir zemin yoktur; yalnızca giriş ve caminin altında güvenli kıyı kalır.
function lavaSea(index: number, name: string, setting: FireScenery, route: Ledge[], starPlatforms: number[], enemies: EnemyDefinition[]) {
    return chapter(index, setting, {name, platforms: ledges(route), gaps: lava([260, 3220]),
        fruits: stars(...starPlatforms), enemies});
}
const basaltIslands = lavaSea(4, 'Bazalt Adaları', 'volcano', [
    [300, 445, 140], [530, 370, 140], [770, 420, 160], [1030, 340, 190],
    [1320, 405, 150], [1570, 325, 180], [1860, 395, 150], [2120, 315, 200],
    [2430, 390, 150], [2690, 425, 160], [2940, 350, 190], [3240, 435, 190]
], [3, 7, 10], [flyer(1450, 270, 1360, 1530), flyer(2630, 300, 2510, 2740)]);
const furnaceHall = chapter(5, 'forge', {
    name: 'Fırın Salonları',
    platforms: ledges([[350, 440, 150], [580, 355, 240], [1250, 430, 160], [1490, 345, 240],
        [2230, 445, 170], [2480, 365, 180], [2740, 280, 240]]),
    gaps: lava([900, 150], [1880, 160], [3180, 160]), fruits: stars(1, 3, 6),
    enemies: [fireMouth(1200), fireMouth(2200), flyer(3030, 370, 3000, 3130)],
    columns: [{x: 1790, width: 70, style: 'lava', raisedBottom: 240, openMs: 2100}]
});
const cinderBridges = chapter(6, 'ruins', {
    name: 'Köz Köprüleri',
    platforms: ledges([[330, 450, 180], [620, 380, 170], [900, 300, 230],
        [1450, 435, 160], [1700, 350, 210], [2240, 440, 180], [2500, 355, 190], [2800, 275, 230]]),
    gaps: lava([580, 620], [2090, 95], [3010, 260]), fruits: stars(2, 4, 7),
    enemies: [flyer(1270, 360, 1210, 1350), walk('basalt-crab', 1980, 1940, 2030), fireMouth(3500)],
    fireRain: [{period: 10500, speed: 250, offset: 6500}]
});
const sunSea = lavaSea(7, 'Güneşin Altındaki Deniz', 'sunset', [
    [300, 445, 160], [550, 390, 180], [830, 310, 220], [1160, 385, 160],
    [1420, 435, 150], [1660, 355, 210], [1980, 425, 160], [2250, 345, 220],
    [2580, 410, 170], [2860, 330, 220], [3200, 420, 230]
], [2, 5, 9], [sun(650, 3060, 125)]);
const lavaPress = chapter(9, 'cavern', {
    name: 'Lav Presleri',
    platforms: ledges([[340, 445, 160], [570, 365, 220], [1310, 435, 160], [1540, 350, 230],
        [2420, 440, 140], [2640, 355, 230], [3110, 435, 160]]),
    gaps: lava([910, 150], [1980, 155], [2920, 140]), fruits: stars(1, 3, 5),
    columns: [1150, 1850, 2220, 2330].map((x, i) => ({x, width: 60, style: 'lava', raisedBottom: 220,
        openMs: 2200, offset: i * 850})),
    enemies: [walk('basalt-crab', 1360, 1335, 1435, 70), fireMouth(3370)]
});
const dragonPass = chapter(10, 'ruins', {
    name: 'Ejder Geçidi',
    platforms: ledges([[370, 445, 160], [600, 365, 230], [1330, 430, 160], [1560, 345, 240],
        [2250, 440, 160], [2490, 355, 220], [3120, 430, 200]]),
    gaps: lava([970, 160], [1980, 140], [2830, 160]), fruits: stars(1, 3, 5),
    enemies: [defineEnemy('magma-drake', {x: 1280, scale: .9, components: ['face-player'], weapon: {type: 'flame-orb', period: 3700}}),
        defineEnemy('magma-drake', {x: 3450, scale: 1, components: ['face-player'], weapon: {type: 'flame-orb', period: 3300}}),
        flyer(2210, 310, 2140, 2330)]
});
const brokenSky = lavaSea(12, 'Kırık Gökyüzü', 'cavern', [
    [300, 440, 130], [530, 355, 160], [790, 400, 130], [1030, 315, 200],
    [1350, 390, 130], [1580, 305, 180], [1880, 380, 140], [2120, 295, 210],
    [2470, 375, 140], [2720, 435, 150], [2980, 350, 180], [3270, 435, 160]
], [3, 7, 10], [flyer(1440, 235, 1320, 1520), flyer(2610, 265, 2490, 2720)]);
const lastSun = chapter(13, 'sunset', {
    name: 'Son Kor Fırtınası',
    platforms: ledges([[330, 440, 130], [540, 355, 220], [1170, 435, 130], [1390, 350, 220],
        [2120, 445, 140], [2340, 360, 170], [2600, 280, 230], [3150, 430, 180]]),
    gaps: lava([850, 160], [1770, 160], [2930, 160]), fruits: stars(1, 3, 6),
    enemies: [sun(500, 2950), fireMouth(3200), walk('basalt-crab', 3420, 3350, 3480, 80)],
    columns: [{x: 2040, width: 65, style: 'lava', raisedBottom: 235, openMs: 2150}]
});
const calderaGuardian = chapter(14, 'volcano', {
    name: 'Kalderanın Muhafızı', width: 4500, boss: true,
    platforms: ledges([[330, 445, 150], [550, 360, 230], [1220, 430, 150], [1450, 345, 230],
        [2150, 445, 140], [2370, 360, 180], [2630, 280, 240], [3130, 440, 160]]),
    gaps: lava([870, 160], [1810, 160], [2940, 145]), fruits: stars(1, 3, 6),
    enemies: [flyer(1190, 315, 1100, 1300), fireMouth(2150),
        defineEnemy('magma-drake', {x: 3600, scale: 1.65, components: ['face-player'],
            jump: {height: 220, duration: 1500, period: 4400, offset: 0},
            weapon: {type: 'flame-orb', period: 4100, speed: 185, range: 620}})]
});

export const worldFourLevels = [emberValley, ashTunnels, sunRoad,
    physicsChapter(3, 'Demir ve Lav', 'forge', ['metal', 'bridge', 'tower']), basaltIslands, furnaceHall,
    cinderBridges, sunSea, physicsChapter(8, 'Kor Terazisi', 'ruins', ['ramp', 'balance', 'tunnel']),
    lavaPress, dragonPass, physicsChapter(11, 'Kaldera Atölyesi', 'forge', ['seesaw', 'drop', 'bridge']),
    brokenSky, lastSun, calderaGuardian];
