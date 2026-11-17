// Buz dünyasının katmanlarını önbelleğe alır; karı tek ve sınırlı bir Phaser parçacık yayıcısıyla üretir.
import { cacheTexture } from '../../graphics/texture.js';

const palettes = {
    glacier: { sky: 0xc7e6f4, far: 0x91b8d3, near: 0x6f9fb8, floor: 0x729dad, edge: 0xeafcff },
    iceCave: { sky: 0x264f72, far: 0x3b7294, near: 0x669fb7, floor: 0x477a96, edge: 0xc9f6ff },
    aurora: { sky: 0x152e4b, far: 0x355f82, near: 0x557e9b, floor: 0x3b637e, edge: 0xc2eaf5 }
};

export function createIceScenery(scene, width, theme) {
    const p = palettes[theme];
    if (!p) return false;
    scene.cameras.main.setBackgroundColor(p.sky);
    scene.add.circle(660, 140, 43, 0xebf6ed).setScrollFactor(0.08, 1).setDepth(-90);
    const layer = (key, y, height, scroll, depth) => scene.add.tileSprite(0, y, width + 1024, height, key)
        .setOrigin(0).setScrollFactor(scroll, 1).setDepth(depth);
    cacheTexture(scene, `${theme}-sky`, 1024, 256, g => {
        if (theme === 'aurora') {
            for (let i = 0; i < 5; i++) {
                g.fillStyle(i % 2 ? 0xa3a4e8 : 0x8bdcc6, 0.12);
                g.fillEllipse(500 + i * 35, 95 + i * 15, 1100, 60);
            }
            g.fillStyle(0xe9f7f4, 0.8);
            for (let i = 0; i < 36; i++) g.fillCircle(i * 149 % 1024, 28 + i * 61 % 190, 1.5);
        } else {
            g.fillStyle(0xf3fcff, 0.25);
            for (const x of [120, 520, 900]) g.fillEllipse(x, 120, 200, 36);
        }
    });
    layer(`${theme}-sky`, 0, 256, 0.14, -85);
    cacheTexture(scene, `${theme}-mountains`, 1024, 512, g => {
        for (let x = -140; x < 1100; x += 300) {
            g.fillStyle(p.far); g.fillTriangle(x, 512, x + 170, 135, x + 370, 512);
            g.fillStyle(0xe8f6fb); g.fillTriangle(x + 128, 228, x + 170, 135, x + 220, 229);
        }
        if (theme === 'iceCave') {
            g.fillStyle(p.near);
            for (let x = 0; x < 1024; x += 128) g.fillTriangle(x, 0, x + 55, 170 + x % 90, x + 105, 0);
        }
    });
    layer(`${theme}-mountains`, 8, 512, 0.3, -65);
    cacheTexture(scene, `${theme}-crystals`, 512, 256, g => {
        g.fillStyle(p.near);
        for (const x of [70, 340]) {
            g.fillTriangle(x - 45, 256, x, theme === 'iceCave' ? 80 : 100, x + 55, 256);
            g.fillStyle(p.edge, 0.55); g.fillTriangle(x, 120, x + 8, 230, x + 32, 245);
            g.fillStyle(p.near);
        }
        g.fillStyle(p.edge, 0.65); g.fillEllipse(190, 245, 150, 14);
    });
    layer(`${theme}-crystals`, 264, 256, 0.72, -25);
    cacheTexture(scene, `${theme}-ice-floor`, 256, 128, g => {
        g.fillStyle(p.floor); g.fillRect(0, 0, 256, 128);
        g.fillStyle(p.edge); g.fillRect(0, 0, 256, 8);
        g.lineStyle(2, 0xd7f5ff, 0.55);
        for (let x = 10; x < 256; x += 64) { g.lineBetween(x, 22, x + 34, 45); g.lineBetween(x + 34, 45, x + 15, 72); }
    });
    layer(`${theme}-ice-floor`, 520, 80, 1, -4);
    createSnowfall(scene);
    return true;
}

function createSnowfall(scene) {
    cacheTexture(scene, 'snowflake', 16, 16, g => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 3); });
    const config = {
        x: { min: -20, max: scene.scale.width + 20 }, y: -12,
        speedX: { min: -18, max: 14 }, speedY: { min: 55, max: 100 },
        lifespan: 11000, scale: { start: 0.65, end: 0.35 }, alpha: { start: 0.8, end: 0.25 },
        frequency: 140, maxAliveParticles: 65, advance: 4000
    };
    const snow = scene.add.particles(0, 0, 'snowflake', config).setScrollFactor(0).setDepth(18);
    config.advance = 0; // Ekran döndürülünce başlangıç simülasyonunu yeniden çalıştırma.
    const resize = () => { config.x.max = scene.scale.width + 20; snow.setConfig(config); };
    const cleanup = () => {
        scene.scale.off('resize', resize);
        scene.events.off('shutdown', cleanup);
        scene.events.off('destroy', cleanup);
    };
    scene.scale.on('resize', resize);
    scene.events.once('shutdown', cleanup);
    scene.events.once('destroy', cleanup);
}
