// Bölüm sonu Kâbe görsellerini önbelleğe çizer; anahtar alınınca altın kapıyı açar.
import {cacheTexture} from '../../graphics/texture.js';

export function kaabaDesign(variant: number) {
    return {width: 180 + variant % 4 * 12, height: 164 + Math.floor(variant / 4) * 9,
        side: 36 + variant % 3 * 6, left: variant % 2 === 0,
        gold: [0xe5c06c, 0xd4ad56, 0xf0d28a][variant % 3], band: 40 + variant % 3 * 5};
}

export function createKaaba(scene, x: number, style: Record<string, unknown> = {}) {
    const variant = Math.max(0, Math.floor(Number(style.variant) || 0));
    const p = kaabaDesign(variant), width = p.width + 40, height = p.height + 28;
    const frontX = p.left ? 20 + p.side : 20, frontW = p.width - p.side;
    const sideX = p.left ? 20 : frontX + frontW;
    const key = `kaaba-landmark-${variant}`;
    cacheTexture(scene, key, width, height, g => {
        g.fillStyle(0x242630); g.fillRect(frontX, 18, frontW, p.height);
        g.fillStyle(0x151921); g.fillRect(sideX, 28, p.side, p.height - 10);
        g.fillStyle(0x363640); g.fillTriangle(sideX, 28, frontX + (p.left ? 0 : frontW), 18, sideX + p.side, 28);
        g.fillStyle(p.gold); g.fillRect(frontX, p.band, frontW, 13);
        g.fillStyle(0xb18a45); g.fillRect(sideX, p.band + 8, p.side, 11);
        // Geometrik nakış: okunaksız veya uydurma kutsal metin çizilmez.
        for (let xx = frontX + 8; xx < frontX + frontW - 5; xx += 18) {
            g.fillStyle(0x5c4a30); g.fillRect(xx, p.band + 4, 9, 5);
            g.fillStyle(p.gold); g.fillEllipse(xx + 4, p.band + 38, 7, 12);
        }
        g.lineStyle(1, 0x53505a, .5);
        for (let xx = frontX + 10; xx < frontX + frontW; xx += 22) g.lineBetween(xx, p.band + 65, xx, p.height + 10);
        g.fillStyle(0xe6dfcf); g.fillRect(18, p.height + 14, p.width + 4, 8);
        g.fillStyle(p.gold); g.fillRect(frontX, 18, frontW, 3);
    });
    const add = scene.add, doorX = x;
    const buildingX = x + width / 2 - frontX - frontW * .72;
    add.ellipse(buildingX, 518, width + 55, 14, 0xede9dd).setDepth(3);
    add.image(buildingX, 520 - height, key).setOrigin(.5, 0).setDepth(5);
    add.rectangle(doorX, 482, 30, 56, p.gold).setDepth(6);
    add.rectangle(doorX, 482, 24, 50, 0x252d36).setDepth(7);
    const glow = add.ellipse(doorX, 484, 24, 46, 0xffe5a1, .65).setDepth(8).setVisible(false);
    const door = add.rectangle(doorX, 482, 24, 50, p.gold).setDepth(9).setStrokeStyle(2, 0xaf843d);
    add.rectangle(doorX, 464, 14, 8, 0xf6dfa7).setDepth(10);
    let opened = false;
    return {open() {
        if (opened) return;
        opened = true;
        glow.setVisible(true);
        scene.tweens.add({targets: door, x: doorX - 11, scaleX: .15, duration: 500, ease: 'Sine.easeOut'});
    }};
}
