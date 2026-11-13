import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, recordFruit, takeKey } from '../src/rules.js';
import { garden, courtyard } from '../src/level.js';

// Exercise scene transitions without requiring WebGL in Node.
globalThis.Phaser = { Scene: class {} };
const { GameScene } = await import('../src/GameScene.js');

test('Selecting a numbered level starts that scene directly', () => {
    const scene = new GameScene('boy', 1);
    GameScene.prototype.init.call(scene);
    assert.equal(scene.levelIndex, 1);
    assert.equal(scene.level, courtyard);
    assert.equal(scene.carriedScore, 0);
});

test('A collectible plays one quiet effect, even with repeated overlaps', () => {
    const played = [];
    const scene = {
        gameState: createGameState(),
        sound: { play(key, options) { played.push({ key, volume: options.volume }); } },
        tweens: { killTweensOf() {} }, updateHud() {}, announce() {}
    };
    const fruit = { getData: () => ({ id: 'berry-1', type: 'berry' }), disableBody() {} };
    GameScene.prototype.collectFruit.call(scene, {}, fruit);
    GameScene.prototype.collectFruit.call(scene, {}, fruit);
    assert.deepEqual(played, [{ key: 'collect', volume: 0.18 }]);
});

test('Invulnerability suppresses repeated impact sounds as well as repeated damage', () => {
    let sounds = 0;
    const player = { x: 100, anims: { stop() {} }, setTexture() {}, setVelocity() {} };
    const scene = {
        gameState: createGameState(), elapsed: 1000, hurtUntil: 0,
        sound: { play(key) { assert.equal(key, 'hurt'); sounds += 1; } },
        cameras: { main: { shake() {} } }, updateHud() {}, announce() {}
    };
    GameScene.prototype.hitHazard.call(scene, player, { x: 200 });
    GameScene.prototype.hitHazard.call(scene, player, { x: 200 });
    assert.equal(sounds, 1);
    assert.equal(scene.gameState.hearts, 2);
});

test('Touching the exit early leaves the game running and explains the mission', () => {
    let hint = '';
    const scene = { gameState: createGameState(), elapsed: 5000, lastGateHint: 0, announce: message => { hint = message; } };
    GameScene.prototype.reachExit.call(scene);
    assert.equal(scene.gameState.complete, false);
    assert.match(hint, /üç elma/);
});

test('The key and exit open the result screen exactly once', () => {
    const elements = new Map(['result-score', 'game-result', 'play-again'].map(id => [id, { hidden: true, textContent: '', focus() { this.focused = true; } }]));
    globalThis.document = { getElementById: id => elements.get(id) };
    const run = createGameState();
    for (let i = 0; i < 3; i++) recordFruit(run, `apple-${i}`, 'apple');
    takeKey(run);
    let pauseCount = 0;
    const scene = {
        gameState: run, elapsed: 10000, levelIndex: 1,
        physics: { pause() { pauseCount += 1; } },
        player: { anims: { stop() {} }, setTexture() {} },
        tweens: { pauseAll() {} }, announce() {}, updateHud() {}
    };
    GameScene.prototype.reachExit.call(scene);
    GameScene.prototype.reachExit.call(scene);
    assert.equal(run.complete, true);
    assert.equal(pauseCount, 1);
    assert.equal(elements.get('game-result').hidden, false);
    assert.match(elements.get('result-score').textContent, /90 puan/);
    assert.equal(elements.get('play-again').focused, true);
});

test('Respawn restores hearts at the flag and preserves collected fruit and key', () => {
    const run = createGameState();
    for (let i = 0; i < 3; i++) recordFruit(run, `apple-${i}`, 'apple');
    takeKey(run);
    run.checkpointActive = true;
    run.hearts = 0;
    let position;
    const scene = {
        gameState: run, elapsed: 9000, level: garden,
        player: { movement: {}, anims: { stop() {} }, setTexture() {}, setVelocity() {}, setRotation() {}, setPosition() {}, body: { reset(x, y) { position = { x, y }; } } },
        cameras: { main: { flash() {} } }, announce() {}, updateHud() {}
    };
    GameScene.prototype.respawn.call(scene);
    assert.deepEqual(position, garden.checkpoint);
    assert.equal(run.hearts, 3);
    assert.equal(run.apples, 3);
    assert.equal(run.score, 90);
    assert.equal(run.hasKey, true);
    assert.ok(scene.hurtUntil > scene.elapsed);
});

test('First mosque automatically starts the second level exactly once with score preserved', () => {
    const run = createGameState();
    for (let i = 0; i < 3; i++) recordFruit(run, `apple-${i}`, 'apple');
    takeKey(run);
    const calls = [];
    const scene = {
        gameState: run, levelIndex: 0, elapsed: 9000,
        touchControls: { reset() {} }, scene: { restart(data) { calls.push(data); } }
    };
    GameScene.prototype.reachExit.call(scene);
    GameScene.prototype.reachExit.call(scene);
    assert.deepEqual(calls, [{ levelIndex: 1, score: 90 }]);
});

test('Second level resets its mission and hearts, preserves character, sound setting and total score', () => {
    const scene = new GameScene('girl');
    scene.soundMuted = true;
    GameScene.prototype.init.call(scene, { levelIndex: 1, score: 150 });
    assert.equal(scene.level, courtyard);
    const state = createGameState(scene.carriedScore);
    assert.equal(state.score, 150);
    assert.equal(state.apples, 0);
    assert.equal(state.hasKey, false);
    assert.equal(state.hearts, 3);
    assert.equal(scene.character, 'girl');
    assert.equal(scene.soundMuted, true);
});

test('Restart repeats the current level; play again begins from the garden', () => {
    const calls = [];
    const scene = {
        levelIndex: 1, carriedScore: 130,
        time: {}, tweens: { resumeAll() {} }, physics: { resume() {} },
        scene: { restart(data) { calls.push(data); } }
    };
    GameScene.prototype.restart.call(scene);
    GameScene.prototype.restart.call(scene, true);
    assert.deepEqual(calls, [{ levelIndex: 1, score: 130 }, { levelIndex: 0, score: 0 }]);
});
