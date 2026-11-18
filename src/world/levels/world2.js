// Dünya 2: 16–30. bölümler; ilk yolculuk, gece ormanı ve karanlık geçitler.
import { defineLevel } from '../model/definitions.js';
import { nightChapter } from '../model/templates.js';
export { nightChapter };

export const firstJourney = defineLevel({

    name: 'Yeni Bölüm', theme: 'moonwood', width: 3200, groundY: 520,
    spawn: {x:100 , y:480},
    checkpoint: {x:1500 , y:480} ,
    key: {x: 2700, y: 477},
    exit: {x: 2950, y: 468},

    platforms: [
                {x: 300, y: 450, width: 50},
                {x: 400, y: 350, width: 50},
                {x: 500, y: 250, width: 50},
                {x: 600, y: 150, width: 50},
                {x: 400, y: 430, width: 180}
                ],

    fruits: [
                {id:'fruit-1', type:'apple', x: 300, y: 200},
                {id:'fruit-2', type:'orange', x: 400, y: 200},
                {id:'fruit-3', type:'grapes', x: 500, y: 200},
                {id:'star-1',  type:'star', x: 550, y: 400},
                {id:'star-2',  type:'star', x: 1400, y: 480},
                {id:'star-3',  type:'star', x: 2450, y: 480}
            ],

    enemies: [
                {type:'hedgehog', x: 490, y:411, minX: 453, maxX:545, speed:45},
                {type:'snail', x: 500, minX: 900, maxX:1200, speed:65},
                {type:'frog', x: 600, minX: 1000, maxX:1300, speed:65},
                {type:'bee', x: 2250, y:410, minX: 2150, maxX:2350, speed:80, bob:25}
    ],

    fountains: [{ id: 'fountain-1', x: 2500 }],
    belt: {x: 2050, width: 250, speed:-120},
    gaps: [{ x: 1900, width: 100 }],
    fireRain: [{ period: 10000, offset: 4000, speed: 250 }],
    ice: [{ x: 1600, width: 180 } ]
});

// Yıldız bekçisi konumunu basamaktan alır; görünmezlik arası yıldızı almak için fırsattır.
function platformGuard(type, platform, speed) {
    return { type, platform, speed };
}

const moonForest = nightChapter({
    name: 'Ay Işığı Ormanı', theme: 'moonwood', width: 4300,
    checkpoint: { x: 2500, y: 480 },
    // İki katlı yükseliş, yüksek ağaç rotası ve alçak geniş kütük: üç farklı yol.
    platforms: [
        { x: 360, y: 438, width: 90, single: true }, { x: 515, y: 354, width: 160 },
        { x: 1430, y: 445, width: 80, single: true }, { x: 1580, y: 362, width: 80, single: true }, { x: 1735, y: 286, width: 160 },
        { x: 2820, y: 430, width: 160 }, { x: 3040, y: 410, width: 90, single: true }, { x: 3190, y: 340, width: 80, single: true }
    ],
    gaps: [{ x: 850, width: 155 }, { x: 1190, width: 150 }, { x: 1980, width: 160 }, { x: 2570, width: 155 }, { x: 3400, width: 160 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 1 },
        { id: 'star-2', type: 'star', platform: 4 },
        { id: 'star-3', type: 'star', platform: 5 },
        { id: 'fruit-4', type: 'apple', x: 918, y: 425 },
        { id: 'lantern-1', type: 'lantern', x: 2200, y: 480 },
        { id: 'bead-1', type: 'bead', x: 3580, y: 480 }
    ],
    enemies: [
        platformGuard('dusk-wolf', 1, 165),
        platformGuard('moon-scorpion', 4, 180),
        platformGuard('cave-crab', 5, 190),
        { type: 'night-owl', x: 1090, y: 385, minX: 1035, maxX: 1150, speed: 170, bob: 28 },
        { type: 'spider', x: 1410, y: 385, minX: 1410, maxX: 1410, speed: 0, bob: 95, period: 1700, offset: 400 },
        { type: 'moon-moth', x: 2300, y: 380, minX: 2180, maxX: 2480, speed: 185, bob: 28 },
        { type: 'shadow-fox', x: 2810, minX: 2770, maxX: 2850, speed: 175 },
        { type: 'spider', x: 3660, y: 385, minX: 3660, maxX: 3660, speed: 0, bob: 95, period: 1500 }
    ]
});

