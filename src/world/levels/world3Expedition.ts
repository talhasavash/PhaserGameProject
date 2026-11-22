// Dünya 3'ün 36–45. bölümleri: ayrı rotalar ve sahneler, ortak kış varsayılanlarıyla kurulur.
import { createLevelBuilder } from '../model/definitions.js';
import type { LevelInput } from '../model/contracts.js';
import { defineEnemy as enemy } from '../../actors/enemies/EnemyCatalog.js';
import { platform as step, item, gap, iceArea, column, outfits, scenery as art, weather,
    rain, movement, behavior, weapon, scenario, fountain, belt } from '../model/levelParts.js';

// Sadece yeni bölümler kullanır; mevcut buz şablonunu ve ilk beş bölümü değiştirmez.
const winterLevel = createLevelBuilder({
    theme: 'glacier', player: outfits.winter(),
    environment: { platformStyle: 'snow', weather: weather.snow({intensity: 0.7}) }
}, input => ({...input, fruits: [...(input.fruits || []), ...bonusFruit(input)]}));

function bonusFruit(level: LevelInput) {
    const types = ['pear', 'orange', 'strawberry', 'banana', 'grapes', 'apple'] as const;
    const spots = (level.platforms || []).map(p => ({x: p.x + 26, y: p.y - 36}));
    for (let x = 240, i = 0; x < level.width! - 550; x += 190, i++) {
        const fruitX = x + (i % 3) * 13;
        if ((level.gaps || []).some(g => fruitX > g.x - 30 && fruitX < g.x + g.width + 30)) continue;
        if ((level.columns || []).some(c => Math.abs(c.x - fruitX) < c.width / 2 + 35)) continue;
        spots.push({x: fruitX, y: 480 - (i % 3) * 17});
    }
    return spots.map((p, i) => item.at(types[i % types.length], p.x, p.y));
}

const blink = behavior.visibility(2900, 2400, {fadeMs: 260});
const hop = behavior.hop(2400, 450, {height: 62, duration: 800});
const disc = (period = 3700) => weapon.of('snow-disc', {period});
const wave = (period = 3500) => weapon.of('frost-wave', {period});

// 36: alçak buz iskeleleri, aralıklı su yarıkları ve geri dönen kar diskleri.
const silentHarbor = winterLevel({
    name: 'Sessiz Buz Limanı', width: 4400, checkpoint: {x: 2320},
    environment: {scenery: art.background(0x8ed5e5, [
        art.sun(740, 135, {color: 0xffe5b2}),
        art.repeat(art.cloud(180, 115, {width: 240, height: 60}), 6, 610),
        art.repeat(art.mountain(320, 375, {width: 620, height: 190, color: 0x81acc8}), 6, 690),
        art.repeat(art.hill(200, 470, {width: 470, height: 70, color: 0xb7ecf0, scrollFactor: 0.65}), 9, 520),
        art.repeat(art.circle(100, 498, {width: 350, height: 14, color: 0x65adc7, depth: -8, scrollFactor: 0.8}), 10, 430)
    ], {body: 0x5b91b4, edge: 0xb8f1f6})},
    platforms: [step.icy(400, 440, 200), step.icy(650, 360, 220), step.solid(1280, 445, 200, {style: 'river'}),
        step.icy(1790, 440, 200), step.icy(2030, 365, 220), step.icy(2830, 440, 180),
        step.icy(3060, 360, 210), step.icy(3320, 280, 200)],
    gaps: [gap(990, 135, {style: 'glacier'}), gap(1510, 140, {style: 'glacier'}), gap(2520, 145, {style: 'glacier'}), gap(3570, 140, {style: 'glacier'})],
    ice: [iceArea(300, 420), iceArea(1780, 320), iceArea(2770, 420)],
    fruits: [item.onPlatform('star', 1), item.onPlatform('star', 4), item.onPlatform('star', 7), item.at('lantern', 2350, 480)],
    enemies: [
        enemy('penguin', {x: 1260, movement: movement.patrol(1170, 1400, 85)}),
        enemy('ice-owl', {x: 1820, y: 280, movement: movement.patrol(1690, 2030, 85), behaviors: {vertical: behavior.vertical(25)}}),
        enemy('ice-sentinel', {x: 2370, weapon: disc(), movement: movement.stationary()}),
        enemy('ice-crab', {platform: 7, speed: 70, behaviors: {visibility: blink}})
    ],
    fountains: [fountain(2310)],
    mosqueStyle: {wall: 0xd6f4f4, roof: 0x2988ab, trim: 0xe5dba9, width: 220, towers: [-135, 135]}
});

