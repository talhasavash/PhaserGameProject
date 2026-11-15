import { createChapterScenery } from './chapterScenery.js';
import { createWorldOneScenery } from './world1Scenery.js';
// Bu dosya yalnızca görünümü çizer; oyun kurallarını değiştirmez.
// Sabit bahçe çizimlerini bir kez dokuya çevirip tekrar kullanırız.
export function createScenery(scene, width, theme = 'garden') {
    if (createWorldOneScenery(scene, width, theme)) return;
    if (theme === 'courtyard') { createCourtyard(scene, width); return; }
    if (theme === 'desert' || theme === 'night') { createThemedScenery(scene, width, theme); return; }
    if (createChapterScenery(scene, width, theme)) return;
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

function cacheTexture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return;
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
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

// Cami görünümünü çiz; giriş kapısını oyun akışının kullanması için geri döndür.
export function createMosque(scene, x, theme = 'garden') {
    // Her bölümün cephesi, kubbe düzeni ve minare sayısı farklıdır.
    const designs = {
        garden: { wall: 0xf0e6c5, roof: 0x4b897b, trim: 0xc5a86a, width: 168, top: 455, towers: [-106, 106], domes: [[0, 444, 144, 106]] },
        abyss: { wall: 0xebe3ce, roof: 0x488c87, trim: 0xe2c783, width: 190, top: 445, towers: [118], domes: [[0, 412, 150, 106]] },
        courtyard: { wall: 0xe5e8eb, roof: 0x427fa4, trim: 0x77bfc2, width: 218, top: 446, towers: [-132], domes: [[-72, 437, 70, 58], [72, 437, 70, 58], [0, 410, 116, 100]] },
        desert: { wall: 0xe8bc8c, roof: 0xcb8256, trim: 0xf5dd9c, width: 194, top: 428, towers: [126], domes: [[0, 410, 94, 70]] },
        night: { wall: 0xe8dff0, roof: 0x7763a7, trim: 0xe8c77a, width: 230, top: 450, towers: [-140, -104, 104, 140], domes: [[-78, 435, 68, 68], [78, 435, 68, 68], [0, 399, 122, 116]] },
        forest: { wall: 0xe3d9b2, roof: 0x53876a, trim: 0xa77d4f, width: 180, top: 450, towers: [112], domes: [[0, 421, 150, 90]] },
        interior: { wall: 0xddceb1, roof: 0x728e91, trim: 0xbb9658, width: 220, top: 352, towers: [], domes: [] },
        snow: { wall: 0xf5f0eb, roof: 0x80adca, trim: 0xc9dce2, width: 208, top: 448, towers: [-126, 126], domes: [[-65, 435, 75, 60], [65, 435, 75, 60], [0, 401, 108, 110]] },
        river: { wall: 0xe1e7c8, roof: 0x3b8d9c, trim: 0xcbac65, width: 190, top: 440, towers: [-117], domes: [[0, 407, 155, 90]] },
        canyon: { wall: 0xd8a591, roof: 0x88687e, trim: 0xf0d39b, width: 212, top: 427, towers: [-130, 130], domes: [[-65, 414, 78, 58], [65, 414, 78, 58], [0, 393, 100, 100]] },
        festival: { wall: 0xf9e7c7, roof: 0x488f80, trim: 0xe2b951, width: 246, top: 441, towers: [-156, -116, 116, 156], domes: [[-85, 426, 72, 70], [85, 426, 72, 70], [0, 387, 125, 126]] },
        boss: { wall: 0xeee5d6, roof: 0x665d94, trim: 0xe5c275, width: 250, top: 434, towers: [-154, -116, 116, 154], domes: [[-88, 421, 80, 76], [88, 421, 80, 76], [0, 380, 136, 138]] }
    };
    const design = designs[theme] || designs.garden;
    // Her bölüme uygun açık renk vitraylar.
    const finishes = {
        garden: 0xb8e2d5, abyss: 0xb9e6df, courtyard: 0xc0e4ee,
        desert: 0xf4dcad, night: 0xd3c8ed,
        forest: 0xc9e2b9, interior: 0xb5e2df,
        snow: 0xd9f0f4, river: 0xb7e7e6,
        canyon: 0xebcbd1, festival: 0xf3e2ad,
        boss: 0xb3cee5
    };
    const glass = finishes[theme] || finishes.garden;
    const add = scene.add;
    for (const [index, offset] of design.towers.entries()) {
        const top = theme === 'desert' ? 330 : 348 - (index % 2) * 18;
        const towerX = x + offset;
        add.rectangle(towerX, (top + 520) / 2, theme === 'desert' ? 30 : 18, 520 - top, design.wall).setDepth(4);
        for (const y of [top + 36, top + 66]) add.rectangle(towerX, y, 28, 6, design.trim).setDepth(5);
        if (theme === 'desert') {
            add.rectangle(towerX, top - 4, 36, 10, design.roof).setDepth(5);
            add.rectangle(towerX, top + 19, 12, 22, 0x795b55).setDepth(5);
        } else add.triangle(towerX, top - 15, 0, 30, 13, 0, 26, 30, design.roof).setDepth(5);
    }
    add.rectangle(x, (design.top + 520) / 2, design.width, 520 - design.top, design.wall).setDepth(5);
    if (theme === 'interior') {
        add.ellipse(x, 373, 170, 150, design.wall).setDepth(4);
        add.ellipse(x, 389, 122, 114, design.roof).setDepth(6);
        add.rectangle(x, 440, 122, 110, design.roof).setDepth(6);
        for (const offset of [-95, 95]) {
            add.rectangle(x + offset, 440, 14, 160, design.trim).setDepth(6);
            add.rectangle(x + offset, 355, 26, 10, design.trim).setDepth(6);
        }
    }
    for (const [offset, y, width, height] of design.domes) {
        add.ellipse(x + offset, y, width, height, design.roof).setDepth(4);
        add.rectangle(x + offset, y + height / 3, width, 7, design.trim).setDepth(5);
        add.text(x + offset, y - height / 2 - 13, '☾', { fontFamily: 'Georgia', fontSize: offset === 0 ? '24px' : '16px', color: '#e8c77a' }).setOrigin(0.5).setDepth(5);
    }
    add.rectangle(x, design.top, design.width + 10, 9, design.trim).setDepth(6);
    // Renkli pencere kemerleri ve basamaklar.
    for (const offset of [-66, 66]) {
        // Ahşap çaprazlar yerine açık renk taş kemer ve desenli vitray.
        add.ellipse(x + offset, 466, 30, 40, 0xf5ecd5).setDepth(7);
        add.rectangle(x + offset, 482, 30, 34, 0xf5ecd5).setDepth(7);
        add.ellipse(x + offset, 468, 22, 32, glass).setDepth(8);
        add.rectangle(x + offset, 482, 22, 26, glass).setDepth(8);
        for (const y of [465, 478, 490]) {
            add.circle(x + offset, y, 4, y === 478 ? 0xf2d69b : 0xe0f2e7).setDepth(9);
        }
    }
    if (theme === 'courtyard') {
        const tiles = add.graphics().setDepth(6);
        tiles.lineStyle(2, design.trim, 0.9);
        for (let offset = -98; offset <= 98; offset += 14) tiles.strokeRect(x + offset, 450, 10, 10);
    }
    if (theme === 'desert') {
        for (let offset = -88; offset <= 88; offset += 22) add.rectangle(x + offset, 418, 12, 16, design.wall).setDepth(6);
    }
    add.rectangle(x, 518, 90, 5, design.trim).setDepth(7);
    add.ellipse(x, 474, 58, 48, design.trim).setDepth(6);
    add.rectangle(x, 493, 58, 54, design.trim).setDepth(6);
    add.ellipse(x, 476, 44, 36, 0x344d56).setDepth(7);
    add.rectangle(x, 494, 44, 52, 0x273b43).setDepth(7);
    const glow = add.ellipse(x, 492, 40, 54, 0xffe49d, 0.65).setDepth(8).setVisible(false);
    const doorColor = theme === 'boss' ? 0x8495ac : 0x8b6547;
    const leftDoor = add.container(x - 11, 494).setDepth(9);
    leftDoor.add([add.rectangle(0, 0, 21, 50, doorColor).setStrokeStyle(1, design.trim), add.circle(6, 0, 2, 0xf0ce79)]);
    const rightDoor = add.container(x + 11, 494).setDepth(9);
    rightDoor.add([add.rectangle(0, 0, 21, 50, doorColor).setStrokeStyle(1, design.trim), add.circle(-6, 0, 2, 0xf0ce79)]);
    return { open() {
        glow.setVisible(true);
        scene.tweens.add({ targets: leftDoor, x: x - 24, scaleX: 0.2, duration: 500, ease: 'Sine.easeOut' });
        scene.tweens.add({ targets: rightDoor, x: x + 24, scaleX: 0.2, duration: 500, ease: 'Sine.easeOut' });
    } };
}
export function createFountain(scene, x) {
    const tiles = scene.add.graphics().setDepth(5);
    tiles.fillStyle(0xe7dfc3);
    tiles.fillRoundedRect(x - 34, 459, 68, 59, 7);
    tiles.fillStyle(0x74a99f);
    tiles.fillRoundedRect(x - 25, 467, 50, 44, 4);
    scene.add.rectangle(x, 469, 56, 4, 0xc8af78).setDepth(6);
    scene.add.ellipse(x, 514, 84, 15, 0xd1c7a3).setDepth(6);
    const water = scene.add.ellipse(x, 512, 66, 8, 0x96cdd0).setDepth(7);
    for (const offset of [-14, 14]) {
        scene.add.rectangle(x + offset, 487, 12, 4, 0xdabb79).setDepth(7);
        scene.add.rectangle(x + offset + 5, 491, 4, 8, 0xdabb79).setDepth(7);
        const drop = scene.add.ellipse(x + offset + 5, 500, 3, 6, 0xaee6e6).setDepth(7);
        scene.tweens.add({ targets: drop, y: 509, alpha: 0.3, duration: 650, repeat: -1 });
    }
    return water;
}
