// Yeni buz seferinin ulaşılabilir rotalarını, silahlarını ve son dünya sınırını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, worlds, isPlayableLevel, worldForLevel } from '../.build/src/world/levels/level.js';
import { iceExpeditionLevels } from '../.build/src/world/levels/world3Expedition.js';
import { resolveWeapon } from '../.build/src/actors/enemies/WeaponCatalog.js';
import { bossLift } from '../.build/src/actors/enemies/EnemyController.js';

test('Chapters 36–45 fill World 3, keep sequential locks and leave World 4 unimplemented', () => {
    assert.deepEqual(levels.slice(35, 45), iceExpeditionLevels);
    assert.equal(worlds[2].levels.length, 15);
    for (let index = 35; index < 45; index++) {
        assert.ok(isPlayableLevel(index));
        assert.equal(worldForLevel(index).id, 3);
    }
    assert.equal(isPlayableLevel(45), false);
    assert.equal(worldForLevel(45).id, 4);
});

// 265 px/s, 590 px/s zıplama ve 1600 px/s² yerçekimiyle tam basılı zıplama.
// Bu kontrol düşman zamanlamasını değil, geometrik olarak imkânsız yıldız rotalarını yakalar.
function reachableSurfaces(level) {
    let x = 0;
    const surfaces = [];
    for (const g of [...level.gaps, {x: level.width, width: 0}]) {
        surfaces.push({x, width: g.x - x, y: level.groundY});
        x = g.x + g.width;
    }
    surfaces.push(...level.platforms);
    const reached = new Set([0]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const from of [...reached]) for (let to = 0; to < surfaces.length; to++) {
            if (reached.has(to)) continue;
            const a = surfaces[from], b = surfaces[to];
            const discriminant = 590 ** 2 - 2 * 1600 * (a.y - b.y);
            if (discriminant < 0) continue;
            const airtime = (590 + Math.sqrt(discriminant)) / 1600;
            const distance = Math.max(0, b.x - a.x - a.width, a.x - b.x - b.width);
            if (distance + 20 <= 265 * airtime) { reached.add(to); changed = true; }
        }
    }
    return surfaces.filter((_, i) => reached.has(i));
}

test('Every required star and exit has a reachable landing, with safe spawn and key ground', () => {
    for (const level of iceExpeditionLevels) {
        const reachable = reachableSurfaces(level);
        const stars = level.fruits.filter(f => f.type === 'star');
        assert.equal(stars.length, 3, level.name);
        for (const star of stars) assert.ok(reachable.some(p => star.x >= p.x && star.x <= p.x + p.width &&
            Math.abs(star.y - (p.y - 35)) < 2), `${level.name}: ${star.id}`);
        for (const point of [level.spawn, level.key, level.exit, level.checkpoint]) {
            assert.ok(level.gaps.every(g => point.x < g.x - 20 || point.x > g.x + g.width + 20), level.name);
        }
        assert.ok(level.ice.every(ice => level.gaps.every(g => ice.x + ice.width <= g.x || ice.x >= g.x + g.width)), level.name);
        assert.ok(level.fruits.length >= 20, level.name);
    }
});

test('Each expedition has its own scenery, platform route and mosque without unbounded decoration', () => {
    for (const field of ['platforms', 'mosqueStyle']) {
        assert.equal(new Set(iceExpeditionLevels.map(level => JSON.stringify(level[field]))).size, 10);
    }
    assert.equal(new Set(iceExpeditionLevels.map(level => JSON.stringify(level.environment.scenery))).size, 10);
    for (const level of iceExpeditionLevels) {
        const count = level.environment.scenery.parts.reduce((sum, part) => sum + (part.repeat?.count ?? 1), 0);
        assert.ok(count <= 90, `${level.name}: ${count} scenery images`);
        for (const enemy of level.enemies.filter(e => e.platform !== undefined)) {
            const p = level.platforms[enemy.platform];
            assert.ok(enemy.minX >= p.x && enemy.maxX <= p.x + p.width, level.name);
            assert.ok(enemy.visibility || !level.fruits.some(f => f.type === 'star' && f.platform === enemy.platform), level.name);
        }
    }
});

test('Returning snow discs reverse once and end at their launch point in either direction', () => {
    const {definition, config} = resolveWeapon({weapon: {type: 'snow-disc'}});
    for (const direction of [-1, 1]) {
        const shot = {...definition.launch({player: {x: 500 + direction * 200}}, {x: 500, y: 470}, config, 0), startAt: 0};
        const outbound = definition.frame(900, shot);
        const returning = definition.frame(1800, shot);
        assert.ok((outbound.x - 500) * direction > (returning.x - 500) * direction);
        assert.ok(Number.isFinite(outbound.rotation));
        assert.equal(definition.frame(2200, shot).done, true);
        assert.equal(definition.frame(2200, shot).x, 500);
        assert.equal(definition.frame(0, shot).y, 470);
    }
});

test('Frost waves stay within a visible dodge band and expire before the next volley', () => {
    const {definition, config} = resolveWeapon({weapon: {type: 'frost-wave'}});
    const shot = {...definition.launch({player: {x: 100}}, {x: 500, y: 470}, config, 0), startAt: 1000};
    for (let t = 1000; t < 4000; t += 100) {
        const frame = definition.frame(t, shot);
        assert.ok(frame.y >= 444 && frame.y <= 496);
        assert.ok(frame.x <= 500);
    }
    assert.equal(definition.frame(4000, shot).done, true);
    assert.ok(config.period > 3000);
});

test('The mammoth gives a walk-under window and all three stars precede the final arena', () => {
    const level = iceExpeditionLevels.at(-1);
    const boss = level.enemies.find(e => e.type === 'glacier-mammoth');
    assert.ok(level.boss);
    assert.ok(level.fruits.filter(f => f.type === 'star').every(f => f.x < 4400));
    let clearMs = 0;
    for (let t = 0; t < boss.jump.period; t += 10) if (bossLift(t, boss.jump) > 110) clearMs += 10;
    assert.ok(clearMs > (126 * boss.scale + 30) / 265 * 1000 + 200);
    assert.ok(level.gaps.every(g => g.x + g.width < boss.x - 600));
    assert.ok(level.exit.x - boss.x > 300);
    assert.equal(boss.weapon.type, 'ice-axe');
    assert.equal(resolveWeapon(boss).config.volley, 1);
    assert.equal(level.scenarios?.length ?? 0, 0, 'Approaching the mammoth does not trigger another attack');
});

test('Ice axes aim in both directions, spin without changing trajectory and expire', () => {
    const {definition, config} = resolveWeapon({weapon: {type: 'ice-axe'}});
    for (const direction of [-1, 1]) {
        const shot = {...definition.launch({player: {x: 500 + direction * 250, y: 470}}, {x: 500, y: 470}, config, 0), startAt: 1000};
        const first = definition.frame(1000, shot);
        const later = definition.frame(1500, shot);
        assert.ok((later.x - first.x) * direction > 0);
        assert.equal(later.x, shot.x + shot.vx * 0.5);
        assert.equal(later.y, shot.y + shot.vy * 0.5);
        assert.ok(later.rotation > first.rotation);
        assert.equal(definition.frame(4300, shot).done, true);
    }
});