// 37: düşen sütunlar arasında kuru bekleme cepleri; üst rota yıldızlara çıkar.
const pendulumCave = winterLevel({
    name: 'Sarkaç Mağarası', width: 4700, checkpoint: {x: 2650}, theme: 'iceCave',
    environment: {platformStyle: 'iceCave', weather: false, scenery: art.background(0x162f4e, [
        art.repeat(art.hill(250, 175, {width: 780, height: 490, color: 0x294965, depth: -90, scrollFactor: 0.2}), 6, 700),
        art.repeat(art.triangle(120, 310, {width: 80, height: 310, color: 0x4f7895, depth: -60, scrollFactor: 0.4}), 12, 350),
        art.repeat(art.circle(300, 230, {width: 20, height: 20, color: 0x88edee, alpha: 0.7}), 10, 410),
        art.repeat(art.mountain(170, 475, {width: 140, height: 100, color: 0x74bacb, detailColor: 0xd4f5ff, depth: -15, scrollFactor: 0.85}), 10, 450)
    ], {body: 0x2a4a66, edge: 0x88c8df})},
    platforms: [step.solid(360, 440, 180), step.icy(590, 360, 220), step.icy(1690, 440, 180),
        step.solid(1910, 360, 170), step.icy(2130, 280, 220), step.icy(3260, 440, 190), step.icy(3500, 360, 220)],
    columns: [column(990, 76, {raisedBottom: 180, openMs: 2300}), column(1210, 76, {raisedBottom: 240, openMs: 2300, startDelay: 650}),
        column(1430, 76, {raisedBottom: 160, openMs: 2300, startDelay: 1300}), column(2770, 80, {raisedBottom: 210, openMs: 2100}),
        column(3000, 80, {raisedBottom: 170, openMs: 2100, startDelay: 750})],
    gaps: [gap(2440, 140), gap(3810, 145)], ice: [iceArea(1560, 340), iceArea(3200, 340)],
    fruits: [item.onPlatform('star', 1), item.at('star', 2620, 485), item.onPlatform('star', 6), item.at('bead', 2640, 480)],
    enemies: [enemy('ice-crab', {platform: 1, speed: 65, behaviors: {visibility: blink}}),
        enemy('frost-bat', {x: 2060, y: 205, movement: movement.patrol(1800, 2250, 85), bob: 20}),
        enemy('ice-sentinel', {x: 4110, weapon: weapon.iceShard({volley: 1, period: 3400, speed: 180})})],
    fountains: [fountain(2630)],
    mosqueStyle: {wall: 0xaacfe1, roof: 0x586fa9, trim: 0x9cf2e4, width: 240, towers: [-145], domes: [[-65, 430, 80, 65], [45, 390, 125, 105]]}
});

// 38: görüşü kapatmayan tipi ve çam ormanı; takip eden tilkilerden kuru adalara kaçılır.
const blizzardForest = winterLevel({
    name: 'Tipi Ormanı', width: 4900, checkpoint: {x: 2510},
    environment: {platformStyle: 'moonwood', weather: weather.snow({intensity: 1.15, wind: -60}), scenery: art.background(0xa4c9d4, [
        art.repeat(art.cloud(150, 100, {width: 420, height: 90, color: 0xd3e2e7}), 7, 480),
        art.repeat(art.pine(130, 340, {width: 150, height: 350, color: 0x759ba6, detailColor: 0x7d8995, scrollFactor: 0.3, depth: -65}), 14, 300),
        art.repeat(art.pine(300, 395, {width: 170, height: 260, color: 0x376d80}), 10, 490),
        art.repeat(art.hill(210, 505, {width: 430, height: 70, color: 0xe1eff2, depth: -10, scrollFactor: 0.9}), 11, 470)
    ], {body: 0x638b9e, edge: 0xd8f4f4})},
    platforms: [step.solid(350, 440, 170, {style: 'moonwood'}), step.icy(570, 360, 200),
        step.icy(1390, 440, 190), step.solid(1630, 360, 210, {style: 'moonwood'}),
        step.solid(2610, 440, 180, {style: 'moonwood'}), step.icy(2840, 360, 170), step.icy(3060, 280, 210),
        step.solid(3870, 440, 190, {style: 'moonwood'})],
    gaps: [gap(1010, 140), gap(2170, 145), gap(3450, 145), gap(4150, 150)],
    ice: [iceArea(810, 180), iceArea(1880, 230), iceArea(3630, 180)],
    fruits: [item.onPlatform('star', 1), item.onPlatform('star', 3), item.at('star', 3720, 485), item.at('crescent', 2500, 480)],
    enemies: [enemy('snow-hare', {x: 880, movement: movement.patrol(800, 960, 95), behaviors: {hop}}),
        enemy('snow-fox', {x: 1950, movement: movement.chase(1870, 2090, {speed: 100, range: 290}), behaviors: {hop}}),
        enemy('ice-owl', {x: 2500, y: 350, movement: movement.patrol(2370, 2650, 90), weapon: weapon.snowball({period: 3700, speed: 150}), bob: 25}),
        enemy('snow-hare', {platform: 6, speed: 75, behaviors: {hop, visibility: blink}}),
        enemy('snow-fox', {x: 4500, movement: movement.chase(4400, 4570, {speed: 110, range: 300})})],
    fountains: [fountain(2490)],
    mosqueStyle: {wall: 0xe1ede0, roof: 0x39776f, trim: 0xe3ce9d, width: 210, towers: [-128, 128], domes: [[0, 400, 145, 90]]}
});

