import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/world/level.js';
import { bossLift } from '../src/gameplay/boss.js';
import { breathMoment, breathWarning, guardianShotFrame, updateGuardianFire, resetGuardianFire } from '../src/gameplay/guardianFire.js';

const level = levels.at(-1);
const boss = level.enemies.find(enemy => enemy.breath);

test('The final chapter has one giant fire guardian between the key and mosque on solid ground', () => {
    assert.equal(level.boss, true);
    assert.equal(level.exitLabel, 'camiye');
    assert.equal(level.columns, undefined, 'This chapter uses a mosque exit');
    assert.ok(boss.scale >= 2.4);
    const halfBody = 29 * boss.scale;
    assert.ok(level.key.x < boss.x - halfBody);
    assert.ok(level.exit.x > boss.x + halfBody + 80);
    assert.ok(level.gaps.every(gap => gap.x + gap.width < boss.x - halfBody - 100));
    let openMs = 0;
    for (let time = 0; time < boss.jump.period; time += 10) if (bossLift(time, boss.jump) > 85) openMs += 10;
    assert.ok(openMs > (58 * boss.scale + 24) / 265 * 1000 + 250);
});

test('The guardian fires twice per cycle on the ground and clears every flame before jumping', () => {
    let shots = 0;
    for (let time = 10; time <= boss.jump.period * 3; time += 10) {
        if (!breathMoment(time - 10, time, boss.jump, boss.breath)) continue;
        shots++;
        assert.equal(bossLift(time, boss.jump), 0);
    }
    assert.equal(shots, 6);
    const lastShotEnd = boss.breath.shots.at(-1) + boss.breath.range / boss.breath.speed * 1000;
    assert.ok(lastShotEnd + 300 < boss.jump.period - boss.jump.duration);
    assert.equal(breathWarning(400, boss.jump, boss.breath), true);
    assert.equal(breathWarning(900, boss.jump, boss.breath), false);
});

test('Mouth flames move toward the player, settle near ground height, and expire at a fixed range', () => {
    const plan = { x: 5118, y: 458, startAt: 1000, ...boss.breath };
    const first = guardianShotFrame(1000, plan);
    const later = guardianShotFrame(1500, plan);
    assert.ok(later.x < first.x);
    assert.equal(later.y, 490);
    assert.equal(guardianShotFrame(2500, plan).done, true);
});

test('A distant boss cannot save up shots; respawn clears the fire and jump clocks', () => {
    const patrol = { baseY: 414, jumpClock: 600, breathClock: 0, jump: boss.jump, breath: boss.breath };
    const glow = { setPosition() { return this; }, setVisible(value) { this.visible = value; return this; } };
    const guard = { x: boss.x, y: 414, scaleX: boss.scale, scaleY: boss.scale, getData: name => name === 'patrol' ? patrol : glow, body: { reset() {} } };
    const sprite = { body: { reset() {} }, enableBody() { this.active = true; }, disableBody() { this.active = false; } };
    let sounds = 0;
    const scene = { elapsed: 600, player: { x: 100 }, hazards: { getChildren: () => [guard] }, guardianShots: [{ sprite, plan: null }], sound: { play() { sounds++; } } };
    updateGuardianFire(scene);
    scene.player.x = 5000;
    patrol.jumpClock = 700;
    updateGuardianFire(scene);
    assert.equal(sounds, 0);
    patrol.jumpClock = 1800;
    updateGuardianFire(scene);
    updateGuardianFire(scene);
    assert.equal(sounds, 1);
    resetGuardianFire(scene);
    assert.equal(scene.guardianShots[0].plan, null);
    assert.equal(sprite.active, false);
    assert.equal(patrol.jumpClock, 0);
    assert.equal(patrol.breathClock, 0);
    assert.equal(glow.visible, false);
});
