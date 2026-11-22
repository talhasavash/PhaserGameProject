// Kayıtlı silahları bütün düşmanlarla kullanır; altı Phaser fizik gövdesini yeniden kullanır.

import { resolveWeapon } from './WeaponCatalog.js';
import { cacheTexture } from '../../graphics/texture.js';

export function createEnemyWeapons(scene) {
    scene.enemyProjectiles = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.weaponShots = [];
    for (const enemy of scene.hazards.getChildren()) {
        const patrol = enemy.getData('patrol');
        enemy.setData('initial-weapon', structuredClone({ weapon: patrol.weapon, snowball: patrol.snowball }));
    }
    scene.weaponUsers = scene.hazards.getChildren().filter(enemy => resolveWeapon(enemy.getData('patrol')));
    if (!scene.weaponUsers.length) return;
    const definitions = new Set<import('../../world/model/contracts.js').WeaponType>(scene.weaponUsers.map(enemy => resolveWeapon(enemy.getData('patrol'))!.definition));
    for (const definition of definitions) definition.prepare?.(scene);
    const first = definitions.values().next().value;
    createPool(scene, first);
    scene.weaponUsers.forEach((enemy, index) => {
        const { config } = resolveWeapon(enemy.getData('patrol'))!;
        enemy.setData('next-shot', config.initialDelay ?? 1800 + index * 900);
    });
}

// Can bitip karakter geri geldiğinde senaryonun değiştirdiği silahları ilk hâline döndür.
export function resetEnemyWeapons(scene) {
    if (!scene.weaponShots) return;
    for (const shot of scene.weaponShots) {
        shot.sprite.disableBody(true, true);
        shot.plan = null;
    }
    scene.weaponUsers.length = 0;
    for (const enemy of scene.hazards.getChildren()) {
        const initial = enemy.getData('initial-weapon');
        if (!initial) continue;
        Object.assign(enemy.getData('patrol'), structuredClone(initial));
        const weapon = resolveWeapon(enemy.getData('patrol'));
        if (!weapon) continue;
        const index = scene.weaponUsers.length;
        scene.weaponUsers.push(enemy);
        enemy.setData('next-shot', scene.elapsed + (weapon.config.initialDelay ?? 1800 + index * 900));
    }
}

function createPool(scene, first) {
    if (scene.weaponShots.length) return;
    for (let i = 0; i < 6; i++) {
        const sprite = scene.enemyProjectiles.create(0, 0, first.texture).setScale(first.scale ?? 1).setDepth(14);
        sprite.body.setCircle(first.radius ?? 10, first.offset ?? 0, first.offset ?? 0);
        sprite.disableBody(true, true);
        scene.weaponShots.push({ sprite, plan: null });
    }
}

// Senaryo bir düşmanın silahını değiştirebilir; yeni bir havuz veya update koşulu gerekmez.
export function equipEnemyWeapon(scene, enemy, selection) {
    const patrol = enemy.getData('patrol');
    const weapon = resolveWeapon({ weapon: selection });
    weapon?.definition.prepare?.(scene);
    patrol.weapon = selection;
    if (!weapon) return;
    createPool(scene, weapon.definition);
    if (!scene.weaponUsers.includes(enemy)) scene.weaponUsers.push(enemy);
    enemy.setData('next-shot', scene.elapsed + (weapon.config.initialDelay ?? weapon.config.period));
}

export function updateEnemyWeapons(scene) {
    for (const shot of scene.weaponShots) {
        if (!shot.plan) continue;
        const frame = shot.definition.frame(scene.elapsed, shot.plan, scene);
        if (frame.done || frame.y > scene.level.groundY || Math.abs(frame.x - scene.player.x) > 900) {
            shot.sprite.disableBody(true, true);
            shot.plan = null;
        } else {
            shot.sprite.body.reset(frame.x, frame.y);
            if (frame.rotation !== undefined) shot.sprite.setRotation(frame.rotation);
        }
    }
    for (const enemy of scene.weaponUsers) {
        const weapon = resolveWeapon(enemy.getData('patrol'));
        if (!weapon) continue;
        const { definition, config } = weapon;
        const untilShot = enemy.getData('next-shot') - scene.elapsed;
        if (definition.warningTint) enemy.setTint(untilShot > 0 && untilShot < 450 ? definition.warningTint : 0xffffff);
        if (untilShot > 0) continue;
        enemy.setData('next-shot', scene.elapsed + config.period);
        if (enemy.alpha < 1 || Math.abs(scene.player.x - enemy.x) > config.range) continue;
        if (definition.canFire && !definition.canFire(scene, enemy, config)) continue;
        for (let i = 0; i < config.volley; i++) {
            const shot = scene.weaponShots.find(item => !item.plan);
            if (!shot) break;
            shot.definition = definition;
            shot.plan = { ...definition.launch(scene, enemy, config, i), startAt: scene.elapsed };
            shot.sprite.setData('projectile', { type: config.type, config, shooter: enemy });
            shot.sprite.setRotation(shot.plan.angle ?? 0);
            shot.sprite.setTexture(definition.texture).setScale(definition.scale ?? 1);
            shot.sprite.body.setCircle(definition.radius ?? 10, definition.offset ?? 0, definition.offset ?? 0);
            shot.sprite.enableBody(true, shot.plan.x, shot.plan.y, true, true);
        }
    }
}


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
    cacheTexture(scene, 'guardian-flame', 44, 28, g => {
        g.fillStyle(0xef7c42);
        g.fillTriangle(44, 2, 8, 14, 44, 26);
        g.fillCircle(13, 14, 12);
        g.fillStyle(0xffd268);
        g.fillEllipse(17, 14, 26, 15);
        g.fillStyle(0xfff0bd);
        g.fillEllipse(11, 14, 12, 8);
    });
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
