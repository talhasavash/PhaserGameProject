// Buz kolonlarının ezmesini ve kar topu atışlarının zamanlamasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { columnCrushes } from '../src/gameplay/columns.js';
import { createSnowballs, updateSnowballs, snowballFrame } from '../src/gameplay/snowballs.js';
import { iceLevels } from '../src/world/levels/iceLevels.js';

test('Descending columns catch swept head contact, but rising columns and side passes do not crush', () => {
    const player = { left: 90, right: 110, top: 470, bottom: 520 };
    const column = { left: 80, right: 120 };
    assert.equal(columnCrushes(player, column, 460, { bottom: 500, state: 'falling' }), true);
    assert.equal(columnCrushes(player, column, 460, { bottom: 520, state: 'closed' }), true);
    assert.equal(columnCrushes(player, column, 520, { bottom: 520, state: 'closed' }), false);
    assert.equal(columnCrushes(player, column, 500, { bottom: 480, state: 'rising' }), false);
    assert.equal(columnCrushes({ ...player, left: 125, right: 145 }, column, 460, { bottom: 500, state: 'falling' }), false);
});

test('All ice chapters have intermittent ground ice, snowmen and sparse large snowfall', () => {
    for (const level of iceLevels) {
        const solidWidth = level.width - level.gaps.reduce((sum, gap) => sum + gap.width, 0);
        const icyWidth = level.ice.reduce((sum, strip) => sum + strip.width, 0);
        assert.ok(icyWidth > solidWidth * 0.2 && icyWidth < solidWidth * 0.6);
        assert.ok(level.columns.length >= 3);
        assert.ok(level.enemies.some(enemy => enemy.type === 'snowman' && enemy.snowball));
        assert.equal(level.fireRain[0].kind, 'snow');
        assert.ok(level.fireRain[0].period >= 10000);
    }
});

test('Snowmen aim both ways, wait between throws, skip invisible enemies and reuse a bounded pool', () => {
    let created = 0;
    const data = { patrol: { snowball: { period: 2500, speed: 220 } } };
    const enemy = { x: 500, y: 490, alpha: 1, getData: key => data[key], setData: (key, value) => { data[key] = value; } };
    const scene = { elapsed: 0, player: { x: 300 }, level: { groundY: 520 },
        textures: { exists: () => true }, hazards: { getChildren: () => [enemy] },
        physics: { add: { group: () => ({ create() {
            created++;
            const sprite = { body: { setCircle() {}, reset(x, y) { sprite.x = x; sprite.y = y; } },
                setScale() { return this; }, setDepth() { return this; }, setRotation() { return this; }, setTexture() { return this; },
                disableBody() { this.active = false; }, enableBody(reset, x, y) { this.active = true; this.x = x; this.y = y; } };
            return sprite;
        } }) } } };
    createSnowballs(scene);
    scene.elapsed = 1800;
    updateSnowballs(scene);
    const first = scene.snowShots[0].plan;
    assert.equal(first.direction, -1);
    assert.ok(snowballFrame(2200, first).x < first.x);
    assert.ok(snowballFrame(2300, first).y + 10 > 477, 'A nearby throw reaches a standing child instead of passing over their head');
    updateSnowballs(scene);
    assert.equal(scene.snowShots.filter(shot => shot.plan).length, 1);
    enemy.alpha = 0;
    scene.elapsed = 4300;
    updateSnowballs(scene);
    assert.equal(scene.snowShots.filter(shot => shot.plan).length, 0, 'The old shot landed; the invisible snowman emits no replacement');
    scene.elapsed = 6800;
    scene.player.x = 700;
    enemy.alpha = 1;
    updateSnowballs(scene);
    assert.equal(scene.snowShots[0].plan.direction, 1);
    assert.equal(created, 6);
    scene.elapsed = 11000;
    scene.player.x = 2000;
    updateSnowballs(scene);
    assert.ok(scene.snowShots.every(shot => !shot.plan && !shot.sprite.active));
    scene.elapsed = 14000;
    scene.player = { x: 300, y: 490 };
    enemy.y = 325;
    enemy.setTint = () => {};
    data.patrol.snowball = { kind: 'shard', volley: 3, speed: 230, period: 2900, range: 720 };
    updateSnowballs(scene);
    const volley = scene.snowShots.filter(shot => shot.plan);
    assert.equal(volley.length, 3);
    assert.ok(volley.every(shot => shot.plan.vx < 0 && shot.plan.kind === 'shard'));
    assert.equal(new Set(volley.map(shot => shot.plan.vy)).size, 3);
    assert.equal(created, 6, 'Boss volleys reuse the existing projectile pool');
});

test('Crushing plays once and automatically restarts the current chapter after flattening', async () => {
    globalThis.Phaser = { Scene: class {} };
    const { GameScene } = await import('../src/gameplay/GameScene.js');
    let delayed, tween, restarts = 0, pauses = 0;
    const player = { anims: { stop() {} }, setTexture() {}, setVelocity() { return this; }, setAlpha() { return this; },
        recoveryGlow: { setVisible() {} }, recoveryStars: [] };
    const scene = { player, elapsed: 2000, hurtUntil: 5000, gameState: { complete: false }, level: { groundY: 520 },
        touchControls: { reset() {} }, physics: { pause() { pauses++; } }, sound: { play() {} },
        cameras: { main: { shake() {} } }, tweens: { add(config) { tween = config; } },
        time: { delayedCall(ms, fn) { assert.equal(ms, 950); delayed = fn; } }, restart() { restarts++; } };
    GameScene.prototype.crushPlayer.call(scene, 510);
    GameScene.prototype.crushPlayer.call(scene, 520);
    assert.equal(pauses, 1);
    assert.equal(player.expression, 'sad');
    assert.ok(tween.scaleY < 0.2);
    assert.equal(restarts, 0);
    delayed();
    assert.equal(restarts, 1);
});
