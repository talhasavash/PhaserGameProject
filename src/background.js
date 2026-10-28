// Bu dosya yalnızca görünümü çizer; oyun kurallarını değiştirmez.
// Phaser'ın add.rectangle, add.circle, add.ellipse gibi çizim araçlarını kullanırız.
// setScrollFactor: 0 sabit, 1 dünya ile aynı hız. Ara değerler derinlik hissi verir.
export function createScenery(scene, width) {
    scene.add.rectangle(480, 300, 960, 600, 0xc6edef).setScrollFactor(0).setDepth(-100);
    scene.add.circle(775, 152, 47, 0xffe6a0).setScrollFactor(0.08).setDepth(-90);
    for (let i = 0; i < 9; i++) {
        const cloud = scene.add.container(i * 260 + 120, 155 + (i % 3) * 32).setScrollFactor(0.18).setDepth(-80);
        cloud.add([scene.add.ellipse(0, 0, 116, 30, 0xf5faf3), scene.add.ellipse(-21, -13, 50, 42, 0xf5faf3), scene.add.ellipse(20, -18, 58, 50, 0xf5faf3)]);
    }
    for (let i = 0; i < 15; i++) {
        scene.add.ellipse(i * 300, 507, 650, 355 + (i % 3) * 70, 0x9bced0).setScrollFactor(0.3).setDepth(-70);
        scene.add.ellipse(i * 260 + 130, 545, 460, 260, 0x73b5a5).setScrollFactor(0.5).setDepth(-60);
    }
    for (let x = 100; x < width + 900; x += 310) {
        const tree = scene.add.container(x, 510).setScrollFactor(0.75).setDepth(-40).setAlpha(0.8);
        tree.add([scene.add.rectangle(0, -65, 13, 130, 0x7c9573), scene.add.ellipse(0, -145, 125, 135, 0x5fa38b), scene.add.ellipse(-35, -111, 92, 94, 0x5fa38b), scene.add.ellipse(34, -112, 92, 94, 0x5fa38b)]);
    }
    scene.add.rectangle(width / 2, 560, width, 80, 0xaf7851).setDepth(-5);
    scene.add.rectangle(width / 2, 530, width, 20, 0x7dba64).setDepth(-4);
    scene.add.rectangle(width / 2, 520, width, 7, 0x417d54).setDepth(-3);
    const earth = scene.add.graphics().setDepth(-2);
    for (let x = 0; x < width; x += 28) {
        earth.fillStyle(x % 3 ? 0x956c4a : 0xc78b5c, 0.65);
        earth.fillRoundedRect(x, 550 + (x % 4) * 8, 9, 5, 2);
    }
    for (let x = 55; x < width; x += 175) {
        scene.add.ellipse(x, 512, 54, 18, 0x528b56).setDepth(1);
        scene.add.circle(x + 12, 504, 4, 0xffd779).setDepth(2);
        scene.add.circle(x - 10, 509, 3, 0xf1bf9a).setDepth(2);
    }
}

export function makeSign(scene, x, text, color = '#465b47') {
    scene.add.rectangle(x, 499, 7, 42, 0x937854).setDepth(4);
    return scene.add.text(x, 463, text, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', fontStyle: 'bold',
        color, backgroundColor: '#fff1ce', padding: { x: 12, y: 8 }, align: 'center'
    }).setOrigin(0.5).setDepth(5);
}

// Cami görünümünü çiz; giriş kapısını oyun akışının kullanması için geri döndür.
export function createMosque(scene, x) {
    for (const side of [-1, 1]) {
        const towerX = x + side * 106;
        scene.add.rectangle(towerX, 452, 22, 136, 0xe9e0bc).setDepth(4);
        scene.add.rectangle(towerX, 411, 32, 7, 0xc5a86a).setDepth(5);
        scene.add.triangle(towerX, 371, 0, 30, 13, 0, 26, 30, 0x4b897b).setDepth(5);
        scene.add.rectangle(towerX, 440, 7, 24, 0x6a9d95).setDepth(5);
    }
    scene.add.ellipse(x, 444, 144, 106, 0x4b897b).setDepth(4);
    scene.add.text(x, 369, '☾', { fontFamily: 'Georgia', fontSize: '30px', color: '#bd9950' }).setOrigin(0.5).setDepth(5);
    scene.add.rectangle(x, 487, 168, 66, 0xf0e6c5).setDepth(5);
    scene.add.rectangle(x, 455, 174, 8, 0xc5a86a).setDepth(6);
    for (const side of [-1, 1]) {
        scene.add.ellipse(x + side * 54, 479, 22, 24, 0x81aaa0).setDepth(6);
        scene.add.rectangle(x + side * 54, 491, 22, 24, 0x81aaa0).setDepth(6);
    }
    scene.add.ellipse(x, 475, 54, 46, 0xc5a86a).setDepth(6);
    scene.add.rectangle(x, 492, 54, 56, 0xc5a86a).setDepth(6);
    scene.add.ellipse(x, 477, 42, 36, 0x486b62).setDepth(7);
    const door = scene.add.rectangle(x, 494, 42, 52, 0x486b62).setDepth(7);
    scene.add.circle(x + 12, 494, 3, 0xf0ce79).setDepth(8);
    scene.add.text(x, 331, 'CAMİ GİRİŞİ', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#294e4c' }).setOrigin(0.5).setDepth(7);
    return door;
}

export function createFountain(scene, x) {
    const tiles = scene.add.graphics().setDepth(5);
    tiles.fillStyle(0xe7dfc3);
    tiles.fillRoundedRect(x - 34, 459, 68, 59, 7);
    tiles.fillStyle(0x74a99f);
    tiles.fillRoundedRect(x - 25, 467, 50, 44, 4);
    scene.add.rectangle(x, 469, 56, 4, 0xc8af78).setDepth(6);
    scene.add.ellipse(x, 514, 84, 15, 0xd1c7a3).setDepth(6);
    scene.add.ellipse(x, 512, 66, 8, 0x96cdd0).setDepth(7);
    for (const offset of [-14, 14]) {
        scene.add.rectangle(x + offset, 487, 12, 4, 0xdabb79).setDepth(7);
        scene.add.rectangle(x + offset + 5, 491, 4, 8, 0xdabb79).setDepth(7);
        const drop = scene.add.ellipse(x + offset + 5, 500, 3, 6, 0xaee6e6).setDepth(7);
        scene.tweens.add({ targets: drop, y: 509, alpha: 0.3, duration: 650, repeat: -1 });
    }
    return scene.add.text(x, 435, 'ABDEST ALANI · +1 CAN', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#375e58' }).setOrigin(0.5).setDepth(7);
}
