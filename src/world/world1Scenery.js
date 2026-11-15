const palettes = {
    lava: { sky: '#422d43', far: 0x654055, near: 0x91505a, floor: 0x473b4d, trim: 0xf2a361 },
    factory: { sky: '#b4cbd0', far: 0x89a9b0, near: 0x577d8b, floor: 0x3e5969, trim: 0xd9bd70 },
    castle: { sky: '#252f50', far: 0x394363, near: 0x4e5478, floor: 0x41415e, trim: 0xb0a1cb },
    abyss: { sky: '#a6ccd5', far: 0x83a7b5, near: 0x617f91, floor: 0x726a60, trim: 0xe0c99d }
};

function texture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return;
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
}

export function createWorldOneScenery(scene, width, theme) {
    const p = palettes[theme];
    if (!p) return false;
    scene.cameras.main.setBackgroundColor(p.sky);
    texture(scene, `${theme}-skyline`, 512, 512, g => {
        g.fillStyle(p.far);
        if (theme === 'abyss') {
            for (const x of [-100, 180, 450]) {
                g.fillTriangle(x - 170, 512, x, 160, x + 190, 512);
                g.fillStyle(0xc7dae0, 0.6); g.fillTriangle(x - 30, 220, x, 160, x + 34, 220);
                g.fillStyle(p.far);
            }
        } else if (theme === 'lava') {
            for (const x of [-100, 180, 450]) g.fillTriangle(x - 150, 512, x, 190, x + 180, 512);
            g.fillStyle(p.trim, 0.65); g.fillEllipse(190, 360, 390, 80);
        } else {
            for (let x = 0; x < 512; x += 100) {
                const top = 160 + (x % 3) * 55;
                g.fillRect(x, top, 74, 512 - top);
                if (theme === 'castle') g.fillTriangle(x - 8, top, x + 37, top - 64, x + 82, top);
                else g.fillRect(x + 16, top - 55, 22, 55);
                g.fillStyle(p.trim, 0.4);
                for (let y = top + 35; y < 480; y += 66) g.fillRoundedRect(x + 22, y, 26, 32, 10);
                g.fillStyle(p.far);
            }
        }
    });
    texture(scene, `${theme}-walls`, 512, 256, g => {
        g.fillStyle(p.near);
        if (theme === 'abyss') {
            for (let x = -60; x < 560; x += 140) {
                const top = 90 + (x + 60) % 80;
                g.fillRect(x, top, 95, 256 - top);
                g.fillTriangle(x, top, x + 18, top - 24, x + 60, top);
                g.fillStyle(p.trim, 0.5); g.fillRect(x + 10, top + 10, 68, 5); g.fillStyle(p.near);
            }
        } else if (theme === 'lava') {
            for (let x = -50; x < 600; x += 130) g.fillTriangle(x - 80, 256, x, 60, x + 120, 256);
            g.lineStyle(5, p.trim, 0.7); g.lineBetween(130, 90, 155, 180); g.lineBetween(155, 180, 138, 245);
        } else {
            for (let x = 0; x < 512; x += 128) {
                g.fillRect(x + 10, 0, 14, 256);
                g.fillRect(x, 4, 48, 12);
                if (theme === 'castle') {
                    g.fillRect(x + 24, 150, 104, 106);
                    g.fillEllipse(x + 77, 150, 104, 100);
                }
            }
            g.lineStyle(8, p.trim, 0.35); g.lineBetween(0, 56, 512, 56);
            if (theme === 'factory') { g.lineBetween(70, 10, 70, 210); g.lineBetween(70, 210, 380, 210); }
        }
    });
    texture(scene, `${theme}-floor`, 256, 128, g => {
        g.fillStyle(p.floor); g.fillRect(0, 0, 256, 128);
        g.fillStyle(p.trim); g.fillRect(0, 0, 256, 8);
        g.lineStyle(2, p.near);
        if (theme === 'abyss') {
            for (const y of [26, 58, 94]) {
                g.lineBetween(0, y, 80, y - 8); g.lineBetween(80, y - 8, 160, y + 6); g.lineBetween(160, y + 6, 256, y - 2);
            }
            g.lineBetween(110, 8, 100, 24); g.lineBetween(205, 56, 192, 90);
        } else for (let x = 0; x < 256; x += 64) { g.strokeRect(x, 16, 60, 30); g.strokeRect(x + 32, 52, 60, 30); }
        if (theme === 'factory') {
            g.fillStyle(0xd9bd70);
            for (let x = 0; x < 256; x += 32) g.fillTriangle(x, 8, x + 16, 8, x + 8, 22);
        }
    });
    scene.add.tileSprite(0, 8, width + 1024, 512, `${theme}-skyline`).setOrigin(0).setScrollFactor(0.25).setDepth(-60);
    scene.add.tileSprite(0, 264, width + 1024, 256, `${theme}-walls`).setOrigin(0).setScrollFactor(0.55).setDepth(-30);
    scene.add.tileSprite(0, 520, width, 80, `${theme}-floor`).setOrigin(0).setDepth(-4);
    if (theme === 'factory') createGears(scene, width);
    if (theme === 'castle') {
        scene.add.circle(650, 150, 48, 0xe6e0ba).setScrollFactor(0.08).setDepth(-70);
        scene.add.circle(670, 137, 44, 0x252f50).setScrollFactor(0.08).setDepth(-69);
    }
    if (theme === 'lava') {
        texture(scene, 'lava-glow', 256, 32, g => {
            g.fillStyle(0xf28550); g.fillRect(0, 0, 256, 32);
            g.fillStyle(0xffd17c);
            for (let x = 0; x < 256; x += 32) g.fillEllipse(x, 12 + x % 3, 24, 6);
        });
        const flow = scene.add.tileSprite(0, 568, width, 32, 'lava-glow').setOrigin(0).setDepth(-2);
        scene.tweens.add({ targets: flow, tilePositionX: 256, duration: 4000, repeat: -1 });
    }
    return true;
}

