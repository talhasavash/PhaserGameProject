// Dünya bölüm listelerini birleştirir; dünya başlangıçlarını ve bölüm numaralarını tanımlar.
import { worldOneLevels } from './world1.js';
import { worldTwoLevels } from './world2.js';
import { worldThreeLevels } from './world3.js';

// Kayıtlar aynı sıralamayı kullanır: eski 0–10 indisleri değişmez.
export const levels = [...worldOneLevels, ...worldTwoLevels, ...worldThreeLevels];

export const worlds = [
    { id: 1, title: 'Bahçeler ve Geçitler', start: 0, count: worldOneLevels.length },
    { id: 2, title: 'Gölge Diyarları', start: worldOneLevels.length, count: worldTwoLevels.length },
    { id: 3, title: 'Yeni Dünya', start: worldOneLevels.length + worldTwoLevels.length, count: worldThreeLevels.length },
];

export function worldForLevel(index) {
    return worlds.find(world => index >= world.start && index < world.start + world.count);
}

export function chapterNumber(index) {
    return index + 1;
}
