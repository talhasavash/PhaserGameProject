// Düşmanları kurar; devriyeyi, dikey ağ hareketini, görünmezliği ve boss davranışlarını yönetir.

import { createEnemySprite, defineEnemy } from './EnemyCatalog.js';
import { enemyBehaviors, registerEnemyBehavior, behaviorSelection } from './EnemyCatalog.js';

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
    data = defineEnemy(data.type, data);
    const { sprite, y } = createEnemySprite(scene, data);
    sprite.setData('enemy-id', data.id);
    sprite.setData('patrol', {
        minX: data.minX,
        maxX: data.maxX,
        speed: data.speed,
        type: data.type,
        baseX: data.x,
        baseY: y,
        bob: data.bob || 0,
        grounded: data.y === undefined,
        jump: data.jump,
        hop: data.hop, hopActive: false,
        breath: data.breath,
        snowball: data.snowball,
        weapon: data.weapon,
        jumpClock: 0,
        rage: data.rage || false,
        engagedAt: null,
        direction: 1,
        period: data.period || 2400, offset: data.offset || 0,
        threadTop: data.threadTop ?? 220, visibility: data.visibility
    });
    const components = (data.components || []).map(selection => {
        const { definition, options } = behaviorSelection(selection);
        return { definition, options, state: definition.create?.(scene, sprite, options) };
    });
    sprite.setData('behaviors', [...defaultBehaviors, ...components.map(component => ({
        update(scene, enemy, patrol, delta) {
            component.definition.update(scene, enemy, patrol, delta, component.options, component.state);
        }
    }))]);
    if (components.length) {
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            for (const component of components) component.definition.destroy?.(scene, sprite, component.state);
            scene.events?.off('shutdown', cleanup);
            scene.events?.off('destroy', cleanup);
            sprite.off?.('destroy', cleanup);
        };
        scene.events?.once('shutdown', cleanup);
        scene.events?.once('destroy', cleanup);
        sprite.once?.('destroy', cleanup);
    }
    updateVisibility(scene, sprite, sprite.getData('patrol'));
}

// Bileşenler aynı update sözleşmesini kullanır; yeni davranış tek kayıtla eklenir.
registerEnemyBehavior('jump', { update(scene, enemy, patrol, delta) { if (patrol.jump) updateGuardJump(scene, enemy, patrol, delta); } });
registerEnemyBehavior('patrol', { update: updatePatrol });
registerEnemyBehavior('appearance', { update(scene, enemy, patrol, delta) { updateHazardAppearance(enemy, patrol, delta); } });
registerEnemyBehavior('visibility', { update: updateVisibility });
const defaultBehaviors = ['jump', 'patrol', 'appearance', 'visibility'].map(name => enemyBehaviors.get(name));

export function updateHazards(scene, delta) {
    for (const hazard of scene.hazards.getChildren()) {
        const patrol = hazard.getData('patrol');
        const behaviors = hazard.getData('behaviors') || defaultBehaviors;
        for (const behavior of behaviors) behavior.update(scene, hazard, patrol, delta);
    }
}

function updatePatrol(scene, hazard, patrol) {
    if (patrol.type === 'spider') {
        // Ağın bağlandığı x sabittir; örümcek yalnızca aynı ip boyunca inip çıkar.
        const wave = Math.sin((scene.elapsed + patrol.offset) / patrol.period * Math.PI * 2);
        hazard.body.reset(patrol.baseX, patrol.baseY + wave * patrol.bob);
        hazard.setVelocityX(0);
        hazard.setVelocityY(0);
        return;
    }
    if (patrol.hop && patrol.grounded && !patrol.jump) {
        const step = patrolHop(scene.elapsed, patrol.hop);
        if (step.stopped) {
            hazard.body.reset(hazard.x, patrol.baseY - step.lift);
            hazard.setVelocityX(0);
            hazard.setVelocityY(0);
            patrol.hopActive = true;
            return;
        }
        if (patrol.hopActive) hazard.body.reset(hazard.x, patrol.baseY);
        patrol.hopActive = false;
    }
    if (hazard.x >= patrol.maxX) patrol.direction = -1;
    if (hazard.x <= patrol.minX) patrol.direction = 1;
    hazard.setVelocityX(patrol.speed * patrol.direction);
    if (patrol.bob) {
        const wave = Math.sin(scene.elapsed / 550);
        const targetY = patrol.baseY + (patrol.grounded ? -Math.abs(wave) : wave) * patrol.bob;
        hazard.setVelocityY((targetY - hazard.y) * 10);
    }
}

