// Matter'a özel sabit rampaları ve çıkıntıları fizik koordinatlarında bir kez çizer.
import type {MatterSurface} from './definitions.js';

export function drawMatterTerrain(scene: Phaser.Scene, surfaces: MatterSurface[]) {
    if (!surfaces.length) return;
    const g = scene.add.graphics().setDepth(3);
    g.fillStyle(0x738397); g.lineStyle(4, 0xe1bf88);
    for (const surface of surfaces) {
        if (surface.hidden) continue;
        const points = 'vertices' in surface ? surface.vertices : [
            [-surface.width / 2, -surface.height / 2], [surface.width / 2, -surface.height / 2],
            [surface.width / 2, surface.height / 2], [-surface.width / 2, surface.height / 2]
        ].map(([x, y]) => {
            const angle = surface.angle ?? 0;
            return {x: surface.x + x * Math.cos(angle) - y * Math.sin(angle),
                y: surface.y + x * Math.sin(angle) + y * Math.cos(angle)};
        });
        const vertices = points.map(p => new Phaser.Math.Vector2(p.x, p.y));
        g.fillPoints(vertices, true); g.strokePoints(vertices, true);
    }
}
