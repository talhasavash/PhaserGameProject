// Dünya bölüm listelerini birleştirir; dünya başlangıçlarını ve bölüm numaralarını tanımlar.
import { worldOneLevels } from './world1.js';
import { worldTwoLevels } from './world2.js';
import { worldThreeLevels } from './world3.js';
import { nightLevels } from './nightLevels.js';
import { lateNightLevels } from './nightCampaign.js';
import { iceLevels } from './iceLevels.js';

// Kayıtlar aynı sıralamayı kullanır: eski 0–10 indisleri değişmez.
export const levels = [...worldOneLevels, ...worldTwoLevels, ...worldThreeLevels, ...nightLevels, ...lateNightLevels, ...iceLevels];

// Menüdeki yerler sabittir; levels yalnızca gerçekten oynanabilen bölümleri içerir.
export const LEVELS_PER_WORLD = 15;
export const worlds = ['Meyve Rüyası', 'Gece Karanlığı', 'Buz Dağları', 'Ateş ve Çukur', "Kabe'nin Yolları"]
    .map((title, index) => ({ id: index + 1, title, start: index * LEVELS_PER_WORLD, count: LEVELS_PER_WORLD }));
export const LEVEL_SLOT_COUNT = worlds.length * LEVELS_PER_WORLD;

export function worldForLevel(index) {
    return worlds.find(world => index >= world.start && index < world.start + world.count);
}

export function chapterNumber(index) {
    return index + 1;
}
