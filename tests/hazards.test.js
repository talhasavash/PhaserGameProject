import test from 'node:test';
import assert from 'node:assert/strict';
import { updateHazards } from '../src/hazards.js';

function hazardForTest(overrides = {}) {
    const patrol = { type: 'fox', minX: 100, maxX: 200, speed: 80, direction: 1, baseY: 480, ...overrides };
    const shadow = { setPosition(x, y) { this.x = x; this.y = y; } };
    return {
        x: 200, y: 480, rotation: 0, patrol, shadow,
        getData(key) { return key === 'patrol' ? patrol : key === 'shadow' ? shadow : undefined; },
        setVelocityX(x) { this.velocityX = x; }, setVelocityY(y) { this.velocityY = y; },
        setFlipX(value) { this.flipped = value; },
        setTint(value) { this.tint = value; }, setTexture(value) { this.texture = value; },
        body: { reset(x, y) { this.x = x; this.y = y; } }
    };
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
