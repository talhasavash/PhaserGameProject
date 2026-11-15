// World 1: zıplamanın yanında bekleme, zamanlama ve bantlara karşı hareket etme.
function chapter(data) {
    return {
        groundY: 520, spawn: { x: 100, y: 480 },
        key: { x: data.width - 520, y: 477 }, exit: { x: data.width - 220, y: 468 },
        checkpoint: { x: data.width / 2, y: 480 },
        belt: { x: 0, width: 1, speed: 0 },
        fountains: [{ id: 'fountain-1', x: 420 }, { id: 'fountain-2', x: data.width - 850 }],
        ...data
    };
}

export const lavaValley = chapter({
    name: 'Lav Vadisi', theme: 'lava', width: 4300, exitLabel: 'ışıklı geçide',
    platforms: [{ x: 470, y: 430, width: 140 }, { x: 2130, y: 430, width: 110 }, { x: 3000, y: 430, width: 140 }],
    fruits: [
        { id: 'star-1', type: 'star', x: 1050, y: 480 },
        { id: 'star-2', type: 'star', x: 2340, y: 480 },
        { id: 'star-3', type: 'star', x: 3350, y: 480 },
        { id: 'fruit-1', type: 'orange', x: 540, y: 394 },
        { id: 'fruit-2', type: 'grapes', x: 2190, y: 394 },
        { id: 'fruit-3', type: 'strawberry', x: 3070, y: 394 },
        { id: 'lantern-1', type: 'lantern', x: 1500, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 3650, y: 480 }
    ],
    enemies: [
        { type: 'salamander', x: 1120, minX: 1090, maxX: 1190, speed: 80 },
        { type: 'salamander', x: 3180, minX: 3140, maxX: 3270, speed: 95 }
    ],
    gaps: [{ x: 1260, width: 110 }, { x: 2530, width: 115 }, { x: 3500, width: 110 }],
    columns: [
        { x: 760, width: 72, openMs: 2400, offset: 0, raisedRange: [150, 210] },
        { x: 1840, width: 80, openMs: 2100, offset: 1100, raisedRange: [270, 330] },
        { x: 2820, width: 88, openMs: 1900, offset: 2100, raisedRange: [170, 240] }
    ]
});

export const mechanicalFactory = chapter({
    name: 'Mekanik Fabrika', theme: 'factory', width: 4800, exitLabel: 'asansöre',
    checkpoint: { x: 2700, y: 480 },
    platforms: [{ x: 1580, y: 430, width: 120 }, { x: 3580, y: 430, width: 150 }, { x: 3790, y: 430, width: 130 }],
    fruits: [
        { id: 'star-1', type: 'star', x: 1510, y: 480 },
        { id: 'star-2', type: 'star', x: 2500, y: 480 },
        { id: 'star-3', type: 'star', x: 3850, y: 394 },
        { id: 'fruit-1', type: 'pear', x: 1640, y: 394 },
        { id: 'fruit-2', type: 'banana', x: 2830, y: 480 },
        { id: 'fruit-3', type: 'apple', x: 3640, y: 394 },
        { id: 'bead-1', type: 'bead', x: 1800, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 4080, y: 480 }
    ],
    enemies: [
        { type: 'robot', x: 1640, minX: 1580, maxX: 1750, speed: 100 },
        { type: 'wheel', x: 2910, minX: 2830, maxX: 2990, speed: 125 },
        { type: 'robot', x: 3980, minX: 3940, maxX: 4100, speed: 115 }
    ],
    belts: [{ x: 520, width: 650, speed: 70 }, { x: 2050, width: 470, speed: -80 }, { x: 3020, width: 360, speed: 95 }],
    gaps: [{ x: 1870, width: 110 }, { x: 3410, width: 120 }],
    columns: [
        // Aynı çevrim, 430 ms aralıklı başlangıç: soldan sağa bir pres dalgası.
        ...[700, 870, 1040, 1210, 1380].map((x, index) => ({
            x, width: 72, openMs: 2100, startDelay: index * 430,
            raisedRange: index % 2 === 0 ? [140, 220] : [270, 340]
        })),
        { x: 2250, width: 88, openMs: 1900, offset: 700 },
        { x: 3150, width: 88, openMs: 1800, offset: 2300 }
    ]
});

