// Düşman hareketlerinin ve boss güncellemelerinin beklenen şekilde çalıştığını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { updateHazards, hazardVisibility, createHazards } from '../src/gameplay/hazards.js';

function hazardForTest(overrides = {}) {
    const patrol = { type: 'fox', minX: 100, maxX: 200, speed: 80, direction: 1, baseX: 150, baseY: 480, period: 2400, offset: 0, threadTop: 220, ...overrides };
    const shadow = { setPosition(x, y) { this.x = x; this.y = y; }, setAlpha(alpha) { this.alpha = alpha; } };
    const hazard = {
        x: 200, y: 480, rotation: 0, patrol, shadow,
        getData(key) { return key === 'patrol' ? patrol : key === 'shadow' ? shadow : key === 'thread' ? this.thread : undefined; },
        setVelocityX(x) { this.velocityX = x; }, setVelocityY(y) { this.velocityY = y; },
        setFlipX(value) { this.flipped = value; },
        setTint(value) { this.tint = value; }, setTexture(value) { this.texture = value; },
        setAlpha(value) { this.alpha = value; },
        body: { checkCollision: { none: false }, reset(x, y) { hazard.x = this.x = x; hazard.y = this.y = y; } }
    };
    return hazard;
}

function sceneForTest(hazard) {
    return {
        elapsed: 1000, player: { x: 200 }, scale: { width: 960 },
        hazards: { getChildren: () => [hazard] },
        sound: { played: [], play(key) { this.played.push(key); } }
    };
}

test('Patrols reverse at either boundary; floating animals keep their vertical movement', () => {
    const hazard = hazardForTest({ bob: 30 });
    const scene = sceneForTest(hazard);
    updateHazards(scene, 16);
    assert.equal(hazard.velocityX, -80);
    assert.equal(hazard.flipped, true);
    assert.ok(hazard.velocityY > 0);
    hazard.x = 100;
    updateHazards(scene, 16);
    assert.equal(hazard.velocityX, 80);
    assert.equal(hazard.flipped, false);
});

test('Spiders descend on a fixed vertical thread even if their old data contains a horizontal patrol', () => {
    const hazard = hazardForTest({ type: 'spider', baseY: 385, bob: 95, period: 1600, speed: 120 });
    hazard.thread = { setTo(...ends) { this.ends = ends; } };
    const scene = sceneForTest(hazard);
    const heights = [];
    for (let time = 0; time <= 1600; time += 200) {
        scene.elapsed = time;
        updateHazards(scene, 16);
        heights.push(hazard.y);
        assert.equal(hazard.x, 150);
        assert.equal(hazard.velocityX, 0);
        assert.equal(hazard.velocityY, 0);
        assert.deepEqual(hazard.thread.ends, [0, 220, 0, hazard.y - 12]);
    }
    assert.equal(Math.min(...heights), 290);
    assert.equal(Math.max(...heights), 480);
    assert.ok(Math.abs(heights[0] - heights.at(-1)) < 0.001);
});

test('Vanishing patrols fade predictably and only cause damage while fully visible', () => {
    const visibility = { visibleMs: 2000, hiddenMs: 1200, fadeMs: 200, offset: 0 };
    assert.deepEqual(hazardVisibility(0, visibility), { alpha: 0, collidable: false });
    assert.deepEqual(hazardVisibility(100, visibility), { alpha: 0.5, collidable: false });
    assert.deepEqual(hazardVisibility(200, visibility), { alpha: 1, collidable: true });
    assert.deepEqual(hazardVisibility(1900, visibility), { alpha: 0.5, collidable: false });
    assert.deepEqual(hazardVisibility(2000, visibility), { alpha: 0, collidable: false });
    assert.deepEqual(hazardVisibility(3200 + 200, visibility), hazardVisibility(200, visibility));
    assert.deepEqual(hazardVisibility(0, { ...visibility, offset: 200 }), hazardVisibility(200, visibility));
    const hazard = hazardForTest({ visibility });
    const scene = sceneForTest(hazard);
    scene.elapsed = 2200;
    updateHazards(scene, 16);
    assert.equal(hazard.alpha, 0);
    assert.equal(hazard.body.checkCollision.none, true);
    assert.equal(hazard.shadow.alpha, 0, 'The invisible guardian must not leave a visible shadow');
    assert.equal(hazard.velocityX, -80, 'The hidden patrol keeps moving');
    scene.elapsed = 3600;
    updateHazards(scene, 16);
    assert.equal(hazard.alpha, 1);
    assert.equal(hazard.body.checkCollision.none, false);
});

test('Platform patrols are created with their feet on the specified platform, not on the ground', () => {
    const data = new Map();
    let spawn;
    const sprite = {
        body: { setSize() { return this; }, setOffset() { return this; } },
        setDepth() { return this; }, setScale() {}, setData(key, value) { data.set(key, value); }, getData: key => data.get(key)
    };
    const scene = {
        level: { groundY: 520, platforms: [{ x: 100, y: 275, width: 160 }],
            enemies: [{ type: 'shadow-fox', platform: 0, x: 180, minX: 140, maxX: 220, speed: 190 }] },
        physics: { add: { group: () => ({ create(x, y, texture) { spawn = { x, y, texture }; return sprite; } }) } }
    };
    createHazards(scene);
    assert.deepEqual(spawn, { x: 180, y: 275 - 24 * 0.8, texture: 'shadow-fox' });
    assert.equal(data.get('patrol').grounded, true);
});

test('Guard jump moves its body and shadow together and cools down after the player retreats', () => {
    const hazard = hazardForTest({
        type: 'ogre', rage: true, engagedAt: 0, jumpClock: 0,
        jump: { height: 220, duration: 1800, period: 3200, offset: 0 }
    });
    const scene = sceneForTest(hazard);
    scene.elapsed = 25000;
    updateHazards(scene, 100);
    assert.equal(hazard.texture, 'ogre-ember-angry');
    assert.ok(hazard.body.y < hazard.patrol.baseY);
    assert.equal(hazard.body.x, hazard.x);
    assert.equal(hazard.shadow.x, hazard.x);
    assert.deepEqual(scene.sound.played, ['boss-jump']);
    scene.player.x = 1000;
    const clock = hazard.patrol.jumpClock;
    updateHazards(scene, 100);
    assert.equal(hazard.patrol.engagedAt, null);
    assert.equal(hazard.texture, 'ogre-ember');
    assert.equal(hazard.tint, 0xffffff);
    assert.equal(hazard.patrol.jumpClock - clock, 100);
    assert.equal(scene.sound.played.length, 1, 'No repeated jump sound during flight');
});
