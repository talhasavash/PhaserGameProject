// Ortak bölüm koordinatlarını Matter dünyasına çevirir; eski Arcade tanımlarını değiştirmez.
import type {LevelDefinition} from '../../world/model/contracts.js';
import type {MatterWorldDefinition, MatterSurface} from './definitions.js';
import {validateMatterEnemy} from './MatterEnemies.js';

// Arcade'a bağlı özellikler sessizce yok sayılmaz; Matter desteği eklendiğinde bu sınır genişletilir.
export function validateMatterLevel(level: LevelDefinition) {
    const fail = (message: string) => { throw new Error(`${level.name}: ${message}`); };
    const unsupported = ['extraHazards', 'ice', 'belts', 'columns', 'fireRain', 'passages', 'scenarios']
        .filter(name => level[name]?.length);
    if (unsupported.length || level.belt.speed || level.ball || level.boss || level.frozenItems || level.platforms.some(p => p.ice)) {
        fail(`Matter sahnesinde henüz desteklenmeyen Arcade özelliği: ${unsupported.join(', ') || 'özel zemin / tehlike'}`);
    }
    const ids = new Set<string>();
    for (const object of level.props ?? []) {
        if (!object.id || ids.has(object.id)) fail('Matter nesne id değerleri benzersiz olmalı.');
        ids.add(object.id);
        if (![object.x, object.y, object.angle ?? 0].every(Number.isFinite)) fail('Matter nesne konumu geçersiz.');
        const sizes = 'radius' in object ? [object.radius] : [object.width, object.height];
        if (sizes.some(size => !Number.isFinite(size) || size <= 0) ||
            (object.density !== undefined && (!Number.isFinite(object.density) || object.density <= 0))) fail('Matter nesne boyutu / yoğunluğu geçersiz.');
    }
    for (const link of level.links ?? []) {
        if (!ids.has(link.objectId)) fail(`Bağlantının nesnesi bulunamadı: ${link.objectId}`);
        if (![link.anchor.x, link.anchor.y, link.localPoint.x, link.localPoint.y, link.length ?? 0].every(Number.isFinite) ||
            (link.length ?? 0) < 0) fail('Matter bağlantı konumu / uzunluğu geçersiz.');
    }
    for (const enemy of level.enemies) validateMatterEnemy(enemy);
    for (const mechanism of level.mechanisms ?? []) {
        if (mechanism.type !== 'pressure-bridge' || !ids.has(mechanism.cargoId) || !ids.has(mechanism.plankId)) fail('Köprü mekanizmasının nesnesi bulunamadı.');
        if (![mechanism.plate.x, mechanism.plate.y, mechanism.plate.width].every(Number.isFinite) || mechanism.plate.width <= 0 ||
            !Number.isFinite(mechanism.holdMs ?? 450) || (mechanism.holdMs ?? 450) <= 0) fail('Baskı plakası geçersiz.');
    }
}

export function matterWorldForLevel(level: LevelDefinition): MatterWorldDefinition {
    const surfaces: MatterSurface[] = [];
    let start = 0;
    for (const gap of [...level.gaps].sort((a, b) => a.x - b.x).concat({x: level.width, width: 0})) {
        const end = Math.min(level.width, Math.max(start, gap.x));
        if (end > start) surfaces.push({x: (start + end) / 2, y: level.groundY + 100, width: end - start, height: 200});
        start = Math.max(start, gap.x + gap.width);
    }
    for (const platform of level.platforms) surfaces.push({x: platform.x + platform.width / 2,
        y: platform.y + 14, width: platform.width, height: 28});
    surfaces.push(...(level.matterSurfaces ?? []),
        {x: -20, y: 300, width: 40, height: 1200, hidden: true},
        {x: level.width + 20, y: 300, width: 40, height: 1200, hidden: true});
    return {width: level.width, groundY: level.groundY, spawn: level.spawn,
        surfaces, objects: level.props ?? [], hinges: [], links: level.links ?? [], mechanisms: level.mechanisms ?? []};
}
