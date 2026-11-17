// Bölüme uygun arka planı seçer; ortak cami ve abdest alanı görsellerini çizer.
import { createWorldOneScenery } from './world1Scenery.js';
import { createWorldTwoScenery } from './world2Scenery.js';
import { createWorldThreeScenery } from './world3Scenery.js';
import { createNightScenery } from './nightScenery.js';
import { createIceScenery } from './iceScenery.js';

export function createScenery(scene, width, theme = 'garden') {
    if (createIceScenery(scene, width, theme)) return;
    if (createNightScenery(scene, width, theme)) return;
    if (createWorldThreeScenery(scene, width, theme)) return;
    if (createWorldTwoScenery(scene, width, theme)) return;
    createWorldOneScenery(scene, width, theme);
}

// Cami görünümünü çiz; giriş kapısını oyun akışının kullanması için geri döndür.
export function createMosque(scene, x, theme = 'garden', style = {}) {
    // Her bölümün cephesi, kubbe düzeni ve minare sayısı farklıdır.
    const designs = {
        garden: { wall: 0xf0e6c5, roof: 0x4b897b, trim: 0xc5a86a, width: 168, top: 455, towers: [-106, 106], domes: [[0, 444, 144, 106]] },
        abyss: { wall: 0xebe3ce, roof: 0x488c87, trim: 0xe2c783, width: 190, top: 445, towers: [118], domes: [[0, 412, 150, 106]] },
        courtyard: { wall: 0xe5e8eb, roof: 0x427fa4, trim: 0x77bfc2, width: 218, top: 446, towers: [-132], domes: [[-72, 437, 70, 58], [72, 437, 70, 58], [0, 410, 116, 100]] },
        desert: { wall: 0xe8bc8c, roof: 0xcb8256, trim: 0xf5dd9c, width: 194, top: 428, towers: [126], domes: [[0, 410, 94, 70]] },
        night: { wall: 0xe8dff0, roof: 0x7763a7, trim: 0xe8c77a, width: 230, top: 450, towers: [-140, -104, 104, 140], domes: [[-78, 435, 68, 68], [78, 435, 68, 68], [0, 399, 122, 116]] },
        moonwood: { wall: 0xcbe0d7, roof: 0x3d807b, trim: 0xe8cb8a, width: 190, top: 450, towers: [-118], domes: [[0, 420, 154, 94]] },
        nightRuins: { wall: 0xd5cde5, roof: 0x716791, trim: 0xdcc69d, width: 236, top: 442, towers: [-140, 140], domes: [[-72, 425, 75, 65], [72, 425, 75, 65], [0, 396, 108, 108]] },
        nightKeep: { wall: 0xc8d9e6, roof: 0x395d89, trim: 0xf2d491, width: 260, top: 430, towers: [-158, -119, 119, 158], domes: [[-87, 412, 80, 78], [87, 412, 80, 78], [0, 375, 133, 130]] },
        forest: { wall: 0xe3d9b2, roof: 0x53876a, trim: 0xa77d4f, width: 180, top: 450, towers: [112], domes: [[0, 421, 150, 90]] },
        interior: { wall: 0xddceb1, roof: 0x728e91, trim: 0xbb9658, width: 220, top: 352, towers: [], domes: [] },
        snow: { wall: 0xf5f0eb, roof: 0x80adca, trim: 0xc9dce2, width: 208, top: 448, towers: [-126, 126], domes: [[-65, 435, 75, 60], [65, 435, 75, 60], [0, 401, 108, 110]] },
        river: { wall: 0xe1e7c8, roof: 0x3b8d9c, trim: 0xcbac65, width: 190, top: 440, towers: [-117], domes: [[0, 407, 155, 90]] },
        canyon: { wall: 0xd8a591, roof: 0x88687e, trim: 0xf0d39b, width: 212, top: 427, towers: [-130, 130], domes: [[-65, 414, 78, 58], [65, 414, 78, 58], [0, 393, 100, 100]] },
        festival: { wall: 0xf9e7c7, roof: 0x488f80, trim: 0xe2b951, width: 246, top: 441, towers: [-156, -116, 116, 156], domes: [[-85, 426, 72, 70], [85, 426, 72, 70], [0, 387, 125, 126]] },
        boss: { wall: 0xeee5d6, roof: 0x665d94, trim: 0xe5c275, width: 250, top: 434, towers: [-154, -116, 116, 154], domes: [[-88, 421, 80, 76], [88, 421, 80, 76], [0, 380, 136, 138]] }
    };
    const icy = ['glacier', 'iceCave', 'aurora'].includes(theme);
    const design = { ...(designs[theme] || (icy ? designs.snow : designs.garden)), ...style };
    // Her bölüme uygun açık renk vitraylar.
    const finishes = {
        garden: 0xb8e2d5, abyss: 0xb9e6df, courtyard: 0xc0e4ee,
        desert: 0xf4dcad, night: 0xd3c8ed,
        moonwood: 0x9fd9c9, nightRuins: 0xd5b8e5, nightKeep: 0x9ecce9,
        forest: 0xc9e2b9, interior: 0xb5e2df,
        snow: 0xd9f0f4, river: 0xb7e7e6,
        canyon: 0xebcbd1, festival: 0xf3e2ad,
        boss: 0xb3cee5
    };
    const glass = finishes[theme] || (icy ? finishes.snow : finishes.garden);
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
