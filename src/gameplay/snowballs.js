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
    if (shot.kind === 'shard') return { x: shot.x + shot.vx * age, y: shot.y + shot.vy * age, done: age > 3.2 };
    return { x: shot.x + shot.direction * shot.speed * age,
        y: shot.y - 45 * age + 55 * age * age, done: age > 3.2 };
}

export function createSnowballs(scene) {
    scene.snowballs = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.snowShots = [];
    scene.snowThrowers = scene.hazards.getChildren().filter(enemy => enemy.getData('patrol').snowball);
    if (!scene.snowThrowers.length) return;
    createSnowballTexture(scene);
    cacheTexture(scene, 'ice-shard', 48, 48, g => {
        g.fillStyle(0x7965cb); g.fillTriangle(0, 24, 24, 8, 48, 24); g.fillTriangle(0, 24, 24, 40, 48, 24);
        g.fillStyle(0xc7faff); g.fillTriangle(0, 24, 24, 8, 48, 24);
        g.lineStyle(2, 0xffffff); g.lineBetween(6, 24, 39, 24);
    });
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
        const config = enemy.getData('patrol').snowball;
        const untilShot = enemy.getData('next-snowball') - scene.elapsed;
        if (config.kind === 'shard') enemy.setTint(untilShot > 0 && untilShot < 450 ? 0xffd5ff : 0xffffff);
        if (untilShot > 0) continue;
        enemy.setData('next-snowball', scene.elapsed + config.period);
        if (enemy.alpha < 1 || Math.abs(scene.player.x - enemy.x) > (config.range || 540)) continue;
        const direction = scene.player.x < enemy.x ? -1 : 1;
        for (let i = 0; i < (config.volley || 1); i++) {
            const shot = scene.snowShots.find(item => !item.plan);
            if (!shot) break;
            const shard = config.kind === 'shard';
            shot.plan = { x: enemy.x + direction * 24, y: enemy.y + (shard ? 28 : -2),
                direction, speed: config.speed, startAt: scene.elapsed, kind: config.kind };
            if (shard) {
                const angle = Math.atan2(scene.player.y - shot.plan.y, scene.player.x - shot.plan.x) + (i - 1) * 0.18;
                shot.plan.vx = Math.cos(angle) * config.speed;
                shot.plan.vy = Math.sin(angle) * config.speed;
                shot.sprite.setRotation(angle);
            } else shot.sprite.setRotation(0);
            shot.sprite.setTexture(shard ? 'ice-shard' : 'snowball').setScale(shard ? 0.75 : 0.48);
            shot.sprite.body.setCircle(shard ? 14 : 21, shard ? 10 : 3, shard ? 10 : 3);
            shot.sprite.enableBody(true, shot.plan.x, shot.plan.y, true, true);
        }
    }
}
