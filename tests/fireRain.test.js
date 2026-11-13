import test from 'node:test';
import assert from 'node:assert/strict';
import { fireFrame, chooseFireX } from '../src/fireRain.js';
import { levels } from '../src/level.js';

test('A chosen target warns for 1.5 seconds, then falls and finishes without moving its target', () => {
    const plan = { x: 900, startAt: 2000, speed: 300 };
    assert.equal(fireFrame(1999, plan).warning, false);
    assert.equal(fireFrame(2000, plan).warning, true);
    assert.equal(fireFrame(3499, plan).falling, false);
    assert.equal(fireFrame(3500, plan).falling, true);
    assert.equal(fireFrame(3500, plan).warning, false);
    assert.ok(fireFrame(3800, plan).y > fireFrame(3700, plan).y);
    assert.equal(fireFrame(5000, plan).falling, false);
    assert.equal(fireFrame(5000, plan).done, true);
    assert.equal(plan.x, 900);
});

test('Random fire targets vary, stay near the player and avoid safe spots and other drops', () => {
    let seed = 41;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const targets = new Set();
    for (const level of levels.slice(2)) for (let playerX = 100; playerX < level.exit.x; playerX += 70) {
        const x = chooseFireX(level, playerX, random, [900]);
        if (x === null) continue;
        targets.add(Math.round(x));
        assert.ok(x >= Math.max(180, playerX - 180) && x <= Math.min(level.key.x - 100, playerX + 500));
        for (const safe of [level.spawn.x, level.checkpoint.x, level.exit.x, ...level.fountains.map(f => f.x)]) assert.ok(Math.abs(x - safe) > 110);
        assert.ok(Math.abs(x - 900) > 90);
    }
    assert.ok(targets.size > 30);
    assert.equal(chooseFireX(levels[2], levels[2].exit.x, random), null);
    assert.equal(chooseFireX(levels[2], 100, () => 0), null, 'Do not fall back to an unsafe target');
});
test('Four chapters have unique themes and reachable apples before their key and mosque', () => {
    assert.equal(levels.length, 4);
    assert.equal(new Set(levels.map(level => level.theme)).size, 4);
    const maxRise = 590 ** 2 / (2 * 1600);
    for (const level of levels) {
        const reached = [];
        for (const p of level.platforms) {
            if (level.groundY - p.y < maxRise || reached.some(step =>
                step.y - p.y >= 0 && step.y - p.y < maxRise &&
                p.x - (step.x + step.width) >= 0 && p.x - (step.x + step.width) < 100)) reached.push(p);
        }
        const apples = level.fruits.filter(item => item.type === 'apple');
        assert.equal(apples.length, 3);
        assert.equal(new Set(level.fruits.map(item => item.id)).size, level.fruits.length);
        for (const apple of apples) {
            assert.ok(reached.some(p => apple.x > p.x && apple.x < p.x + p.width && p.y - apple.y < 60), level.name);
            assert.ok(apple.x < level.key.x);
        }
        assert.ok(level.key.x < level.exit.x && level.exit.x < level.width);
    }
});
