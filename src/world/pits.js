// Yalnızca görsel: fizik boşluğu terrain.js içinde aynı x / width ile korunur.
export function createPitArt(scene, gap) {
    const theme = scene.level.theme;
    const height = 600 - scene.level.groundY + 8;
    const key = `pit-${theme}-${gap.width}`;
    if (!scene.textures.exists(key)) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const width = gap.width + 24;
        const shades = theme === 'river'
            ? [0x315b70, 0x29485e, 0x20384f, 0x162b42, 0x0e2038]
            : [0x354858, 0x293b4e, 0x1d2e42, 0x142337, 0x0b192d];
        // Aşağıya doğru genişleyen karanlık; düz taban veya kuyu çerçevesi yok.
        for (let row = 0; row < shades.length; row++) {
            const top = row * height / shades.length;
            const bottom = (row + 1) * height / shades.length;
            const a = 12 * (1 - top / height);
            const b = 12 * (1 - bottom / height);
            g.fillStyle(shades[row]);
            g.fillPoints([{ x: a, y: top }, { x: width - a, y: top }, { x: width - b, y: bottom }, { x: b, y: bottom }], true);
        }
        const stone = theme === 'snow' ? 0x8fabb4 : theme === 'factory' ? 0x617e8d : 0x8e7c68;
        const edge = theme === 'snow' ? 0xf2f7ee : theme === 'lava' ? 0xf2a361 : 0xddc99f;
        const face = [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 20, y: 12 }, { x: 14, y: 27 }, { x: 18, y: 39 }, { x: 8, y: 59 }, { x: 12, y: 72 }, { x: 0, y: height }];
        g.fillStyle(stone); g.fillPoints(face, true);
        g.fillPoints(face.map(point => ({ x: width - point.x, y: point.y })), true);
        g.fillStyle(edge);
        g.fillTriangle(0, 0, 12, 0, 20, 12);
        g.fillTriangle(width, 0, width - 12, 0, width - 20, 12);
        g.lineStyle(2, 0x483e3d, 0.7);
        g.lineBetween(8, 20, 2, 33); g.lineBetween(width - 8, 43, width - 2, 53);
        if (theme === 'lava') {
            g.fillStyle(0xe86f42); g.fillRect(12, height - 14, gap.width, 14);
            g.fillStyle(0xffcf7a); g.fillEllipse(width / 2, height - 10, gap.width * 0.6, 4);
        }
        g.generateTexture(key, width, height); g.destroy();
    }
    scene.add.image(gap.x - 12, scene.level.groundY - 8, key).setOrigin(0).setDepth(3);
}
