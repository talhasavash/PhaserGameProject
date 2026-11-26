// Bölümün fizik seçimine göre sahneyi ve yalnızca o motorun Phaser ayarlarını üretir.
import {GameScene} from './GameScene.js';
import {MatterGameScene} from './MatterGameScene.js';
import {physicsForLevel} from './sceneRouting.js';
import {levels} from '../world/levels/level.js';
import {labMotion} from '../physics/matter/movement.js';
import {labPhysics} from '../physics/matter/simulation.js';

export function createLevelScene(character: string, levelIndex: number, score = 0) {
    if (physicsForLevel(levels[levelIndex]) === 'matter') return new MatterGameScene(character, levelIndex, score);
    const scene = new GameScene(character, levelIndex);
    scene.carriedScore = score;
    return scene;
}
export function levelPhysicsConfig(levelIndex: number): Phaser.Types.Core.PhysicsConfig {
    return physicsForLevel(levels[levelIndex]) === 'matter'
        ? {default: 'matter', matter: {...labPhysics, gravity: {x: 0, y: labMotion.gravity}, autoUpdate: false, debug: true}}
        : {default: 'arcade', arcade: {gravity: {x: 0, y: 1600}, debug: false}};
}
