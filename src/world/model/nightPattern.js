// Gece rota örüntüsü: bölüm dosyalarında yalnızca rota ve zorluk ayarları kalır.
import { defineEnemy } from '../../gameplay/enemyTypes.js';
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


export function createNightLayout(chapter, random) {
    const index = chapter.stage;
    if (!Number.isInteger(index) || index < 0) throw new Error('Gece örüntüsünde stage, 0 veya daha büyük bir tam sayı olmalı.');
    const anchors = [350, 1700 + index * 40, 3200 + index * 70];
    const width = chapter.width;
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
            enemies.push(defineEnemy(groundTypes[(index + sector) % groundTypes.length], { platform, behaviors: { patrol: { speed: 165 + index * 3 }, hop: { walkMs: 2800 - index * 65, pauseMs: 380, height: 48 + index * 3, duration: 700, offset: sector * 700 }, visibility: (chapter.vanish || sector === index % 3) ? visibility(sector * 670) : undefined } }));
        }
        // Farklı bir yaklaşım noktasında uçan düşman; yıldız basamağının üstüne doğmaz.
        const x = anchors[sector] + 650;
        enemies.push(defineEnemy(airTypes[(index + sector) % airTypes.length], { x: x + Math.round(random() * 60 - 30), y: 375 - Math.round(random() * 50), behaviors: { patrol: { minX: x - 60, maxX: x + 70, speed: 175 + index * 3 }, visibility: chapter.vanish && sector !== 2 ? visibility(900 + sector * 800) : undefined, vertical: { bob: chapter.flying ? 40 : 24 } } }));
        if (chapter.spiders || (sector === 1 && index > 3)) {
            const spiderX = anchors[sector] + 610;
            enemies.push(defineEnemy('spider', { x: spiderX, y: 385, behaviors: { patrol: { minX: spiderX, maxX: spiderX, speed: 0 }, visibility: chapter.vanish ? visibility(1400) : undefined, vertical: { bob: 90, period: 2100 - index * 40, offset: sector * 500 } } }));
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
            enemies.push(defineEnemy('ogre', { texture, x, scale: 1.9 + guard * 0.2, behaviors: { patrol: { minX: x, maxX: x, speed: 0 }, jump: { height: 210, duration: 1600, period: 3500, offset: guard * 1200 }, visibility: guard === 0 ? visibility(1700) : undefined } }));
        }
    }
    return { ...chapter, width, platforms, fruits, enemies, gaps, columns,
        vanishAll: false, checkpoint: { x: anchors[1] + 570, y: 480 },
        fountains: [{ id: 'fountain-1', x: anchors[1] + 480 }], mosqueStyle: mosqueStyle(index) };
}
