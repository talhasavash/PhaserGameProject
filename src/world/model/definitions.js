// Builder: ortak varsayılanları uygular; yeni dünya ve bölüm tanımlarını aynı sözleşmede toplar.
import { levelTemplates } from './templates.js';
/** @typedef {import('./contracts.js').LevelInput} LevelInput */
/** @typedef {import('./contracts.js').LevelDefinition} LevelDefinition */
/** @typedef {import('./contracts.js').WorldInput} WorldInput */
const levelInputs = new WeakMap();

// Diziler eklenmez, değiştirilir. Nesnelerde sadece eksik alanlar tamamlanır; girişler değiştirilmez.
export function withDefaults(input, defaults) {
    let result = input;
    for (const [key, fallback] of Object.entries(defaults)) {
        const current = input[key];
        const value = current === undefined ? structuredClone(fallback)
            : current && fallback && Object.getPrototypeOf(current) === Object.prototype && Object.getPrototypeOf(fallback) === Object.prototype
                ? withDefaults(current, fallback) : current;
        if (value !== current) {
            if (result === input) result = { ...input };
            result[key] = value;
        }
    }
    return result;
}

/** @param {LevelInput} input @returns {LevelDefinition} */
export function defineLevel(input, random = Math.random) {
    if (levelInputs.has(input)) return input;
    let data = input;
    const visited = new Set();
    let name = input.template || 'standard';
    while (name) {
        if (visited.has(name)) throw new Error(`Döngüsel bölüm şablonu: ${name}`);
        const template = levelTemplates.get(name);
        if (!template) throw new Error(`Bilinmeyen bölüm şablonu: ${name}`);
        visited.add(name);
        data = withDefaults(data, typeof template.defaults === 'function' ? template.defaults(data) : template.defaults || {});
        if (template.prepare) data = template.prepare(withDefaults(data, { platforms: [], fruits: [], enemies: [], gaps: [] }), random);
        name = template.parent;
    }
    if (!data.name || !Number.isFinite(data.width) || data.width <= 0) throw new Error('Bölüm adı ve pozitif genişlik gerekli.');
    const level = withDefaults(data, {
        template: 'standard', theme: 'garden', groundY: 520, spawn: { x: 100, y: 480 },
        checkpoint: { x: data.width / 2, y: 480 }, key: { x: data.width - 420, y: 477 },
        exit: { x: data.width - 180, y: 468 }, belt: { x: 0, width: 1, speed: 0 },
        platforms: [], fruits: [], enemies: [], fountains: [], gaps: []
    });
    if (!levelInputs.has(level)) levelInputs.set(level, levelInputs.get(input) || input);
    return level;
}

// Şablon sabit bir nesne veya bölümün genişliğinden ayar hesaplayan fonksiyon olabilir.
/**
 * @param {Partial<LevelDefinition> | ((input: LevelInput) => Partial<LevelDefinition>)} defaults
 * @param {(input: LevelInput) => LevelInput} decorate
 * @returns {(input: LevelInput) => LevelDefinition}
 */
export function createLevelBuilder(defaults = {}, decorate = level => level) {
    return input => defineLevel(decorate(withDefaults(input, typeof defaults === 'function' ? defaults(input) : defaults)));
}

/** @param {WorldInput} input */
export function defineWorld(input) {
    const { count = 15, levels = [], defaults = {}, ...metadata } = input;
    if (!Number.isInteger(input.id) || input.id < 1 || !input.title) throw new Error('Dünya için pozitif id ve ad gerekli.');
    if (!Number.isInteger(count) || count < 1 || levels.length > count) throw new Error(`${input.title}: bölüm sayısı ayrılan yeri aşıyor.`);
    const build = createLevelBuilder(defaults);
    return { ...metadata, count, defaults, levels: levels.map(level =>
        build(Object.keys(defaults).length ? levelInputs.get(level) || level : level)) };
}

/** Hazır basamak örüntüsü: koordinatları tek tek tekrar yazmadan merdiven kurar. */
export function stairs({ x, y, count, width = 120, stepX = 170, stepY = -80, ...options }) {
    return Array.from({ length: count }, (_, index) => ({ ...options, x: x + index * stepX, y: y + index * stepY, width }));
}

/** @param {import('./contracts.js').Point[]} positions */
export function stars(positions) {
    return positions.map((point, index) => ({ ...point, id: `star-${index + 1}`, type: 'star' }));
}

/** Bölümün temel sözleşmesini oyun başlamadan doğrular. */
export function validateLevel(level) {
    const fail = message => { throw new Error(`${level.name}: ${message}`); };
    if (!Number.isFinite(level.groundY) || level.groundY <= 0) fail('Zemin yüksekliği geçersiz.');
    for (const name of ['spawn', 'checkpoint', 'key', 'exit']) {
        const point = level[name];
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > level.width) fail(`${name} konumu geçersiz.`);
    }
    for (const name of ['platforms', 'fruits', 'enemies', 'fountains', 'gaps']) {
        if (!Array.isArray(level[name])) fail(`${name} bir dizi olmalı.`);
    }
    if (level.fruits.filter(item => item.type === 'star').length !== 3) fail('Üç yıldız gerekli.');
    if (new Set(level.fruits.map(item => item.id)).size !== level.fruits.length) fail('Nesne id değerleri benzersiz olmalı.');
    for (const item of [...level.platforms, ...level.fruits]) {
        if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) fail('Nesne koordinatları sayı olmalı.');
    }
    for (const strip of [...level.platforms, ...level.gaps, ...(level.ice || []), ...(level.columns || [])]) {
        if (!Number.isFinite(strip.x) || !Number.isFinite(strip.width) || strip.width <= 0) fail('Yüzeyin konumu ve genişliği geçersiz.');
    }
    for (const enemy of level.enemies) {
        if (!Number.isFinite(enemy.x) || (enemy.y !== undefined && !Number.isFinite(enemy.y))) fail('Düşman koordinatları sayı olmalı.');
        if (enemy.platform !== undefined && !level.platforms[enemy.platform]) fail('Düşmanın platform indisi geçersiz.');
    }
    return level;
}
