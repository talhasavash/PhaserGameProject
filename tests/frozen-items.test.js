// Buzun ilk temasta kırıldığını, ayrılıp yeniden dokunmadan nesnenin toplanmadığını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { touchFrozenItem, updateFrozenItems } from '../src/gameplay/frozenItems.js';
import { iceLevels } from '../src/world/levels/iceLevels.js';
import { snowballFrame } from '../src/gameplay/snowballs.js';

test('Frozen objects thaw once, remain uncollectible during contact, then open after a clear exit', () => {
    let state = 'sealed', tween, bursts = 0, destroyed = 0;
    const sprite = { x: 100, y: 200, visible: true, body: { left: 85, right: 115, top: 185, bottom: 215 },
        getData: () => state, setData(key, value) { state = value; } };
    const shell = { scaleX: 1, scaleY: 1, setPosition() { return this; }, setVisible() {}, destroy() { destroyed++; } };
    const item = { sprite, shell };
    const scene = { frozenItems: [item], player: { body: { left: 90, right: 110, top: 180, bottom: 220 } },
        iceBreakSparks: { emitParticleAt() { bursts++; } }, sound: { play() {} }, tweens: { add(config) { tween = config; } } };
    assert.equal(touchFrozenItem(scene, sprite), true);
    for (let i = 0; i < 20; i++) {
        updateFrozenItems(scene);
        assert.equal(touchFrozenItem(scene, sprite), true);
    }
    assert.equal(bursts, 1);
    assert.equal(state, 'thawing');
    tween.onComplete();
    assert.equal(item.shell, null);
    assert.equal(destroyed, 1);
    scene.player.body.left = 123;
    scene.player.body.right = 143;
    updateFrozenItems(scene);
    assert.equal(state, 'open');
    assert.equal(touchFrozenItem(scene, sprite), false);
});

test('Chapter 34 has a distinct palace, frozen collectibles and an original shard-throwing boss', () => {
    const level = iceLevels[3];
    assert.equal(level.frozenItems, true);
    assert.equal(level.theme, 'crystalPalace');
    assert.equal(level.boss, true);
    const boss = level.enemies.find(enemy => enemy.type === 'frost-warden');
    assert.ok(boss && boss.x > Math.max(...level.fruits.filter(item => item.type === 'star').map(item => item.x)));
    assert.equal(boss.snowball.kind, 'shard');
    assert.equal(boss.snowball.volley, 3);
    const shot = { kind: 'shard', x: 500, y: 350, vx: -200, vy: 100, startAt: 1000 };
    assert.deepEqual(snowballFrame(2000, shot), { x: 300, y: 450, done: false });
    assert.equal(snowballFrame(4300, shot).done, true);
});
