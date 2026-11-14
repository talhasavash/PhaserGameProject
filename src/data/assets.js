import { FRUIT_TYPES } from '../gameplay/rules.js';

// Aynı boyutta yüklenen SVG'ler birlikte listelenir. Boyutlar fizik kutusu değildir.
const IMAGE_GROUPS = [
    { width: 40, height: 44, keys: [...FRUIT_TYPES, 'bead'] },
    { width: 44, height: 44, keys: ['star'] },
    { width: 32, height: 36, keys: ['berry'] },
    { width: 76, height: 52, keys: ['hedgehog', 'snail', 'bee', 'fox', 'penguin', 'frog', 'turtle', 'bat', 'bird', 'spider', 'salamander', 'robot', 'scarab'] },
    { width: 52, height: 52, keys: ['ball', 'wheel'] },
    { width: 96, height: 100, keys: ['ogre', 'ogre-moss', 'ogre-stone', 'ogre-ember', 'ogre-ember-angry'] },
    { width: 96, height: 76, keys: ['allah-plaque'] },
    { width: 64, height: 40, keys: ['key'] },
    { width: 36, height: 52, keys: ['mat'] },
    { width: 40, height: 52, keys: ['lantern'] },
    { width: 44, height: 46, keys: ['crescent'] }
];
const SOUND_KEYS = ['jump', 'collect', 'hurt', 'heal', 'key', 'boss-jump', 'boss-land'];

// Phaser Loader yüklemeyi yönetir; GameScene.preload yalnızca bu fonksiyonu çağırır.
export function loadGameAssets(scene, character) {
    const base = character === 'girl' ? 'girl' : 'child';
    for (const expression of ['normal', 'sad', 'happy']) {
        const prefix = expression === 'normal' ? `${base}-` : `${base}-${expression}-`;
        for (let frame = 0; frame < 6; frame++) {
            const key = `${prefix}${frame}`;
            scene.load.svg(key, `assets/images/${key}.svg`, { width: 64, height: 80 });
        }
    }
    for (const { width, height, keys } of IMAGE_GROUPS) {
        for (const key of keys) scene.load.svg(key, `assets/images/${key}.svg`, { width, height });
    }
    for (const key of SOUND_KEYS) scene.load.audio(key, `assets/audio/${key}.wav`);
}
