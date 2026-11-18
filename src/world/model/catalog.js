// Dünya kayıtlarından menü, sabit bölüm yuvaları ve dünya sınırlarını tek seferde oluşturur.
import { defineWorld, validateLevel } from './definitions.js';

export function createWorldCatalog(definitions, { themeExists = () => true, enemyExists = () => true } = {}) {
    const worlds = [];
    const levels = [];
    let start = 0;
    for (const definition of definitions) {
        const world = { ...defineWorld(definition), start };
        if (worlds.some(item => item.id === world.id)) throw new Error(`Tekrarlanan dünya id: ${world.id}`);
        world.levels.forEach((level, index) => {
            validateLevel(level);
            if (!themeExists(level.theme)) throw new Error(`Bilinmeyen tema: ${level.theme}`);
            for (const enemy of [...level.enemies, ...(level.extraHazards || []), ...(level.ball ? [level.ball] : [])]) {
                if (!enemyExists(enemy.type)) throw new Error(`Bilinmeyen düşman: ${enemy.type}`);
            }
            if (world.starGuardsPause) giveStarGuardsBreaks(level);
            levels[start + index] = level;
        });
        worlds.push(world);
        start += world.count;
    }
    return {
        worlds, levels, slotCount: start,
        worldForLevel: index => worlds.find(world => index >= world.start && index < world.start + world.count)
    };
}

// Bekçiler birlikte kaybolur; yıldız için güvenli pencereyi dünya politikası belirler.
function giveStarGuardsBreaks(level) {
    const stars = level.fruits.filter(item => item.type === 'star');
    for (const enemy of level.enemies) {
        const platform = level.platforms[enemy.platform];
        const y = enemy.y ?? (platform?.y ?? level.groundY) - 20;
        if (stars.some(star => Math.abs(star.y - y) <= 90 + (enemy.bob || 0) &&
            star.x >= Math.min(enemy.x, enemy.minX ?? enemy.x) - 45 &&
            star.x <= Math.max(enemy.x, enemy.maxX ?? enemy.x) + 45)) {
            enemy.visibility = { visibleMs: 2600, hiddenMs: 3000, fadeMs: 220, offset: 0 };
        }
    }
}
