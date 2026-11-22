// Builder: ortak varsayılanları uygular; yeni dünya ve bölüm tanımlarını aynı sözleşmede toplar.

import type { LevelInput, LevelDefinition, WorldInput } from './contracts.js';
import { levelTemplates } from './templates.js';

import { resolveWeapon } from '../../actors/enemies/WeaponCatalog.js';
import { behaviorSelection } from '../../actors/enemies/EnemyCatalog.js';
import { characterSkin } from '../../data/characters.js';
import { weatherTypes } from '../scenery/weather.js';
import { validateScenarios } from '../../game/LevelScenarios.js';
import { defineEnemy } from '../../actors/enemies/EnemyCatalog.js';
import { validateBackground } from '../scenery/BackgroundBuilder.js';

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

export function defineLevel(input: LevelInput, random = Math.random): LevelDefinition {
    if (levelInputs.has(input)) return input as LevelDefinition;
    let data = composeLevel(input);
    const visited = new Set();
    let name: string | undefined = input.template || 'standard';
    while (name) {
        if (visited.has(name)) throw new Error(`Döngüsel bölüm şablonu: ${name}`);
        const template = levelTemplates.get(name);
        if (!template) throw new Error(`Bilinmeyen bölüm şablonu: ${name}`);
        visited.add(name);
        data = withDefaults(data, typeof template.defaults === 'function' ? template.defaults(data) : template.defaults || {});
        if (template.prepare) data = template.prepare(withDefaults(data, { platforms: [], fruits: [], enemies: [], gaps: [] }), random);
        name = template.parent;
    }
    if (!data.name || typeof data.width !== 'number' || !Number.isFinite(data.width) || data.width <= 0) throw new Error('Bölüm adı ve pozitif genişlik gerekli.');
    const level = assignItemIds(placeOnPlatforms(withDefaults(data, {
        template: 'standard', theme: 'garden', groundY: 520, spawn: { x: 100, y: 480 },
        checkpoint: { x: data.width / 2, y: 480 }, key: { x: data.width - 420, y: 477 },
        exit: { x: data.width - 180, y: 468 }, belt: { x: 0, width: 1, speed: 0 },
        platforms: [], fruits: [], enemies: [], fountains: [], gaps: []
    })));
    if (!levelInputs.has(level)) levelInputs.set(level, levelInputs.get(input) || input);
    return level;
}

// Şablon sabit bir nesne veya bölümün genişliğinden ayar hesaplayan fonksiyon olabilir.

export function createLevelBuilder(defaults: Partial<LevelDefinition> | ((input: LevelInput) => Partial<LevelDefinition>) = {}, decorate: (input: LevelInput) => LevelInput = level => level): (input: LevelInput) => LevelDefinition {
    return input => defineLevel(decorate(withDefaults(input, typeof defaults === 'function' ? defaults(input) : defaults)));
}

export function defineWorld(input: WorldInput) {
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

export function stars(positions: import('./contracts.js').Point[]) {
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
    for (const enemy of [...level.enemies, ...(level.extraHazards || []), ...(level.ball ? [level.ball] : [])]) {
        defineEnemy(enemy.type, enemy);
        if (!Number.isFinite(enemy.x) || (enemy.y !== undefined && !Number.isFinite(enemy.y))) fail('Düşman koordinatları sayı olmalı.');
        if (enemy.platform !== undefined && !level.platforms[enemy.platform]) fail('Düşmanın platform indisi geçersiz.');
        resolveWeapon(enemy);
        for (const component of enemy.components || []) behaviorSelection(component);
    }
    if (level.characterSkin) characterSkin(level.characterSkin);
    const costume = level.player?.costume;
    for (const name of typeof costume === 'string' ? [costume] : Object.values(costume || {})) characterSkin(name);
    const weather = level.environment?.weather;
    if (level.environment?.scenery) validateBackground(level.environment.scenery);
    if (weather && weather.type !== 'none' && !weatherTypes.has(weather.type)) fail(`Bilinmeyen hava olayı: ${weather.type}`);
    validateScenarios(level);
    return level;
}


// Global sayaç kullanma: yeniden başlatılan veya tekrar kurulan bölüm aynı kimlikleri alır.
function assignItemIds(level) {
    const used = new Set(level.fruits.filter(item => item.id !== undefined).map(item => item.id));
    const counters = new Map<string, number>();
    let changed = false;
    const fruits = level.fruits.map(item => {
        if (item.id !== undefined) return item;
        let index = counters.get(item.type) ?? 0;
        let id: string;
        do { id = `${item.type}-${++index}`; } while (used.has(id));
        counters.set(item.type, index);
        used.add(id);
        changed = true;
        return { ...item, id };
    });
    return changed ? { ...level, fruits } : level;
}

// Bölümde açıkça seçilen arka plan ve platform stilini motorun kullandığı alanlara bağlar.
function composeLevel(input: LevelInput): LevelInput {
    const environment = input.environment;
    if (!environment) return input;
    return { ...input,
        ...(environment.background ? { theme: environment.background } : {}),
        ...(environment.platformStyle ? { platformTheme: environment.platformStyle } : {})
    };
}

// Standart bölümlerde de platform numarasıyla yıldız/düşman yerleştirilebilir.
function placeOnPlatforms(level) {
    let changed = false;
    const place = (item, enemy) => {
        const platform = level.platforms[item.platform];
        if (!platform || (item.x !== undefined && (enemy || item.y !== undefined))) return item;
        changed = true;
        const x = item.x ?? platform.x + platform.width / 2;
        return enemy ? { ...item, x, minX: item.minX ?? x - 35, maxX: item.maxX ?? x + 35 }
            : { ...item, x, y: item.y ?? platform.y - 35 };
    };
    const enemies = level.enemies.map(item => place(item, true));
    const fruits = level.fruits.map(item => place(item, false));
    return changed ? { ...level, enemies, fruits } : level;
}
