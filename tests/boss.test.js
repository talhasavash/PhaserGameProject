// Boss zıplamasını, öfkesini ve yeniden başlama durumunda sıfırlanmasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bossLift, bossMood, bossStep, resetBossRage } from '../.build/src/actors/enemies/EnemyController.js';
import { levels } from '../.build/src/world/levels/level.js';
import { verses } from '../.build/src/data/verses.js';

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
        const speed = guard.rage ? bossMood(18000, 0, 0).speed : 1;
        assert.ok(clearanceMs / speed > runUnderMs + 150, 'Even the angry guardian leaves a fair passage window');
    }
});

test('The final guard only grows angry after engagement and its speed and red tint increase gradually', () => {
    const finalGuard = levels[10].enemies.at(-1);
    assert.equal(finalGuard.rage, true);
    assert.ok(levels[10].enemies.slice(0, -1).every(guard => !guard.rage));
    assert.equal(bossMood(999999, null).speed, 1);
    const calm = bossMood(1000, 1000);
    const warming = bossMood(5500, 1000, 300);
    const angry = bossMood(19000, 1000, 0);
    assert.equal(calm.tint, 0xffffff);
    assert.ok(calm.speed < warming.speed && warming.speed < angry.speed);
    assert.ok(calm.tint > warming.tint && warming.tint > angry.tint);
    assert.equal(warming.angry, false);
    assert.equal(angry.angry, true);
    assert.deepEqual(bossMood(999999, 1000, 0), angry, 'Difficulty has a fixed upper limit');
    const distant = bossMood(1000, 1000, 440);
    const approaching = bossMood(1000, 1000, 300);
    const nearby = bossMood(1000, 1000, 140);
    assert.ok(distant.anger < approaching.anger && approaching.anger < nearby.anger);
    assert.ok(distant.speed < approaching.speed && approaching.speed < nearby.speed);
    assert.equal(nearby.angry, true, 'The face changes before contact, without taking damage');
    const retreating = bossMood(25000, 1000, 400);
    const farAway = bossMood(26000, 1000, 500);
    assert.ok(retreating.anger < angry.anger);
    assert.equal(retreating.angry, false);
    assert.equal(farAway.anger, 0, 'Waiting cannot keep a distant guardian angry');
    assert.equal(farAway.tint, 0xffffff);
    assert.equal(farAway.speed, 1);
});

test('Every chapter has a sourced verse; citations remain in data rather than on the result card', () => {
    for (const [index, level] of levels.entries()) {
        if (!level) continue;
        const verse = level.verse || verses[index] || verses[0];
        assert.ok(verse.text.length > 10 && verse.text.length < 120);
        assert.match(verse.reference, /\d+\/\d+/);
        assert.equal(new URL(verse.source).hostname, 'kuran.diyanet.gov.tr');
    }
});

test('Jump and landing effects play once per transition at normal and angry speeds', () => {
    for (const guard of levels[10].enemies) for (const fps of [30, 60, 120]) {
        const speed = guard.rage ? 1.6 : 1;
        const end = guard.jump.period * 3;
        let clock = 0;
        const sounds = [];
        while (clock < end) {
            const next = Math.min(end, clock + 1000 / fps * speed);
            const step = bossStep(clock, next, guard.jump);
            if (step.sound) sounds.push(step.sound);
            clock = next;
        }
        assert.equal(sounds.filter(sound => sound === 'boss-jump').length, 3);
        assert.equal(sounds.filter(sound => sound === 'boss-land').length, 3);
    }
});

test('Respawn resets the last guardian to its calm look and normal jump clock', () => {
    const patrol = { rage: true, engagedAt: 1000, jumpClock: 50000 };
    const guard = { getData: () => patrol, setTint(value) { this.tint = value; }, setTexture(value) { this.texture = value; } };
    resetBossRage([guard, { getData: () => ({ rage: false }) }]);
    assert.equal(guard.tint, 0xffffff);
    assert.equal(guard.texture, 'ogre-ember');
    assert.equal(patrol.jumpClock, 0);
    assert.equal(patrol.engagedAt, null);
    assert.equal(bossMood(60000, patrol.engagedAt).speed, 1);
});
