// Toplama animasyonunun tek seferlik temasını ve yalnızca buzda çıkan parçacıkları doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { animateCollection, updateIceSparks } from '../src/gameplay/feedback.js';
import { levels } from '../src/world/levels/level.js';
import { hazardVisibility } from '../src/gameplay/hazards.js';

test('World 2 and 3 star guards share a long, fully non-collidable collection window', () => {
    let checked = 0;
    for (const level of levels.slice(15, 45)) {
        for (const enemy of level.enemies) {
            const platform = level.platforms[enemy.platform];
            const y = enemy.y ?? (platform?.y ?? level.groundY) - 20;
            if (!level.fruits.some(star => star.type === 'star' && Math.abs(star.y - y) <= 90 + (enemy.bob || 0) &&
                star.x >= Math.min(enemy.x, enemy.minX ?? enemy.x) - 45 && star.x <= Math.max(enemy.x, enemy.maxX ?? enemy.x) + 45)) continue;
            checked++;
            assert.equal(enemy.visibility.hiddenMs, 3000);
            for (const time of [2700, 4000, 5500]) {
                assert.deepEqual(hazardVisibility(time, enemy.visibility), { alpha: 0, collidable: false });
            }
        }
    }
    assert.ok(checked >= 45);
});

test('Collection disables contact immediately, keeps the image for its tween, then hides it', () => {
    let tween, killed, disabled, visible = true;
    const bursts = [];
    const sprite = { x: 100, y: 200, scaleX: 0.75, scaleY: 0.75,
        disableBody(...args) { disabled = args; }, setVisible(value) { visible = value; } };
    const scene = { tweens: { killTweensOf(target) { killed = target; }, add(config) { tween = config; } },
        collectSparks: { emitParticleAt(...args) { bursts.push(args); } } };
    animateCollection(scene, sprite);
    assert.equal(killed, sprite);
    assert.deepEqual(disabled, [true, false]);
    assert.equal(visible, true);
    assert.ok(tween.y < sprite.y && tween.scaleX > sprite.scaleX && tween.alpha === 0);
    assert.deepEqual(bursts, [[100, 200, 9]]);
    tween.onComplete();
    assert.equal(visible, false);
});

test('Ice sparks require sliding on a supported icy surface and throttle particle bursts', () => {
    const bursts = [];
    const scene = { elapsed: 100, nextIceSpark: 0, player: { x: 300, body: { bottom: 350, velocity: { x: 100 } } },
        iceSparks: { emitParticleAt(...args) { bursts.push(args); } } };
    updateIceSparks(scene, false);
    assert.equal(bursts.length, 0);
    updateIceSparks(scene, true);
    updateIceSparks(scene, true);
    assert.deepEqual(bursts, [[291, 348, 3]]);
    scene.elapsed = 200;
    scene.player.body.velocity.x = 0;
    updateIceSparks(scene, true);
    assert.equal(bursts.length, 1);
    scene.player.body.velocity.x = -100;
    updateIceSparks(scene, true);
    assert.deepEqual(bursts[1], [309, 348, 3]);
});
