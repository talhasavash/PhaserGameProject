// Bir bölümün nesnelerini kurar ve sistemlerini doğru sırada günceller; Phaser sahnesi akışa odaklanır.

import type { GameScene } from './GameScene.js';
import { createScenery } from '../world/scenery/background.js';
import { createTerrain } from '../world/terrain/terrain.js';
import { createCollectibles, createLandmarks, createHealingSpots, updateFrozenItems } from '../world/objects/LevelObjects.js';
import { createHazards, updateHazards, resetBossRage } from '../actors/enemies/EnemyController.js';
import { createEnemyWeapons, updateEnemyWeapons, resetEnemyWeapons,
    createGuardianFire, updateGuardianFire, resetGuardianFire } from '../actors/enemies/WeaponController.js';
import { createFireRain, updateFireRain, createColumns, updateColumns } from '../world/hazards/EnvironmentalHazards.js';
import { createLevelScenarios, updateLevelScenarios, destroyLevelScenarios } from './LevelScenarios.js';

/** Sahnenin yaşam döngüsüne katılan bir bölüm yöneticisinin sözleşmesi. */
export interface LevelLifecycle {
    build(): void;
    start(): void;
    update(delta: number): void;
    destroy(): void;
}

export class LevelRuntime implements LevelLifecycle {
    constructor(private readonly scene: GameScene) {}

    build(): void {
        const scene = this.scene;
        createScenery(scene, scene.level.width, scene.level.theme);
        createTerrain(scene);
        createCollectibles(scene);
        createHazards(scene);
        createEnemyWeapons(scene);
        createGuardianFire(scene);
        createFireRain(scene);
        createColumns(scene);
        createLandmarks(scene);
        createHealingSpots(scene);
    }

    // Oyuncu ve çarpışmalar hazır olduktan sonra bölüme özel senaryo başlar.
    start(): void { createLevelScenarios(this.scene); }

    update(delta: number): void {
        const scene = this.scene;
        updateFrozenItems(scene);
        updateFireRain(scene);
        updateColumns(scene);
        if (scene.lost) return;
        scene.updatePlayer(delta);
        scene.updateCamera(delta);
        updateHazards(scene, delta);
        updateGuardianFire(scene);
        updateEnemyWeapons(scene);
        updateLevelScenarios(scene, delta);
        scene.updateConveyor(delta);
        scene.updateCheckpoint();
        scene.checkPits();
    }

    destroy(): void { destroyLevelScenarios(this.scene); }
}

export function resetLevelEnemies(scene: GameScene): void {
    resetBossRage(scene.hazards.getChildren());
    resetGuardianFire(scene);
    resetEnemyWeapons(scene);
}