// 39: pembe kristaller ve iki dokunuş isteyen donmuş nesneler; farklı yükseklikte üç vitrin.
const crystalGarden = winterLevel({
    name: 'Donmuş Kristal Bahçesi', width: 4800, theme: 'crystalPalace', frozenItems: true, checkpoint: {x: 2490},
    environment: {platformStyle: 'crystalPalace', weather: weather.snow({intensity: 0.4}), scenery: art.background(0xc9badf, [
        art.sun(740, 130, {width: 130, height: 130, color: 0xffd6dc}),
        art.repeat(art.mountain(260, 375, {width: 560, height: 250, color: 0x9e93c4, detailColor: 0xf1e7fc}), 7, 630),
        art.repeat(art.triangle(200, 435, {width: 90, height: 170, color: 0x86cfdb, scrollFactor: 0.7, depth: -25}), 12, 370),
        art.repeat(art.triangle(270, 462, {width: 75, height: 105, color: 0xedaee5, scrollFactor: 0.7, depth: -24}), 12, 370),
        art.repeat(art.circle(180, 260, {width: 8, height: 8, color: 0xffffff}), 18, 250)
    ], {body: 0x8d81ad, edge: 0xe2f8ff})},
    platforms: [step.icy(340, 440, 180), step.solid(570, 360, 180), step.icy(800, 280, 220),
        step.icy(1670, 440, 190), step.solid(1910, 360, 230), step.solid(2780, 440, 180),
        step.icy(3010, 360, 180), step.solid(3240, 280, 230)],
    gaps: [gap(1190, 140), gap(2250, 145), gap(3720, 145)], ice: [iceArea(1380, 240), iceArea(2520, 200)],
    fruits: [item.onPlatform('star', 2), item.onPlatform('star', 4), item.onPlatform('star', 7), item.at('lantern', 2490, 480)],
    enemies: [enemy('ice-sentinel', {x: 1450, weapon: wave(3900)}),
        enemy('ice-crab', {platform: 4, speed: 65, behaviors: {visibility: blink}}),
        enemy('ice-owl', {x: 2880, y: 260, movement: movement.patrol(2690, 3040, 75), bob: 22}),
        enemy('ice-sentinel', {x: 4080, weapon: disc(4000)})],
    fountains: [fountain(2480)],
    mosqueStyle: {wall: 0xf0ddef, roof: 0x9582c6, trim: 0xb0f3ef, width: 250, towers: [-150, 150], domes: [[-70, 425, 90, 70], [70, 425, 90, 70], [0, 380, 120, 120]]}
});

