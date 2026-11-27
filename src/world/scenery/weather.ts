// Hava olaylarını arka plan çiziminden ayırır; yeni olay registerWeather ile bir kez kaydedilir.

import { cacheTexture } from '../../graphics/texture.js';
import type { WeatherType } from '../model/contracts.js';

export const weatherTypes = new Map();

export function registerWeather(name: string, definition: import('../model/contracts.js').WeatherType) {
    if (!name || weatherTypes.has(name) || typeof definition.create !== 'function') {
        throw new Error('Hava olayı benzersiz bir ad ve create fonksiyonu gerektirir.');
    }
    weatherTypes.set(name, definition);
}

export function createWeather(scene, selection) {
    if (!selection || selection.type === 'none') return;
    const definition = weatherTypes.get(selection.type);
    if (!definition) throw new Error(`Bilinmeyen hava olayı: ${selection.type}`);
    const { type, ...options } = selection;
    const instance = definition.create(scene, options);
    if (definition.destroy) {
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            scene.events.off('shutdown', cleanup);
            scene.events.off('destroy', cleanup);
            definition.destroy(scene, instance);
        };
        scene.events.once('shutdown', cleanup);
        scene.events.once('destroy', cleanup);
    }
    return instance;
}

function createSnow(scene, { intensity = 1, wind = 0 } = {}) {
    if (!Number.isFinite(intensity) || intensity <= 0 || intensity > 3 || !Number.isFinite(wind)) {
        throw new Error('Kar yoğunluğu 0–3 arasında pozitif, rüzgar bir sayı olmalı.');
    }
    cacheTexture(scene, 'snowflake', 16, 16, g => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 3); });
    const config = {
        x: { min: -20, max: scene.scale.width + 20 }, y: -12,
        speedX: { min: -18 + wind, max: 14 + wind }, speedY: { min: 55, max: 100 },
        lifespan: 11000, scale: { start: 0.65, end: 0.35 }, alpha: { start: 0.8, end: 0.25 },
        frequency: 140 / intensity, maxAliveParticles: Math.ceil(65 * intensity), advance: 4000
    };
    const snow = scene.add.particles(0, 0, 'snowflake', config).setScrollFactor(0).setDepth(18);
    config.advance = 0;
    const resize = () => { config.x.max = scene.scale.width + 20; snow.setConfig(config); };
    const cleanup = () => {
        scene.scale.off('resize', resize);
        scene.events.off('shutdown', cleanup);
        scene.events.off('destroy', cleanup);
    };
    scene.scale.on('resize', resize);
    scene.events.once('shutdown', cleanup);
    scene.events.once('destroy', cleanup);
    return snow;
}

function createEmbers(scene) {
    cacheTexture(scene, 'floating-ember', 12, 12, g => {
        g.fillStyle(0xff9c42, .3); g.fillCircle(6, 6, 5);
        g.fillStyle(0xffd580); g.fillCircle(6, 6, 2);
    });
    const config = {x: {min: 0, max: scene.scale.width}, y: scene.scale.height + 8,
        speedX: {min: -18, max: 10}, speedY: {min: -90, max: -45}, lifespan: 4300,
        scale: {start: .65, end: .2}, alpha: {start: .65, end: 0}, frequency: 180, maxAliveParticles: 28};
    const emitter = scene.add.particles(0, 0, 'floating-ember', config).setScrollFactor(0).setDepth(1);
    const resize = () => {config.x.max = scene.scale.width; config.y = scene.scale.height + 8; emitter.setConfig(config);};
    const cleanup = () => {
        scene.scale.off('resize', resize);
        scene.events.off('shutdown', cleanup); scene.events.off('destroy', cleanup);
    };
    scene.scale.on('resize', resize);
    scene.events.once('shutdown', cleanup); scene.events.once('destroy', cleanup);
    return emitter;
}

const builtInWeather = {snow: {create: createSnow}, embers: {create: createEmbers}} satisfies Record<string, WeatherType>;

export type BuiltInWeatherName = keyof typeof builtInWeather;
for (const [name, definition] of Object.entries(builtInWeather)) registerWeather(name, definition);
