import test from 'node:test';
import assert from 'node:assert/strict';
import { bossLift } from '../src/boss.js';
import { levels } from '../src/level.js';
import { verses } from '../src/verses.js';

test('The eleventh chapter has giant jumping guards with enough time to run underneath', () => {
    const boss = levels[10];
    assert.equal(boss.boss, true);
    assert.ok(boss.enemies.length >= 3);
    for (const guard of boss.enemies) {
        assert.equal(guard.type, 'ogre');
        assert.ok(guard.scale >= 1.5);
        assert.ok(guard.jump.period > guard.jump.duration);
        const start = guard.jump.period - guard.jump.offset;
        assert.equal(bossLift(start, guard.jump), 0);
        assert.equal(bossLift(start + guard.jump.duration, guard.jump), 0);
        assert.equal(bossLift(start + guard.jump.duration / 2, guard.jump), guard.jump.height);
        let clearanceMs = 0;
        for (let age = 0; age < guard.jump.duration; age += 10) if (bossLift(start + age, guard.jump) > 85) clearanceMs += 10;
        const runUnderMs = (58 * guard.scale + 24) / (265 - guard.speed) * 1000;
        assert.ok(clearanceMs > runUnderMs + 150);
    }
});

test('Every chapter has a sourced verse; citations remain in data rather than on the result card', () => {
    assert.equal(verses.length, levels.length);
    for (const verse of verses) {
        assert.ok(verse.text.length > 10 && verse.text.length < 120);
        assert.match(verse.reference, /\d+\/\d+/);
        assert.equal(new URL(verse.source).hostname, 'kuran.diyanet.gov.tr');
    }
});