// 40: donmuş makinelerin bantları ile sıralı presler birlikte zamanlama ister.
const clockTower = winterLevel({
    name: 'Ayaz Saat Kulesi', width: 5100, checkpoint: {x: 2670},
    environment: {platformStyle: 'factory', weather: weather.snow({intensity: 0.45}), scenery: art.background(0x526a8d, [
        art.moon(730, 115, {color: 0xf4dcaa}),
        art.repeat(art.circle(280, 350, {width: 190, height: 340, color: 0x364e73, depth: -65, scrollFactor: 0.3}), 9, 540),
        art.repeat(art.circle(280, 260, {width: 120, height: 120, color: 0xc2c8b1, detailColor: 0x8da3b8, depth: -60, scrollFactor: 0.3}), 9, 540),
        art.repeat(art.triangle(280, 270, {width: 12, height: 65, color: 0x415471, depth: -55, scrollFactor: 0.3}), 9, 540),
        art.repeat(art.pine(130, 435, {width: 130, height: 170, color: 0x83abbf}), 9, 600)
    ], {body: 0x475d7d, edge: 0xb3dbea})},
    platforms: [step.solid(360, 440, 190), step.icy(600, 360, 220), step.icy(1860, 440, 200),
        step.solid(2110, 360, 220), step.icy(3260, 440, 170), step.solid(3480, 360, 170), step.icy(3700, 280, 220)],
    belts: [belt(930, 280, -65), belt(2690, 290, 70)],
    columns: [column(1110, 76, {style: 'glacier', openMs: 2200, raisedBottom: 180}),
        column(1410, 76, {style: 'glacier', openMs: 2200, raisedBottom: 210, startDelay: 700}),
        column(2840, 80, {style: 'glacier', openMs: 2100, raisedBottom: 190}),
        column(3090, 80, {style: 'glacier', openMs: 2100, raisedBottom: 170, startDelay: 750})],
    gaps: [gap(1620, 140), gap(2410, 145), gap(4040, 150)], ice: [iceArea(1830, 280), iceArea(4300, 230)],
    fruits: [item.at('star', 880, 485), item.onPlatform('star', 3), item.onPlatform('star', 6), item.at('bead', 2650, 480)],
    enemies: [enemy('ice-sentinel', {x: 2630, weapon: weapon.bullet({period: 3600, speed: 190})}),
        enemy('snow-hare', {platform: 3, speed: 75, behaviors: {hop, visibility: blink}}),
        enemy('ice-owl', {x: 3520, y: 245, movement: movement.patrol(3300, 3730, 90), bob: 25}),
        enemy('ice-sentinel', {x: 4530, weapon: disc()})],
    fountains: [fountain(2610)],
    mosqueStyle: {wall: 0xd1e4e6, roof: 0x50698b, trim: 0xe9c783, width: 240, towers: [-145, 145], domes: [[-60, 415, 95, 85], [60, 415, 95, 85]]}
});

// 41: uzun bir uçurum yerine aralarında iniş cepleri bulunan üç ayrı zirve.
const cloudPass = winterLevel({
    name: 'Bulutların Üstünde', width: 5200, checkpoint: {x: 2800},
    environment: {platformStyle: 'aurora', weather: weather.snow({intensity: 0.55, wind: 25}), scenery: art.background(0x8ebce8, [
        art.sun(650, 100, {width: 150, height: 150, color: 0xffedbd}),
        art.repeat(art.mountain(220, 420, {width: 750, height: 510, color: 0x83a5d0, detailColor: 0xf7fcff, scrollFactor: 0.15}), 6, 800),
        art.repeat(art.cloud(130, 420, {width: 430, height: 120, color: 0xe1f2fc, depth: -30, scrollFactor: 0.5}), 10, 490),
        art.repeat(art.cloud(280, 495, {width: 340, height: 65, color: 0xf2fbff, depth: -10, scrollFactor: 0.8}), 11, 480)
    ], {body: 0x8aa8cb, edge: 0xe1f5ff})},
    platforms: [step.icy(340, 440, 160), step.icy(550, 360, 160), step.icy(760, 280, 160), step.solid(970, 200, 210),
        step.icy(1700, 440, 160), step.icy(1910, 360, 160), step.solid(2120, 280, 210),
        step.icy(3000, 440, 160), step.icy(3210, 360, 160), step.icy(3420, 280, 160), step.solid(3630, 200, 220),
        step.icy(4330, 440, 180)],
    gaps: [gap(1240, 150), gap(2450, 150), gap(4000, 150)],
    ice: [iceArea(1440, 170), iceArea(2660, 180), iceArea(4230, 200)],
    fruits: [item.onPlatform('star', 3), item.onPlatform('star', 6), item.onPlatform('star', 10), item.at('crescent', 2800, 480)],
    enemies: [enemy('ice-owl', {x: 850, y: 170, movement: movement.patrol(750, 1060, 80), bob: 18}),
        enemy('frost-bat', {x: 1900, y: 270, movement: movement.patrol(1750, 2070, 90), behaviors: {visibility: blink}, bob: 25}),
        enemy('ice-owl', {x: 3500, y: 150, movement: movement.patrol(3350, 3760, 85), weapon: wave(4100), bob: 20}),
        enemy('penguin', {platform: 11, speed: 65, behaviors: {hop}})],
    fountains: [fountain(2810)],
    mosqueStyle: {wall: 0xf3f9fc, roof: 0x80aee3, trim: 0xf6dfb3, width: 235, towers: [-145, -113, 113, 145], domes: [[0, 390, 150, 115]]}
});

