// Yeni ortamlar küçük dokulara bir kez çizilir; kamera kayarken bu dokular tekrarlanır.
const palettes = {
    forest: { sky: 0xd4e7cb, far: 0x8fb393, near: 0x547d63, earth: 0x95744f, edge: 0x79a15b },
    interior: { sky: 0xeae1cb, far: 0xd4c6a6, near: 0xb89c76, earth: 0x934d51, edge: 0xc6a268 },
    snow: { sky: 0xd5e7ef, far: 0xadc4d2, near: 0x7694b0, earth: 0x819aaa, edge: 0xf4f7ed },
    river: { sky: 0xd4ebdf, far: 0x96b9b0, near: 0x548c83, earth: 0x8a8a6b, edge: 0x84aa70 },
    canyon: { sky: 0xe5c8b5, far: 0xb99287, near: 0x927a84, earth: 0x947265, edge: 0xcda17f },
    festival: { sky: 0xe8d9df, far: 0xbcaac6, near: 0x789997, earth: 0x9c7e84, edge: 0xa9bd86 },
    boss: { sky: 0xbcb1d0, far: 0x817d9e, near: 0x645d80, earth: 0x71637b, edge: 0xc8ae73 }
};
function texture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g); g.generateTexture(key, width, height); g.destroy();
}
export function createChapterScenery(scene, width, theme) {
    const p = palettes[theme];
    if (!p) return false;
    scene.cameras.main.setBackgroundColor(p.sky);
    texture(scene, `${theme}-far`, 1024, 512, g => {
        g.fillStyle(p.far);
        if (theme === 'interior') {
            g.fillRect(0, 0, 1024, 512);
            for (let x = 0; x < 1024; x += 256) {
                g.fillStyle(0xece3c8); g.fillEllipse(x + 128, 252, 200, 250); g.fillRect(x + 28, 252, 200, 260);
                g.fillStyle(0x8cafb5); g.fillEllipse(x + 128, 218, 64, 112); g.fillRect(x + 96, 218, 64, 116);
                g.lineStyle(3, 0xc7aa70); g.strokeRect(x + 94, 214, 68, 124);
                g.fillStyle(0xd7c18d); g.fillRect(x + 125, 170, 6, 162); g.fillRect(x + 96, 254, 64, 5);
            }
        } else {
            for (let x = -200; x <= 1024; x += 400) {
                if (theme === 'snow' || theme === 'canyon') {
                    g.fillStyle(p.far); g.fillTriangle(x, 512, x + 200, theme === 'snow' ? 100 : 170, x + 400, 512);
                    if (theme === 'snow') { g.fillStyle(0xf3f7ed); g.fillTriangle(x + 155, 190, x + 200, 100, x + 250, 200); }
                } else { g.fillStyle(p.far); g.fillEllipse(x + 200, 470, 620, 260); }
            }
            if (theme === 'river') {
                g.fillStyle(0x87bcc6); g.fillRect(0, 402, 1024, 110);
                g.lineStyle(3, 0xc4e4df, 0.8);
                for (let x = 0; x < 1024; x += 96) g.strokeRect(x, 438 + (x % 3) * 12, 48, 2);
            }
            if (theme === 'festival' || theme === 'boss') {
                for (let x = 70; x < 1024; x += 240) {
                    g.fillStyle(0x9c96af); g.fillEllipse(x, 310, 110, 100); g.fillRect(x - 55, 310, 110, 190);
                }
            }
        }
    });
    scene.add.tileSprite(0, 0, width + 1024, 512, `${theme}-far`).setOrigin(0).setScrollFactor(theme === 'interior' ? 0.55 : 0.3).setDepth(-60);
    texture(scene, `${theme}-near`, 512, 512, g => {
        if (theme === 'interior') {
            g.fillStyle(0xc7af88); g.fillRect(18, 120, 24, 392); g.fillRect(8, 115, 44, 15); g.fillRect(8, 495, 44, 17);
            // Lafzatullah tabloları aşağıda aynı SVG dokusundan eklenir.
            g.fillStyle(0xbaa06e); g.fillRect(375, 140, 3, 110); g.fillEllipse(377, 258, 62, 12);
            g.fillStyle(0xffdd85); g.fillCircle(355, 259, 6); g.fillCircle(377, 259, 6); g.fillCircle(399, 259, 6);
        } else if (theme === 'boss') {
            g.fillStyle(p.near); g.fillRect(55, 270, 65, 242); g.fillRect(350, 270, 65, 242);
            g.fillStyle(0xbba478); g.fillRect(48, 264, 80, 12); g.fillRect(342, 264, 80, 12);
            g.fillStyle(p.near); g.fillRoundedRect(110, 320, 245, 70, 18);
            g.lineStyle(3, 0xbba478); g.strokeRect(65, 360, 45, 120); g.strokeRect(360, 360, 45, 120);
        } else if (theme === 'canyon') {
            g.fillStyle(p.near); g.fillRect(70, 300, 90, 212); g.fillRect(120, 270, 70, 242);
            g.fillStyle(0xb59b91); g.fillRect(64, 310, 135, 9); g.fillRect(70, 375, 120, 7);
        } else {
            g.fillStyle(0x8f7c63); g.fillRect(125, 370, 12, 142);
            g.fillStyle(p.near);
            if (theme === 'snow' || theme === 'forest') {
                g.fillTriangle(65, 446, 131, 264, 198, 446); g.fillTriangle(78, 382, 131, 240, 184, 382);
                if (theme === 'snow') { g.fillStyle(0xeaf5e9); g.fillTriangle(110, 297, 131, 240, 152, 297); }
            } else {
                g.fillEllipse(131, 360, 135, 150); g.fillEllipse(96, 400, 95, 110);
            }
            if (theme === 'festival') {
                g.lineStyle(2, 0x8f7c80); g.strokeRect(0, 275, 512, 1);
                for (let x = 0; x < 512; x += 64) { g.fillStyle(x % 128 ? 0xe2bd77 : 0xa286af); g.fillTriangle(x, 276, x + 32, 316, x + 60, 276); }
            }
        }
    });
    scene.add.tileSprite(0, 0, width + 512, 512, `${theme}-near`).setOrigin(0).setScrollFactor(0.82).setDepth(-20);
    if (theme === 'interior') {
        for (let x = 226; x < width + 512; x += 512) {
            scene.add.image(x, 323, 'allah-plaque').setScrollFactor(0.82).setDepth(-19);
        }
    }
    scene.add.rectangle(width / 2, 560, width, 80, p.earth).setDepth(-5);
    scene.add.rectangle(width / 2, 524, width, 12, p.edge).setDepth(-4);
    if (theme === 'interior') {
        texture(scene, 'interior-carpet', 128, 128, g => {
            g.fillStyle(0xc6a268); g.fillRect(0, 0, 128, 5); g.fillRect(0, 68, 128, 4);
            g.lineStyle(2, 0xdfbd8f, 0.7); g.strokeRect(14, 15, 98, 42); g.strokeCircle(64, 36, 13); g.strokeCircle(64, 36, 6);
        });
        scene.add.tileSprite(0, 520, width, 80, 'interior-carpet').setOrigin(0).setDepth(-2);
    }
    return true;
}
