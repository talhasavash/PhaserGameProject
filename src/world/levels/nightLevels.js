// Gece Karanlığı dünyasının 17–19. bölümlerini ve giderek zorlaşan geçitlerini tanımlar.
function nightChapter(data) {
    // Bölüm yüklenirken küçük sapmalar seçilir; yıldız ve devriye aynı basamağı izler.
    const platforms = data.platforms.map(platform => ({ ...platform,
        x: platform.x + Math.round(Math.random() * 20 - 10),
        y: platform.y + Math.round(Math.random() * 10 - 5)
    }));
    const enemies = data.enemies.map((enemy, index) => {
        const platform = platforms[enemy.platform];
        const x = platform ? platform.x + platform.width / 2 : enemy.x;
        return { ...enemy, x,
            minX: platform ? x - 40 : enemy.minX, maxX: platform ? x + 40 : enemy.maxX,
            speed: Math.round(enemy.speed * 0.75),
            period: enemy.period ? Math.round(enemy.period / 0.75) : undefined,
            jump: enemy.jump ? { ...enemy.jump, duration: Math.round(enemy.jump.duration / 0.85), period: Math.round(enemy.jump.period / 0.85) } : undefined,
            visibility: { visibleMs: 2800, hiddenMs: platform ? 2400 : 1800, fadeMs: 260, offset: index * 670 }
        };
    });
    const fruits = data.fruits.map(item => {
        const platform = platforms[item.platform];
        return platform ? { ...item, x: platform.x + platform.width / 2 + 15, y: platform.y - 35 } : item;
    });
    return {
        groundY: 520, spawn: { x: 100, y: 480 },
        checkpoint: { x: 2550, y: 480 },
        key: { x: data.width - 420, y: 477 }, exit: { x: data.width - 180, y: 468 },
        belt: { x: 0, width: 1, speed: 0 },
        fountains: [{ id: 'fountain-1', x: 2400 }],
        ...data, platforms, enemies, fruits: [...fruits, ...scatterFruit(data, platforms)]
    };
}

// Yıldız bekçisi konumunu basamaktan alır; görünmezlik arası yıldızı almak için fırsattır.
function platformGuard(type, platform, speed) {
    return { type, platform, speed };
}

function scatterFruit(level, platforms) {
    const types = ['apple', 'orange', 'grapes', 'pear', 'banana', 'strawberry'];
    const spots = platforms.map(p => ({ x: p.x + p.width / 3, y: p.y - 36 }));
    for (let x = 190; x < level.width - 540; x += 155) {
        const fruitX = x + Math.round(Math.random() * 40 - 20);
        if (level.gaps.some(g => fruitX > g.x - 25 && fruitX < g.x + g.width + 25)) continue;
        if ((level.columns || []).some(c => Math.abs(c.x - fruitX) < c.width / 2 + 35)) continue;
        spots.push({ x: fruitX, y: 484 - (spots.length % 3) * 27 });
    }
    return spots.map((spot, index) => ({ id: `scattered-${index}`, type: types[index % types.length], ...spot }));
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
