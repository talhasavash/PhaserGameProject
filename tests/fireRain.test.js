// Ateş yağmurunun konum, bekleme süresi ve düşüş hareketini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fireFrame, chooseFireX, fireWait, createFireRain, updateFireRain } from '../.build/src/world/hazards/EnvironmentalHazards.js';
import { levels, worlds } from '../.build/src/world/levels/level.js';

test('A chosen target waits for 1.5 seconds, then falls and finishes without moving its target', () => {
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

test('Fire rain creates no ground shadows or warning graphics', () => {
    const sprite = {
        active: false, body: { setCircle() {} }, setDepth() { return this; },
        disableBody() { this.active = false; }, enableBody() { this.active = true; }
    };
    const scene = {
        level: { fireRain: [{ offset: 4000, period: 10000, speed: 300 }] },
        textures: { exists: () => true },
        physics: { add: { group: () => ({ create: () => sprite }) } },
        add: { container() { assert.fail('No warning container'); }, ellipse() { assert.fail('No ground shadow'); } }
    };
    createFireRain(scene);
    scene.rainDrops[0].plan = { x: 900, startAt: 2000, speed: 300 };
    scene.elapsed = 2000;
    updateFireRain(scene);
    assert.equal(sprite.active, false);
    scene.elapsed = 3600;
    updateFireRain(scene);
    assert.equal(sprite.active, true);
});

test('Random fire targets vary, stay near the player and avoid safe spots and other drops', () => {
    let seed = 41;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const targets = new Set();
    for (const level of levels.slice(2).filter(Boolean)) for (let playerX = 100; playerX < level.exit.x; playerX += 70) {
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
test('Every Arcade chapter has three reachable stars before its key and exit', () => {
    assert.ok(levels.length <= worlds.reduce((count, world) => count + world.count, 0), 'Playable chapters fit within reserved menu slots');
    const maxRise = 590 ** 2 / (2 * 1600);
    for (const level of levels.filter(level => level && level.physics !== 'matter')) {
        const reached = [];
        let groundStart = 0;
        for (const gap of [...(level.gaps || []), { x: level.width, width: 0 }]) {
            reached.push({ x: groundStart, y: level.groundY, width: gap.x - groundStart });
            groundStart = gap.x + gap.width;
        }
        // Sağ ve sol yönlü, yukarı ve aşağı atlayışları gerçek hız/yerçekimiyle doğrula.
        let remaining = [...level.platforms];
        let progress = true;
        while (progress) {
            progress = false;
            remaining = remaining.filter(platform => {
                const reachable = reached.some(step => {
                    const rise = step.y - platform.y;
                    if (rise > maxRise) return false;
                    const distance = Math.max(0, platform.x - step.x - step.width, step.x - platform.x - platform.width);
                    const flightTime = (590 + Math.sqrt(590 ** 2 - 3200 * rise)) / 1600;
                    return distance + 24 < 265 * flightTime;
                });
                if (reachable) { reached.push(platform); progress = true; }
                return !reachable;
            });
        }
        assert.equal(remaining.length, 0, `${level.name}: unreachable platform`);
        const stars = level.fruits.filter(item => item.type === 'star');
        assert.equal(stars.length, 3);
        assert.equal(new Set(level.fruits.map(item => item.id)).size, level.fruits.length);
        for (const star of stars) {
            const onGround = star.y >= level.groundY - 60 &&
                (level.gaps || []).every(gap => star.x < gap.x || star.x > gap.x + gap.width);
            assert.ok(onGround || reached.some(p => star.x > p.x && star.x < p.x + p.width && p.y - star.y >= 0 && p.y - star.y < 60), level.name);
            assert.ok(star.x < level.key.x);
        }
        assert.ok(level.key.x < level.exit.x && level.exit.x < level.width);
    }
});

test('Fire is sparse: one reusable ball per level and at least eight seconds between drops', () => {
    for (const level of levels.filter(Boolean)) {
        assert.ok((level.fireRain || []).length <= 1);
        for (const rain of level.fireRain || []) {
            assert.ok(rain.offset >= 4000);
            for (const value of [0, 0.5, 1]) assert.ok(fireWait(rain, () => value) >= 8000);
        }
    }
});

test('Arcade pits have safe respawns and either running-jump widths or authored stepping platforms', () => {
    const jumpRange = 265 * (2 * 590 / 1600);
    for (const level of levels.filter(level => level && level.physics !== 'matter')) {
        let end = 0;
        for (const gap of level.gaps || []) {
            assert.ok(gap.width >= 80);
            assert.ok(gap.width + 30 < jumpRange || level.platforms.some(p =>
                p.x < gap.x + gap.width && p.x + p.width > gap.x), `${level.name}: wide pit needs a platform route`);
            assert.ok(gap.x - end >= 150);
            assert.ok(gap.x + gap.width < level.key.x);
            for (const point of [level.spawn, level.checkpoint, ...level.fountains.map(f => ({ x: f.x }))]) {
                assert.ok(point.x < gap.x - 10 || point.x > gap.x + gap.width + 10);
            }
            end = gap.x + gap.width;
        }
        for (const ice of level.ice || []) {
            assert.ok((level.gaps || []).every(g => ice.x + ice.width <= g.x || ice.x >= g.x + g.width));
        }
    }
});
