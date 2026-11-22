// Gece ormanı, harabeler ve kaleyi önbellekli katmanlarla çizer; oyun sırasında yeniden çizmez.

import { cacheTexture } from '../../graphics/texture.js';

const palettes = {
    moonwood: { sky: 0x14283e, far: 0x243e54, near: 0x345965, floor: 0x34464b, edge: 0x8cb6a5 },
    nightRuins: { sky: 0x191f3b, far: 0x303854, near: 0x515373, floor: 0x49445b, edge: 0xb2a8d1 },
    nightKeep: { sky: 0x101c31, far: 0x293953, near: 0x425472, floor: 0x353e55, edge: 0x99c1d4 }
};

export function createNightScenery(scene, width, theme) {
    const p = palettes[theme];
    if (!p) return false;
    scene.cameras.main.setBackgroundColor(p.sky);
    scene.add.circle(650, 145, 65, 0xb8e1eb, 0.08).setScrollFactor(0.08, 1).setDepth(-92);
    scene.add.circle(650, 145, 44, 0xffedc4).setScrollFactor(0.08, 1).setDepth(-91);
    scene.add.circle(668, 133, 39, p.sky).setScrollFactor(0.08, 1).setDepth(-90);
    const tile = (key, y, height, scroll, depth) => scene.add.tileSprite(0, y, width + 1024, height, key)
        .setOrigin(0).setScrollFactor(scroll, 1).setDepth(depth);

    cacheTexture(scene, `${theme}-stars`, 1024, 256, g => {
        g.fillStyle(0xe7edcf, 0.8);
        for (let i = 0; i < 42; i++) {
            const x = (i * 173 + 37) % 1024;
            const y = 35 + (i * 59) % 195;
            g.fillCircle(x, y, i % 7 === 0 ? 2 : 1);
        }
    });
    tile(`${theme}-stars`, 0, 256, 0.12, -85);
    cacheTexture(scene, `${theme}-distance`, 1024, 512, g => {
        g.fillStyle(p.far);
        if (theme === 'moonwood') {
            for (let x = -80; x < 1100; x += 160) {
                g.fillRect(x + 55, 230, 20, 282);
                g.fillTriangle(x - 10, 420, x + 65, 150, x + 140, 420);
                g.fillTriangle(x + 5, 335, x + 65, 120, x + 125, 335);
            }
        } else {
            for (let x = 0; x < 1024; x += 200) {
                const top = theme === 'nightKeep' ? 185 : 300 + x % 60;
                g.fillRect(x + 20, top, 110, 512 - top);
                for (let xx = x + 20; xx < x + 130; xx += 30) g.fillRect(xx, top - 20, 18, 24);
                if (theme === 'nightKeep') {
                    g.fillTriangle(x + 8, top, x + 75, top - 90, x + 142, top);
                    g.fillStyle(0xcdbb86, 0.55); g.fillRoundedRect(x + 62, top + 38, 24, 45, 12);
                    g.fillStyle(p.far);
                }
            }
        }
    });
    tile(`${theme}-distance`, 8, 512, 0.3, -65);
    cacheTexture(scene, `${theme}-foreground`, 512, 256, g => {
        g.fillStyle(p.near);
        if (theme === 'moonwood') {
            g.fillRect(72, 35, 22, 221);
            g.fillEllipse(80, 40, 140, 95); g.fillEllipse(35, 80, 100, 110); g.fillEllipse(125, 85, 100, 110);
            g.lineStyle(5, p.near); g.lineBetween(85, 135, 150, 93);
        } else {
            for (const x of [30, 355]) {
                g.fillRect(x, 30, 28, 226); g.fillRect(x - 9, 25, 46, 12);
                g.fillRect(x - 9, 241, 46, 15);
            }
            if (theme === 'nightRuins') {
                g.fillRect(58, 35, 110, 18); g.fillRect(260, 62, 95, 18);
            } else { g.fillRect(58, 45, 297, 18); }
        }
        // Kandiller ve ateş böcekleri sabit bir dokuya çizilir; tehlikelerden ayrı renktedir.
        g.fillStyle(0xf7da8f, 0.1); g.fillCircle(245, 166, 32);
        g.fillStyle(0xffe2a0); g.fillRoundedRect(238, 155, 14, 23, 4);
        g.fillStyle(0xfff0bc, 0.8);
        for (const x of [180, 310, 465]) g.fillCircle(x, 210 - x % 50, 2);
    });
    tile(`${theme}-foreground`, 264, 256, 0.7, -25);
    cacheTexture(scene, `${theme}-ground`, 256, 128, g => {
        g.fillStyle(p.floor); g.fillRect(0, 0, 256, 128);
        g.fillStyle(p.edge); g.fillRect(0, 0, 256, 6);
        g.lineStyle(1, p.near);
        for (let x = 0; x < 256; x += 64) { g.strokeRect(x, 16, 62, 28); g.strokeRect(x + 32, 48, 62, 28); }
    });
    tile(`${theme}-ground`, 520, 80, 1, -4);
    return true;
}
