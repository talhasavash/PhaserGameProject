import { bossStep, bossMood } from './boss.js';

const ENEMY_SCALE = 0.8;

// Düşmanlar Phaser'ın yerçekimsiz hareketli gövdeleridir.
export function createHazards(scene) {
    scene.hazards = scene.physics.add.group({ allowGravity: false, immovable: true });
    for (const enemy of scene.level.enemies) {
        createHazard(scene, enemy);
    }
    if (scene.level.ball) createHazard(scene, scene.level.ball);
    for (const hazard of scene.level.extraHazards || []) createHazard(scene, hazard);
}

function createHazard(scene, data) {
    // Küçülünce de ayaklar yerde kalsın. Kutuların alt kenarı zeminle aynı hizada.
    let y = scene.level.groundY - 24 * ENEMY_SCALE;
    if (data.type === 'ball' || data.type === 'wheel') y = scene.level.groundY - 22 * ENEMY_SCALE;
    if (data.y !== undefined) y = data.y;
    if (data.type === 'ogre') y = scene.level.groundY - 44 * data.scale;
    const sprite = scene.hazards.create(data.x, y, data.texture || data.type).setDepth(12);
    sprite.setScale(data.scale || ENEMY_SCALE);
    sprite.setData('patrol', {
        minX: data.minX,
        maxX: data.maxX,
        speed: data.speed,
        type: data.type,
        baseY: y,
        bob: data.bob || 0,
        grounded: data.y === undefined,
        jump: data.jump,
        jumpClock: 0,
        rage: data.rage || false,
        engagedAt: null,
        direction: 1
    });
    if (data.type === 'spider') {
        const thread = scene.add.line(data.x, 0, 0, 250, 0, 480, 0x9b919f, 0.65).setOrigin(0).setDepth(8);
        sprite.setData('thread', thread);
    }
    if (data.type === 'ogre') {
        sprite.body.setSize(58, 66).setOffset(19, 28);
        sprite.setData('shadow', scene.add.ellipse(data.x, 517, 76 * data.scale, 12, 0x332d4b, 0.23).setDepth(8));
    } else if (data.type === 'ball' || data.type === 'wheel') {
        sprite.body.setCircle(22, 4, 4);
    } else if (data.y !== undefined) {
        sprite.body.setSize(48, 26).setOffset(14, 16);
    } else {
        sprite.body.setSize(53, 27).setOffset(12, 23);
    }
}

export function updateHazards(scene, delta) {
    for (const hazard of scene.hazards.getChildren()) {
        const patrol = hazard.getData('patrol');
        if (patrol.jump) updateGuardJump(scene, hazard, patrol, delta);
        updatePatrol(scene, hazard, patrol);
        updateHazardAppearance(hazard, patrol, delta);
    }
}

function updatePatrol(scene, hazard, patrol) {
    if (hazard.x >= patrol.maxX) patrol.direction = -1;
    if (hazard.x <= patrol.minX) patrol.direction = 1;
    hazard.setVelocityX(patrol.speed * patrol.direction);
    if (patrol.bob) {
        const wave = Math.sin(scene.elapsed / 550);
        const targetY = patrol.baseY + (patrol.grounded ? -Math.abs(wave) : wave) * patrol.bob;
        hazard.setVelocityY((targetY - hazard.y) * 10);
    }
}

function updateHazardAppearance(hazard, patrol, delta) {
    const thread = hazard.getData('thread');
    if (thread) thread.geom.y2 = hazard.y;
    if (patrol.type === 'ball' || patrol.type === 'wheel') {
        hazard.rotation += patrol.direction * delta * 0.003;
    } else {
        hazard.setFlipX(patrol.direction < 0);
    }
}

function guardJumpSpeed(scene, hazard, patrol) {
    if (!patrol.rage) return 1;
    const distance = Math.abs(scene.player.x - hazard.x);
    if (distance >= 450) patrol.engagedAt = null;
    else if (patrol.engagedAt === null) patrol.engagedAt = scene.elapsed;
    const mood = bossMood(scene.elapsed, patrol.engagedAt, distance);
    hazard.setTint(mood.tint);
    hazard.setTexture(mood.angry ? 'ogre-ember-angry' : 'ogre-ember');
    return mood.speed;
}

function updateGuardJump(scene, hazard, patrol, delta) {
    // Biriken saat, öfke hızı değişirken zıplamanın ortasında konum atlamasını önler.
    const previousClock = patrol.jumpClock;
    patrol.jumpClock += delta * guardJumpSpeed(scene, hazard, patrol);
    const step = bossStep(previousClock, patrol.jumpClock, patrol.jump);
    if (step.sound) playGuardSound(scene, hazard, step.sound);
    // Görsel ve çarpışma gövdesi birlikte taşınır.
    hazard.body.reset(hazard.x, patrol.baseY - step.lift);
    hazard.getData('shadow').setPosition(hazard.x, 517);
}

function playGuardSound(scene, hazard, key) {
    const distance = Math.abs(scene.player.x - hazard.x);
    const range = Math.max(500, scene.scale.width * 0.7);
    if (distance >= range) return;
    const volume = (key === 'boss-land' ? 0.24 : 0.14) * (1 - distance / range);
    scene.sound.play(key, { volume });
}
