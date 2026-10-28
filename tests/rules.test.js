import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState, isKeyReady, recordFruit, takeKey, finishLevel, healAtFountain } from '../src/rules.js';
import { garden } from '../src/level.js';

test('Bonus fruit cannot unlock the key; three distinct apples can', () => {
    const run = createGameState();
    for (let i = 0; i < 12; i++) recordFruit(run, `berry-${i}`, 'berry');
    assert.equal(isKeyReady(run), false);
    assert.equal(takeKey(run), false);
    for (let i = 0; i < 3; i++) recordFruit(run, `apple-${i}`, 'apple');
    assert.equal(isKeyReady(run), true);
    assert.equal(run.score, 210);
});

test('Overlap events cannot award the same fruit or key twice', () => {
    const run = createGameState();
    assert.equal(recordFruit(run, 'apple-1', 'apple'), true);
    assert.equal(recordFruit(run, 'apple-1', 'apple'), false);
    assert.equal(run.apples, 1);
    assert.equal(run.score, 30);
    recordFruit(run, 'apple-2', 'apple'); recordFruit(run, 'apple-3', 'apple');
    assert.equal(takeKey(run), true);
    assert.equal(takeKey(run), false);
});

test('The exit requires the key, and completion only occurs once', () => {
    const run = createGameState();
    assert.equal(finishLevel(run), false);
    for (let i = 0; i < 3; i++) recordFruit(run, `apple-${i}`, 'apple');
    assert.equal(finishLevel(run), false);
    takeKey(run);
    assert.equal(finishLevel(run), true);
    assert.equal(finishLevel(run), false);
});

test('The garden has three reachable mission apples, with key after them', () => {
    const apples = garden.fruits.filter(fruit => fruit.type === 'apple');
    assert.equal(apples.length, 3);
    assert.equal(new Set(garden.fruits.map(f => f.id)).size, garden.fruits.length);
    const maxRise = 590 ** 2 / (2 * 1600);
    for (const platform of garden.platforms) {
        assert.ok(garden.groundY - platform.y < maxRise);
        assert.ok(garden.groundY - platform.y - 28 >= 54, 'Explorer must fit beneath platforms');
    }
    for (const apple of apples) {
        assert.ok(garden.platforms.some(p => apple.x > p.x && apple.x < p.x + p.width && p.y - apple.y < 60));
        assert.ok(apple.x < garden.key.x);
    }
    assert.ok(garden.key.x < garden.exit.x && garden.exit.x < garden.width);
});

test('An ablution area restores one missing heart and cannot be farmed', () => {
    const state = createGameState();
    state.hearts = 1;
    assert.equal(healAtFountain(state, 'fountain-1'), true);
    assert.equal(state.hearts, 2);
    assert.equal(healAtFountain(state, 'fountain-1'), false);
    assert.equal(state.hearts, 2);
    assert.equal(healAtFountain(state, 'fountain-2'), true);
    assert.equal(state.hearts, 3);
});

test('Visiting an ablution area at full health preserves it for later', () => {
    const state = createGameState();
    assert.equal(healAtFountain(state, 'fountain-1'), false);
    state.hearts = 2;
    assert.equal(healAtFountain(state, 'fountain-1'), true);
    assert.equal(state.hearts, 3);
});

test('Beads and prayer mats award bonus points without advancing the apple mission', () => {
    const state = createGameState();
    recordFruit(state, 'bead-1', 'bead');
    recordFruit(state, 'mat-1', 'mat');
    assert.equal(state.score, 30);
    assert.equal(state.apples, 0);
    assert.equal(isKeyReady(state), false);
});
