// 20–30'un rastgele yollarını, zorluk artışını ve son bölüm muhafızlarını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNightCampaign, lateNightLevels } from '../src/world/levels/nightCampaign.js';
import { levels, worldForLevel } from '../src/world/levels/level.js';

function reachablePlatforms(level) {
    const reached = [];
    let start = 0;
    for (const gap of [...level.gaps, { x: level.width, width: 0 }]) {
        reached.push({ x: start, y: 520, width: gap.x - start });
        start = gap.x + gap.width;
    }
    let remaining = [...level.platforms];
    let progress = true;
    while (progress) {
        progress = false;
        remaining = remaining.filter(p => {
            const okay = reached.some(s => {
                const rise = s.y - p.y;
                if (rise > 590 ** 2 / 3200) return false;
                const distance = Math.max(0, p.x - s.x - s.width, s.x - p.x - p.width);
                return distance + 24 < 265 * (590 + Math.sqrt(590 ** 2 - 3200 * rise)) / 1600;
            });
            if (okay) { reached.push(p); progress = true; }
            return !okay;
        });
    }
    return remaining.length === 0;
}

test('World 2 is complete through 30, has distinct routes and becomes harder gradually', () => {
    assert.equal(lateNightLevels.length, 11);
    assert.deepEqual(levels.slice(19), lateNightLevels);
    assert.ok(levels.slice(15, 30).every((_, i) => worldForLevel(i + 15).id === 2));
    assert.equal(new Set(lateNightLevels.map(level => level.routes.join(','))).size, 11);
    assert.equal(new Set(lateNightLevels.map(level => JSON.stringify(level.mosqueStyle))).size, 11);
    for (let i = 0; i < lateNightLevels.length; i++) {
        const level = lateNightLevels[i];
        const guards = level.enemies.filter(enemy => enemy.platform !== undefined);
        assert.equal(guards.length, 3);
        assert.ok(guards.every(enemy => enemy.hop));
        assert.ok(level.enemies.some(enemy => enemy.visibility));
        assert.ok(level.enemies.some(enemy => !enemy.visibility));
        if (i === 0) continue;
        assert.ok(level.width > lateNightLevels[i - 1].width);
        assert.ok(level.gaps[0].width > lateNightLevels[i - 1].gaps[0].width);
        assert.ok(guards[0].hop.walkMs < lateNightLevels[i - 1].enemies[0].hop.walkMs);
    }
    assert.equal(levels[29].boss, true);
    assert.equal(levels[29].enemies.filter(enemy => enemy.type === 'ogre').length, 2);
});

test('Randomized night routes keep stars reachable, guards on their ledges and landmarks clear', () => {
    for (let seed = 0; seed < 102; seed++) {
        let state = seed + 1;
        const random = seed === 0 ? () => 0 : seed === 1 ? () => 1 :
            () => ((state = state * 16807 % 2147483647) - 1) / 2147483646;
        for (const level of createNightCampaign(random)) {
            assert.ok(reachablePlatforms(level), `${seed}: ${level.name}`);
            const stars = level.fruits.filter(item => item.type === 'star');
            assert.equal(stars.length, 3);
            assert.equal(new Set(level.fruits.map(item => item.id)).size, level.fruits.length);
            for (const star of stars) {
                const platform = level.platforms[star.platform];
                assert.ok(star.x > platform.x && star.x < platform.x + platform.width && star.y === platform.y - 35);
                assert.ok(star.x < level.key.x);
            }
            for (const enemy of level.enemies.filter(enemy => enemy.platform !== undefined)) {
                const p = level.platforms[enemy.platform];
                assert.ok(enemy.minX - 31 >= p.x && enemy.maxX + 31 <= p.x + p.width);
            }
            for (const point of [level.spawn, level.checkpoint, level.key, level.exit, ...level.fountains]) {
                assert.ok(level.gaps.every(gap => point.x < gap.x - 30 || point.x > gap.x + gap.width + 30), level.name);
            }
            assert.ok(level.fruits.filter(item => item.id.startsWith('scattered-')).length >= 20);
        }
    }
});