const silentRuins = nightChapter({
    name: 'Sessiz Harabeler', theme: 'nightRuins', width: 4800,
    // Kısa aralıklı pres dalgası ve üst basamakları koruyan ay akrepleri.
    platforms: [
        { x: 400, y: 428, width: 90, single: true }, { x: 530, y: 345, width: 80, single: true }, { x: 670, y: 275, width: 160 },
        { x: 2060, y: 435, width: 90, single: true }, { x: 2200, y: 350, width: 80, single: true }, { x: 1960, y: 276, width: 160 },
        { x: 3520, y: 440, width: 160 }, { x: 3760, y: 400, width: 80, single: true }
    ],
    gaps: [{ x: 1490, width: 160 }, { x: 1840, width: 155 }, { x: 2870, width: 160 }, { x: 3200, width: 155 }, { x: 3970, width: 160 }],
    columns: [
        { x: 950, width: 76, openMs: 1350, startDelay: 0, raisedRange: [160, 230] },
        { x: 1140, width: 76, openMs: 1350, startDelay: 380, raisedRange: [240, 300] },
        { x: 1330, width: 76, openMs: 1350, startDelay: 760, raisedRange: [170, 240] }
    ],
    passages: [{ x: 2350, y: 390, width: 360 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 2 },
        { id: 'star-2', type: 'star', platform: 5 },
        { id: 'star-3', type: 'star', platform: 6 },
        { id: 'lantern-1', type: 'lantern', x: 1760, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 4260, y: 480 }
    ],
    enemies: [
        platformGuard('cave-crab', 2, 185),
        platformGuard('shadow-fox', 5, 195),
        platformGuard('moon-scorpion', 6, 205),
        { type: 'moon-moth', x: 1720, y: 365, minX: 1660, maxX: 1890, speed: 190, bob: 35 },
        { type: 'night-owl', x: 2530, y: 315, minX: 2390, maxX: 2670, speed: 210, bob: 22 },
        { type: 'spider', x: 3420, y: 385, minX: 3420, maxX: 3420, speed: 0, bob: 95, period: 1450 },
        { type: 'dusk-wolf', x: 4240, minX: 4190, maxX: 4330, speed: 195 }
    ]
});

const moonCitadel = nightChapter({
    name: 'Gecenin Muhafızı', theme: 'nightKeep', width: 5500, boss: true,
    checkpoint: { x: 2780, y: 480 },
    fountains: [{ id: 'fountain-1', x: 2650 }, { id: 'fountain-2', x: 4500 }],
    platforms: [
        { x: 400, y: 436, width: 160 }, { x: 1020, y: 434, width: 80, single: true },
        { x: 1890, y: 444, width: 80, single: true }, { x: 2010, y: 365, width: 80, single: true },
        { x: 2130, y: 281, width: 80, single: true }, { x: 2250, y: 210, width: 160 },
        { x: 3310, y: 439, width: 80, single: true }, { x: 3450, y: 361, width: 160 }, { x: 3680, y: 430, width: 90, single: true }
    ],
    gaps: [
        { x: 780, width: 150 }, { x: 1140, width: 155 }, { x: 1500, width: 160 },
        { x: 2440, width: 160 }, { x: 3740, width: 160 }, { x: 4110, width: 165 }
    ],
    columns: [
        { x: 2940, width: 80, openMs: 1250, offset: 0, raisedRange: [150, 220] },
        { x: 3130, width: 80, openMs: 1250, offset: 550, raisedRange: [230, 290] },
        { x: 4400, width: 80, openMs: 1250, offset: 1100, raisedRange: [170, 250] }
    ],
    fruits: [
        { id: 'star-1', type: 'star', platform: 0 },
        { id: 'star-2', type: 'star', platform: 5 },
        { id: 'star-3', type: 'star', platform: 7 },
        { id: 'lantern-1', type: 'lantern', x: 1370, y: 480 },
        { id: 'mat-1', type: 'mat', x: 4370, y: 480 }
    ],
    enemies: [
        platformGuard('dusk-wolf', 0, 200),
        platformGuard('cave-crab', 5, 215),
        platformGuard('moon-scorpion', 7, 225),
        { type: 'moon-moth', x: 1030, y: 385, minX: 960, maxX: 1100, speed: 215, bob: 30 },
        { type: 'spider', x: 1800, y: 385, minX: 1800, maxX: 1800, speed: 0, bob: 95, period: 1300 },
        { type: 'night-owl', x: 2490, y: 370, minX: 2380, maxX: 2630, speed: 225, bob: 32 },
        { type: 'ogre', texture: 'ogre-stone', x: 4780, minX: 4780, maxX: 4780, speed: 0, scale: 2.2,
            jump: { height: 200, duration: 1450, period: 3450, offset: 1100 } }
    ]
});

