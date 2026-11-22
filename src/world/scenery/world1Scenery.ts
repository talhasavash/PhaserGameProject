// Dünya 1'in bahçe, avlu, çöl ve diğer ortamlarının arka planlarını çizer.

import { cacheTexture } from '../../graphics/texture.js';

export function createWorldOneScenery(scene, width, theme = 'garden') {
    if (theme === 'courtyard') { createCourtyard(scene, width); return; }
    if (theme === 'desert' || theme === 'night') { createThemedScenery(scene, width, theme); return; }
    if (createLandscapeScenery(scene, width, theme)) return;
    createGardenScenery(scene, width);
}

function createGardenScenery(scene, width) {
    scene.cameras.main.setBackgroundColor('#c6edef');
    cacheTexture(scene, 'garden-cloud', 128, 64, g => {
        g.fillStyle(0xf5faf3);
        g.fillEllipse(64, 44, 116, 28); g.fillEllipse(43, 30, 50, 42); g.fillEllipse(84, 24, 58, 48);
    });
    cacheTexture(scene, 'garden-hills-far', 1024, 512, g => {
        g.fillStyle(0x9bced0);
        for (let x = 0; x <= 1024; x += 512) g.fillEllipse(x, 419, 800, 430);
    });
    cacheTexture(scene, 'garden-hills-near', 1024, 512, g => {
        g.fillStyle(0x73b5a5);
        for (let x = -256; x <= 1280; x += 512) g.fillEllipse(x, 457, 680, 300);
    });
    cacheTexture(scene, 'garden-trees', 512, 256, g => {
        g.fillStyle(0x7c9573, 0.8); g.fillRect(122, 126, 13, 130);
        g.fillStyle(0x5fa38b, 0.8);
        g.fillEllipse(128, 111, 125, 135); g.fillEllipse(93, 145, 92, 94); g.fillEllipse(162, 144, 92, 94);
    });
    cacheTexture(scene, 'garden-earth', 256, 128, g => {
        for (let x = 0; x < 256; x += 28) {
            g.fillStyle(x % 3 ? 0x956c4a : 0xc78b5c, 0.65);
            g.fillRoundedRect(x, 30 + (x % 4) * 8, 9, 5, 2);
        }
    });
    cacheTexture(scene, 'garden-flowers', 256, 32, g => {
        g.fillStyle(0x528b56); g.fillEllipse(55, 24, 54, 18);
        g.fillStyle(0xffd779); g.fillCircle(67, 16, 4);
        g.fillStyle(0xf1bf9a); g.fillCircle(45, 21, 3);
    });
    scene.add.circle(775, 152, 47, 0xffe6a0).setScrollFactor(0.08).setDepth(-90);
    for (let i = 0; i < 9; i++) {
        scene.add.image(i * 260 + 120, 155 + (i % 3) * 32, 'garden-cloud').setScrollFactor(0.18).setDepth(-80);
    }
    // Her katman tek TileSprite: kamera kayar, pahalı şekiller yeniden çizilmez.
    const tile = (key, y, height, scroll, depth) => scene.add.tileSprite(0, y, width + 1024, height, key)
        .setOrigin(0).setScrollFactor(scroll).setDepth(depth);
    tile('garden-hills-far', 88, 512, 0.3, -70);
    tile('garden-hills-near', 88, 512, 0.5, -60);
    tile('garden-trees', 254, 256, 0.75, -40);
    scene.add.rectangle(width / 2, 560, width, 80, 0xaf7851).setDepth(-5);
    scene.add.rectangle(width / 2, 530, width, 20, 0x7dba64).setDepth(-4);
    scene.add.rectangle(width / 2, 520, width, 7, 0x417d54).setDepth(-3);
    tile('garden-earth', 520, 80, 1, -2);
    tile('garden-flowers', 488, 32, 1, 1);
}

function createThemedScenery(scene, width, theme) {
    const night = theme === 'night';
    const sky = night ? 0x243856 : 0xf2d6ac;
    scene.cameras.main.setBackgroundColor(sky);
    scene.add.circle(620, 150, 43, night ? 0xffefba : 0xffe399).setScrollFactor(0.08).setDepth(-90);
    if (night) scene.add.circle(637, 135, 37, sky).setScrollFactor(0.08).setDepth(-89);
    const key = `${theme}-skyline`;
    cacheTexture(scene, key, 1024, 512, g => {
        if (night) {
            g.fillStyle(0xf7e5ad, 0.85);
            for (let i = 0; i < 24; i++) g.fillCircle((i * 149) % 1024, 30 + (i * 53) % 180, 2);
        }
        g.fillStyle(night ? 0x435b73 : 0xd8b37f);
        for (let x = 0; x <= 1024; x += 512) g.fillEllipse(x, 470, 840, 240);
        g.fillStyle(night ? 0x334d64 : 0xc49b6e);
        // Uzak kubbeler ve minareler, yalnızca dekor olarak kullanılır.
        for (let x = 140; x < 1024; x += 512) {
            g.fillEllipse(x, 345, 130, 96); g.fillRect(x - 65, 345, 130, 150);
            g.fillRect(x + 88, 290, 15, 205); g.fillTriangle(x + 83, 290, x + 95, 262, x + 108, 290);
        }
    });
    scene.add.tileSprite(0, 0, width + 1024, 512, key).setOrigin(0).setScrollFactor(0.35).setDepth(-60);
    const foreground = `${theme}-motifs`;
    cacheTexture(scene, foreground, 512, 256, g => {
        if (night) {
            g.fillStyle(0x49796e); g.fillEllipse(120, 154, 42, 170); g.fillRect(116, 175, 8, 81);
            g.fillStyle(0xc3a46e); g.fillRect(290, 110, 3, 146); g.fillRect(290, 110, 45, 4);
            g.fillStyle(0xffd77e); g.fillRoundedRect(319, 120, 20, 28, 5);
        } else {
            g.fillStyle(0x8c7752); g.fillRect(120, 140, 10, 116);
            g.fillStyle(0x71947a); g.fillEllipse(88, 139, 85, 22); g.fillEllipse(161, 139, 85, 22);
            g.fillEllipse(125, 119, 26, 70);
        }
    });
    scene.add.tileSprite(0, 264, width + 512, 256, foreground).setOrigin(0).setScrollFactor(0.8).setDepth(-20);
    scene.add.rectangle(width / 2, 560, width, 80, night ? 0x596976 : 0xb88a60).setDepth(-5);
    scene.add.rectangle(width / 2, 526, width, 14, night ? 0x7fa99a : 0xe9c58c).setDepth(-4);
    scene.add.rectangle(width / 2, 520, width, 5, night ? 0x416e69 : 0xb89260).setDepth(-3);
}

