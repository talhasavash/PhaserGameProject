// Kardan adamların kar topu atışlarını küçük, tekrar kullanılan bir fizik havuzuyla yönetir.
import { cacheTexture } from '../graphics/texture.js';

export function createSnowballTexture(scene) {
    cacheTexture(scene, 'snowball', 48, 48, g => {
        g.fillStyle(0x8ebed5); g.fillCircle(24, 24, 23);
        g.fillStyle(0xe4f5ff); g.fillCircle(23, 22, 21);
        g.fillStyle(0xffffff); g.fillCircle(18, 16, 10);
        g.fillStyle(0xb5d9e9); g.fillCircle(33, 30, 4); g.fillCircle(18, 34, 3);
    });
}

export function snowballFrame(elapsed, shot) {
    const age = Math.max(0, elapsed - shot.startAt) / 1000;
    return { x: shot.x + shot.direction * shot.speed * age,
        y: shot.y - 45 * age + 55 * age * age, done: age > 3.2 };
}

export function createSnowballs(scene) {
    scene.snowballs = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.snowShots = [];
    scene.snowThrowers = scene.hazards.getChildren().filter(enemy => enemy.getData('patrol').snowball);
    if (!scene.snowThrowers.length) return;
    createSnowballTexture(scene);
    for (let i = 0; i < 6; i++) {
        const sprite = scene.snowballs.create(0, 0, 'snowball').setScale(0.48).setDepth(14);
        sprite.body.setCircle(21, 3, 3);
        sprite.disableBody(true, true);
        scene.snowShots.push({ sprite, plan: null });
    }
    scene.snowThrowers.forEach((enemy, index) => enemy.setData('next-snowball', 1800 + index * 900));
}

export function updateSnowballs(scene) {
    for (const shot of scene.snowShots) {
        if (!shot.plan) continue;
        const frame = snowballFrame(scene.elapsed, shot.plan);
        if (frame.done || frame.y > scene.level.groundY || Math.abs(frame.x - scene.player.x) > 900) {
            shot.sprite.disableBody(true, true);
            shot.plan = null;
        } else shot.sprite.body.reset(frame.x, frame.y);
    }
    for (const enemy of scene.snowThrowers) {
        if (scene.elapsed < enemy.getData('next-snowball')) continue;
        const config = enemy.getData('patrol').snowball;
        enemy.setData('next-snowball', scene.elapsed + config.period);
        if (enemy.alpha < 1 || Math.abs(scene.player.x - enemy.x) > 540) continue;
        const shot = scene.snowShots.find(item => !item.plan);
        if (!shot) continue;
        const direction = scene.player.x < enemy.x ? -1 : 1;
        shot.plan = { x: enemy.x + direction * 24, y: enemy.y - 2,
            direction, speed: config.speed, startAt: scene.elapsed };
        shot.sprite.enableBody(true, shot.plan.x, shot.plan.y, true, true);
    }
}