function createGears(scene, width) {
    texture(scene, 'factory-gear', 128, 128, g => {
        g.fillStyle(0x3b6071); g.fillCircle(64, 64, 42);
        for (let i = 0; i < 12; i++) {
            const angle = i * Math.PI / 6;
            g.fillCircle(64 + Math.cos(angle) * 41, 64 + Math.sin(angle) * 41, 9);
        }
        g.lineStyle(8, 0xb7c7bb); g.strokeCircle(64, 64, 27);
        g.fillStyle(0xd9bd70); g.fillCircle(64, 64, 9);
    });
    for (let x = 300; x < width; x += 650) {
        const gear = scene.add.image(x, 290, 'factory-gear').setScrollFactor(0.65).setDepth(-20);
        scene.tweens.add({ targets: gear, angle: 360, duration: 6000, repeat: -1 });
    }
}

// World 1'de farklı çıkışlar: lav geçidi, fabrika asansörü ve kale kapısı.
export function createWorldGate(scene, x, theme) {
    const p = palettes[theme];
    const add = scene.add;
    const factory = theme === 'factory';
    add.rectangle(x, 454, 140, 132, p.near).setDepth(5);
    if (!factory) add.ellipse(x, 390, 140, 100, p.near).setDepth(5);
    add.rectangle(x, 465, 94, 110, 0x242f44).setStrokeStyle(6, p.trim).setDepth(6);
    if (factory) {
        add.rectangle(x, 396, 164, 18, p.trim).setDepth(7);
        for (const offset of [-55, 55]) add.circle(x + offset, 380, 12, 0x526d7c).setDepth(7);
    } else {
        add.text(x, 354, '☾', { fontSize: '34px', color: '#edd9a5' }).setOrigin(0.5).setDepth(7);
    }
    const glow = add.ellipse(x, 465, 76, 100, theme === 'lava' ? 0xffc18b : 0xb5eddf, 0.65).setDepth(7).setVisible(false);
    const panels = [];
    for (const side of [-1, 1]) {
        const panel = add.container(x + side * 22, 466).setDepth(8);
        panel.add(add.rectangle(0, 0, 42, 102, p.floor).setStrokeStyle(2, p.trim));
        if (theme === 'castle') {
            for (const offset of [-12, 0, 12]) panel.add(add.rectangle(offset, 0, 4, 98, p.trim));
        } else panel.add(add.rectangle(0, -8, 22, 36, p.trim, 0.75));
        panels.push(panel);
    }
    return { open() {
        glow.setVisible(true);
        for (let i = 0; i < panels.length; i++) {
            const motion = theme === 'castle' ? { y: 365 } : { x: x + (i === 0 ? -58 : 58), scaleX: 0.25 };
            scene.tweens.add({ targets: panels[i], ...motion, duration: 600, ease: 'Sine.easeOut' });
        }
    } };
}