export const nightLevels = [moonForest, silentRuins, moonCitadel];

// Koordinatlar rota başlangıcına göredir. Son sütun yıldızlı, geniş bekçi basamağını seçer.
const routes = {
    stairs: [[0, 440, 80], [140, 358, 80], [280, 278, 160, true]],
    switchback: [[140, 435, 85], [280, 352, 80], [60, 276, 160, true]],
    split: [[0, 430, 160, true], [250, 428, 80], [380, 347, 80], [510, 270, 90]],
    tower: [[0, 442, 80], [130, 360, 75], [260, 280, 75], [390, 204, 160, true]],
    bridge: [[0, 435, 90], [140, 400, 80], [280, 340, 160, true], [520, 430, 80]],
    pockets: [[0, 430, 80], [130, 345, 160, true], [360, 430, 80], [490, 355, 80]],
    terraces: [[0, 442, 90], [160, 365, 160, true], [400, 435, 80], [520, 358, 80]]
};

// Her bölüm farklı üç yol, düşman düzeni ve özel engel birleşimi kullanır.
const chapters = [
    { name: 'Sisli Patika', theme: 'moonwood', routes: ['pockets', 'stairs', 'bridge'] },
    { name: 'Yarasa Köprüleri', theme: 'moonwood', routes: ['bridge', 'split', 'terraces'], flying: true },
    { name: 'Unutulmuş Avlu', theme: 'nightRuins', routes: ['switchback', 'terraces', 'pockets'] },
    { name: 'Ağlı Kuleler', theme: 'nightRuins', routes: ['tower', 'switchback', 'bridge'], spiders: true },
    { name: 'Kayıp Kandiller', theme: 'moonwood', routes: ['split', 'pockets', 'tower'], vanish: true },
    { name: 'Gece Presleri', theme: 'nightRuins', routes: ['terraces', 'stairs', 'switchback'], presses: true },
    { name: 'Karanlık Burçlar', theme: 'nightKeep', routes: ['tower', 'bridge', 'split'], flying: true },
    { name: 'Uçurum Nöbeti', theme: 'nightKeep', routes: ['pockets', 'terraces', 'tower'], pits: true },
    { name: 'Kandil Labirenti', theme: 'nightRuins', routes: ['switchback', 'tower', 'pockets'], spiders: true, vanish: true },
    { name: 'Son Geçit', theme: 'nightKeep', routes: ['bridge', 'switchback', 'tower'], presses: true, vanish: true },
    { name: 'Gecenin Efendileri', theme: 'nightKeep', routes: ['tower', 'pockets', 'switchback'], presses: true, pits: true, boss: true }
];

const groundTypes = ['shadow-fox', 'moon-scorpion', 'cave-crab', 'dusk-wolf'];
const airTypes = ['night-owl', 'moon-moth', 'bat'];

function mosqueStyle(index) {
    const width = 190 + index * 4;
    const outer = width / 2 + 24;
    return {
        wall: [0xcbe0d7, 0xd5cde5, 0xc8d9e6][index % 3],
        roof: [0x3d807b, 0x716791, 0x395d89][index % 3], trim: 0xe8cb8a,
        width, top: 448 - index,
        towers: index % 3 === 0 ? [-outer] : index % 3 === 1 ? [-outer, outer] : [-outer, -outer + 30, outer - 30, outer],
        domes: index % 2 === 0 ? [[0, 418 - index, 142 + index * 2, 90 + index]] :
            [[-65, 434, 65, 55], [65, 434, 65, 55], [0, 400 - index, 105, 100]]
    };
}

