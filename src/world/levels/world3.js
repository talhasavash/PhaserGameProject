// Dünya 3'ün 31–34. bölümlerini; buz yüzeylerini, karlı rotaları ve kutup düşmanlarını tanımlar.
import { defineLevel } from '../model/definitions.js';
import { defineEnemy } from '../../gameplay/enemyTypes.js';

const frozenLake = defineLevel({
    template: 'ice',
    name: 'Buz Gölü',
    theme: 'glacier',
    width: 4000,
    checkpoint: { x: 2350, y: 480 },
    fountains: [{ id: 'fountain-1', x: 1250 }, { id: 'fountain-2', x: 2500 }],
    platforms: [
        { x: 420, y: 440, width: 120 }, { x: 590, y: 365, width: 170 },
        { x: 1500, y: 435, width: 160 }, { x: 1760, y: 360, width: 110 },
        { x: 2630, y: 440, width: 110 }, { x: 2780, y: 360, width: 110 }, { x: 2930, y: 280, width: 170 }
    ],
    gaps: [{ x: 900, width: 130 }, { x: 2120, width: 140 }, { x: 3240, width: 140 }],
    columns: [{ x: 1140, width: 76, raisedBottom: 190, openMs: 2400 }, { x: 2550, width: 82, raisedBottom: 220, offset: 1300 }, { x: 3150, width: 76, raisedBottom: 180, offset: 2200 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 1 }, { id: 'star-2', type: 'star', platform: 2 }, { id: 'star-3', type: 'star', platform: 6 },
        { id: 'lantern-1', type: 'lantern', x: 1300, y: 480 }
    ],
    enemies: [
        defineEnemy('snowman', { x: 1380, behaviors: { patrol: { minX: 1320, maxX: 1420, speed: 35 }, shoot: { period: 3100, speed: 210 } } }),
        defineEnemy('penguin', { platform: 1, behaviors: { patrol: { speed: 90 } } }), defineEnemy('snow-fox', { platform: 2, behaviors: { patrol: { speed: 105 } } }),
        defineEnemy('ice-crab', { platform: 6, behaviors: { patrol: { speed: 100 }, hop: { walkMs: 2800, pauseMs: 400, height: 45, duration: 700 } } }),
        defineEnemy('frost-bat', { x: 1900, y: 390, behaviors: { patrol: { minX: 1800, maxX: 2010, speed: 105 }, vertical: { bob: 25 } } }),
        defineEnemy('snow-fox', { x: 3460, behaviors: { patrol: { minX: 3420, maxX: 3500, speed: 110 } } })
    ],
    mosqueStyle: { wall: 0xe1eef2, roof: 0x80b8cd, trim: 0xdcecf0, width: 200, towers: [-122, 122] }
});

