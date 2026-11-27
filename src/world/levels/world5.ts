// 61–75: Kâbe'ye uzanan farklı yollar, avlular ve mevcut Matter parçalarıyla fizik bulmacaları.
import {createLevelBuilder} from '../model/definitions.js';
import type {LevelInput, EnemyDefinition, Platform, Gap} from '../model/contracts.js';
import {defineEnemy} from '../../actors/enemies/EnemyCatalog.js';
import {makePhysicsPuzzle} from '../model/physicsPuzzles.js';
import type {PhysicsPuzzleName} from '../model/physicsPuzzles.js';
import {pilgrimageBackground} from '../scenery/world5Scenery.js';
import type {PilgrimageScenery} from '../scenery/world5Scenery.js';
import {verses} from '../../data/verses.js';

type Ledge = [x: number, y: number, width: number];
const ledges = (route: Ledge[]): Platform[] => route.map(([x, y, width]) => ({x, y, width}));
const gaps = (...holes: [number, number][]): Gap[] => holes.map(([x, width]) => ({x, width, style: 'desert'}));
const stars = (...platforms: number[]) => platforms.map(platform => ({type: 'star', platform}));
const patrol = (type: EnemyDefinition['type'], x: number, minX: number, maxX: number, speed = 65) =>
    defineEnemy(type, {x, minX, maxX, speed, scale: .8});
const bird = (x: number, y: number, minX: number, maxX: number) => defineEnemy('bird', {x, y, minX, maxX, speed: 70, bob: 16});
const build = createLevelBuilder({theme: 'desert', width: 4200, groundY: 520,
    spawn: {x: 100, y: 480}, checkpoint: {x: 100, y: 480}, exitType: 'kaaba', exitLabel: 'Kâbe avlusuna'});

function chapter(index: number, setting: PilgrimageScenery, fountainX: number, input: LevelInput) {
    const platforms = input.platforms ?? [], holes = input.gaps ?? [];
    const types = ['pear', 'orange', 'grapes', 'apple', 'banana', 'strawberry'];
    const fruit = platforms.map((p, i) => ({type: types[(index + i) % types.length], x: p.x + 25, y: p.y - 36}));
    for (let x = 240; x < (input.width ?? 4200) - 650; x += 195) {
        if (holes.some(g => x > g.x - 30 && x < g.x + g.width + 30)) continue;
        if (Math.abs(x - fountainX) < 60) continue;
        fruit.push({type: types[(fruit.length + index) % types.length], x, y: 480});
    }
    const motifs = ['bead', 'lantern', 'crescent', 'mat'];
    const keepsakes = platforms.filter((_, i) => i % 3 === 0).map((p, i) =>
        ({type: motifs[(i + index) % motifs.length], x: p.x + p.width - 28, y: p.y - 37}));
    return build({...input, id: `pilgrimage-${index + 1}`,
        fountains: [{id: 'fountain-1', x: fountainX}], fruits: [...(input.fruits ?? []), ...fruit, ...keepsakes],
        environment: {scenery: pilgrimageBackground(index, setting), platformStyle: ['desert', 'mosaic', 'marble'][index % 3]},
        mosqueStyle: {variant: index}, verse: verses[(index + 4) % verses.length]
    });
}

function physicsChapter(index: number, name: string, setting: PilgrimageScenery, recipes: PhysicsPuzzleName[]) {
    const pieces = recipes.map((recipe, i) => makePhysicsPuzzle(recipe, [120, 1180, 2300][i], `pilgrim-${index}-${i}`));
    return chapter(index, setting, 3200, {name, physics: 'matter', width: 3700,
        key: {x: 3280, y: 477}, exit: {x: 3520, y: 468},
        platforms: pieces.flatMap(p => p.platforms), gaps: pieces.flatMap(p => p.gaps).map(g => ({...g, style: 'desert'})),
        props: pieces.flatMap(p => p.props), links: pieces.flatMap(p => p.links),
        mechanisms: pieces.flatMap(p => p.mechanisms), matterSurfaces: pieces.flatMap(p => p.surfaces),
        fruits: pieces.map(p => ({...p.star, type: 'star'})),
        enemies: [patrol('scarab', 1010, 970, 1050, 32), patrol('turtle', 2150, 2100, 2190, 30)]
    });
}

