import test from 'node:test';
import assert from 'node:assert/strict';
import { bossLift, bossMood } from '../src/boss.js';
import { levels } from '../src/level.js';
import { verses } from '../src/verses.js';

test('The eleventh chapter has giant jumping guards with enough time to run underneath', () => {
    const boss = levels[10];
    assert.equal(boss.boss, true);
    assert.ok(boss.enemies.length >= 3);
    assert.equal(new Set(boss.enemies.map(guard => guard.texture || guard.type)).size, boss.enemies.length);
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
        const speed = guard.rage ? bossMood(18000, 0).speed : 1;
        assert.ok(clearanceMs / speed > runUnderMs + 150, 'Even the angry guardian leaves a fair passage window');
    }
});

test('The final guard only grows angry after engagement and its speed and red tint increase gradually', () => {
    const finalGuard = levels[10].enemies.at(-1);
    assert.equal(finalGuard.rage, true);
    assert.ok(levels[10].enemies.slice(0, -1).every(guard => !guard.rage));
    assert.equal(bossMood(999999, null).speed, 1);
    const calm = bossMood(1000, 1000);
    const warming = bossMood(5500, 1000);
    const angry = bossMood(19000, 1000);
    assert.equal(calm.tint, 0xffffff);
    assert.ok(calm.speed < warming.speed && warming.speed < angry.speed);
    assert.ok(calm.tint > warming.tint && warming.tint > angry.tint);
    assert.equal(warming.angry, false);
    assert.equal(angry.angry, true);
    assert.deepEqual(bossMood(999999, 1000), angry, 'Difficulty has a fixed upper limit');
});

test('Every chapter has a sourced verse; citations remain in data rather than on the result card', () => {
    assert.equal(verses.length, levels.length);
    for (const verse of verses) {
        assert.ok(verse.text.length > 10 && verse.text.length < 120);
        assert.match(verse.reference, /\d+\/\d+/);
        assert.equal(new URL(verse.source).hostname, 'kuran.diyanet.gov.tr');
    }
});
