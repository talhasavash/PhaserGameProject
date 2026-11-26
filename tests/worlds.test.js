// Dünya ve bölüm sıralamasını, bölüm verilerini ve dünyalar arası kilit ilerlemesini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, worlds, worldForLevel, chapterNumber, LEVEL_SLOT_COUNT } from '../.build/src/world/levels/level.js';
import { bossGate, worldOneLevels } from '../.build/src/world/levels/world1.js';
import { worldTwoLevels } from '../.build/src/world/levels/world2.js';
import { worldThreeLevels } from '../.build/src/world/levels/world3.js';
import { readUnlocked, unlockNext } from '../.build/src/data/progress.js';
import { columnFrame, columnTiming, prepareColumn, visibleColumn, RAISED_BOTTOM, CLOSED_BOTTOM } from '../.build/src/world/hazards/EnvironmentalHazards.js';

test('Six worlds reserve 15 sequential slots each without changing playable level indexes', () => {
    assert.deepEqual(levels.slice(0, 15), worldOneLevels);
    assert.deepEqual(levels.slice(15, 30), worldTwoLevels);
    assert.deepEqual(levels.slice(30, 45), worldThreeLevels);
    assert.deepEqual(worlds.map(world => [world.id, world.start, world.count]), [[1, 0, 15], [2, 15, 15], [3, 30, 15], [4, 45, 15], [5, 60, 15], [6, 75, 15]]);
    assert.equal(LEVEL_SLOT_COUNT, 90);
    assert.deepEqual(worlds.map(world => world.title), ['Meyve Rüyası', 'Gece Karanlığı', 'Buz Dağları', 'Ateş ve Çukur', "Kabe'nin Yolları", 'Denge Atölyesi']);
    assert.equal(levels[10], bossGate);
    assert.equal(worldForLevel(10).id, 1);
    assert.equal(chapterNumber(10), 11);
    assert.equal(worldForLevel(11).id, 1);
    assert.equal(chapterNumber(11), 12);
    assert.equal(chapterNumber(13), 14);
    assert.equal(worldForLevel(15).id, 2);
    assert.equal(chapterNumber(15), 16);
    assert.deepEqual(levels.slice(11, 15).map(level => level.name), ['Lav Vadisi', 'Mekanik Fabrika', 'Kara Kale', 'Uçurum Geçidi']);
    assert.deepEqual(levels.slice(11, 15).map(level => level.exitType), ['gate', 'gate', 'gate', 'mosque']);
});

test('Existing saved progress is retained; completing each world unlocks the next', () => {
    let saved = '11';
    const storage = { getItem() { return saved; }, setItem(key, value) { saved = value; } };
    globalThis.window = { localStorage: storage };
    assert.equal(readUnlocked(storage, levels.length), 11);
    assert.equal(unlockNext(10, levels.length), 12);
    assert.equal(saved, '12');
    assert.equal(unlockNext(11, levels.length), 13);
    assert.equal(unlockNext(12, levels.length), 14);
    assert.equal(unlockNext(13, levels.length), 15);
    assert.equal(unlockNext(14, levels.length), 16);
    assert.equal(saved, '16');
    assert.equal(unlockNext(15, LEVEL_SLOT_COUNT), 17, 'Remember the next slot before its level is implemented');
    assert.equal(saved, '17');
});

test('Columns warn before slamming, remain closed, then retract continuously', () => {
    const column = levels[11].columns[0];
    const t = columnTiming(column);
    const fallAt = t.open + t.warning;
    const closedAt = fallAt + t.fall;
    const riseAt = closedAt + t.closed;
    const end = riseAt + t.rise;
    assert.deepEqual(columnFrame(0, column), { bottom: RAISED_BOTTOM, state: 'open' });
    assert.equal(columnFrame(t.open, column).state, 'warning');
    assert.equal(columnFrame(fallAt, column).bottom, RAISED_BOTTOM);
    assert.equal(columnFrame(closedAt, column).bottom, CLOSED_BOTTOM);
    assert.equal(columnFrame(riseAt, column).state, 'rising');
    assert.ok(columnFrame(riseAt + 500, column).bottom < CLOSED_BOTTOM);
    assert.deepEqual(columnFrame(end, column), columnFrame(0, column));
    let previous = columnFrame(0, column).bottom;
    for (let time = 10; time < end; time += 10) {
        const bottom = columnFrame(time, column).bottom;
        assert.ok(bottom >= RAISED_BOTTOM && bottom <= CLOSED_BOTTOM);
        const maximumStep = 2 * (CLOSED_BOTTOM - RAISED_BOTTOM) / t.fall * 10 + 1;
        assert.ok(Math.abs(bottom - previous) <= maximumStep, 'No teleporting at phase boundaries');
        previous = bottom;
    }
});

