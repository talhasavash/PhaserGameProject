// Dünya kayıtlarından oynanabilir bölümleri, menü yuvalarını ve numaralandırmayı oluşturur.
import { worldDefinitions } from './worlds.js';
import { createWorldCatalog } from '../model/catalog.js';
import { themeStrategies } from '../scenery/themes.js';
import { enemyTypes } from '../../gameplay/enemyTypes.js';

const catalog = createWorldCatalog(worldDefinitions, {
    themeExists: name => themeStrategies.has(name), enemyExists: name => enemyTypes.has(name)
});
export const { levels, worlds, worldForLevel } = catalog;
export const LEVELS_PER_WORLD = 15;
export const LEVEL_SLOT_COUNT = catalog.slotCount;
export function chapterNumber(index) { return index + 1; }
