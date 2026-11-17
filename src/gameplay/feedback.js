// Toplama parlamalarını ve buzda kayma kıvılcımlarını sınırlı Phaser parçacıklarıyla gösterir.
import { cacheTexture } from '../graphics/texture.js';

export function createFeedback(scene) {
    cacheTexture(scene, 'feedback-spark', 12, 12, g => {
        g.fillStyle(0xffffff);
        g.fillTriangle(6, 0, 0, 6, 6, 12); g.fillTriangle(6, 0, 12, 6, 6, 12);
    });
    scene.collectSparks = scene.add.particles(0, 0, 'feedback-spark', {
        emitting: false, speed: { min: 40, max: 120 }, lifespan: 420,
        scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
        tint: [0xffd66f, 0xfff4b0, 0xffffff], maxAliveParticles: 48
    }).setDepth(21);
    scene.iceSparks = scene.add.particles(0, 0, 'feedback-spark', {
        emitting: false, speedX: { min: -35, max: 35 }, speedY: { min: -75, max: -25 },
        gravityY: 180, lifespan: 320, scale: { start: 0.45, end: 0 },
        alpha: { start: 0.8, end: 0 }, tint: [0xffffff, 0x9ce7ff], maxAliveParticles: 24
    }).setDepth(16);
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
    scene.iceSparks.emitParticleAt(player.x - Math.sign(player.body.velocity.x) * 9, player.body.bottom - 2, 2);
}
