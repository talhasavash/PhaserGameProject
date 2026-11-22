// Donmuş nesneleri ilk temasta çözer; toplamak için temastan çıkıp yeniden girmeyi gerektirir.

import { cacheTexture } from '../../graphics/texture.js';
import { createMosque, createFountain } from '../scenery/background.js';
import { createWorldGate } from '../scenery/world2Scenery.js';

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

// Toplanacak nesneleri, anahtarı, çıkışı, kontrol noktasını ve can kazanma alanlarını oluşturur.

const COLLECTIBLE_SCALE = 0.75;

// Görseller ve temas bölgeleri burada kurulur; oyun kuralları GameScene'de kalır.
// Anahtar, üç yıldız toplanıncaya kadar gizli kalır.
export function createCollectibles(scene) {
    scene.frozenItems = [];
    scene.fruits = scene.physics.add.staticGroup();
    for (const fruit of scene.level.fruits) {
        const sprite = scene.fruits.create(fruit.x, fruit.y, fruit.type).setDepth(10);
        sprite.setScale(COLLECTIBLE_SCALE).refreshBody();
        sprite.setData('item', fruit);
        freezeItem(scene, sprite);
        // Görsel hafifçe süzülür; toplama kutusu yerinde kalır.
        scene.tweens.add({ targets: sprite, y: fruit.y - 5, duration: 950, yoyo: true, repeat: -1, delay: fruit.x % 400, ease: 'Sine.easeInOut' });
    }
    scene.keySprite = scene.physics.add.staticImage(scene.level.key.x, scene.level.key.y, 'key').setDepth(10);
    scene.keySprite.setScale(COLLECTIBLE_SCALE).refreshBody();
    scene.keySprite.disableBody(true, true);
    freezeItem(scene, scene.keySprite);
    scene.add.ellipse(scene.level.key.x, 514, 100, 12, 0x528b56).setDepth(2);
    scene.add.rectangle(scene.level.key.x, 506, 64, 18, 0xc8b78c).setDepth(3);
}

export function createLandmarks(scene) {
    const { x } = scene.level.checkpoint;
    scene.add.rectangle(x, 476, 6, 88, 0x6b6e52).setDepth(6);
    scene.checkpointFlag = scene.add.triangle(x + 4, 433, 0, 0, 48, 12, 0, 27, 0xe3c37d).setOrigin(0, 0).setDepth(7);
    const exit = scene.level.exit;
    scene.door = scene.level.exitType === 'gate'
        ? createWorldGate(scene, exit.x, scene.level.theme)
        : createMosque(scene, exit.x, scene.level.theme, scene.level.mosqueStyle);
    scene.exitZone = scene.add.zone(exit.x, 480, 68, 80);
    scene.physics.add.existing(scene.exitZone, true);
}

export function createHealingSpots(scene) {
    scene.fountains = scene.physics.add.staticGroup();
    for (const fountain of scene.level.fountains) {
        const water = createFountain(scene, fountain.x);
        const zone = scene.add.zone(fountain.x, 480, 85, 80);
        zone.setData('id', fountain.id);
        zone.setData('water', water);
        scene.fountains.add(zone);
    }
}
