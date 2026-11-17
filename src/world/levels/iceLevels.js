// Dünya 3'ün 31–33. bölümlerini; buz yüzeylerini, karlı rotaları ve kutup düşmanlarını tanımlar.
function iceChapter(data) {
    const platforms = data.platforms.map(platform => ({ ...platform, ice: true }));
    const fruits = data.fruits.map(item => item.platform === undefined ? item : {
        ...item, x: platforms[item.platform].x + platforms[item.platform].width / 2 + 10,
        y: platforms[item.platform].y - 35
    });
    const enemies = data.enemies.map(enemy => {
        if (enemy.platform === undefined) return enemy;
        const platform = platforms[enemy.platform];
        const x = platform.x + platform.width / 2;
        const radius = Math.min(40, platform.width / 2 - 32);
        return { ...enemy, x, minX: x - radius, maxX: x + radius };
    });
    // Çukur alanında buz şeridi çizme; her sağlam zemin parçası kaygandır.
    const ice = [];
    let start = 0;
    for (const gap of [...data.gaps, { x: data.width, width: 0 }]) {
        if (gap.x > start) ice.push({ x: start, width: gap.x - start });
        start = gap.x + gap.width;
    }
    const types = ['apple', 'orange', 'pear', 'grapes', 'banana', 'strawberry'];
    for (const [index, platform] of platforms.entries()) {
        fruits.push({ id: `ledge-fruit-${index}`, type: types[index % types.length], x: platform.x + 30, y: platform.y - 36 });
    }
    for (let x = 220, index = 0; x < data.width - 550; x += 170, index++) {
        if (data.gaps.some(gap => x > gap.x - 25 && x < gap.x + gap.width + 25)) continue;
        fruits.push({ id: `ground-fruit-${index}`, type: types[index % types.length], x, y: 480 - index % 3 * 25 });
    }
    return { groundY: 520, spawn: { x: 100, y: 480 }, belt: { x: 0, width: 1, speed: 0 },
        key: { x: data.width - 420, y: 477 }, exit: { x: data.width - 180, y: 468 },
        ...data, platforms, fruits, enemies, ice };
}

const frozenLake = iceChapter({
    name: 'Buz Gölü', theme: 'glacier', width: 4000,
    checkpoint: { x: 2350, y: 480 }, fountains: [{ id: 'fountain-1', x: 1250 }, { id: 'fountain-2', x: 2500 }],
    platforms: [
        { x: 420, y: 440, width: 120 }, { x: 590, y: 365, width: 170 },
        { x: 1500, y: 435, width: 160 }, { x: 1760, y: 360, width: 110 },
        { x: 2630, y: 440, width: 110 }, { x: 2780, y: 360, width: 110 }, { x: 2930, y: 280, width: 170 }
    ],
    gaps: [{ x: 900, width: 130 }, { x: 2120, width: 140 }, { x: 3240, width: 140 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 1 }, { id: 'star-2', type: 'star', platform: 2 }, { id: 'star-3', type: 'star', platform: 6 },
        { id: 'lantern-1', type: 'lantern', x: 1300, y: 480 }
    ],
    enemies: [
        { type: 'penguin', platform: 1, speed: 90 }, { type: 'snow-fox', platform: 2, speed: 105 },
        { type: 'ice-crab', platform: 6, speed: 100, hop: { walkMs: 2800, pauseMs: 400, height: 45, duration: 700 } },
        { type: 'frost-bat', x: 1900, y: 390, minX: 1800, maxX: 2010, speed: 105, bob: 25 },
        { type: 'snow-fox', x: 3460, minX: 3420, maxX: 3500, speed: 110 }
    ],
    mosqueStyle: { wall: 0xe1eef2, roof: 0x80b8cd, trim: 0xdcecf0, width: 200, towers: [-122, 122] }
});