const frozenCave = defineLevel({
    template: 'ice',
    name: 'Donmuş Mağara',
    theme: 'iceCave',
    width: 4700,
    checkpoint: { x: 2700, y: 480 },
    fountains: [{ id: 'fountain-1', x: 2860 }],
    platforms: [
        { x: 390, y: 440, width: 110 }, { x: 560, y: 360, width: 110 }, { x: 720, y: 280, width: 170 },
        { x: 1880, y: 440, width: 150 }, { x: 2400, y: 435, width: 100 },
        { x: 3280, y: 440, width: 100 }, { x: 3420, y: 360, width: 100 }, { x: 3560, y: 285, width: 170 }
    ],
    gaps: [{ x: 1050, width: 140 }, { x: 2180, width: 150 }, { x: 3920, width: 150 }],
    columns: [{ x: 1260, width: 80, raisedBottom: 180 }, { x: 1710, width: 80, raisedBottom: 210, offset: 1100 }, { x: 3100, width: 86, raisedBottom: 170, openMs: 1800 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 2 }, { id: 'star-2', type: 'star', platform: 3 }, { id: 'star-3', type: 'star', platform: 7 },
        { id: 'bead-1', type: 'bead', x: 3060, y: 480 }
    ],
    enemies: [
        defineEnemy('snowman', { x: 1560, behaviors: { patrol: { minX: 1480, maxX: 1600, speed: 40 }, shoot: { period: 2700, speed: 230 } } }),
        defineEnemy('snowman', { x: 4200, behaviors: { patrol: { minX: 4140, maxX: 4250, speed: 40 }, shoot: { period: 2900, speed: 220 } } }),
        defineEnemy('ice-crab', { platform: 2, behaviors: { patrol: { speed: 110 } } }),
        defineEnemy('penguin', { platform: 3, behaviors: { patrol: { speed: 115 }, visibility: { visibleMs: 2900, hiddenMs: 2300, offset: 700 } } }),
        defineEnemy('snow-fox', { platform: 7, behaviors: { patrol: { speed: 120 }, hop: { walkMs: 2600, pauseMs: 400, height: 55, duration: 750 } } }),
        defineEnemy('frost-bat', { x: 1450, y: 365, behaviors: { patrol: { minX: 1320, maxX: 1620, speed: 125 }, vertical: { bob: 35 } } }),
        defineEnemy('frost-bat', { x: 2900, y: 390, behaviors: { patrol: { minX: 2790, maxX: 3100, speed: 130 }, vertical: { bob: 30 } } })
    ],
    mosqueStyle: { wall: 0xc4e0e9, roof: 0x5389ab, trim: 0xd5f2f4, width: 225, towers: [-135],
        domes: [[-65, 435, 75, 65], [65, 435, 75, 65], [0, 400, 110, 105]] }
});

const polarLights = defineLevel({
    template: 'ice',
    name: 'Kutup Işıkları',
    theme: 'aurora',
    width: 5400,
    checkpoint: { x: 2870, y: 480 },
    fountains: [{ id: 'fountain-1', x: 1650 }, { id: 'fountain-2', x: 4390 }],
    platforms: [
        { x: 350, y: 440, width: 100 }, { x: 500, y: 360, width: 110 }, { x: 650, y: 280, width: 170 },
        { x: 1900, y: 440, width: 110 }, { x: 2040, y: 360, width: 100 }, { x: 2180, y: 280, width: 100 }, { x: 2320, y: 205, width: 170 },
        { x: 3380, y: 435, width: 110 }, { x: 3530, y: 355, width: 170 }, { x: 3810, y: 430, width: 100 }
    ],
    gaps: [{ x: 1000, width: 150 }, { x: 1360, width: 150 }, { x: 2670, width: 155 }, { x: 3060, width: 155 }, { x: 4170, width: 160 }],
    columns: [{ x: 1190, width: 74, raisedBottom: 180, openMs: 1900 }, { x: 2980, width: 78, raisedBottom: 200, offset: 950 }, { x: 3260, width: 78, raisedBottom: 160, offset: 1900 }, { x: 4490, width: 88, raisedBottom: 190, openMs: 1700 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 2 }, { id: 'star-2', type: 'star', platform: 6 }, { id: 'star-3', type: 'star', platform: 8 },
        { id: 'crescent-1', type: 'crescent', x: 4510, y: 480 }
    ],
    enemies: [
        defineEnemy('snowman', { x: 1610, behaviors: { patrol: { minX: 1560, maxX: 1650, speed: 45 }, shoot: { period: 2500, speed: 245 } } }),
        defineEnemy('snowman', { x: 4930, behaviors: { patrol: { minX: 4870, maxX: 4970, speed: 45 }, shoot: { period: 2600, speed: 235 } } }),
        defineEnemy('snow-fox', { platform: 2, behaviors: { patrol: { speed: 120 }, hop: { walkMs: 2500, pauseMs: 350, height: 60, duration: 750 } } }),
        defineEnemy('ice-crab', { platform: 6, behaviors: { patrol: { speed: 125 }, visibility: { visibleMs: 2600, hiddenMs: 2300, offset: 500 } } }),
        defineEnemy('penguin', { platform: 8, behaviors: { patrol: { speed: 130 } } }),
        defineEnemy('frost-bat', { x: 1750, y: 380, behaviors: { patrol: { minX: 1610, maxX: 1830, speed: 135 }, vertical: { bob: 35 } } }),
        defineEnemy('frost-bat', { x: 4610, y: 390, behaviors: { patrol: { minX: 4500, maxX: 4740, speed: 140 }, vertical: { bob: 28 } } }),
        defineEnemy('snow-fox', { x: 4790, behaviors: { patrol: { minX: 4700, maxX: 4850, speed: 130 } } })
    ],
    mosqueStyle: { wall: 0xdce9f0, roof: 0x587aab, trim: 0xe9d8a6, width: 245, towers: [-148, -113, 113, 148],
        domes: [[-80, 425, 80, 70], [80, 425, 80, 70], [0, 389, 125, 120]] }
});