export const darkCastle = chapter({
    name: 'Kara Kale', theme: 'castle', width: 5400, exitLabel: 'kale kapısına',
    checkpoint: { x: 2720, y: 480 },
    platforms: [{ x: 1280, y: 430, width: 110 }, { x: 3040, y: 430, width: 90, single: true }, { x: 4170, y: 430, width: 160 }],
    fruits: [
        { id: 'star-1', type: 'star', x: 1170, y: 480 },
        { id: 'star-2', type: 'star', x: 2880, y: 480 },
        { id: 'star-3', type: 'star', x: 4250, y: 394 },
        { id: 'fruit-1', type: 'grapes', x: 1330, y: 394 },
        { id: 'fruit-2', type: 'strawberry', x: 3080, y: 394 },
        { id: 'fruit-3', type: 'orange', x: 3990, y: 480 },
        { id: 'mat-1', type: 'mat', x: 1850, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 4480, y: 480 }
    ],
    enemies: [
        { type: 'bat', x: 1470, y: 400, minX: 1410, maxX: 1550, speed: 95, bob: 22 },
        { type: 'scarab', x: 3280, minX: 3180, maxX: 3410, speed: 110 },
        { type: 'bat', x: 3750, y: 400, minX: 3690, maxX: 3890, speed: 115, bob: 25 }
    ],
    passages: [{ x: 2020, width: 500, y: 390 }],
    gaps: [{ x: 1600, width: 120 }, { x: 3500, width: 130 }],
    columns: [
        { x: 820, width: 80, openMs: 1900, offset: 0 },
        { x: 2140, width: 76, openMs: 1800, offset: 600 },
        { x: 2370, width: 76, openMs: 1800, offset: 2200 },
        { x: 4680, width: 96, openMs: 1700, offset: 1200 }
    ]
});

// Uzun atlayışlar arasında dinlenme adaları var; tüm boşluklar koşarak aşılabilir.
export const brokenPass = chapter({
    name: 'Uçurum Geçidi', theme: 'abyss', width: 5200, exitLabel: 'taş geçide',
    checkpoint: { x: 2460, y: 480 },
    fountains: [{ id: 'fountain-1', x: 420 }, { id: 'fountain-2', x: 3520 }],
    platforms: [],
    gaps: [
        { x: 550, width: 90 }, { x: 850, width: 110 }, { x: 1190, width: 130 },
        { x: 1510, width: 140 }, { x: 1840, width: 150 }, { x: 2230, width: 135 },
        { x: 2570, width: 150 }, { x: 2920, width: 140 }, { x: 3270, width: 150 },
        { x: 3640, width: 155 }, { x: 4000, width: 150 }, { x: 4350, width: 155 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 1050, y: 480 },
        { id: 'star-2', type: 'star', x: 2430, y: 480 },
        { id: 'star-3', type: 'star', x: 3850, y: 480 },
        { id: 'fruit-1', type: 'orange', x: 595, y: 430 },
        { id: 'fruit-2', type: 'grapes', x: 1230, y: 420 },
        { id: 'fruit-3', type: 'strawberry', x: 1885, y: 410 },
        { id: 'fruit-4', type: 'banana', x: 2630, y: 410 },
        { id: 'fruit-5', type: 'pear', x: 3700, y: 410 },
        { id: 'fruit-6', type: 'apple', x: 4410, y: 415 },
        { id: 'mat-1', type: 'mat', x: 2070, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 4600, y: 480 }
    ],
    enemies: [
        { type: 'bat', x: 1740, y: 384, minX: 1690, maxX: 1790, speed: 80, bob: 14 },
        { type: 'bird', x: 3140, y: 375, minX: 3100, maxX: 3200, speed: 90, bob: 16 }
    ]
});

export const worldOneLevels = [lavaValley, mechanicalFactory, darkCastle, brokenPass];
