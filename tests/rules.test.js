import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, isKeyReady, recordFruit, takeKey, finishLevel, healAtFountain } from '../src/rules.js';

test('Apples and bonuses score points, but only three distinct stars unlock the key', () => {
    const run = createGameState();
    for (let i = 0; i < 3; i++) recordFruit(run, `apple-${i}`, 'apple');
    for (const type of ['berry', 'mat', 'bead', 'lantern', 'crescent']) recordFruit(run, type, type);
    assert.equal(run.apples, 3);
    assert.equal(run.stars, 0);
    assert.equal(isKeyReady(run), false);
    assert.equal(takeKey(run), false);
    const bonusScore = run.score;
    for (let i = 0; i < 3; i++) recordFruit(run, `star-${i}`, 'star');
    assert.equal(isKeyReady(run), true);
    assert.equal(run.score, bonusScore + 120);
});

test('Repeated overlaps cannot award the same star or key twice', () => {
    const run = createGameState();
    assert.equal(recordFruit(run, 'star-1', 'star'), true);
    assert.equal(recordFruit(run, 'star-1', 'star'), false);
    assert.equal(run.stars, 1);
    assert.equal(run.score, 40);
    recordFruit(run, 'star-2', 'star'); recordFruit(run, 'star-3', 'star');
    assert.equal(takeKey(run), true);
    assert.equal(takeKey(run), false);
});

test('The mosque requires the key after stars, and completion occurs only once', () => {
    const run = createGameState();
    assert.equal(finishLevel(run), false);
    for (let i = 0; i < 3; i++) recordFruit(run, `star-${i}`, 'star');
    assert.equal(finishLevel(run), false);
    takeKey(run);
    assert.equal(finishLevel(run), true);
    assert.equal(finishLevel(run), false);
});

test('A fountain heals one missing heart once; full hearts preserve its use', () => {
    const run = createGameState();
    assert.equal(healAtFountain(run, 'fountain-1'), false);
    run.hearts = 1;
    assert.equal(healAtFountain(run, 'fountain-1'), true);
    assert.equal(run.hearts, 2);
    assert.equal(healAtFountain(run, 'fountain-1'), false);
    assert.equal(healAtFountain(run, 'fountain-2'), true);
    assert.equal(run.hearts, 3);
});
