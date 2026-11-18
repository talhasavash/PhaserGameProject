// Ortak bölüm şablonları: mevcut gece/buz yerleşimini korur, yeni bölümlerde tekrarları azaltır.
import { defineLevel, createLevelBuilder, withDefaults } from './definitions.js';

export const trailLevel = createLevelBuilder(data => ({
        checkpoint: { x: data.width / 2, y: 480 },
        key: { x: data.width - 550, y: 477 }, exit: { x: data.width - 260, y: 468 },
        belt: { x: 2050, width: 180, speed: -100 },
        fountains: [{ id: 'fountain-1', x: 1250 }, { id: 'fountain-2', x: data.width - 950 }]
    }));

export const gateLevel = createLevelBuilder(data => ({
        exitType: 'gate',
        key: { x: data.width - 520, y: 477 }, exit: { x: data.width - 220, y: 468 },
        checkpoint: { x: data.width / 2, y: 480 },
        fountains: [{ id: 'fountain-1', x: 420 }, { id: 'fountain-2', x: data.width - 850 }]
    }));

/** @param {import('./contracts.js').LevelInput} data */
export function nightChapter(data, random = Math.random) {
    data = withDefaults(data, { platforms: [], fruits: [], enemies: [], gaps: [] });
    // Bölüm yüklenirken küçük sapmalar seçilir; yıldız ve devriye aynı basamağı izler.
    const platforms = data.platforms.map(platform => ({ ...platform,
        x: platform.x + Math.round(random() * 20 - 10),
        y: platform.y + Math.round(random() * 10 - 5)
    }));
    const enemies = data.enemies.map((enemy, index) => {
        const platform = platforms[enemy.platform];
        const x = platform ? platform.x + platform.width / 2 : enemy.x;
        return { ...enemy, x,
            minX: platform ? x - 40 : enemy.minX, maxX: platform ? x + 40 : enemy.maxX,
            speed: Math.round(enemy.speed * 0.75),
            period: enemy.period ? Math.round(enemy.period / 0.75) : undefined,
            jump: enemy.jump ? { ...enemy.jump, duration: Math.round(enemy.jump.duration / 0.85), period: Math.round(enemy.jump.period / 0.85) } : undefined,
            visibility: data.vanishAll === false ? enemy.visibility :
                { visibleMs: 2800, hiddenMs: platform ? 2400 : 1800, fadeMs: 260, offset: index * 670 }
        };
    });
    const fruits = data.fruits.map(item => {
        const platform = platforms[item.platform];
        return platform ? { ...item, x: platform.x + platform.width / 2 + 15, y: platform.y - 35 } : item;
    });
    return defineLevel({
        checkpoint: { x: 2550, y: 480 },
        fountains: [{ id: 'fountain-1', x: 2400 }],
        ...data, platforms, enemies, fruits: [...fruits, ...scatterFruit(data, platforms, random)]
    });
}

function scatterFruit(level, platforms, random) {
    const types = ['apple', 'orange', 'grapes', 'pear', 'banana', 'strawberry'];
    const spots = platforms.map(p => ({ x: p.x + p.width / 3, y: p.y - 36 }));
    for (let x = 190; x < level.width - 540; x += 155) {
        const fruitX = x + Math.round(random() * 40 - 20);
        if (level.gaps.some(g => fruitX > g.x - 25 && fruitX < g.x + g.width + 25)) continue;
        if ((level.columns || []).some(c => Math.abs(c.x - fruitX) < c.width / 2 + 35)) continue;
        spots.push({ x: fruitX, y: 484 - (spots.length % 3) * 27 });
    }
    return spots.map((spot, index) => ({ id: `scattered-${index}`, type: types[index % types.length], ...spot }));
}

/** @param {import('./contracts.js').LevelInput} data */
export function iceLevel(data) {
    data = withDefaults(data, { platforms: [], fruits: [], enemies: [], gaps: [] });
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
    // Sağlam zeminde aralıklı buz adaları; aralarında kuru ve güvenli durma alanları kalır.
    const ice = [];
    let start = 0;
    for (const gap of [...data.gaps, { x: data.width, width: 0 }]) {
        for (let x = start + 140; x + 160 < gap.x - 60; x += 480) {
            ice.push({ x, width: Math.min(250, gap.x - 60 - x) });
        }
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
    return defineLevel({
        ...data, platforms, fruits, enemies, ice,
        fireRain: [{ kind: 'snow', period: 10000, speed: 310, offset: 4500 }] });
}
