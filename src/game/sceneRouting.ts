// Sahne sözleşmesi ve motor seçimi; aynı motor yeniden başlar, motor değişimi ana başlatıcıya bildirilir.
import type {LevelDefinition} from '../world/model/contracts.js';
import type {GameState} from './rules.js';
import {levels} from '../world/levels/level.js';

export const GAME_SCENE_KEY = 'Garden';
export interface GameSessionData {levelIndex: number; score?: number; character: string}
export interface ActiveGameScene extends Phaser.Scene {
    levelIndex: number; character: string; level: LevelDefinition;
    paused: boolean; soundMuted: boolean; gameState: GameState;
    player: Phaser.GameObjects.Sprite;
    togglePause(): void;
    restart(fromBeginning?: boolean): void;
    continueAfterResult(): void;
    retryFall(): void;
}
export function physicsForLevel(level: Pick<LevelDefinition, 'physics'>): 'arcade' | 'matter' {
    return level.physics ?? 'arcade';
}
export function restartOrChangeLevel(scene: ActiveGameScene, data: {levelIndex: number; score: number}) {
    if (physicsForLevel(scene.level) === physicsForLevel(levels[data.levelIndex])) scene.scene.restart(data);
    else scene.game.events.emit('level-change', {...data, character: scene.character} satisfies GameSessionData);
}
export function isLocalMatterPreview(location: {hostname: string; search: string}, level: LevelDefinition): boolean {
    return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
        new URLSearchParams(location.search).get('pilot') === 'matter' && level.draft === true && level.physics === 'matter';
}
