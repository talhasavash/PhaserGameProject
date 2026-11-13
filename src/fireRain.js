// Bir döngü: önce yerde uyarı, sonra ateş düşer, ardından kısa bir bekleme.
// elapsed oyun duraklatıldığında ilerlemediği için ateşler de durur.
export function fireFrame(elapsed, rain) {
    const phase = (elapsed + rain.offset) % rain.period;
    const y = 100 + Math.max(0, phase - 1000) * rain.speed / 1000;
    return { warning: phase < 1000, falling: phase >= 1000 && y < 510, y };
}

export function createFireRain(scene) {
    scene.fireballs = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.rainDrops = [];
    if (!scene.level.fireRain?.length) return;
    // Küçük doku bir kez üretilir. Her yağmur noktası aynı dokuyu kullanır.
    if (!scene.textures.exists('fireball')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xef7d44); g.fillTriangle(6, 24, 16, 0, 27, 24); g.fillCircle(16, 22, 12);
        g.fillStyle(0xffdf88); g.fillCircle(16, 24, 6);
        g.generateTexture('fireball', 32, 40); g.destroy();
    }
    scene.rainDrops = (scene.level.fireRain || []).map(rain => {
        const sprite = scene.fireballs.create(rain.x, 100, 'fireball').setDepth(14);
        sprite.body.setCircle(10, 6, 14);
        sprite.disableBody(true, true);
        const warning = scene.add.ellipse(rain.x, 516, 50, 8, 0xffa44f, 0.6).setDepth(9);
        return { rain, sprite, warning };
    });
}

export function updateFireRain(scene) {
    for (const { rain, sprite, warning } of scene.rainDrops) {
        const frame = fireFrame(scene.elapsed, rain);
        warning.setVisible(frame.warning);
        warning.setAlpha(0.35 + 0.35 * Math.abs(Math.sin(scene.elapsed / 100)));
        if (frame.falling) {
            sprite.enableBody(true, rain.x, frame.y, true, true);
        } else if (sprite.active) sprite.disableBody(true, true);
    }
}
