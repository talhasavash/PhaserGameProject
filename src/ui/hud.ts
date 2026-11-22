// Canları solda, soluk bölüm numarasını ortada, yıldızları ve puanı sağda gösterir.

import { chapterNumber } from '../world/levels/level.js';

const HEART_COUNT = 3;
const starPoints = Array.from({ length: 10 }, (_, i) => {
    const angle = i * Math.PI / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? 13 : 6;
    return { x: 15 + Math.cos(angle) * radius, y: 15 + Math.sin(angle) * radius };
});
// Bir kalbin dış hattı: aynı şekli dolu ve boş durumda kullanırız.
const heartPoints = Array.from({ length: 48 }, (_, i) => {
    const t = i / 48 * Math.PI * 2;
    return {
        x: 22 + 20 * Math.sin(t) ** 3,
        y: 22 - 1.25 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    };
});

export function createHud(scene) {
    // Kamera kayarken bilgiler ekranda sabit kalır.
    scene.hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);
    scene.hearts = Array.from({ length: HEART_COUNT }, (_, i) => {
        const heart = scene.add.graphics({ x: i * 34, y: 0 }).setScale(0.8);
        scene.hud.add(heart);
        return heart;
    });
    scene.scoreText = scene.add.text(0, 2, '', {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '32px', fontStyle: 'bold',
        color: '#fff9e9', stroke: '#254d46', strokeThickness: 3
    }).setResolution(2).setOrigin(1, 0);
    scene.hud.add(scene.scoreText);
    scene.chapterHud = scene.add.container(0, 0);
    scene.chapterHud.add(scene.add.text(0, 0, `Bölüm ${chapterNumber(scene.levelIndex)}`, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '18px', fontStyle: 'bold',
        color: '#fff9e9', stroke: '#254d46', strokeThickness: 1
    }).setResolution(2).setOrigin(0.5, 0).setAlpha(0.65));
    scene.starHud = scene.add.container(0, 8);
    scene.starIcons = Array.from({ length: 3 }, (_, i) => {
        const star = scene.add.graphics({ x: i * 21, y: 0 }).setScale(0.8);
        scene.starHud.add(star);
        return star;
    });
    scene.hud.add([scene.chapterHud, scene.starHud]);
    if (scene.level?.theme === 'crystalPalace') {
        scene.scoreText.setStyle({ color: '#c9ffff', stroke: '#51417b' });
        scene.chapterHud.list[0].setStyle({ color: '#e6cbff', stroke: '#49376e' });
    }
}

export function centerHud(scene) {
    // Canlar küçük telefonlarda da okunur; puan, mola düğmesinin solunda kalır.
    const hudScale = Math.min(1.1, scene.scale.width / 680);
    scene.hud.setScale(hudScale).setPosition(14 * hudScale, 12 * hudScale);
    scene.scoreText.setX(scene.scale.width / hudScale - 88);
    scene.chapterHud.setX(scene.scale.width / hudScale / 2 - 14);
    scene.starHud.setX(scene.scoreText.x - Math.max(50, scene.scoreText.width) - 78);
    // Zemini aynı yerde tut: zıplarken ekran yukarı-aşağı sallanmasın.
    scene.cameras.main.scrollY = Math.max(0, 600 - scene.scale.height);
    scene.cameras.main.setFollowOffset(-Math.min(190, scene.scale.width * 0.2), 0);
}

export function updateHud(scene) {
    scene.hearts.forEach((heart, i) => {
        heart.clear();
        heart.fillStyle(i < scene.gameState.hearts ? 0xe85750 : 0x294e4c, i < scene.gameState.hearts ? 1 : 0.25);
        heart.fillPoints(heartPoints, true);
        heart.lineStyle(2.5, 0xfff5df, 0.95);
        heart.strokePoints(heartPoints, true);
    });
    scene.scoreText.setText(String(scene.gameState.score));
    scene.starIcons.forEach((star, i) => {
        star.clear();
        star.fillStyle(i < scene.gameState.stars ? 0xffd35c : 0x294e4c, i < scene.gameState.stars ? 1 : 0.15);
        star.fillPoints(starPoints, true);
        star.lineStyle(1.5, 0xffedb4, 0.9);
        star.strokePoints(starPoints, true);
    });
    scene.starHud.setX(scene.scoreText.x - Math.max(50, scene.scoreText.width) - 78);
}
