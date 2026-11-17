// Oyunun görsel ve ses dosyalarını listeler; bunları Phaser Loader ile yükler.
import { FRUIT_TYPES } from '../gameplay/rules.js';

// Aynı boyutta yüklenen SVG'ler birlikte listelenir. Boyutlar fizik kutusu değildir.
const IMAGE_GROUPS = [
    { folder: 'collect', width: 40, height: 44, keys: [...FRUIT_TYPES, 'bead'] },
    { folder: 'collect', width: 44, height: 44, keys: ['star'] },
    { folder: 'collect', width: 32, height: 36, keys: ['berry'] },
    { folder: 'enemy', width: 76, height: 52, keys: ['hedgehog', 'snail', 'bee', 'fox', 'penguin', 'frog', 'turtle', 'bat', 'bird', 'spider', 'salamander', 'robot', 'scarab', 'night-owl', 'shadow-fox', 'moon-scorpion', 'moon-moth', 'cave-crab', 'dusk-wolf', 'snow-fox', 'ice-crab', 'frost-bat'] },
    { folder: 'enemy', width: 52, height: 52, keys: ['ball', 'wheel'] },
    { folder: 'enemy', width: 96, height: 100, keys: ['ogre', 'ogre-moss', 'ogre-stone', 'ogre-ember', 'ogre-ember-angry', 'ogre-flame'] },
    { folder: 'scene', width: 96, height: 76, keys: ['allah-plaque'] },
    { folder: 'collect', width: 64, height: 40, keys: ['key'] },
    { folder: 'collect', width: 36, height: 52, keys: ['mat'] },
    { folder: 'collect', width: 40, height: 52, keys: ['lantern'] },
    { folder: 'collect', width: 44, height: 46, keys: ['crescent'] }
];
const SOUND_KEYS = ['jump', 'collect', 'hurt', 'heal', 'key', 'boss-jump', 'boss-land', 'level-complete', 'boss-fire'];

// Phaser Loader yüklemeyi yönetir; GameScene.preload yalnızca bu fonksiyonu çağırır.
export function loadGameAssets(scene, character, level = scene.level) {
    const needed = level ? requiredImages(level) : null;

    let base = 'child';
    if (character === 'girl') base = 'girl';
    if (character === 'ice_girl') base = 'ice_girl';
    
    for (const expression of ['normal', 'sad', 'happy']) {
        const prefix = expression === 'normal' ? `${base}-` : `${base}-${expression}-`;
        for (let frame = 0; frame < 6; frame++) {
            const key = `${prefix}${frame}`;
            if (!scene.textures?.exists(key)) {
                scene.load.svg(key, `assets/images/hero/${key}.svg`, { width: 64, height: 80 });
            }
        }
    }
    for (const { folder, width, height, keys } of IMAGE_GROUPS) {
        for (const key of keys) {
            if ((!needed || needed.has(key)) && !scene.textures?.exists(key)) {
                scene.load.svg(key, `assets/images/${folder}/${key}.svg`, { width, height });
            }
        }
    }
    for (const key of SOUND_KEYS) {
        if (!scene.cache?.audio.exists(key)) scene.load.audio(key, `assets/audio/${key}.wav`);
    }
}

// Gizli anahtar ve sonradan değişen boss yüzü de yükleme listesinde bulunmalı.
function requiredImages(level) {
    const keys = new Set(['key', ...level.fruits.map(item => item.type)]);
    const enemies = [...level.enemies, ...(level.extraHazards || [])];
    if (level.ball) enemies.push(level.ball);
    for (const enemy of enemies) {
        keys.add(enemy.texture || enemy.type);
        if (enemy.rage) { keys.add('ogre-ember'); keys.add('ogre-ember-angry'); }
    }
    if (level.theme === 'interior') keys.add('allah-plaque');
    return keys;
}
