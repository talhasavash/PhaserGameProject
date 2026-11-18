// Yeni dünya bu listeye eklenir; menü, bölüm numaraları, kıyafet ve kilit sınırları buradan oluşur.
import { defineWorld } from '../model/definitions.js';
import { worldOneLevels } from './world1.js';
import { worldTwoLevels } from './world2.js';
import { worldThreeLevels } from './world3.js';

/** @type {import('../model/contracts.js').WorldInput[]} */
export const worldDefinitions = [
    { id: 1, title: 'Meyve Rüyası', levels: worldOneLevels,
        menu: { image: 'assets/images/scene/menu-world1.svg', color: '#a6dcf0' } },
    { id: 2, title: 'Gece Karanlığı', levels: worldTwoLevels, starGuardsPause: true,
        menu: { image: 'assets/images/scene/menu-world2.svg', color: '#18294c' } },
    { id: 3, title: 'Buz Dağları', levels: worldThreeLevels, starGuardsPause: true,
        characterSkins: { boy: 'ice_boy', girl: 'ice_girl' },
        menu: { image: 'assets/images/scene/menu-world3.svg', color: '#cbe8f6',
            headingColor: '#2a6281', headingStroke: '2px #f4fdff', headingShadow: '0 3px 0 #2e678633' } },
    { id: 4, title: 'Ateş ve Çukur', menu: { image: 'assets/images/scene/menu-world4.svg', color: '#49657c' } },
    { id: 5, title: "Kabe'nin Yolları", menu: { image: 'assets/images/scene/menu-world5.svg', color: '#18294c' } }
].map(definition => defineWorld(definition));