const crescentRoad = chapter(0, 'dunes', 1760, {
    name: 'Hilal Yolu', width: 3600,
    platforms: ledges([[330, 440, 160], [550, 360, 200], [1270, 440, 180], [1510, 360, 210],
        [2230, 430, 150], [2450, 350, 210]]),
    gaps: gaps([920, 140], [1950, 150], [2880, 160]), fruits: stars(1, 3, 5),
    enemies: [patrol('scarab', 1140, 1100, 1210), patrol('snail', 2720, 2680, 2780, 45)]
});
const dateOasis = chapter(1, 'oasis', 2000, {
    name: 'Hurma Vahası', width: 4000,
    platforms: ledges([[350, 445, 130], [540, 365, 140], [760, 285, 210], [1400, 445, 160],
        [1640, 360, 220], [2530, 445, 130], [2730, 360, 220]]),
    gaps: gaps([1050, 120], [2170, 150], [3160, 150]), fruits: stars(2, 4, 6),
    enemies: [bird(1260, 335, 1190, 1380), patrol('turtle', 2380, 2350, 2440, 45)]
});
const lanternStreet = chapter(2, 'lanterns', 2150, {
    name: 'Fenerli Sokaklar', width: 4100,
    platforms: ledges([[360, 445, 170], [610, 365, 210], [1480, 435, 160], [1710, 350, 230],
        [2580, 440, 140], [2800, 355, 220], [3320, 435, 170]]),
    gaps: gaps([920, 140], [2280, 150], [3110, 145]), fruits: stars(1, 3, 5),
    passages: [{x: 1130, y: 405, width: 180}, {x: 2420, y: 405, width: 130}],
    enemies: [patrol('scarab', 1370, 1340, 1420), bird(3120, 310, 3040, 3250)]
});
const tiledCourt = chapter(4, 'courtyard', 2020, {
    name: 'Çinili Avlu', width: 3900,
    platforms: ledges([[340, 440, 200], [650, 370, 230], [990, 300, 200], [1440, 425, 210],
        [1760, 350, 190], [2390, 440, 140], [2620, 355, 160], [2880, 275, 220]]),
    gaps: gaps([1230, 150], [2160, 150], [3220, 155]), fruits: stars(2, 4, 7),
    enemies: [patrol('turtle', 1550, 1490, 1590, 50), patrol('scarab', 2500, 2420, 2510, 60)]
});
const pearlArches = chapter(6, 'courtyard', 2120, {
    name: 'Sedefli Kemerler',
    platforms: ledges([[320, 445, 120], [510, 360, 140], [740, 280, 220], [1260, 425, 140],
        [1480, 340, 200], [1810, 410, 160], [2490, 440, 130], [2700, 355, 170], [2960, 275, 220]]),
    gaps: gaps([1040, 140], [2280, 150], [3320, 160]), fruits: stars(2, 4, 8),
    enemies: [bird(2000, 325, 1910, 2080), patrol('scarab', 3550, 3500, 3630)]
});
const starryNight = chapter(7, 'night', 2210, {
    name: 'Yıldızlı Yolculuk', width: 4300,
    platforms: ledges([[390, 440, 150], [610, 355, 230], [1350, 435, 140], [1570, 350, 230],
        [2520, 440, 130], [2730, 355, 160], [2990, 275, 230]]),
    gaps: gaps([970, 155], [1990, 155], [3390, 160]), fruits: stars(1, 3, 6),
    enemies: [bird(1240, 340, 1160, 1330), patrol('scarab', 2360, 2310, 2420), bird(3300, 355, 3250, 3370)]
});
const waterWays = chapter(8, 'oasis', 1960, {
    name: 'Su Yollarının Üstünde',
    platforms: ledges([[330, 440, 170], [600, 370, 180], [880, 295, 220], [1220, 370, 200],
        [1510, 435, 180], [2170, 440, 180], [2450, 360, 180], [2730, 280, 230], [3070, 375, 190]]),
    gaps: gaps([700, 850], [2340, 620]), fruits: stars(2, 4, 7),
    enemies: [bird(1800, 340, 1710, 1880), bird(2930, 190, 2860, 3010)]
});
const sandstonePass = chapter(10, 'canyon', 2240, {
    name: 'Kumtaşı Geçidi', width: 4400,
    platforms: ledges([[340, 440, 130], [530, 355, 170], [790, 275, 200], [1160, 340, 230],
        [1500, 410, 160], [1750, 325, 230], [2580, 440, 130], [2790, 355, 160], [3050, 275, 230]]),
    gaps: gaps([1010, 140], [2050, 135], [2400, 140], [3450, 160]), fruits: stars(2, 5, 8),
    enemies: [patrol('scarab', 1880, 1800, 1930), bird(2340, 340, 2250, 2390), patrol('fox', 3700, 3640, 3760, 65)]
});
const lanternGarden = chapter(11, 'lanterns', 2120, {
    name: 'Fener Bahçesi', width: 4000,
    platforms: ledges([[330, 445, 170], [580, 365, 230], [1300, 440, 140], [1510, 355, 160],
        [1770, 275, 220], [2470, 435, 190], [2770, 350, 230]]),
    gaps: gaps([970, 150], [2250, 145], [3220, 150]), fruits: stars(1, 4, 6),
    enemies: [patrol('turtle', 1200, 1160, 1240, 40), bird(2330, 310, 2180, 2440), patrol('scarab', 3500, 3440, 3560)]
});
const whiteArcades = chapter(13, 'sanctuary', 2210, {
    name: 'Beyaz Revaklar', width: 4400,
    platforms: ledges([[340, 445, 180], [620, 365, 220], [1440, 435, 160], [1680, 350, 230],
        [2510, 440, 140], [2730, 355, 170], [3000, 275, 230]]),
    gaps: gaps([980, 150], [2010, 140], [3380, 150]), fruits: stars(1, 3, 6),
    enemies: [bird(1300, 325, 1190, 1400), patrol('scarab', 2350, 2300, 2420)]
});
const sacredCourt = chapter(14, 'sanctuary', 3360, {
    name: 'Kâbe Avlusuna Varış', width: 4600,
    platforms: ledges([[370, 440, 150], [610, 355, 220], [1370, 430, 140], [1590, 345, 220],
        [2200, 440, 140], [2430, 350, 160], [2690, 270, 220]]),
    gaps: gaps([950, 150], [1900, 160], [3080, 150]), fruits: stars(1, 3, 6),
    enemies: [patrol('snail', 1220, 1170, 1270, 40), bird(1830, 265, 1750, 1880)]
});

export const worldFiveLevels = [crescentRoad, dateOasis, lanternStreet,
    physicsChapter(3, 'Emanet Sandıkları', 'courtyard', ['crate', 'tunnel', 'tower']), tiledCourt,
    physicsChapter(5, 'Çöl Kervanı', 'dunes', ['ramp', 'bridge', 'metal']), pearlArches, starryNight, waterWays,
    physicsChapter(9, 'Denge Avlusu', 'courtyard', ['seesaw', 'suspended', 'balance']), sandstonePass, lanternGarden,
    physicsChapter(12, 'Sırlı Taşlar', 'night', ['stepping', 'drop', 'bridge']), whiteArcades, sacredCourt];