// 42: kar altındaki eski kervan yolu; alçak geçitler ve nöbetçi silah değişimi.
const caravanRoad = winterLevel({
    name: 'Donmuş Kervan Yolu', width: 5200, checkpoint: {x: 2750},
    environment: {platformStyle: 'courtyard', weather: weather.snow({intensity: 0.65, wind: -20}), scenery: art.background(0xd7bcc3, [
        art.sun(780, 150, {width: 170, height: 170, color: 0xffdaa1}),
        art.repeat(art.mountain(240, 385, {width: 650, height: 260, color: 0xad96b2, detailColor: 0xe2e6f2}), 7, 650),
        art.repeat(art.circle(200, 420, {width: 80, height: 200, color: 0x8a92b0, depth: -40, scrollFactor: 0.55}), 12, 380),
        art.repeat(art.circle(200, 335, {width: 120, height: 50, color: 0xe1dfec, depth: -39, scrollFactor: 0.55}), 12, 380),
        art.repeat(art.hill(250, 510, {width: 600, height: 100, color: 0xe5d9e4, scrollFactor: 0.8, depth: -10}), 9, 620)
    ], {body: 0xa293ab, edge: 0xe8e8f4})},
    platforms: [step.solid(340, 440, 180), step.icy(570, 360, 210), step.solid(1520, 440, 180),
        step.icy(1750, 360, 190), step.solid(1990, 280, 220), step.solid(3010, 440, 200),
        step.icy(3260, 360, 210), step.solid(3950, 440, 200)],
    passages: [{x: 940, y: 420, width: 300}, {x: 3590, y: 420, width: 230}],
    columns: [column(2520, 80, {raisedBottom: 180, openMs: 2100, style: 'glacier'})],
    gaps: [gap(1280, 140), gap(2250, 150), gap(4250, 155)],
    ice: [iceArea(910, 300), iceArea(3500, 310)],
    fruits: [item.at('star', 1110, 485), item.onPlatform('star', 4), item.at('star', 3690, 485), item.at('mat', 2780, 480)],
    enemies: [enemy('snow-hare', {x: 1120, movement: movement.patrol(1010, 1190, 80), behaviors: {visibility: blink}}),
        enemy('ice-sentinel', {id: 'caravan-guard', x: 2840, weapon: disc(4000)}),
        enemy('snow-fox', {platform: 4, speed: 70, behaviors: {visibility: blink}}),
        enemy('ice-sentinel', {x: 4640, weapon: weapon.snowball({period: 3300, speed: 190})})],
    scenarios: [scenario.changeWeapon(2600, 350, 'caravan-guard', wave(3600))],
    fountains: [fountain(2730)],
    mosqueStyle: {wall: 0xeae2db, roof: 0xa1a9cf, trim: 0xcfad73, width: 260, towers: [-158, 158], domes: [[-80, 425, 90, 75], [80, 425, 90, 75], [0, 390, 120, 110]]}
});