// random parametresi testlerde sabitlenebilir; oynarken Math.random kullanılır.
export function createNightCampaign(random = Math.random) {
    return chapters.map((chapter, index) => {
        const anchors = [350, 1700 + index * 40, 3200 + index * 70];
        const width = 5000 + index * 120;
        const platforms = [];
        const fruits = [];
        const enemies = [];
        const visibility = offset => ({ visibleMs: 3000 - index * 35, hiddenMs: 2200, fadeMs: 260, offset });
        for (const [sector, name] of chapter.routes.entries()) {
            const start = platforms.length;
            for (const [dx, y, stepWidth, star] of routes[name]) {
                const platform = platforms.length;
                platforms.push({ x: anchors[sector] + dx, y, width: stepWidth, single: stepWidth <= 90 });
                if (!star) continue;
                fruits.push({ id: `star-${sector + 1}`, type: 'star', platform });
                enemies.push({ type: groundTypes[(index + sector) % groundTypes.length], platform, speed: 165 + index * 3,
                    hop: { walkMs: 2800 - index * 65, pauseMs: 380, height: 48 + index * 3, duration: 700, offset: sector * 700 },
                    visibility: (chapter.vanish || sector === index % 3) ? visibility(sector * 670) : undefined });
            }
            // Farklı bir yaklaşım noktasında uçan düşman; yıldız basamağının üstüne doğmaz.
            const x = anchors[sector] + 650;
            enemies.push({ type: airTypes[(index + sector) % airTypes.length],
                x: x + Math.round(random() * 60 - 30), y: 375 - Math.round(random() * 50),
                minX: x - 60, maxX: x + 70, speed: 175 + index * 3, bob: chapter.flying ? 40 : 24,
                visibility: chapter.vanish && sector !== 2 ? visibility(900 + sector * 800) : undefined });
            if (chapter.spiders || (sector === 1 && index > 3)) {
                const spiderX = anchors[sector] + 610;
                enemies.push({ type: 'spider', x: spiderX, y: 385, minX: spiderX, maxX: spiderX,
                    speed: 0, bob: 90, period: 2100 - index * 40, offset: sector * 500,
                    visibility: chapter.vanish ? visibility(1400) : undefined });
            }
            fruits.push({ id: `bonus-${sector}`, type: ['lantern', 'bead', 'crescent'][sector], x: platforms[start].x - 100, y: 480 });
        }
        const gapWidth = 130 + index * 3;
        const gaps = [
            { x: 1040, width: gapWidth }, { x: 1390, width: gapWidth },
            { x: anchors[1] + 820, width: gapWidth }, { x: anchors[1] + 1160, width: gapWidth },
            { x: anchors[2] + 720, width: gapWidth }
        ];
        if (chapter.pits) gaps.push({ x: anchors[2] + 1060, width: 160 });
        const columns = chapter.presses ? [1280, anchors[1] + 720, anchors[2] + 620].map((x, i) => ({
            x, width: 70, openMs: 1550 - index * 25, startDelay: i * 420, raisedRange: [170, 290]
        })) : [];
        if (chapter.boss) {
            for (const [guard, texture] of ['ogre-moss', 'ogre-stone'].entries()) {
                const x = width - 920 + guard * 340;
                enemies.push({ type: 'ogre', texture, x, minX: x, maxX: x, speed: 0, scale: 1.9 + guard * 0.2,
                    jump: { height: 210, duration: 1600, period: 3500, offset: guard * 1200 },
                    visibility: guard === 0 ? visibility(1700) : undefined });
            }
        }
        return nightChapter({ ...chapter, width, platforms, fruits, enemies, gaps, columns,
            vanishAll: false, checkpoint: { x: anchors[1] + 570, y: 480 },
            fountains: [{ id: 'fountain-1', x: anchors[1] + 480 }], mosqueStyle: mosqueStyle(index) }, random);
    });
}

export const lateNightLevels = createNightCampaign();

export const worldTwoLevels = [firstJourney, ...nightLevels, ...lateNightLevels];
