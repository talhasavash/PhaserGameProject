// Dünya bölüm listelerini birleştirir; dünya başlangıçlarını ve bölüm numaralarını tanımlar.
import { worldZeroLevels } from './world0.js';
import { worldOneLevels } from './world1.js';
import { worldTwoLevels } from './world2.js';

// Kayıtlar aynı sıralamayı kullanır: eski 0–10 indisleri değişmez.
export const levels = [...worldZeroLevels, ...worldOneLevels, ...worldTwoLevels];

export const worlds = [
    { id: 0, title: 'Bahçeler ve Geçitler', start: 0, count: worldZeroLevels.length },
    { id: 1, title: 'Gölge Diyarları', start: worldZeroLevels.length, count: worldOneLevels.length },
    { id: 2, title: 'Yeni DÜnya', start: worldZeroLevels.length + worldOneLevels.length, count: worldTwoLevels.length },
];

export function worldForLevel(index) {
    return worlds.find(world => index >= world.start && index < world.start + world.count);
}

export function chapterNumber(index) {
    return index - worldForLevel(index).start + 1;
}
