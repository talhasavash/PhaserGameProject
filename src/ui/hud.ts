// Canları solda, yıldızları ve puanı sağda gösterir; bölüm numarası mola menüsündedir.

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
    scene.starHud = scene.add.container(0, 8);
    scene.starIcons = Array.from({ length: 3 }, (_, i) => {
        const star = scene.add.graphics({ x: i * 21, y: 0 }).setScale(0.8);
        scene.starHud.add(star);
        return star;
    });
    scene.hud.add(scene.starHud);
    if (scene.level?.theme === 'crystalPalace') {
        scene.scoreText.setStyle({ color: '#c9ffff', stroke: '#51417b' });
    }
}

// En yüksek platformda tam zıplama için karaktere ve üst göstergelere yer bırakır.
export function levelViewHeight(level, viewportHeight) {
    const highest = Math.min(level.groundY, ...level.platforms.map(platform => platform.y));
    // Kızgın Güneş gibi üstten takip eden tehlikeler de üst göstergelerin altında görünür kalsın.
    const overheadTop = Math.min(600, ...(level.enemies ?? [])
        .filter(enemy => enemy.components?.some(component =>
            (typeof component === 'string' ? component : component.type) === 'overhead') && typeof enemy.y === 'number')
        .map(enemy => enemy.y - 100));
    const top = Math.max(0, Math.min(highest - 220, overheadTop));
    return Math.max(viewportHeight, level.camera?.visibleHeight ?? 600 - top);
}

export function centerHud(scene) {
    const camera = scene.cameras.main;
    const visibleHeight = levelViewHeight(scene.level, scene.scale.height);
    const zoom = scene.scale.height / visibleHeight;
    camera.setZoom(zoom);
    // Canlar solda, puan sağ kenarda; orta alan saydam mola düğmesine ayrılır.
    const hudScale = Math.min(1.1, scene.scale.width / 680);
    // Kamera uzaklaşsa da can ve puan göstergelerinin ekrandaki boyutu korunur.
    scene.hud.setScale(hudScale / zoom).setPosition(
        (14 * hudScale - scene.scale.width * (1 - zoom) / 2) / zoom,
        (12 * hudScale - scene.scale.height * (1 - zoom) / 2) / zoom);
    scene.scoreText.setX(scene.scale.width / hudScale - 28);
    scene.starHud.setX(scene.scoreText.x - Math.max(50, scene.scoreText.width) - 78);
    // Zemini aynı yerde tut: zıplarken ekran yukarı-aşağı sallanmasın.
    camera.scrollY = Math.max(0, 600 - visibleHeight) + (visibleHeight - scene.scale.height) / 2;
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
