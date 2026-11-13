import test from 'node:test';
import assert from 'node:assert/strict';
import { readUnlocked, unlockedLevels, unlockNext } from '../src/progress.js';

test('Missing, invalid or inaccessible saved progress starts with just chapter one', () => {
    for (const value of [null, '0', '-1', 'abc', '2.5']) {
        assert.equal(readUnlocked({ getItem: () => value }, 4), 1);
    }
    assert.equal(readUnlocked({ getItem() { throw Error('blocked'); } }, 4), 1);
    assert.equal(readUnlocked({ getItem: () => '99' }, 4), 4);
});

test('Finishing a chapter unlocks the next and saves progress without relocking older chapters', () => {
    let saved = null;
    globalThis.window = { localStorage: { getItem: () => saved, setItem(key, value) { saved = value; } } };
    assert.equal(unlockedLevels(4), 1);
    assert.equal(unlockNext(0, 4), 2);
    assert.equal(saved, '2');
    assert.equal(unlockNext(1, 4), 3);
    assert.equal(unlockNext(0, 4), 3);
    assert.equal(unlockNext(2, 4), 4);
    assert.equal(unlockNext(3, 4), 4);
    assert.equal(saved, '4');
});
