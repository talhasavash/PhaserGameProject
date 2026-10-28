import test from 'node:test';
import assert from 'node:assert/strict';
import { readDirection, movePlayer, currentExpression, showPlayerExpression, showRecovery, updatePlayerEffects } from '../src/player.js';

globalThis.Phaser = { Math: { Clamp: (value, min, max) => Math.max(min, Math.min(max, value)) } };

function key() { return { isDown: false, timeDown: 0 }; }

function playerForTest() {
    return {
        rotation: 0,
        movement: { lastGrounded: -Infinity, jumpQueued: -Infinity, jumpConsumed: false, wasJumpHeld: false, wasOnGround: false, lastDirection: 1 },
        cursors: { left: key(), right: key(), up: key() },
        keys: { A: key(), D: key(), W: key(), SPACE: key() },
        body: { blocked: { down: true }, touching: { down: false }, velocity: { x: 0, y: 0 } },
        anims: { stop() {}, timeScale: 1 },
        setVelocityX(value) { this.body.velocity.x = value; },
        setVelocityY(value) { this.body.velocity.y = value; },
        setRotation(value) { this.rotation = value; },
        setFlipX() {}, setTexture() {}, play() {}
    };
}

test('With both arrows held, the latest press wins; releasing it restores the held direction', () => {
    const player = playerForTest();
    player.cursors.left = { isDown: true, timeDown: 100 };
    player.cursors.right = { isDown: true, timeDown: 200 };
    assert.equal(readDirection(player), 1);
    player.cursors.left.timeDown = 300;
    assert.equal(readDirection(player), -1);
    player.cursors.left.isDown = false;
    assert.equal(readDirection(player), 1);
});

test('A released A/D key cannot override a newer held arrow', () => {
    const player = playerForTest();
    player.keys.A = { isDown: false, timeDown: 900 };
    player.cursors.left = { isDown: true, timeDown: 100 };
    player.cursors.right = { isDown: true, timeDown: 200 };
    assert.equal(readDirection(player), 1);
});

test('Releasing movement coasts for a while and eventually stops', () => {
    const player = playerForTest();
    player.body.velocity.x = 265;
    movePlayer(player, 1000, 1000 / 60, 0);
    assert.ok(player.body.velocity.x > 200 && player.body.velocity.x < 265);
    for (let i = 1; i <= 30; i++) movePlayer(player, 1000 + i * 1000 / 60, 1000 / 60, 0);
    assert.equal(player.body.velocity.x, 0);
});

test('Up and left can remain held while a new right press reverses airborne movement', () => {
    const player = playerForTest();
    player.body.blocked.down = false;
    player.body.velocity.x = -220;
    player.cursors.up.isDown = true;
    player.cursors.left = { isDown: true, timeDown: 100 };
    player.cursors.right = { isDown: true, timeDown: 200 };
    for (let i = 0; i < 12; i++) movePlayer(player, 1000 + i * 1000 / 60, 1000 / 60, 0);
    assert.ok(player.body.velocity.x > 0);
});

test('Coasting deceleration is consistent at 30, 60, and 120 FPS', () => {
    for (const fps of [30, 60, 120]) {
        const player = playerForTest();
        player.body.velocity.x = 265;
        for (let i = 0; i < fps / 2; i++) movePlayer(player, i * 1000 / fps, 1000 / fps, 0);
        assert.equal(player.body.velocity.x, 0);
    }
});

test('Sadness starts immediately, survives walking, and expires back to normal', () => {
    const player = playerForTest();
    let texture;
    let animation;
    player.setTexture = value => { texture = value; };
    player.play = value => { animation = value; };
    showPlayerExpression(player, 'sad', 1000, 1500);
    assert.equal(texture, 'child-sad-0');
    player.cursors.right.isDown = true;
    movePlayer(player, 1100, 40, 0);
    assert.equal(animation, 'child-walk-sad');
    assert.equal(currentExpression(player, 2499), 'sad');
    assert.equal(currentExpression(player, 2500), 'normal');
});

test('Gaining health overrides sadness with a temporary smile and follows the moving player', () => {
    const player = playerForTest();
    function visual() {
        return {
            setVisible(value) { this.visible = value; },
            setPosition(x, y) { this.x = x; this.y = y; },
            setAlpha() {}
        };
    }
    player.x = 200;
    player.y = 480;
    player.recoveryGlow = visual();
    player.recoveryStars = [visual(), visual()];
    showPlayerExpression(player, 'sad', 1000, 1500);
    showRecovery(player, 1200);
    assert.equal(currentExpression(player, 1300), 'happy');
    updatePlayerEffects(player, 1300);
    assert.equal(player.recoveryStars[0].visible, true);
    player.x = 300;
    updatePlayerEffects(player, 1400);
    assert.equal(player.recoveryGlow.x, 300);
    assert.ok(Math.abs(player.recoveryStars[0].x - 300) <= 24);
    updatePlayerEffects(player, 3400);
    assert.equal(player.recoveryStars[0].visible, false);
    assert.equal(player.recoveryGlow.visible, false);
    assert.equal(currentExpression(player, 3400), 'normal');
});

test('The stopped character remains perfectly still at different times', () => {
    const player = playerForTest();
    player.rotation = 0.02;
    for (const time of [1000, 1500, 2000, 6000]) {
        movePlayer(player, time, 1000 / 60, 0);
        assert.equal(player.rotation, 0);
        assert.equal(player.body.velocity.x, 0);
    }
});

test('The girl keeps her own sad and happy appearances while moving', () => {
    const player = playerForTest();
    player.character = 'girl';
    let texture;
    let animation;
    player.setTexture = value => { texture = value; };
    player.play = value => { animation = value; };
    showPlayerExpression(player, 'sad', 1000, 1500);
    assert.equal(texture, 'girl-sad-0');
    player.cursors.right.isDown = true;
    movePlayer(player, 1100, 40, 0);
    assert.equal(animation, 'girl-walk-sad');
    showRecovery(player, 1200);
    assert.equal(texture, 'girl-happy-0');
    movePlayer(player, 1300, 40, 0);
    assert.equal(animation, 'girl-walk-happy');
});
