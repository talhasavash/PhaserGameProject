// Dünya bölüm listelerini birleştirir; dünya başlangıçlarını ve bölüm numaralarını tanımlar.
import { worldOneLevels } from './world1.js';
import { worldTwoLevels } from './world2.js';
import { worldThreeLevels } from './world3.js';

// Kayıtlar aynı sıralamayı kullanır: eski 0–10 indisleri değişmez.
export const levels = [...worldOneLevels, ...worldTwoLevels, ...worldThreeLevels];

// Dünya 2 ve 3: yıldızın yanındaki bekçiler birlikte kaybolur; toplamak için güvenli süre bırakır.
for (const level of levels.slice(15, 45)) {
    const stars = level.fruits.filter(item => item.type === 'star');
    for (const enemy of level.enemies) {
        const platform = level.platforms[enemy.platform];
        const y = enemy.y ?? (platform?.y ?? level.groundY) - 20;
        const guardsStar = stars.some(star =>
            Math.abs(star.y - y) <= 90 + (enemy.bob || 0) &&
            star.x >= Math.min(enemy.x, enemy.minX ?? enemy.x) - 45 &&
            star.x <= Math.max(enemy.x, enemy.maxX ?? enemy.x) + 45);
        if (guardsStar) enemy.visibility = { visibleMs: 2600, hiddenMs: 3000, fadeMs: 220, offset: 0 };
    }
}

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