// 43: karanlıkta ay ışığı ve ince yıldızlar; görünürlük döngüsü hareket hızından önemlidir.
const polarNight = winterLevel({
    name: 'Kutup Gecesinin İzleri', width: 5400, checkpoint: {x: 2880}, theme: 'aurora',
    environment: {platformStyle: 'aurora', weather: weather.snow({intensity: 0.5}), scenery: art.background(0x142342, [
        art.moon(720, 130, {width: 130, height: 130, color: 0xe7edff}),
        art.repeat(art.circle(110, 80, {width: 5, height: 5, color: 0xffffff, depth: -95, scrollFactor: 0.06}), 25, 180),
        art.repeat(art.circle(230, 180, {width: 3, height: 3, color: 0xaff3f0, depth: -94, scrollFactor: 0.09}), 22, 210),
        art.repeat(art.hill(300, 160, {width: 650, height: 90, color: 0x5db6b1, alpha: 0.3, depth: -85, scrollFactor: 0.12}), 7, 600),
        art.repeat(art.mountain(200, 405, {width: 580, height: 240, color: 0x314b75, detailColor: 0x8bacd0}), 8, 620),
        art.repeat(art.pine(300, 430, {width: 120, height: 170, color: 0x233b59}), 12, 430)
    ], {body: 0x324864, edge: 0x9bcce0})},
    platforms: [step.icy(400, 440, 170), step.solid(620, 360, 210), step.icy(1570, 440, 170),
        step.icy(1790, 360, 170), step.solid(2010, 280, 220), step.icy(2990, 440, 170),
        step.solid(3210, 360, 210), step.icy(4080, 440, 190)],
    gaps: [gap(1050, 150), gap(2410, 150), gap(3660, 155), gap(4380, 155)],
    columns: [column(2720, 78, {raisedBottom: 190, openMs: 2100})],
    ice: [iceArea(1260, 230), iceArea(2630, 260), iceArea(3880, 190)],
    fruits: [item.at('star', 1390, 485), item.onPlatform('star', 4), item.onPlatform('star', 7), item.at('lantern', 2740, 480)],
    enemies: [enemy('ice-owl', {x: 1290, y: 370, movement: movement.patrol(1230, 1470, 95), weapon: wave(), behaviors: {visibility: blink}, bob: 24}),
        enemy('snow-hare', {platform: 4, speed: 80, behaviors: {hop, visibility: blink}}),
        enemy('snow-fox', {x: 3500, movement: movement.chase(3470, 3600, {speed: 100, range: 260}), behaviors: {visibility: blink}}),
        enemy('ice-sentinel', {x: 4720, weapon: disc(), behaviors: {visibility: blink}})],
    fountains: [fountain(2830)],
    mosqueStyle: {wall: 0x95afcb, roof: 0x405b8d, trim: 0xb5f3e5, width: 245, towers: [-148, 148], domes: [[-70, 425, 80, 70], [60, 405, 130, 110]]}
});

// 44: birbirine bağlanan alçak/yüksek rotalar, kurak sığınaklar ve seyrek çığ topları.
const glacierMaze = winterLevel({
    name: 'Mavi Buzul Labirenti', width: 5700, checkpoint: {x: 2850}, theme: 'iceCave',
    environment: {platformStyle: 'glacier', weather: false, scenery: art.background(0x206f8b, [
        art.repeat(art.circle(230, 260, {width: 330, height: 440, color: 0x368fa3, scrollFactor: 0.25, depth: -80}), 8, 650),
        art.repeat(art.triangle(150, 365, {width: 170, height: 300, color: 0x70c9d0, scrollFactor: 0.5, depth: -55}), 12, 470),
        art.repeat(art.triangle(230, 440, {width: 120, height: 150, color: 0xb1f0ec, scrollFactor: 0.65, depth: -35}), 12, 470),
        art.repeat(art.circle(300, 240, {width: 14, height: 14, color: 0xe8ffff, alpha: 0.65}), 13, 410)
    ], {body: 0x3f91a7, edge: 0xc4ffff})},
    platforms: [step.icy(330, 440, 170), step.icy(550, 360, 170), step.solid(770, 280, 220),
        step.solid(1570, 440, 200), step.icy(1820, 360, 180), step.icy(2050, 280, 200),
        step.icy(3020, 440, 180), step.solid(3250, 360, 180), step.icy(3480, 280, 230),
        step.solid(4400, 440, 180), step.icy(4630, 360, 200)],
    gaps: [gap(1170, 150), gap(2410, 150), gap(3930, 155), gap(4930, 150)],
    columns: [column(2690, 80, {raisedBottom: 180, openMs: 2000}), column(4190, 80, {raisedBottom: 210, openMs: 2100})],
    passages: [{x: 1400, y: 420, width: 200}, {x: 2790, y: 420, width: 170}, {x: 4350, y: 350, width: 350}],
    ice: [iceArea(1390, 160), iceArea(2860, 140), iceArea(5170, 160)],
    fireRain: [rain.snow({period: 11500, speed: 320, offset: 6200})],
    fruits: [item.onPlatform('star', 2), item.onPlatform('star', 5), item.at('star', 4440, 485), item.at('bead', 2840, 480)],
    enemies: [enemy('ice-sentinel', {x: 1450, weapon: disc(3900)}),
        enemy('ice-crab', {platform: 5, speed: 80, behaviors: {hop, visibility: blink}}),
        enemy('ice-owl', {x: 3120, y: 245, movement: movement.patrol(2990, 3310, 95), bob: 20}),
        enemy('snow-hare', {platform: 8, speed: 80, behaviors: {hop, visibility: blink}}),
        enemy('ice-sentinel', {x: 5200, weapon: weapon.iceShard({period: 3800, speed: 190, volley: 2, spread: 0.13})})],
    fountains: [fountain(2860)],
    mosqueStyle: {wall: 0xc3edf1, roof: 0x39a3b0, trim: 0xf0e2b6, width: 240, towers: [-145], domes: [[-60, 400, 110, 105], [70, 430, 85, 65]]}
});