test('Column heights are chosen once per attempt without changing level data', () => {
    const source = levels[11].columns[0];
    const before = JSON.stringify(source);
    const high = prepareColumn(source, () => 0);
    const low = prepareColumn(source, () => 1);
    assert.equal(high.raisedBottom, source.raisedRange[0]);
    assert.equal(low.raisedBottom, source.raisedRange[1]);
    assert.ok(high.raisedBottom < low.raisedBottom && low.raisedBottom < 410);
    assert.equal(columnFrame(0, high).bottom, high.raisedBottom);
    assert.equal(columnFrame(100, high).bottom, high.raisedBottom);
    assert.equal(JSON.stringify(source), before);
    assert.ok(columnTiming(source).fall < 260);
    assert.ok(columnTiming(source).rise < 1100);
});

test('Five factory presses fall in order on every cycle with room to wait between them', () => {
    const presses = levels[12].columns.slice(0, 5);
    const t = columnTiming(presses[0]);
    const period = Object.values(t).reduce((sum, duration) => sum + duration, 0);
    assert.equal(presses.length, 5);
    for (let index = 0; index < presses.length; index++) {
        const column = presses[index];
        const impactAt = column.startDelay + t.open + t.warning;
        assert.equal(columnFrame(impactAt + 1, column).state, 'falling');
        assert.equal(columnFrame(impactAt + period + 1, column).state, 'falling');
        if (index === 0) continue;
        const previous = presses[index - 1];
        assert.equal(column.startDelay - previous.startDelay, 430);
        assert.ok(column.x - previous.x - (column.width + previous.width) / 2 > 54);
        assert.ok(430 > t.fall, 'Consecutive presses do not start falling simultaneously');
    }
});

test('Every column has a fair walk-under window, a safe waiting area and an unjumpable top', () => {
    for (const level of levels.slice(11).filter(level => level?.columns?.length)) {
        for (const column of level.columns) {
            assert.ok(columnTiming(column).open > (column.width + 24) / 185 * 1000 + 500);
            assert.ok(level.groundY - RAISED_BOTTOM > 54, 'Standing player clears the raised base');
            assert.ok(RAISED_BOTTOM - 512 < 0, 'Column extends beyond the top of the world');
            assert.ok(column.x > 500 && column.x < level.key.x - 80);
            assert.ok((level.gaps || []).every(gap => column.x + column.width / 2 < gap.x || column.x - column.width / 2 > gap.x + gap.width));
            assert.ok(Math.abs(column.x - level.checkpoint.x) > 100);
        }
    }
    const presses = levels[12].columns;
    assert.notEqual(columnFrame(2400, presses[0]).state, columnFrame(2400, presses[1]).state);
    assert.ok(levels[12].belts.some(belt => belt.speed > 0));
    assert.ok(levels[12].belts.some(belt => belt.speed < 0));
});

test('Raised columns remain visible above the player on phones without changing their speed', () => {
    for (const height of [320, 480, 600]) {
        for (const raisedBottom of [140, 150, 210, 270, 340]) {
            const original = { raisedBottom, openMs: 2100 };
            const visible = visibleColumn(original, height);
            assert.ok(visible.raisedBottom >= 600 - height + 50);
            assert.ok(CLOSED_BOTTOM - visible.raisedBottom >= 100);
            assert.deepEqual(columnTiming(visible), columnTiming(original));
            assert.equal(original.raisedBottom, raisedBottom);
        }
    }
});