function createCourtyard(scene, width) {
    scene.cameras.main.setBackgroundColor('#ded3ea');
    scene.add.circle(620, 145, 43, 0xffe7a3).setScrollFactor(0.08).setDepth(-90);
    scene.add.circle(636, 132, 38, 0xded3ea).setScrollFactor(0.08).setDepth(-89);
    // Kemerli avlu duvarı, kandiller ve servi ağaçları.
    for (let x = 0; x < width + 900; x += 260) {
        const wall = scene.add.container(x, 520).setScrollFactor(0.7).setDepth(-40);
        wall.add([
            scene.add.rectangle(110, -70, 250, 140, 0xc4aabf),
            scene.add.ellipse(110, -136, 82, 110, 0xb49bb6),
            scene.add.rectangle(110, -74, 82, 130, 0xb49bb6),
            scene.add.rectangle(0, -100, 16, 200, 0xe5cfbe),
            scene.add.rectangle(0, -200, 28, 10, 0xb294a9)
        ]);
        scene.add.line(x + 18, 326, 0, -28, 0, 12, 0x80677d).setDepth(-30);
        scene.add.ellipse(x + 18, 354, 20, 28, 0xffd47b).setDepth(-29);
        scene.add.rectangle(x + 18, 354, 7, 18, 0xfff2bc).setDepth(-28);
        const tree = scene.add.container(x + 206, 520).setScrollFactor(0.9).setDepth(-20);
        tree.add([
            scene.add.rectangle(0, -55, 9, 110, 0x876d70),
            scene.add.ellipse(0, -132, 42, 166, 0x6d8c82)
        ]);
    }
    scene.add.rectangle(width / 2, 560, width, 80, 0xb99b91).setDepth(-5);
    scene.add.rectangle(width / 2, 526, width, 14, 0xe4ccb0).setDepth(-4);
    scene.add.rectangle(width / 2, 520, width, 5, 0x8b7681).setDepth(-3);
    const tiles = scene.add.graphics().setDepth(-2);
    tiles.lineStyle(1, 0x977e80, 0.6);
    for (let x = 0; x < width; x += 64) {
        tiles.strokeRect(x, 535, 64, 28);
        tiles.strokeRect(x + 32, 563, 64, 28);
    }
}

const palettes = {
    forest: { sky: 0xd4e7cb, far: 0x8fb393, near: 0x547d63, earth: 0x95744f, edge: 0x79a15b },
    interior: { sky: 0xeae1cb, far: 0xd4c6a6, near: 0xb89c76, earth: 0x934d51, edge: 0xc6a268 },
    snow: { sky: 0xd5e7ef, far: 0xadc4d2, near: 0x7694b0, earth: 0x819aaa, edge: 0xf4f7ed },
    river: { sky: 0xd4ebdf, far: 0x96b9b0, near: 0x548c83, earth: 0x8a8a6b, edge: 0x84aa70 },
    canyon: { sky: 0xe5c8b5, far: 0xb99287, near: 0x927a84, earth: 0x947265, edge: 0xcda17f },
    festival: { sky: 0xe8d9df, far: 0xbcaac6, near: 0x789997, earth: 0x9c7e84, edge: 0xa9bd86 },
    boss: { sky: 0xbcb1d0, far: 0x817d9e, near: 0x645d80, earth: 0x71637b, edge: 0xc8ae73 }
};
function createLandscapeScenery(scene, width, theme) {
    const p = palettes[theme];
    if (!p) return false;
    scene.cameras.main.setBackgroundColor(p.sky);
    cacheTexture(scene, `${theme}-far`, 1024, 512, g => {
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
    cacheTexture(scene, `${theme}-near`, 512, 512, g => {
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
            scene.add.image(x, 323, 'Allah-plaque').setScrollFactor(0.82).setDepth(-19);
        }
    }
    scene.add.rectangle(width / 2, 560, width, 80, p.earth).setDepth(-5);
    scene.add.rectangle(width / 2, 524, width, 12, p.edge).setDepth(-4);
    if (theme === 'interior') {
        cacheTexture(scene, 'interior-carpet', 128, 128, g => {
            g.fillStyle(0xc6a268); g.fillRect(0, 0, 128, 5); g.fillRect(0, 68, 128, 4);
            g.lineStyle(2, 0xdfbd8f, 0.7); g.strokeRect(14, 15, 98, 42); g.strokeCircle(64, 36, 13); g.strokeCircle(64, 36, 6);
        });
        scene.add.tileSprite(0, 520, width, 80, 'interior-carpet').setOrigin(0).setDepth(-2);
    }
    return true;
}
