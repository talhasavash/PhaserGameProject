// Bölüme özel olayları kaydeder ve çalıştırır; her denemede ayrı durum oluşturup çıkışta temizler.

import { equipEnemyWeapon } from '../actors/enemies/WeaponController.js';
import { resolveWeapon, preloadWeaponAsset } from '../actors/enemies/WeaponCatalog.js';

export const scenarioTypes = new Map();
export const scenarioActions = new Map();

export function registerScenario(name: string, definition: import('../world/model/contracts.js').ScenarioType) {
    if (!name || scenarioTypes.has(name) || !['create', 'update', 'onEvent'].some(key => typeof definition[key] === 'function')) {
        throw new Error('Senaryo benzersiz bir ad ve create, update veya onEvent gerektirir.');
    }
    scenarioTypes.set(name, definition);
}

export function registerScenarioAction(name: string, action: import('../world/model/contracts.js').ScenarioAction) {
    if (!name || scenarioActions.has(name) || typeof action.run !== 'function') throw new Error('Senaryo eylemi benzersiz bir ad ve run gerektirir.');
    scenarioActions.set(name, action);
}

export function validateScenarios(level) {
    for (const selection of level.scenarios || []) {
        const definition = scenarioTypes.get(selection.type);
        if (!definition) throw new Error(`Bilinmeyen senaryo: ${selection.type}`);
        definition.validate?.(selection, level);
    }
}
export function createLevelScenarios(scene) {
    scene.levelScenarios = (scene.level.scenarios || []).map(config => {
        const definition = scenarioTypes.get(config.type);
        return { definition, config, state: definition.create?.(scene, config) };
    });
}
export function preloadScenarios(scene) {
    for (const config of scene.level.scenarios || []) scenarioTypes.get(config.type).preload?.(scene, config);
}
export function updateLevelScenarios(scene, delta) {
    for (const item of scene.levelScenarios || []) item.definition.update?.(scene, item.state, delta, item.config);
}
export function emitLevelEvent(scene, name: string, payload: unknown = undefined) {
    for (const item of scene.levelScenarios || []) item.definition.onEvent?.(scene, name, payload, item.state, item.config);
}
export function destroyLevelScenarios(scene) {
    const instances = scene.levelScenarios || [];
    scene.levelScenarios = [];
    for (const item of instances) item.definition.destroy?.(scene, item.state, item.config);
}

registerScenarioAction('weapon', {
    preload(scene, action) { preloadWeaponAsset(scene, action.weapon); },
    validate(action, level) {
        if (!level.enemies.some(enemy => enemy.id === action.enemyId)) throw new Error(`Senaryo düşmanı bulunamadı: ${action.enemyId}`);
        resolveWeapon({ weapon: action.weapon });
    },
    run(scene, action) {
        const enemy = scene.hazards.getChildren().find(item => item.getData('enemy-id') === action.enemyId);
        equipEnemyWeapon(scene, enemy, action.weapon);
    }
});
registerScenarioAction('emit', {
    validate(action) { if (!action.event || typeof action.event !== 'string') throw new Error('Olay adı gerekli.'); },
    run(scene, action) {
        scene.events.emit(action.event, action.data);
        emitLevelEvent(scene, action.event, action.data);
    }
});
registerScenario('zones', {
    preload(scene, config) {
        for (const zone of config.zones!) for (const action of zone.actions) scenarioActions.get(action.type).preload?.(scene, action);
    },
    validate(config, level) {
        if (!Array.isArray(config.zones)) throw new Error('Alan senaryosunda zones dizisi gerekli.');
        for (const zone of config.zones) {
            if (!Number.isFinite(zone.x) || !(zone.width > 0) || !Array.isArray(zone.actions)) throw new Error('Senaryo alanının x, width ve actions değerleri gerekli.');
            for (const action of zone.actions) {
                const definition = scenarioActions.get(action.type);
                if (!definition) throw new Error(`Bilinmeyen senaryo eylemi: ${action.type}`);
                definition.validate?.(action, level);
            }
        }
    },
    create(scene, config) { return config.zones!.map(() => ({ inside: false, fired: false })); },
    onEvent(scene, name, payload, states) {
        if (name === 'respawn') for (const state of states) {
            state.inside = false;
            state.fired = false;
        }
    },
    update(scene, states, delta, config) {
        config.zones!.forEach((zone, index) => {
            const state = states[index];
            const inside = scene.player.x >= zone.x && scene.player.x <= zone.x + zone.width;
            if (inside && !state.inside && (!state.fired || zone.once === false)) {
                state.fired = true;
                for (const action of zone.actions) scenarioActions.get(action.type).run(scene, action);
            }
            state.inside = inside;
        });
    }
});
