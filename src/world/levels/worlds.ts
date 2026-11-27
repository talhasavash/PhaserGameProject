// Yeni dünya bu listeye eklenir; menü, bölüm numaraları, kıyafet ve kilit sınırları buradan oluşur.

import { defineWorld } from '../model/definitions.js';
import { worldOneLevels } from './world1.js';
import { worldTwoLevels } from './world2.js';
import { worldThreeLevels } from './world3.js';
import {worldFourLevels} from './world4.js';
import {worldFiveLevels} from './world5.js';
import {worldSixLevels} from './world6.js';

export const worldDefinitions: import('../model/contracts.js').WorldInput[] = [
    { id: 1, title: 'Meyve Rüyası', levels: worldOneLevels,
        music: { src: 'assets/audio/music/world1.mpeg', volume: 0.12 },
        menu: { image: 'assets/images/scene/menu-world1.svg', color: '#a6dcf0' } },
    { id: 2, title: 'Gece Karanlığı', levels: worldTwoLevels, starGuardsPause: true,
        music: { src: 'assets/audio/music/world2.mpeg', volume: 0.12 },
        menu: { image: 'assets/images/scene/menu-world2.svg', color: '#18294c' } },
    { id: 3, title: 'Buz Dağları', levels: worldThreeLevels, starGuardsPause: true,
        music: { src: 'assets/audio/music/world3.mp3', volume: 0.12 },
        characterSkins: { boy: 'ice_boy', girl: 'ice_girl' },
        menu: { image: 'assets/images/scene/menu-world3.svg', color: '#cbe8f6',
            headingColor: '#2a6281', headingStroke: '2px #f4fdff', headingShadow: '0 3px 0 #2e678633' } },
    { id: 4, title: 'Ateş ve Çukur', levels: worldFourLevels, music: { src: 'assets/audio/music/world4.mpeg', volume: 0.12 },
        characterSkins: {boy: 'lava_boy', girl: 'lava_girl'},
        menu: { image: 'assets/images/scene/menu-world4.svg', color: '#49657c' } },
    { id: 5, title: "Kabe'nin Yolları", levels: worldFiveLevels, music: { src: 'assets/audio/music/world5.aac', volume: 0.12 },
        characterSkins: {boy: 'ihram_boy', girl: 'chador_girl'},
        menu: { image: 'assets/images/scene/menu-world5.svg', color: '#18294c' } },
    {id: 6, title: 'Denge Atölyesi', levels: worldSixLevels,
        characterSkins: {boy: 'workshop_boy', girl: 'workshop_girl'},
        music: {src: 'assets/audio/music/world6.mp3', volume: .12},
        menu: {image: 'assets/images/scene/menu-world6.svg', color: '#b9d7df'}}
].map(definition => defineWorld(definition));
