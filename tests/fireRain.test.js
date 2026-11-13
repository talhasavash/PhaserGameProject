import test from 'node:test';
import assert from 'node:assert/strict';
import { fireFrame } from '../src/fireRain.js';
import { levels } from '../src/level.js';

test('Each fireball warns for a second, falls, disappears before the ground, then repeats', () => {
    for (const level of levels) for (const rain of level.fireRain || []) {
        const start = rain.period - rain.offset;
        assert.equal(fireFrame(start, rain).warning, true);
        assert.equal(fireFrame(start + 999, rain).falling, false);
        assert.equal(fireFrame(start + 1000, rain).falling, true);
        assert.equal(fireFrame(start + 1100, rain).warning, false);
        assert.ok(fireFrame(start + 1200, rain).y > fireFrame(start + 1100, rain).y);
        assert.equal(fireFrame(start + rain.period - 1, rain).falling, false);
        assert.deepEqual(fireFrame(start + rain.period, rain), fireFrame(start, rain));
        assert.ok(Math.abs(rain.x - level.spawn.x) > 100);
        assert.ok(Math.abs(rain.x - level.checkpoint.x) > 65);
        for (const fountain of level.fountains) assert.ok(Math.abs(rain.x - fountain.x) > 65);
    }
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
