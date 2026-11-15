// Gökyüzünden düşen ateş toplarının rastgele konumlarını, zamanlamasını ve hareketini yönetir.
import { cacheTexture } from '../graphics/texture.js';
const WARNING_MS = 1500;

export function fireWait(rain, random = Math.random) {
    return Math.max(8000, rain.period * (0.9 + random() * 0.5));
}

// Rastgele yer seçilirken başlangıç, cami ve dinlenme alanları korunur.
export function chooseFireX(level, playerX, random = Math.random, occupied = []) {
    const left = Math.max(180, playerX - 180);
    const right = Math.min(level.key.x - 100, playerX + 500);
    if (right <= left) return null;
    const safe = [level.spawn.x, level.checkpoint.x, level.exit.x, ...level.fountains.map(f => f.x)];
    for (let attempt = 0; attempt < 16; attempt++) {
        const x = left + random() * (right - left);
        const onGround = (level.gaps || []).every(gap => x < gap.x - 30 || x > gap.x + gap.width + 30);
        if (onGround && safe.every(point => Math.abs(x - point) > 110) && occupied.every(point => Math.abs(x - point) > 90)) return x;
    }
    return null; // Uygun yer yoksa bu atışı beklet; güvenli alanı bozma.
}

export function fireFrame(elapsed, plan) {
    const age = elapsed - plan.startAt;
    const y = 80 + Math.max(0, age - WARNING_MS) * plan.speed / 1000;
    return { warning: age >= 0 && age < WARNING_MS, falling: age >= WARNING_MS && y < 510, y, done: age >= WARNING_MS && y >= 510 };
}

export function createFireRain(scene) {
    scene.fireballs = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.rainDrops = [];
    if (!scene.level.fireRain?.length) return;
    cacheTexture(scene, 'fireball', 32, 40, g => {
        g.fillStyle(0xef7d44); g.fillTriangle(6, 24, 16, 0, 27, 24); g.fillCircle(16, 22, 12);
        g.fillStyle(0xffdf88); g.fillCircle(16, 24, 6);
    });
    // Aynı anda yalnızca bir ateş: yeni atış, önceki bittikten uzun süre sonra gelir.
    scene.rainDrops = scene.level.fireRain.slice(0, 1).map(rain => {
        const sprite = scene.fireballs.create(0, 80, 'fireball').setDepth(14);
        sprite.body.setCircle(10, 6, 14);
        sprite.disableBody(true, true);
        return { rain, sprite, plan: null, nextAt: 600 + rain.offset };
    });
}

export function updateFireRain(scene) {
    for (const drop of scene.rainDrops) {
        if (!drop.plan && scene.elapsed >= drop.nextAt) {
            const occupied = scene.rainDrops.filter(other => other.plan).map(other => other.plan.x);
            const x = chooseFireX(scene.level, scene.player.x, Math.random, occupied);
            drop.nextAt = scene.elapsed + 600;
            if (x !== null) drop.plan = { x, startAt: scene.elapsed, speed: drop.rain.speed * (0.85 + Math.random() * 0.3) };
        }
        if (!drop.plan) continue;
        const frame = fireFrame(scene.elapsed, drop.plan);
        if (frame.falling) drop.sprite.enableBody(true, drop.plan.x, frame.y, true, true);
        else if (drop.sprite.active) drop.sprite.disableBody(true, true);
        if (frame.done) {
            drop.plan = null;
            drop.nextAt = scene.elapsed + fireWait(drop.rain);
        }
    }
}
