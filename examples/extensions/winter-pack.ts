// Örnek eklenti paketi: yeni kostüm, SVG düşman, hareket, silah ve senaryo eylemi kaydeder.

import { registerCharacterSkin, registerEnemyType, registerEnemyBehavior, registerWeaponType,
    registerScenarioAction } from '../../src/extensions/api.js';
import { cacheTexture } from '../../src/graphics/texture.js';

// Örnekte mevcut SVG'ler kullanılır; yeni çizim geldiğinde yalnızca bu kayıt değişir.
registerCharacterSkin('example-winter-boy', { prefix: 'ice_boy', folder: 'hero' });
registerCharacterSkin('example-winter-girl', { prefix: 'ice_girl', folder: 'hero' });
registerEnemyType('example-snow-guard', {
    asset: { src: 'assets/images/enemy/snowman.svg', width: 64, height: 80 },
    groundOffset: 36, body: { width: 42, height: 64, x: 11, y: 12 }
});

registerEnemyBehavior('example-shuttle', {
    create() { return { direction: 1 }; },
    update(scene, enemy, patrol, delta, { minX, maxX, speed = 65 } = {}, state) {
        if (patrol.hopActive) return;
        if (enemy.x >= maxX) state.direction = -1;
        if (enemy.x <= minX) state.direction = 1;
        patrol.direction = state.direction;
        enemy.setVelocityX(state.direction * speed);
    }
});

registerWeaponType('example-soft-orb', {
    texture: 'example-soft-orb', scale: 0.6, radius: 15, offset: 1,
    defaults: { period: 2600, speed: 170 },
    prepare(scene) {
        cacheTexture(scene, 'example-soft-orb', 32, 32, g => {
            g.fillStyle(0x9b86d0); g.fillCircle(16, 16, 15);
            g.fillStyle(0xc6f7ff); g.fillCircle(13, 12, 10);
        });
    },
    launch(scene, enemy, config) {
        return { x: enemy.x, y: enemy.y, speed: config.speed,
            direction: scene.player.x < enemy.x ? -1 : 1 };
    },
    frame(elapsed, shot) {
        const age = (elapsed - shot.startAt) / 1000;
        return { x: shot.x + shot.direction * shot.speed * age,
            y: shot.y + Math.sin(age * 5) * 18, done: age > 3.2 };
    }
});

registerScenarioAction('example-flash', {
    run(scene) { scene.cameras.main.flash(180, 210, 240, 255); }
});
