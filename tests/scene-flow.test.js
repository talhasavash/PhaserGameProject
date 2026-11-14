import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, recordFruit, takeKey } from '../src/gameplay/rules.js';
import { garden, courtyard, levels } from '../src/world/level.js';

// Exercise scene transitions without requiring WebGL in Node.
globalThis.Phaser = { Scene: class {} };
const { GameScene } = await import('../src/gameplay/GameScene.js');

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
    assert.match(hint, /üç yıldız/);
});

test('Every mosque celebrates before showing a result; only Continue starts the next level', () => {
    for (let index = 0; index < levels.length; index++) {
        const ids = ['result-score', 'game-result', 'play-again', 'next-level', 'result-eyebrow', 'result-title', 'result-message', 'touch-controls', 'result-verse'];
        const elements = new Map(ids.map(id => [id, { hidden: true, textContent: '', style: {}, focus() { this.focused = true; } }]));
        globalThis.document = { getElementById: id => elements.get(id) };
        const run = createGameState();
        for (let i = 0; i < 3; i++) recordFruit(run, `star-${i}`, 'star');
        takeKey(run);
        let pauseCount = 0;
        let delayed;
        let scheduled = 0;
        const calls = [];
        elements.set('menu-button', { click() { calls.push('menu'); } });
        const scene = {
            gameState: run, elapsed: 10000, levelIndex: index,
            physics: { pause() { pauseCount++; }, resume() {} },
            player: { anims: { stop() {} }, setTexture() {}, setVelocity() {}, setAlpha() {} },
            touchControls: { reset() {} }, sound: { play() {} },
            time: { delayedCall(ms, callback) { assert.equal(ms, 1200); scheduled++; delayed = callback; } },
            tweens: { pauseAll() {}, resumeAll() {} }, announce() {}, updateHud() {},
            showLevelResult() { GameScene.prototype.showLevelResult.call(this); },
            scene: { restart(data) { calls.push(data); } }, restart() { calls.push('replay'); }
        };
        GameScene.prototype.reachExit.call(scene);
        GameScene.prototype.reachExit.call(scene);
        assert.equal(run.complete, true);
        assert.equal(pauseCount, 1);
        assert.equal(scheduled, 1);
        assert.equal(elements.get('game-result').hidden, true, 'Let the player see the sparkle first');
        assert.equal(scene.player.expression, 'happy');
        assert.ok(scene.player.recoveryUntil > scene.elapsed);
        GameScene.prototype.continueAfterResult.call(scene);
        assert.deepEqual(calls, [], 'No transition before result');
        delayed();
        assert.ok(elements.get('result-verse').textContent.length > 10);
        assert.equal(elements.get('game-result').hidden, false);
        assert.match(elements.get('result-score').textContent, /120 puan/);
        const final = index === levels.length - 1;
        assert.equal(elements.get('next-level').hidden, final);
        assert.equal(elements.get('play-again').hidden, !final);
        assert.equal(elements.get(final ? 'play-again' : 'next-level').focused, true);
        GameScene.prototype.continueAfterResult.call(scene);
        GameScene.prototype.continueAfterResult.call(scene);
        assert.deepEqual(calls, final ? ['menu'] : [{ levelIndex: index + 1, score: 120 }]);
    }
});
test('Respawn restores hearts at the flag and preserves collected fruit and key', () => {
    const run = createGameState();
    for (let i = 0; i < 3; i++) recordFruit(run, `star-${i}`, 'star');
    takeKey(run);
    run.checkpointActive = true;
    run.hearts = 0;
    let position;
    const scene = {
        gameState: run, elapsed: 9000, level: garden, hazards: { getChildren: () => [] },
        player: { movement: {}, anims: { stop() {} }, setTexture() {}, setVelocity() {}, setRotation() {}, setPosition() {}, body: { reset(x, y) { position = { x, y }; } } },
        cameras: { main: { flash() {} } }, announce() {}, updateHud() {}
    };
    GameScene.prototype.respawn.call(scene);
    assert.deepEqual(position, garden.checkpoint);
    assert.equal(run.hearts, 3);
    assert.equal(run.stars, 3);
    assert.equal(run.score, 120);
    assert.equal(run.hasKey, true);
    assert.ok(scene.hurtUntil > scene.elapsed);
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

test('A pit ends the attempt even with full hearts, and retry restarts the current chapter', () => {
    const elements = new Map(['fall-result', 'retry-fall', 'touch-controls'].map(id => [id, { hidden: true, focus() {} }]));
    globalThis.document = { getElementById: id => elements.get(id) };
    let paused = 0;
    const restarts = [];
    const run = createGameState(500);
    recordFruit(run, 'star-1', 'star');
    const scene = {
        gameState: run, elapsed: 5000, levelIndex: 4, carriedScore: 500,
        level: { groundY: 520, gaps: [{ x: 300, width: 100 }] },
        player: { x: 350, y: 540, body: { bottom: 570, blocked: { down: false } }, anims: { stop() {} }, setTexture() {}, setVelocityX() {} },
        physics: { pause() { paused++; }, resume() {} }, touchControls: { reset() {} }, sound: { play() {} }, updateHud() {},
        time: {}, tweens: { resumeAll() {} }, scene: { restart(data) { restarts.push(data); } },
        restart() { GameScene.prototype.restart.call(this); }
    };
    GameScene.prototype.checkPits.call(scene);
    assert.equal(scene.falling, true);
    assert.equal(scene.player.expression, 'sad');
    assert.equal(paused, 0, 'The player must actually fall before the attempt ends');
    scene.player.y = 570;
    GameScene.prototype.checkPits.call(scene);
    assert.equal(scene.lost, true);
    assert.equal(run.hearts, 0);
    assert.equal(paused, 1);
    assert.equal(elements.get('fall-result').hidden, false);
    GameScene.prototype.retryFall.call(scene);
    assert.deepEqual(restarts, [{ levelIndex: 4, score: 500 }]);
    const restarted = createGameState(restarts[0].score);
    assert.equal(restarted.stars, 0);
    assert.equal(restarted.hearts, 3);
    assert.equal(restarted.score, 500, 'Only score carried from earlier chapters survives');
});

test('Taking the key opens the mosque once and does not finish the chapter remotely', () => {
    const run = createGameState();
    run.stars = 3;
    let opened = 0;
    const scene = { gameState: run, sound: { play() {} }, keySprite: { disableBody() {} }, door: { open() { opened++; } }, announce() {}, updateHud() {} };
    GameScene.prototype.collectKey.call(scene);
    GameScene.prototype.collectKey.call(scene);
    assert.equal(opened, 1);
    assert.equal(run.hasKey, true);
    assert.equal(run.complete, false);
});
