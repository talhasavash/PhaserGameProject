// Ateş yalnızca muhafız yerdeyken çıkar; zıplama aralığı geçiş için boş bırakılır.
export function breathMoment(before, after, jump, breath) {
    return breath.shots.some(time => {
        const threshold = jump.duration + time;
        return Math.floor((after + jump.offset - threshold) / jump.period) >
            Math.floor((before + jump.offset - threshold) / jump.period);
    });
}

export function breathWarning(clock, jump, breath) {
    const phase = (clock + jump.offset) % jump.period;
    return breath.shots.some(time => jump.duration + time - phase > 0 && jump.duration + time - phase <= 350);
}

export function guardianShotFrame(elapsed, shot) {
    const age = Math.max(0, elapsed - shot.startAt);
    const distance = age * shot.speed / 1000;
    return { x: shot.x - distance, y: shot.y + Math.min(32, age * 0.1), done: distance >= shot.range };
}

function mouthOf(guard) {
    return { x: guard.x - 34 * guard.scaleX, y: guard.y + 18 * guard.scaleY };
}

export function createGuardianFire(scene) {
    scene.guardianFlames = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.guardianShots = [];
    const guards = scene.hazards.getChildren().filter(guard => guard.getData('patrol').breath);
    if (guards.length === 0) return;
    if (!scene.textures.exists('guardian-flame')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xef7c42); g.fillTriangle(44, 2, 8, 14, 44, 26); g.fillCircle(13, 14, 12);
        g.fillStyle(0xffd268); g.fillEllipse(17, 14, 26, 15);
        g.fillStyle(0xfff0bd); g.fillEllipse(11, 14, 12, 8);
        g.generateTexture('guardian-flame', 44, 28); g.destroy();
    }
    for (let i = 0; i < 3; i++) {
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
    for (const shot of scene.guardianShots) {
        if (!shot.plan) continue;
        const frame = guardianShotFrame(scene.elapsed, shot.plan);
        if (frame.done) { shot.sprite.disableBody(true, true); shot.plan = null; }
        else shot.sprite.body.reset(frame.x, frame.y);
    }
    for (const guard of scene.hazards.getChildren()) {
        const patrol = guard.getData('patrol');
        if (!patrol.breath) continue;
        const mouth = mouthOf(guard);
        const near = scene.player.x < guard.x && guard.x - scene.player.x < 500;
        const grounded = (patrol.jumpClock + patrol.jump.offset) % patrol.jump.period >= patrol.jump.duration;
        guard.getData('breath-glow').setPosition(mouth.x, mouth.y).setVisible(near && breathWarning(patrol.jumpClock, patrol.jump, patrol.breath));
        if (near && grounded && breathMoment(patrol.breathClock, patrol.jumpClock, patrol.jump, patrol.breath)) {
            const shot = scene.guardianShots.find(item => !item.plan);
            if (shot) {
                shot.plan = { ...mouth, startAt: scene.elapsed, speed: patrol.breath.speed, range: patrol.breath.range };
                shot.sprite.enableBody(true, mouth.x, mouth.y, true, true);
                scene.sound.play('boss-fire', { volume: 0.14 });
            }
        }
        patrol.breathClock = patrol.jumpClock;
    }
}

export function resetGuardianFire(scene) {
    if (!scene.guardianShots) return;
    for (const shot of scene.guardianShots) { shot.plan = null; shot.sprite.disableBody(true, true); }
    for (const guard of scene.hazards.getChildren()) {
        const patrol = guard.getData('patrol');
        if (!patrol.breath) continue;
        patrol.jumpClock = 0;
        patrol.breathClock = 0;
        guard.body.reset(guard.x, patrol.baseY);
        guard.getData('breath-glow').setVisible(false);
    }
}
