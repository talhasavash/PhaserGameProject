import { createPlatformArt } from './platforms.js';

// Zemini sabit Phaser gövdeleriyle kur; çukurlarda fizik gövdesi oluşturma.
export function createTerrain(scene) {
    scene.solids = scene.physics.add.staticGroup();
    // Çukurlarda fizik zemini yoktur; yalnızca arka planı kapatan boşluk çizilir.
    let start = 0;
    for (const gap of [...(scene.level.gaps || []), { x: scene.level.width, width: 0 }]) {
        const width = gap.x - start;
        if (width > 0) scene.solids.add(scene.add.rectangle(start + width / 2, 570, width, 100).setVisible(false));
        if (gap.width > 0) {
            const water = scene.level.theme === 'river';
            const lava = scene.level.theme === 'lava';
            const color = lava ? 0xe66d48 : water ? 0x397b91 : 0x263342;
            scene.add.rectangle(gap.x + gap.width / 2, 560, gap.width, 86, color).setDepth(3);
            scene.add.rectangle(gap.x + gap.width / 2, 528, gap.width - 6, 5, water ? 0x82ccd1 : 0x465167).setDepth(4);
            for (const side of [gap.x - 4, gap.x + gap.width + 4]) scene.add.rectangle(side, 560, 8, 80, 0x816e62).setDepth(4);
        }
        start = gap.x + gap.width;
    }
    for (const passage of scene.level.passages || []) {
        const color = scene.level.theme === 'interior' ? 0xb79a79 : 0x8f817b;
        const roof = scene.add.rectangle(
            passage.x + passage.width / 2, passage.y + 12, passage.width, 24, color
        ).setDepth(5);
        scene.solids.add(roof);
        scene.add.rectangle(passage.x + passage.width / 2, passage.y, passage.width, 5, 0xd8c59f).setDepth(6);
    }
    for (const ice of scene.level.ice || []) {
        scene.add.rectangle(ice.x + ice.width / 2, 522, ice.width, 10, 0xbcecf0, 0.95).setDepth(7);
        for (let x = ice.x + 15; x < ice.x + ice.width; x += 55) {
            scene.add.line(x, 520, 0, 0, 24, -3, 0xffffff, 0.85).setDepth(8);
        }
    }
    for (const platform of scene.level.platforms) {
        const { x, y, width } = platform;
        const ground = scene.add.rectangle(x + width / 2, y + 14, width, 28).setVisible(false);
        scene.solids.add(ground);
        createPlatformArt(scene, platform, scene.level.theme);
    }
    scene.beltMarks = [];
    for (const belt of scene.level.belts || [scene.level.belt]) {
        if (belt.speed === 0) continue;
        scene.add.rectangle(belt.x + belt.width / 2, 524, belt.width, 17, 0x466b72).setDepth(7);
        for (let offset = 0; offset < belt.width; offset += 22) {
            const mark = scene.add.text(belt.x + offset, 508, belt.speed < 0 ? '‹' : '›', {
                fontFamily: 'Trebuchet MS, sans-serif', color: '#d2e7c8', fontSize: '23px'
            }).setDepth(8);
            mark.setData('belt', belt);
            scene.beltMarks.push(mark);
        }
    }
}
