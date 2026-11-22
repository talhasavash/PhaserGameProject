// Toplama parlamalarını ve buzda kayma kıvılcımlarını sınırlı Phaser parçacıklarıyla gösterir.

import { cacheTexture } from '../graphics/texture.js';

export function createFeedback(scene) {
    cacheTexture(scene, 'feedback-spark', 12, 12, g => {
        g.fillStyle(0xffffff);
        g.fillTriangle(6, 0, 0, 6, 6, 12); g.fillTriangle(6, 0, 12, 6, 6, 12);
    });
    cacheTexture(scene, 'ice-chip', 24, 24, g => {
        g.fillStyle(0x6dc9f0); g.fillTriangle(2, 15, 7, 2, 22, 10);
        g.fillStyle(0xe5fcff); g.fillTriangle(2, 15, 22, 10, 15, 22);
        g.lineStyle(1.5, 0xffffff); g.lineBetween(7, 2, 22, 10); g.lineBetween(2, 15, 15, 22);
    });
    scene.collectSparks = scene.add.particles(0, 0, 'feedback-spark', {
        emitting: false, speed: { min: 40, max: 120 }, lifespan: 420,
        scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
        tint: [0xffd66f, 0xfff4b0, 0xffffff], maxAliveParticles: 48
    }).setDepth(21);
    scene.iceSparks = scene.add.particles(0, 0, 'ice-chip', {
        emitting: false, speedX: { min: -55, max: 55 }, speedY: { min: -110, max: -45 },
        gravityY: 320, lifespan: 500, scale: { start: 0.55, end: 0.08 },
        rotate: { min: 0, max: 360 },
        alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xb5f2ff], maxAliveParticles: 36
    }).setDepth(16);
    // Kırılma, kayma havuzunu tüketmesin; büyük parçalar daha geniş alana saçılır.
    scene.iceBreakSparks = scene.level.frozenItems ? scene.add.particles(0, 0, 'ice-chip', {
        emitting: false, speed: { min: 90, max: 190 }, angle: { min: 190, max: 350 },
        gravityY: 480, lifespan: 700, scale: { start: 1, end: 0.15 },
        rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0 }, maxAliveParticles: 64
    }).setDepth(22) : null;
    scene.nextIceSpark = 0;
}

export function animateCollection(scene, sprite) {
    scene.tweens.killTweensOf(sprite);
    // Temas hemen kapanır; görsel kısa süre büyüyüp yukarı süzülerek kaybolur.
    sprite.disableBody(true, false);
    scene.collectSparks.emitParticleAt(sprite.x, sprite.y, 9);
    scene.tweens.add({ targets: sprite, y: sprite.y - 38,
        scaleX: sprite.scaleX * 1.55, scaleY: sprite.scaleY * 1.55,
        alpha: 0, duration: 360, ease: 'Quad.easeOut',
        onComplete: () => sprite.setVisible(false) });
}

export function updateIceSparks(scene, onIce) {
    const player = scene.player;
    if (!onIce || scene.falling || Math.abs(player.body.velocity.x) < 45 || scene.elapsed < scene.nextIceSpark) return;
    scene.nextIceSpark = scene.elapsed + 65;
    scene.iceSparks.emitParticleAt(player.x - Math.sign(player.body.velocity.x) * 9, player.body.bottom - 2, 3);
}