const crystalPalace = defineLevel({
    template: 'ice',
    name: 'Kristal Sarayın Muhafızı',
    theme: 'crystalPalace',
    width: 5700,
    boss: true,
    frozenItems: true,
    checkpoint: { x: 4050, y: 480 },
    fountains: [{ id: 'fountain-1', x: 1900 }, { id: 'fountain-2', x: 4140 }],
    platforms: [
        { x: 390, y: 440, width: 140 }, { x: 580, y: 360, width: 130 }, { x: 760, y: 280, width: 210 },
        { x: 1670, y: 440, width: 160 }, { x: 2170, y: 435, width: 130 }, { x: 2350, y: 355, width: 130 },
        { x: 2530, y: 275, width: 220 }, { x: 3420, y: 435, width: 130 }, { x: 3600, y: 355, width: 220 },
        { x: 4380, y: 435, width: 150 }, { x: 4600, y: 400, width: 140 }
    ],
    gaps: [{ x: 1130, width: 150 }, { x: 2870, width: 155 }, { x: 3890, width: 145 }],
    columns: [{ x: 1430, width: 84, raisedBottom: 180, openMs: 2100 },
        { x: 3120, width: 80, raisedBottom: 190, offset: 1200 }, { x: 3290, width: 80, raisedBottom: 230, offset: 1900 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 2 }, { id: 'star-2', type: 'star', platform: 6 }, { id: 'star-3', type: 'star', platform: 8 },
        { id: 'palace-lantern', type: 'lantern', x: 1960, y: 480 },
        { id: 'palace-crescent', type: 'crescent', x: 4230, y: 480 }, { id: 'palace-bead', type: 'bead', x: 4540, y: 480 }
    ],
    enemies: [
        defineEnemy('ice-crab', { platform: 2, behaviors: { patrol: { speed: 105 } } }), defineEnemy('penguin', { platform: 6, behaviors: { patrol: { speed: 110 } } }),
        defineEnemy('snow-fox', { platform: 8, behaviors: { patrol: { speed: 115 } } }),
        defineEnemy('snowman', { x: 2050, behaviors: { patrol: { minX: 2000, maxX: 2090, speed: 35 }, shoot: { period: 3100, speed: 220 } } }),
        defineEnemy('frost-bat', { x: 3460, y: 335, behaviors: { patrol: { minX: 3350, maxX: 3540, speed: 105 }, vertical: { bob: 18 } } }),
        defineEnemy('frost-warden', { x: 4930, y: 325, scale: 1.3, behaviors: { patrol: { minX: 4880, maxX: 5010, speed: 35 }, shoot: { kind: 'shard', volley: 3, period: 2900, speed: 230, range: 720 }, vertical: { bob: 18 } } })
    ],
    mosqueStyle: { wall: 0xe3dafa, roof: 0x748ae1, trim: 0x97f2ef, width: 250, towers: [-150, 150],
        domes: [[-82, 427, 82, 70], [82, 427, 82, 70], [0, 382, 132, 125]] }
});

export const worldThreeLevels = [frozenLake, frozenCave, polarLights, crystalPalace];