const frozenCave = iceChapter({
    name: 'Donmuş Mağara', theme: 'iceCave', width: 4700,
    checkpoint: { x: 2700, y: 480 }, fountains: [{ id: 'fountain-1', x: 2860 }],
    platforms: [
        { x: 390, y: 440, width: 110 }, { x: 560, y: 360, width: 110 }, { x: 720, y: 280, width: 170 },
        { x: 1880, y: 440, width: 150 }, { x: 2400, y: 435, width: 100 },
        { x: 3280, y: 440, width: 100 }, { x: 3420, y: 360, width: 100 }, { x: 3560, y: 285, width: 170 }
    ],
    gaps: [{ x: 1050, width: 140 }, { x: 2180, width: 150 }, { x: 3920, width: 150 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 2 }, { id: 'star-2', type: 'star', platform: 3 }, { id: 'star-3', type: 'star', platform: 7 },
        { id: 'bead-1', type: 'bead', x: 3060, y: 480 }
    ],
    enemies: [
        { type: 'ice-crab', platform: 2, speed: 110 },
        { type: 'penguin', platform: 3, speed: 115, visibility: { visibleMs: 2900, hiddenMs: 2300, offset: 700 } },
        { type: 'snow-fox', platform: 7, speed: 120, hop: { walkMs: 2600, pauseMs: 400, height: 55, duration: 750 } },
        { type: 'frost-bat', x: 1450, y: 365, minX: 1320, maxX: 1620, speed: 125, bob: 35 },
        { type: 'frost-bat', x: 2900, y: 390, minX: 2790, maxX: 3100, speed: 130, bob: 30 }
    ],
    mosqueStyle: { wall: 0xc4e0e9, roof: 0x5389ab, trim: 0xd5f2f4, width: 225, towers: [-135],
        domes: [[-65, 435, 75, 65], [65, 435, 75, 65], [0, 400, 110, 105]] }
});

const polarLights = iceChapter({
    name: 'Kutup Işıkları', theme: 'aurora', width: 5400,
    checkpoint: { x: 2870, y: 480 }, fountains: [{ id: 'fountain-1', x: 1650 }, { id: 'fountain-2', x: 4390 }],
    platforms: [
        { x: 350, y: 440, width: 100 }, { x: 500, y: 360, width: 110 }, { x: 650, y: 280, width: 170 },
        { x: 1900, y: 440, width: 110 }, { x: 2040, y: 360, width: 100 }, { x: 2180, y: 280, width: 100 }, { x: 2320, y: 205, width: 170 },
        { x: 3380, y: 435, width: 110 }, { x: 3530, y: 355, width: 170 }, { x: 3810, y: 430, width: 100 }
    ],
    gaps: [{ x: 1000, width: 150 }, { x: 1360, width: 150 }, { x: 2670, width: 155 }, { x: 3060, width: 155 }, { x: 4170, width: 160 }],
    fruits: [
        { id: 'star-1', type: 'star', platform: 2 }, { id: 'star-2', type: 'star', platform: 6 }, { id: 'star-3', type: 'star', platform: 8 },
        { id: 'crescent-1', type: 'crescent', x: 4510, y: 480 }
    ],
    enemies: [
        { type: 'snow-fox', platform: 2, speed: 120, hop: { walkMs: 2500, pauseMs: 350, height: 60, duration: 750 } },
        { type: 'ice-crab', platform: 6, speed: 125, visibility: { visibleMs: 2600, hiddenMs: 2300, offset: 500 } },
        { type: 'penguin', platform: 8, speed: 130 },
        { type: 'frost-bat', x: 1750, y: 380, minX: 1610, maxX: 1830, speed: 135, bob: 35 },
        { type: 'frost-bat', x: 4610, y: 390, minX: 4500, maxX: 4740, speed: 140, bob: 28 },
        { type: 'snow-fox', x: 4790, minX: 4700, maxX: 4850, speed: 130 }
    ],
    mosqueStyle: { wall: 0xdce9f0, roof: 0x587aab, trim: 0xe9d8a6, width: 245, towers: [-148, -113, 113, 148],
        domes: [[-80, 425, 80, 70], [80, 425, 80, 70], [0, 389, 125, 120]] }
});

export const iceLevels = [frozenLake, frozenCave, polarLights];
