import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, recordFruit, takeKey } from '../src/rules.js';
import { garden } from '../src/level.js';

// Exercise scene transitions without requiring WebGL in Node.
globalThis.Phaser = { Scene: class {} };
const { GameScene } = await import('../src/GameScene.js');

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
        gameState: run, elapsed: 10000,
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
        gameState: run, elapsed: 9000,
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
