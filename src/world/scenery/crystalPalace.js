// Kristal sarayın renkli cam kemerlerini, parlayan sütunlarını ve yansımalarını önbelleğe alır.
import { cacheTexture } from '../../graphics/texture.js';
import { createSnowfall } from './iceScenery.js';

export function createCrystalPalace(scene, width) {
    scene.cameras.main.setBackgroundColor(0x302855);
    const layer = (key, y, height, scroll, depth) => scene.add.tileSprite(0, y, width + 1024, height, key)
        .setOrigin(0).setScrollFactor(scroll, 1).setDepth(depth);
    cacheTexture(scene, 'palace-vaults', 1024, 520, g => {
        g.fillStyle(0x6352a0); g.fillRect(0, 0, 1024, 520);
        for (let x = 20; x < 1024; x += 256) {
            g.fillStyle(0x9ceae8); g.fillEllipse(x + 108, 160, 174, 245); g.fillRect(x + 21, 160, 174, 320);
            g.fillStyle(0x8062b7); g.fillRect(x + 104, 42, 8, 438); g.fillRect(x + 21, 210, 174, 8);
            g.fillStyle(0xe8b5f6, 0.65); g.fillTriangle(x + 27, 160, x + 99, 61, x + 99, 204);
            g.fillStyle(0xdbffff, 0.7); g.fillTriangle(x + 116, 221, x + 187, 221, x + 187, 397);
            g.fillStyle(0xd9c7ff); g.fillRect(x, 70, 13, 450);
        }
    });
    layer('palace-vaults', 0, 520, 0.2, -85);
    cacheTexture(scene, 'palace-light', 1024, 512, g => {
        for (const x of [160, 600]) {
            g.fillStyle(0xc2fbff, 0.08); g.fillTriangle(x, 0, x - 150, 512, x + 270, 512);
        }
        g.fillStyle(0xffe3ff, 0.8);
        for (let i = 0; i < 32; i++) g.fillCircle(i * 149 % 1024, 40 + i * 67 % 390, 2);
    });
    const light = layer('palace-light', 0, 512, 0.35, -70);
    scene.tweens.add({ targets: light, alpha: 0.45, duration: 2300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    cacheTexture(scene, 'palace-pillars', 768, 520, g => {
        for (const x of [40, 510]) {
            g.fillStyle(0x6676b6); g.fillRect(x, 40, 34, 480);
            g.fillStyle(0xb2f2f6); g.fillRect(x + 4, 40, 7, 480);
            g.fillStyle(0xbaa3e6); g.fillRect(x - 12, 40, 58, 17); g.fillRect(x - 12, 496, 58, 24);
            g.fillStyle(0xd2ffff); g.fillTriangle(x - 15, 34, x + 17, 4, x + 48, 34);
        }
    });
    layer('palace-pillars', 0, 520, 0.65, -30);
    cacheTexture(scene, 'palace-floor', 512, 80, g => {
        g.fillStyle(0x4c567f); g.fillRect(0, 0, 512, 80);
        g.fillStyle(0xc8eeff); g.fillRect(0, 0, 512, 7);
        for (let x = 0; x < 512; x += 64) {
            g.fillStyle(x % 128 ? 0x718ec1 : 0x9277ba); g.fillRect(x + 2, 12, 60, 42);
            g.lineStyle(1, 0xd9eaff, 0.35); g.lineBetween(x + 9, 48, x + 51, 18);
        }
    });
    layer('palace-floor', 520, 80, 1, -4);
    createSnowfall(scene);
}
