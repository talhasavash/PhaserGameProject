// Dünya 2: 16–30. bölümler; ilk yolculuk, gece ormanı ve karanlık geçitler.

import { defineLevel } from '../model/definitions.js';
import { defineEnemy } from '../../actors/enemies/EnemyCatalog.js';

export const firstJourney = defineLevel({
    template: 'standard',
    name: 'Yeni Bölüm',
    theme: 'moonwood',
    width: 3200,
    checkpoint: {x:1500 , y:480},
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
                defineEnemy('hedgehog', { x: 490, y: 411, behaviors: { patrol: { minX: 453, maxX: 545, speed: 45 } } }),
                defineEnemy('snail', { x: 500, behaviors: { patrol: { minX: 900, maxX: 1200, speed: 65 } } }),
                defineEnemy('frog', { x: 600, behaviors: { patrol: { minX: 1000, maxX: 1300, speed: 65 } } }),
                defineEnemy('bee', { x: 2250, y: 410, behaviors: { patrol: { minX: 2150, maxX: 2350, speed: 80 }, vertical: { bob: 25 } } })
    ],
    fountains: [{ id: 'fountain-1', x: 2500 }],
    belt: {x: 2050, width: 250, speed:-120},
    gaps: [{ x: 1900, width: 100 }],
    fireRain: [{ period: 10000, offset: 4000, speed: 250 }],
    ice: [{ x: 1600, width: 180 } ]
});

// Yıldız bekçisi konumunu basamaktan alır; görünmezlik arası yıldızı almak için fırsattır.
function platformGuard(type, platform, speed) {
    return defineEnemy(type, { platform, behaviors: { patrol: { speed } } });
}

const moonForest = defineLevel({
    template: 'night',
    name: 'Ay Işığı Ormanı',
    theme: 'moonwood',
    width: 4300,
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
        defineEnemy('night-owl', { x: 1090, y: 385, behaviors: { patrol: { minX: 1035, maxX: 1150, speed: 170 }, vertical: { bob: 28 } } }),
        defineEnemy('spider', { x: 1410, y: 385, behaviors: { patrol: { minX: 1410, maxX: 1410, speed: 0 }, vertical: { bob: 95, period: 1700, offset: 400 } } }),
        defineEnemy('moon-moth', { x: 2300, y: 380, behaviors: { patrol: { minX: 2180, maxX: 2480, speed: 185 }, vertical: { bob: 28 } } }),
        defineEnemy('shadow-fox', { x: 2810, behaviors: { patrol: { minX: 2770, maxX: 2850, speed: 175 } } }),
        defineEnemy('spider', { x: 3660, y: 385, behaviors: { patrol: { minX: 3660, maxX: 3660, speed: 0 }, vertical: { bob: 95, period: 1500 } } })
    ]
});

const silentRuins = defineLevel({
    template: 'night',
    name: 'Sessiz Harabeler',
    theme: 'nightRuins',
    width: 4800,
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
        defineEnemy('moon-moth', { x: 1720, y: 365, behaviors: { patrol: { minX: 1660, maxX: 1890, speed: 190 }, vertical: { bob: 35 } } }),
        defineEnemy('night-owl', { x: 2530, y: 315, behaviors: { patrol: { minX: 2390, maxX: 2670, speed: 210 }, vertical: { bob: 22 } } }),
        defineEnemy('spider', { x: 3420, y: 385, behaviors: { patrol: { minX: 3420, maxX: 3420, speed: 0 }, vertical: { bob: 95, period: 1450 } } }),
        defineEnemy('dusk-wolf', { x: 4240, behaviors: { patrol: { minX: 4190, maxX: 4330, speed: 195 } } })
    ]
});

const moonCitadel = defineLevel({
    template: 'night',
    name: 'Gecenin Muhafızı',
    theme: 'nightKeep',
    width: 5500,
    boss: true,
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
        defineEnemy('moon-moth', { x: 1030, y: 385, behaviors: { patrol: { minX: 960, maxX: 1100, speed: 215 }, vertical: { bob: 30 } } }),
        defineEnemy('spider', { x: 1800, y: 385, behaviors: { patrol: { minX: 1800, maxX: 1800, speed: 0 }, vertical: { bob: 95, period: 1300 } } }),
        defineEnemy('night-owl', { x: 2490, y: 370, behaviors: { patrol: { minX: 2380, maxX: 2630, speed: 225 }, vertical: { bob: 32 } } }),
        defineEnemy('ogre', { texture: 'ogre-stone', x: 4780, scale: 2.2, behaviors: { patrol: { minX: 4780, maxX: 4780, speed: 0 }, jump: { height: 200, duration: 1450, period: 3450, offset: 1100 } } })
    ]
});

export const nightLevels = [moonForest, silentRuins, moonCitadel];

// Her satır aynı Builder sözleşmesinde bir bölümdür; rota algoritması ortak şablondadır.
export const lateNightDefinitions = [
    { template: 'night-campaign', stage: 0, name: 'Sisli Patika', theme: 'moonwood', routes: ['pockets', 'stairs', 'bridge'] },
    { template: 'night-campaign', stage: 1, name: 'Yarasa Köprüleri', theme: 'moonwood', routes: ['bridge', 'split', 'terraces'], flying: true },
    { template: 'night-campaign', stage: 2, name: 'Unutulmuş Avlu', theme: 'nightRuins', routes: ['switchback', 'terraces', 'pockets'] },
    { template: 'night-campaign', stage: 3, name: 'Ağlı Kuleler', theme: 'nightRuins', routes: ['tower', 'switchback', 'bridge'], spiders: true },
    { template: 'night-campaign', stage: 4, name: 'Kayıp Kandiller', theme: 'moonwood', routes: ['split', 'pockets', 'tower'], vanish: true },
    { template: 'night-campaign', stage: 5, name: 'Gece Presleri', theme: 'nightRuins', routes: ['terraces', 'stairs', 'switchback'], presses: true },
    { template: 'night-campaign', stage: 6, name: 'Karanlık Burçlar', theme: 'nightKeep', routes: ['tower', 'bridge', 'split'], flying: true },
    { template: 'night-campaign', stage: 7, name: 'Uçurum Nöbeti', theme: 'nightKeep', routes: ['pockets', 'terraces', 'tower'], pits: true },
    { template: 'night-campaign', stage: 8, name: 'Kandil Labirenti', theme: 'nightRuins', routes: ['switchback', 'tower', 'pockets'], spiders: true, vanish: true },
    { template: 'night-campaign', stage: 9, name: 'Son Geçit', theme: 'nightKeep', routes: ['bridge', 'switchback', 'tower'], presses: true, vanish: true },
    { template: 'night-campaign', stage: 10, name: 'Gecenin Efendileri', theme: 'nightKeep', routes: ['tower', 'pockets', 'switchback'], presses: true, pits: true, boss: true }
];
export const lateNightLevels = lateNightDefinitions.map(definition => defineLevel(definition));

export const worldTwoLevels = [firstJourney, ...nightLevels, ...lateNightLevels];
