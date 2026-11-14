// Bölümün basamak görünümü. Fizik kutusunu GameScene kurar; burada yalnızca çizim var.
// Her genişlik/tema bir kez dokuya çevrilir; oyun sırasında şekiller yeniden çizilmez.
export const platformThemes = {
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
    boss: { body: 0x59677f, edge: 0xc7ad70, detail: 0x93a4b4 }
};

export function createPlatformArt(scene, platform, theme) {
    const { x, y, width } = platform;
    const key = `step-${theme}-${width}-${platform.single ? 'single' : 'wide'}`;
    if (!scene.textures.exists(key)) {
        let textureWidth = 64;
        while (textureWidth < width + 12) textureWidth *= 2;
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        drawStep(g, width, theme);
        g.generateTexture(key, textureWidth, 64);
        g.destroy();
    }
    return scene.add.image(x - 6, y, key).setOrigin(0).setDepth(6);
}

function drawStep(g, width, theme) {
    const p = platformThemes[theme] || platformThemes.garden;
    const x = 6;
    const end = x + width;
    g.fillStyle(p.body);
    if (theme === 'garden') {
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
    } else if (theme === 'snow') {
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
    } else {
        g.fillPoints([{ x, y: 0 }, { x: end, y: 0 }, { x: end - 8, y: 28 }, { x: x + 8, y: 28 }], true);
        g.fillStyle(p.edge); g.fillRect(x, 0, width, 5);
        g.lineStyle(2, p.detail); g.strokeRect(x + 6, 9, width - 12, 12);
        g.fillStyle(p.edge);
        for (const xx of [x + 12, end - 12]) g.fillCircle(xx, 15, 3);
    }
}
