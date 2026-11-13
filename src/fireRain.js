const WARNING_MS = 1500;

// Rastgele yer seçilirken başlangıç, cami ve dinlenme alanları korunur.
export function chooseFireX(level, playerX, random = Math.random, occupied = []) {
    const left = Math.max(180, playerX - 180);
    const right = Math.min(level.key.x - 100, playerX + 500);
    if (right <= left) return null;
    const safe = [level.spawn.x, level.checkpoint.x, level.exit.x, ...level.fountains.map(f => f.x)];
    for (let attempt = 0; attempt < 16; attempt++) {
        const x = left + random() * (right - left);
        if (safe.every(point => Math.abs(x - point) > 110) && occupied.every(point => Math.abs(x - point) > 90)) return x;
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
    if (!scene.textures.exists('fireball')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xef7d44); g.fillTriangle(6, 24, 16, 0, 27, 24); g.fillCircle(16, 22, 12);
        g.fillStyle(0xffdf88); g.fillCircle(16, 24, 6);
        g.generateTexture('fireball', 32, 40); g.destroy();
    }
    scene.rainDrops = scene.level.fireRain.map(rain => {
        const sprite = scene.fireballs.create(0, 80, 'fireball').setDepth(14);
        sprite.body.setCircle(10, 6, 14);
        sprite.disableBody(true, true);
        const warning = scene.add.container(0, 0).setDepth(15).setVisible(false);
        warning.add([
            scene.add.rectangle(0, 300, 16, 430, 0xff315a, 0.2),
            scene.add.ellipse(0, 512, 78, 18, 0xef2550, 0.95).setStrokeStyle(3, 0xfff6bd),
            scene.add.ellipse(0, 512, 40, 8, 0xffe76d),
            scene.add.triangle(0, 475, 0, 34, 20, 0, 40, 34, 0xffe36a).setStrokeStyle(3, 0x99293b),
            scene.add.text(0, 477, '!', { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#7d1833' }).setOrigin(0.5)
        ]);
        return { rain, sprite, warning, plan: null, nextAt: 600 + rain.offset };
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
        drop.warning.setPosition(drop.plan.x, 0).setVisible(frame.warning);
        drop.warning.setAlpha(0.8 + 0.2 * Math.abs(Math.sin(scene.elapsed / 120)));
        if (frame.falling) drop.sprite.enableBody(true, drop.plan.x, frame.y, true, true);
        else if (drop.sprite.active) drop.sprite.disableBody(true, true);
        if (frame.done) {
            drop.plan = null;
            drop.nextAt = scene.elapsed + drop.rain.period * (0.25 + Math.random() * 0.4);
        }
    }
}
