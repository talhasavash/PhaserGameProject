// Final canavarının ağız uyarısını, ateş atışlarını ve yeniden kullanılan ateş nesnelerini yönetir.
const FLAME_POOL_SIZE = 3;
const ATTACK_DISTANCE = 500;
const BREATH_WARNING_MS = 350;

// Aynı atış anı, birden fazla kare boyunca tekrar tetiklenmesin.
export function breathMoment(before, after, jump, breath) {
    return breath.shots.some(time => {
        const threshold = jump.duration + time;
        const previousCycle = Math.floor((before + jump.offset - threshold) / jump.period);
        const currentCycle = Math.floor((after + jump.offset - threshold) / jump.period);
        return currentCycle > previousCycle;
    });
}

export function breathWarning(clock, jump, breath) {
    const phase = (clock + jump.offset) % jump.period;
    return breath.shots.some(time => {
        const untilShot = jump.duration + time - phase;
        return untilShot > 0 && untilShot <= BREATH_WARNING_MS;
    });
}

export function guardianShotFrame(elapsed, shot) {
    const age = Math.max(0, elapsed - shot.startAt);
    const distance = age * shot.speed / 1000;
    return { x: shot.x - distance, y: shot.y + Math.min(32, age * 0.1), done: distance >= shot.range };
}

function mouthOf(guard) {
    // SVG içindeki ağız konumu, canavarın ölçeğiyle dünya konumuna çevrilir.
    return { x: guard.x - 34 * guard.scaleX, y: guard.y + 18 * guard.scaleY };
}

function createFlameTexture(scene) {
    if (scene.textures.exists('guardian-flame')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xef7c42);
    g.fillTriangle(44, 2, 8, 14, 44, 26);
    g.fillCircle(13, 14, 12);
    g.fillStyle(0xffd268);
    g.fillEllipse(17, 14, 26, 15);
    g.fillStyle(0xfff0bd);
    g.fillEllipse(11, 14, 12, 8);
    g.generateTexture('guardian-flame', 44, 28);
    g.destroy();
}

export function createGuardianFire(scene) {
    scene.guardianFlames = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.guardianShots = [];
    const guards = scene.hazards.getChildren().filter(guard => guard.getData('patrol').breath);
    if (guards.length === 0) return;
    createFlameTexture(scene);
    // Her atışta nesne üretmek yerine aynı üç fizik gövdesi tekrar kullanılır.
    for (let i = 0; i < FLAME_POOL_SIZE; i++) {
        const sprite = scene.guardianFlames.create(0, 0, 'guardian-flame').setDepth(14);
        sprite.body.setCircle(10, 4, 4);
        sprite.disableBody(true, true);
        scene.guardianShots.push({ sprite, plan: null });
    }
    for (const guard of guards) {
        guard.getData('patrol').breathClock = 0;
        guard.setData('breath-glow', scene.add.circle(0, 0, 7 * guard.scaleX, 0xffcf79, 0.7).setDepth(14).setVisible(false));
    }
}

export function updateGuardianFire(scene) {
    if (scene.guardianShots.length === 0) return;
    updateShots(scene);
    for (const guard of scene.hazards.getChildren()) {
        const patrol = guard.getData('patrol');
        if (patrol.breath) updateGuardBreath(scene, guard, patrol);
    }
}

function deactivateShot(shot) {
    shot.sprite.disableBody(true, true);
    shot.plan = null;
}

function updateShots(scene) {
    for (const shot of scene.guardianShots) {
        if (!shot.plan) continue;
        const frame = guardianShotFrame(scene.elapsed, shot.plan);
        if (frame.done) deactivateShot(shot);
        else shot.sprite.body.reset(frame.x, frame.y);
    }
}

function updateGuardBreath(scene, guard, patrol) {
    const mouth = mouthOf(guard);
    const near = scene.player.x < guard.x && guard.x - scene.player.x < ATTACK_DISTANCE;
    const phase = (patrol.jumpClock + patrol.jump.offset) % patrol.jump.period;
    const grounded = phase >= patrol.jump.duration;
    const warning = near && breathWarning(patrol.jumpClock, patrol.jump, patrol.breath);
    guard.getData('breath-glow').setPosition(mouth.x, mouth.y).setVisible(warning);

    // Uzakta geçen atışlar biriktirilmez; zıplarken ateş çıkarılmaz.
    const fireNow = near && grounded && breathMoment(patrol.breathClock, patrol.jumpClock, patrol.jump, patrol.breath);
    if (fireNow) fireFromMouth(scene, mouth, patrol.breath);
    patrol.breathClock = patrol.jumpClock;
}

function fireFromMouth(scene, mouth, breath) {
    const shot = scene.guardianShots.find(item => !item.plan);
    if (!shot) return;
    shot.plan = { ...mouth, startAt: scene.elapsed, speed: breath.speed, range: breath.range };
    shot.sprite.enableBody(true, mouth.x, mouth.y, true, true);
    scene.sound.play('boss-fire', { volume: 0.14 });
}

export function resetGuardianFire(scene) {
    if (!scene.guardianShots) return;
    for (const shot of scene.guardianShots) deactivateShot(shot);
    for (const guard of scene.hazards.getChildren()) {
        const patrol = guard.getData('patrol');
        if (!patrol.breath) continue;
        patrol.jumpClock = 0;
        patrol.breathClock = 0;
        guard.body.reset(guard.x, patrol.baseY);
        guard.getData('breath-glow').setVisible(false);
    }
}
