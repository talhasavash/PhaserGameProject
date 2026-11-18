// Bölüm temasına göre basamak görsellerini çizer ve tekrar kullanılacak dokular üretir.
import { cacheTexture } from '../../graphics/texture.js';
// Her genişlik/tema bir kez dokuya çevrilir; oyun sırasında şekiller yeniden çizilmez.

export const platformThemes = {
    crystalPalace: { body: 0x8874bf, edge: 0xbdfbff, detail: 0xf0bbf5 },
    glacier: { body: 0x82bfd5, edge: 0xf0fcff, detail: 0xc4eaf4 },
    iceCave: { body: 0x508fab, edge: 0xc6f2ff, detail: 0x93cedd },
    aurora: { body: 0x698eb9, edge: 0xd0edf5, detail: 0xb3cbef },
    moonwood: { body: 0x405b67, edge: 0xb0d8ca, detail: 0x89b7b0 },
    nightRuins: { body: 0x66627f, edge: 0xd0bde6, detail: 0xaaa0c4 },
    nightKeep: { body: 0x465978, edge: 0xb9d9e9, detail: 0x839eb9 },
    journey: { body: 0x708fb3, edge: 0xd6e7fa, detail: 0x456482 },
    garden: { body: 0x98714d, edge: 0x72a65f, detail: 0xc8a16e },
    courtyard: { body: 0xc9d9d3, edge: 0xf4e9ca, detail: 0x729d9e },
    desert: { body: 0xd6a368, edge: 0xf5d792, detail: 0xb47a4e },
    night: { body: 0x8079b0, edge: 0xc6bce5, detail: 0xf6dfa3 },
    forest: { body: 0x81684b, edge: 0x66916a, detail: 0xb9a17a },
    interior: { body: 0xa15b67, edge: 0xe1c18b, detail: 0xf0dab0 },
    snow: { body: 0x8dcbdc, edge: 0xf3faf1, detail: 0xc5edf0 },
    river: { body: 0x759591, edge: 0xd5c596, detail: 0x436f74 },
    canyon: { body: 0xa97870, edge: 0xd7afa0, detail: 0x7f616b },
    festival: { body: 0x9d78a5, edge: 0xe6c879, detail: 0xf9e6b0 },
    boss: { body: 0x59677f, edge: 0xc7ad70, detail: 0x93a4b4 },
    lava: { body: 0x564252, edge: 0xf5ac67, detail: 0xbf6c59 },
    factory: { body: 0x52717f, edge: 0xe2c374, detail: 0xa9c4c7 },
    castle: { body: 0x67627f, edge: 0xb5a8d0, detail: 0x3f3d59 },
    abyss: { body: 0x726a60, edge: 0xe0c99d, detail: 0x4f5960 }
};

const platformDrawers = new Map();
export function registerPlatformTheme(name, palette, draw) {
    platformThemes[name] = palette;
    if (draw) platformDrawers.set(name, draw);
}

export function createPlatformArt(scene, platform, theme) {
    const { x, y, width } = platform;
    const key = `step-${theme}-${width}-${platform.single ? 'single' : 'wide'}`;
    let textureWidth = 64;
    while (textureWidth < width + 12) textureWidth *= 2;
    cacheTexture(scene, key, textureWidth, 64, g => {
        const draw = platformDrawers.get(theme);
        if (draw) draw(g, width, platformThemes[theme]);
        else drawStep(g, width, theme);
    });
    return scene.add.image(x - 6, y, key).setOrigin(0).setDepth(6);
}

