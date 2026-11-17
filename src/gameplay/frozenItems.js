// Donmuş nesneleri ilk temasta çözer; toplamak için temastan çıkıp yeniden girmeyi gerektirir.
import { cacheTexture } from '../graphics/texture.js';

export function freezeItem(scene, sprite) {
    if (!scene.level.frozenItems) return;
    cacheTexture(scene, 'item-ice', 60, 64, g => {
        g.fillStyle(0x8bd9ff, 0.5); g.fillRoundedRect(2, 2, 56, 60, 10);
        g.lineStyle(2, 0xe8fdff, 0.95); g.strokeRoundedRect(2, 2, 56, 60, 10);
        g.lineBetween(10, 19, 30, 7); g.lineBetween(32, 56, 50, 42);
        g.lineBetween(7, 40, 17, 33); g.lineBetween(45, 9, 53, 19);
    });
    const shell = scene.add.image(sprite.x, sprite.y, 'item-ice').setDepth(11)
        .setDisplaySize(sprite.displayWidth + 12, sprite.displayHeight + 12).setVisible(sprite.visible);
    sprite.setData('frozen', 'sealed');
    scene.frozenItems.push({ sprite, shell });
}

export function touchFrozenItem(scene, sprite) {
    const state = sprite.getData('frozen');
    if (!state || state === 'open') return false;
    if (state === 'sealed') {
        sprite.setData('frozen', 'thawing');
        const item = scene.frozenItems.find(item => item.sprite === sprite);
        scene.iceBreakSparks.emitParticleAt(sprite.x, sprite.y, 16);
        scene.sound.play('collect', { volume: 0.12 });
        scene.tweens.add({ targets: item.shell, alpha: 0,
            scaleX: item.shell.scaleX * 1.4, scaleY: item.shell.scaleY * 1.4,
            duration: 220, onComplete: () => { item.shell.destroy(); item.shell = null; } });
    }
    return true;
}

export function updateFrozenItems(scene) {
    if (!scene.frozenItems?.length) return;
    const player = scene.player.body;
    for (const item of scene.frozenItems) {
        const { sprite, shell } = item;
        if (shell) shell.setPosition(sprite.x, sprite.y).setVisible(sprite.visible);
        if (sprite.getData('frozen') !== 'thawing') continue;
        const body = sprite.body;
        const separated = player.right < body.left - 6 || player.left > body.right + 6 ||
            player.bottom < body.top - 6 || player.top > body.bottom + 6;
        if (separated) sprite.setData('frozen', 'open');
    }
}
