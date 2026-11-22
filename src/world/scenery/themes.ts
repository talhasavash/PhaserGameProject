// Strategy kayıt listesi: yeni tema, sahne ve basamak çizimini aynı ad altında bağlar.

import { createWorldOneScenery } from './world1Scenery.js';
import { createWorldTwoScenery } from './world2Scenery.js';
import { createWorldThreeScenery } from './world3Scenery.js';
import { createNightScenery } from './nightScenery.js';
import { createIceScenery } from './iceScenery.js';
import { createCrystalPalace } from './crystalPalace.js';
import { platformThemes, registerPlatformTheme } from '../terrain/platforms.js';

export const themeStrategies: Map<string, import('../model/contracts.js').ThemeStrategy> = new Map();

export function registerTheme(name: string, strategy: import('../model/contracts.js').ThemeStrategy) {
    if (!name || typeof strategy.scenery !== 'function') throw new Error('Tema bir ad ve scenery fonksiyonu gerektirir.');
    if (themeStrategies.has(name)) throw new Error(`Tema zaten kayıtlı: ${name}`);
    if (!strategy.platform && !platformThemes[name]) throw new Error(`${name}: platform paleti gerekli.`);
    if (strategy.platform) registerPlatformTheme(name, strategy.platform, strategy.drawPlatform);
    themeStrategies.set(name, strategy);
}

for (const name of Object.keys(platformThemes)) {
    const icy = ['snow', 'glacier', 'iceCave', 'aurora', 'crystalPalace'].includes(name);
    const scenery = name === 'crystalPalace' ? createCrystalPalace
        : ['glacier', 'iceCave', 'aurora'].includes(name) ? createIceScenery
        : ['moonwood', 'nightRuins', 'nightKeep'].includes(name) ? createNightScenery
        : ['lava', 'factory', 'castle', 'abyss'].includes(name) ? createWorldTwoScenery
        : name === 'journey' ? createWorldThreeScenery : createWorldOneScenery;
    registerTheme(name, { scenery, icy });
}

export function isIceTheme(name) { return themeStrategies.get(name)?.icy ?? false; }