// 45: üç ayrı yaklaşma sınavı, ardından zıplayan mamutun altından geçilen final.
const winterCrown = winterLevel({
    name: 'Kış Tacının Muhafızı', width: 6100, boss: true, checkpoint: {x: 4410}, theme: 'crystalPalace',
    environment: {platformStyle: 'crystalPalace', weather: weather.snow({intensity: 0.8}), scenery: art.background(0x443d78, [
        art.moon(730, 100, {width: 125, height: 125, color: 0xffeecb}),
        art.repeat(art.circle(120, 145, {width: 6, height: 6, color: 0xebf6ff, scrollFactor: 0.08, depth: -95}), 25, 240),
        art.repeat(art.mountain(300, 390, {width: 720, height: 350, color: 0x6865a4, detailColor: 0xcad7f2}), 8, 730),
        art.repeat(art.triangle(140, 400, {width: 140, height: 230, color: 0x88a3cc, scrollFactor: 0.6, depth: -35}), 12, 530),
        art.repeat(art.circle(350, 460, {width: 220, height: 130, color: 0xb6cedf, scrollFactor: 0.7, depth: -20}), 10, 620)
    ], {body: 0x625d94, edge: 0xe1eefb})},
    platforms: [step.icy(350, 440, 170), step.solid(570, 360, 200), step.icy(1520, 440, 170),
        step.icy(1740, 360, 170), step.solid(1960, 280, 220), step.icy(2940, 440, 170),
        step.icy(3160, 360, 170), step.solid(3380, 280, 230), step.solid(4240, 440, 210)],
    gaps: [gap(1030, 150), gap(2330, 150), gap(3810, 155)],
    columns: [column(2680, 80, {raisedBottom: 175, openMs: 2000}), column(4010, 80, {raisedBottom: 210, openMs: 2000})],
    ice: [iceArea(1240, 210), iceArea(2510, 160), iceArea(4550, 190)],
    fireRain: [rain.snow({period: 12500, speed: 320, offset: 6800})],
    fruits: [item.onPlatform('star', 1), item.onPlatform('star', 4), item.onPlatform('star', 7), item.at('crescent', 4450, 480)],
    enemies: [enemy('snow-hare', {platform: 1, speed: 80, behaviors: {hop, visibility: blink}}),
        enemy('ice-sentinel', {x: 1370, weapon: disc(4000)}),
        enemy('ice-owl', {x: 1990, y: 175, movement: movement.patrol(1870, 2180, 90), bob: 18}),
        enemy('snowman', {x: 2840, weapon: weapon.snowball({period: 3400, speed: 190})}),
        enemy('ice-crab', {platform: 7, speed: 75, behaviors: {visibility: blink}}),
        enemy('glacier-mammoth', {id: 'winter-crown', x: 5300, movement: movement.stationary(),
            behaviors: {jump: behavior.jump(215, 1700, 4200)}, weapon: weapon.of('ice-axe')})],
    fountains: [fountain(4440)],
    mosqueStyle: {wall: 0xe3ebfc, roof: 0x8b83d0, trim: 0xf5d99a, width: 270, towers: [-162, -125, 125, 162], domes: [[-85, 420, 95, 80], [85, 420, 95, 80], [0, 370, 140, 140]]}
});

export const iceExpeditionLevels = [silentHarbor, pendulumCave, blizzardForest, crystalGarden, clockTower,
    cloudPass, caravanRoad, polarNight, glacierMaze, winterCrown];
