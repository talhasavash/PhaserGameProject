// Toplanacak nesneleri, anahtarı, çıkışı, kontrol noktasını ve can kazanma alanlarını oluşturur.
import { createMosque, createFountain } from './scenery/background.js';
import { createWorldGate } from './scenery/world2Scenery.js';

const COLLECTIBLE_SCALE = 0.75;

// Görseller ve temas bölgeleri burada kurulur; oyun kuralları GameScene'de kalır.
// Anahtar, üç yıldız toplanıncaya kadar gizli kalır.
export function createCollectibles(scene) {
    scene.fruits = scene.physics.add.staticGroup();
    for (const fruit of scene.level.fruits) {
        const sprite = scene.fruits.create(fruit.x, fruit.y, fruit.type).setDepth(10);
        sprite.setScale(COLLECTIBLE_SCALE).refreshBody();
        sprite.setData('item', fruit);
        // Görsel hafifçe süzülür; toplama kutusu yerinde kalır.
        scene.tweens.add({ targets: sprite, y: fruit.y - 5, duration: 950, yoyo: true, repeat: -1, delay: fruit.x % 400, ease: 'Sine.easeInOut' });
    }
    scene.keySprite = scene.physics.add.staticImage(scene.level.key.x, scene.level.key.y, 'key').setDepth(10);
    scene.keySprite.setScale(COLLECTIBLE_SCALE).refreshBody();
    scene.keySprite.disableBody(true, true);
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
        : createMosque(scene, exit.x, scene.level.theme);
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