function drawStep(g, width, theme) {
    const p = platformThemes[theme] || platformThemes.garden;
    const x = 6;
    const end = x + width;
    g.fillStyle(p.body);

    if (theme === 'crystalPalace') {
        g.fillRoundedRect(x, 0, width, 24, 7);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 7, 3);
        for (let xx = x + 12; xx < end - 8; xx += 28) {
            g.fillStyle(p.detail); g.fillTriangle(xx - 8, 14, xx, 7, xx + 8, 14);
            g.fillStyle(0x94cce8); g.fillTriangle(xx - 8, 14, xx, 23, xx + 8, 14);
        }
        g.fillStyle(p.edge); g.fillEllipse(x + width / 2, 30, width * 0.6, 5);
    } else if (theme === 'moonwood') {
        g.fillRoundedRect(x, 0, width, 27, 10);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 6, 3);
        g.lineStyle(2, p.detail); g.strokeCircle(x + 13, 16, 6);
        for (let xx = x + 30; xx < end - 10; xx += 24) g.lineBetween(xx, 14, xx + 15, 20);
    } else if (theme === 'nightRuins' || theme === 'nightKeep') {
        g.fillRoundedRect(x, 0, width, 28, 4);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 5, 2);
        g.lineStyle(2, p.detail);
        for (let xx = x + 5; xx < end - 8; xx += 27) g.strokeRect(xx, 10, Math.min(23, end - xx - 4), 12);
        if (theme === 'nightKeep') {
            g.fillStyle(p.edge);
            for (const xx of [x + 10, end - 10]) g.fillCircle(xx, 16, 2);
        }
    } else if (theme === 'journey') {
        g.fillRoundedRect(x, 0, width, 28, 6);
        g.fillStyle(p.edge);
        g.fillRoundedRect(x, 0, width, 7, 3);
        g.lineStyle(1, p.detail);
        g.strokeRoundedRect(x+4,11,width-8,12,3);
    }
    else if (theme === 'garden') {
        g.fillRoundedRect(x, 0, width, 27, 5);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 8, 4);
        g.fillStyle(p.detail);
        for (let xx = x + 12; xx < end - 6; xx += 28) g.fillEllipse(xx, 18, 8, 4);
    } else if (theme === 'courtyard') {
        g.fillRect(x, 0, width, 25);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 5); g.fillRect(x + 4, 24, width - 8, 4);
        g.lineStyle(2, p.detail);
        for (let xx = x + 12; xx < end - 8; xx += 26) { g.strokeRect(xx, 9, 14, 10); g.lineBetween(xx + 7, 10, xx + 7, 18); }
    } else if (theme === 'desert') {
        g.fillPoints([{ x, y: 0 }, { x: end, y: 0 }, { x: end - 7, y: 25 }, { x: x + 7, y: 25 }], true);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 6);
        g.fillStyle(p.detail); g.fillRect(x + 7, 13, width - 14, 3); g.fillRect(x + 9, 25, width - 18, 5);
    } else if (theme === 'night') {
        g.fillRoundedRect(x, 0, width, 16, 8);
        for (let xx = x + 12; xx < end; xx += 22) g.fillEllipse(Math.min(xx, end - 10), 16, 24, 20);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 5, 2);
        g.fillStyle(p.detail);
        for (let xx = x + 16; xx < end - 8; xx += 32) g.fillCircle(xx, 14, 2);
    } else if (theme === 'forest') {
        g.fillRoundedRect(x, 0, width, 27, 12);
        g.fillStyle(p.detail); g.fillCircle(x + 13, 13, 9);
        g.lineStyle(2, p.body); g.strokeCircle(x + 13, 13, 5);
        g.lineStyle(2, p.detail);
        for (let xx = x + 32; xx < end - 10; xx += 26) g.lineBetween(xx, 12, xx + 16, 17);
        g.fillStyle(p.edge); g.fillRoundedRect(x + 4, 0, width - 8, 6, 3);
    } else if (theme === 'interior') {
        g.fillRoundedRect(x, 0, width, 23, 9);
        g.lineStyle(2, p.edge); g.strokeRoundedRect(x + 3, 3, width - 6, 17, 6);
        g.fillStyle(p.detail);
        for (let xx = x + 9; xx < end - 3; xx += 14) { g.fillRect(xx, 23, 3, 6); g.fillCircle(xx + 1, 11, 1.5); }
    } else if (['snow', 'glacier', 'iceCave', 'aurora'].includes(theme)) {
        g.fillPoints([{ x, y: 0 }, { x: end, y: 0 }, { x: end - 6, y: 22 }, { x: x + width / 2, y: 29 }, { x: x + 4, y: 23 }], true);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 7, 3);
        g.fillStyle(p.detail);
        for (let xx = x + 10; xx < end - 6; xx += 22) g.fillTriangle(xx, 18, xx + 5, 32, xx + 10, 18);
        g.lineStyle(1, 0xe1f8f4); g.lineBetween(x + 15, 10, end - 12, 16);
    } else if (theme === 'river') {
        for (let xx = x; xx < end; xx += 22) g.fillRoundedRect(xx, 0, Math.min(20, end - xx), 19, 3);
        g.lineStyle(3, p.edge); g.lineBetween(x, 3, end, 3); g.lineBetween(x + 3, 21, end - 3, 21);
        g.fillStyle(p.detail);
        for (let xx = x + 10; xx < end; xx += 22) g.fillCircle(xx, 12, 2);
    } else if (theme === 'canyon') {
        g.fillPoints([{ x, y: 0 }, { x: end, y: 0 }, { x: end - 8, y: 20 }, { x: end - 24, y: 31 }, { x: x + 12, y: 25 }], true);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 5);
        g.lineStyle(2, p.detail); g.lineBetween(x + 12, 13, end - 14, 16); g.lineBetween(x + 20, 20, end - 26, 22);
    } else if (theme === 'festival') {
        g.fillRoundedRect(x, 0, width, 25, 10);
        g.fillStyle(p.edge); g.fillRoundedRect(x, 0, width, 6, 3); g.fillRect(x + 6, 22, width - 12, 3);
        g.fillStyle(p.detail);
        for (let xx = x + 14; xx < end - 6; xx += 24) { g.fillCircle(xx, 14, 3); g.fillRect(xx - 1, 27, 2, 5); }
    } else if (theme === 'lava') {
        g.fillPoints([{ x, y: 0 }, { x: end, y: 0 }, { x: end - 14, y: 25 }, { x: x + 9, y: 30 }], true);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 5);
        g.lineStyle(2, p.detail); g.lineBetween(x + width / 2, 5, x + width / 2 - 8, 24);
    } else if (theme === 'factory') {
        g.fillRect(x, 0, width, 24);
        g.lineStyle(2, p.detail); g.strokeRect(x + 4, 5, width - 8, 15);
        g.fillStyle(p.edge);
        for (let xx = x; xx < end - 12; xx += 24) g.fillTriangle(xx, 0, xx + 14, 0, xx + 7, 7);
    } else if (theme === 'castle') {
        g.fillRoundedRect(x, 0, width, 28, 3);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 5);
        g.lineStyle(2, p.detail);
        for (let xx = x + 12; xx < end; xx += 28) g.strokeRect(xx, 10, Math.min(24, end - xx), 12);
    } else {
        g.fillPoints([{ x, y: 0 }, { x: end, y: 0 }, { x: end - 8, y: 28 }, { x: x + 8, y: 28 }], true);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 5);
        g.lineStyle(2, p.detail); g.strokeRect(x + 6, 9, width - 12, 12);
        g.fillStyle(p.edge);
        for (const xx of [x + 12, end - 12]) g.fillCircle(xx, 15, 3);
    }
}