// Yürü → kısa süre bekle → bulunduğun yerde zıpla → devriyeye devam et.
export function patrolHop(elapsed, { walkMs = 2400, pauseMs = 350, duration = 650, height = 65, offset = 0 }) {
    const phase = (elapsed + offset) % (walkMs + pauseMs + duration);
    if (phase < walkMs) return { stopped: false, lift: 0 };
    if (phase < walkMs + pauseMs) return { stopped: true, lift: 0 };
    const t = (phase - walkMs - pauseMs) / duration;
    return { stopped: true, lift: 4 * height * t * (1 - t) };
}

function updateHazardAppearance(hazard, patrol, delta) {
    const thread = hazard.getData('thread');
    if (thread) thread.setTo(0, patrol.threadTop, 0, hazard.y - 12);
    if (patrol.type === 'ball' || patrol.type === 'wheel') {
        hazard.rotation += patrol.direction * delta * 0.003;
    } else {
        hazard.setFlipX(patrol.direction < 0);
    }
}

// Süreler ms: görünmez düşman devriyeye devam eder, ancak görünmeden hasar vermez.
export function hazardVisibility(elapsed, { visibleMs = 2800, hiddenMs = 1800, fadeMs = 220, offset = 0 }) {
    const visible = Math.max(1, visibleMs);
    const hidden = Math.max(0, hiddenMs);
    const phase = ((elapsed + offset) % (visible + hidden) + visible + hidden) % (visible + hidden);
    const fade = Math.max(0, Math.min(fadeMs, visible / 2));
    const alpha = phase >= visible ? 0 : fade === 0 ? 1 : Math.min(1, phase / fade, (visible - phase) / fade);
    return { alpha, collidable: alpha >= 1 };
}

function updateVisibility(scene, hazard, patrol) {
    if (!patrol.visibility) return;
    const state = hazardVisibility(scene.elapsed, patrol.visibility);
    hazard.setAlpha(state.alpha);
    hazard.body.checkCollision.none = !state.collidable;
    const thread = hazard.getData('thread');
    if (thread) thread.setAlpha(state.alpha * 0.7);
    const shadow = hazard.getData('shadow');
    if (shadow) shadow.setAlpha(state.alpha * 0.23);
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
    hazard.getData('shadow')?.setPosition(hazard.x, 517);
}

function playGuardSound(scene, hazard, key) {
    const distance = Math.abs(scene.player.x - hazard.x);
    const range = Math.max(500, scene.scale.width * 0.7);
    if (distance >= range) return;
    const volume = (key === 'boss-land' ? 0.24 : 0.14) * (1 - distance / range);
    scene.sound.play(key, { volume });
}

// Yükseldiği aralıkta çocuğun altından koşarak geçebileceği boşluk açılır.
export function bossLift(elapsed, jump) {
    const phase = (elapsed + jump.offset) % jump.period;
    if (phase >= jump.duration) return 0;
    const t = phase / jump.duration;
    return 4 * jump.height * t * (1 - t);
}

// Ses her karede değil, yalnızca yerden ayrılma ve yere basma anında çalar.
export function bossStep(before, after, jump) {
    const previousLift = bossLift(before, jump);
    const lift = bossLift(after, jump);
    let sound: 'boss-jump' | 'boss-land' | null = null;
    if (previousLift <= 0 && lift > 0) sound = 'boss-jump';
    if (previousLift > 0 && lift <= 0) sound = 'boss-land';
    return { lift, sound };
}

// Yakınlık ve bekleme öfkeyi artırır; uzaklaşmak her zaman sakinleştirir.
export function bossMood(elapsed, engagedAt, distance = 450) {
    const proximity = Math.max(0, Math.min(1, 1 - distance / 450));
    const waiting = engagedAt === null ? 0 : Math.max(0, Math.min(1, (elapsed - engagedAt) / 18000));
    const anger = engagedAt === null ? 0 : Math.min(1, proximity * (0.8 + waiting * 0.8));
    const green = Math.round(255 - anger * 138);
    const blue = Math.round(255 - anger * 147);
    return { anger, speed: 1 + anger * 0.6, tint: (255 << 16) | (green << 8) | blue, angry: anger >= 0.5 };
}

export function resetBossRage(guards) {
    for (const guard of guards) {
        const patrol = guard.getData('patrol');
        if (!patrol.rage) continue;
        patrol.engagedAt = null;
        patrol.jumpClock = 0;
        guard.setTint(0xffffff);
        guard.setTexture('ogre-ember');
    }
}
