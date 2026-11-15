// Ekranda sabit duran can, yıldız, anahtar, puan ve ilerleme göstergelerini oluşturup günceller.
const textStyle = { fontFamily: 'Trebuchet MS, sans-serif', color: '#294e4c' };
const HUD_WIDTH = 500;
const HUD_PROGRESS_WIDTH = 76;

// ScrollFactor(0): puan çubuğu kamera kayarken ekranda sabit kalır.
export function createHud(scene) {
    scene.hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);
    // HUD: can ve puan gibi ekran bilgileri. ScrollFactor(0) ile kameradan bağımsız kalır.
    const bg = scene.add.graphics().setScrollFactor(0).setDepth(100);
    bg.fillStyle(0xfffcf0, 0.20);
    bg.fillRoundedRect(0, 0, HUD_WIDTH, 28, 8);
    bg.lineStyle(1, 0x94b7a0, 0.08);
    bg.strokeRoundedRect(0, 0, HUD_WIDTH, 28, 8);
    const label = (x, y, content, size = 16) => {
        const text = scene.add.text(x, y, content, { ...textStyle, fontSize: `${size}px`, fontStyle: 'bold' }).setScrollFactor(0).setDepth(101);
        scene.hud.add(text);
        return text;
    };
    scene.hud.add(bg);
    scene.heartsText = label(14, 5, '', 16);
    scene.hud.add(scene.add.image(100, 14, 'star').setDisplaySize(15, 15).setScrollFactor(0).setDepth(101));
    scene.starText = label(116, 6, '', 14);
    scene.hud.add(scene.add.image(188, 14, 'key').setDisplaySize(21, 13).setScrollFactor(0).setDepth(101));
    scene.keyText = label(203, 6, '', 14);
    scene.scoreText = label(290, 6, '', 14);
    scene.progressTrack = scene.add.rectangle(436, 14, HUD_PROGRESS_WIDTH, 3, 0xdce8d9).setScrollFactor(0).setDepth(101);
    scene.progressFill = scene.add.rectangle(398, 14, 1, 3, 0x649272).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);
    scene.hud.add([scene.progressTrack, scene.progressFill]);
}

export function centerHud(scene) {
    const hudScale = scene.scale.width / 960;
    scene.hud.setScale(hudScale);
    scene.hud.setPosition((scene.scale.width - HUD_WIDTH * hudScale) / 2, 6 * hudScale);
    // Zemini aynı yerde tut: zıplarken ekran yukarı-aşağı sallanmasın.
    scene.cameras.main.scrollY = Math.max(0, 600 - scene.scale.height);
    scene.cameras.main.setFollowOffset(-Math.min(190, scene.scale.width * 0.2), 0);
}

export function updateHud(scene) {
    scene.heartsText.setText('♥'.repeat(scene.gameState.hearts) + '♡'.repeat(3 - scene.gameState.hearts));
    scene.heartsText.setColor('#bd6959');
    scene.starText.setText(`${scene.gameState.stars}/3`);
    scene.keyText.setText(scene.gameState.hasKey ? '✓' : '—');
    scene.scoreText.setText(`☆ ${scene.gameState.score}`);
}

export function updateProgress(scene) {
    const progress = Phaser.Math.Clamp(scene.player.x / scene.level.exit.x, 0, 1);
    scene.progressFill.width = progress * HUD_PROGRESS_WIDTH;
}
