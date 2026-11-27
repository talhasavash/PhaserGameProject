// Çukurları karanlık bir boşluk ve doğal zemin kenarlarıyla çizer; fizik boşluğunu terrain.js kurar.

import { cacheTexture } from '../../graphics/texture.js';
import { platformThemes } from './platforms.js';
import { themeStrategies } from '../scenery/themes.js';
import type { Gap } from '../model/contracts.js';

export function createPitArt(scene, gap: Gap) {
    const theme = gap.style || scene.level.theme;
    const height = 600 - scene.level.groundY + 8;
    const key = `pit-${theme}-${gap.width}-${height}${gap.style ? '-styled' : ''}`;
    const width = gap.width + 24;
    cacheTexture(scene, key, width, height, g => {
        if (theme === 'magma') {
            // Lav denizi yüzeye kadar görünür; üzerinde görünmez bir fizik zemini yoktur.
            g.fillStyle(0xa53636); g.fillRect(12, 8, gap.width, height - 8);
            g.fillStyle(0xf57736); g.fillRect(12, 18, gap.width, height - 18);
            g.fillStyle(0xffbf54); g.fillRect(12, 13, gap.width, 9);
            for (let x = 22; x < width - 20; x += 55) {
                g.fillStyle(0xffd475); g.fillEllipse(x, 25 + x % 23, 27, 6);
                g.fillStyle(0xbd4432); g.fillEllipse(x + 15, 54 + x % 13, 18, 9);
            }
            return;
        }
        // Açıklık fizik boşluğuyla aynı yerde başlar; yatay şerit veya basamak çizilmez.
        g.fillStyle(theme === 'river' ? 0x244b60 : 0x293c48);
        g.fillRect(12, 8, gap.width, height - 8);
        // Bir piksellik geçişler, aşağı doğru kesintisiz bir derinlik verir.
        for (let y = 8; y < height; y++) {
            g.fillStyle(0x060d17, (y - 8) / (height - 8) * 0.95);
            g.fillRect(12, y, gap.width, 1);
        }
        // Açık stil seçimi kayıtlı paleti kullanır; eski bölümlerin varsayılan renkleri korunur.
        const palette = themeStrategies.get(theme)?.platform ||
            (gap.style || ['moonwood', 'nightRuins', 'nightKeep', 'glacier', 'iceCave', 'aurora', 'crystalPalace'].includes(theme) ? platformThemes[theme] : null);
        const stone = palette?.body ?? (theme === 'snow' ? 0x8fabb4 : theme === 'factory' ? 0x526d7b : 0x87644e);
        const edge = palette?.edge ?? (theme === 'snow' ? 0xf2f7ee : theme === 'lava' ? 0xf2a361 : theme === 'factory' ? 0xc2ac75 : 0x7dba64);
        // İnce, dik toprak kesitleri; çıkıntılar üzerinde durulacak merdiven oluşturmaz.
        const face = [{ x: 0, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 23 }, { x: 7, y: 39 }, { x: 10, y: 55 }, { x: 5, y: height }, { x: 0, y: height }];
        g.fillStyle(stone); g.fillPoints(face, true);
        g.fillPoints(face.map(point => ({ x: width - point.x, y: point.y })), true);
        g.fillStyle(edge);
        g.fillPoints([{ x: 0, y: 1 }, { x: 8, y: 2 }, { x: 12, y: 8 }, { x: 9, y: 14 }, { x: 5, y: 9 }, { x: 0, y: 10 }], true);
        g.fillPoints([{ x: width, y: 1 }, { x: width - 8, y: 2 }, { x: width - 12, y: 8 }, { x: width - 9, y: 14 }, { x: width - 5, y: 9 }, { x: width, y: 10 }], true);
        g.lineStyle(1, 0x342d32, 0.65);
        g.lineBetween(3, 24, 7, 32);
        g.lineBetween(width - 3, 49, width - 7, 58);
        if (theme === 'lava') {
            g.fillStyle(0xe86f42); g.fillRect(12, height - 14, gap.width, 14);
            g.fillStyle(0xffcf7a); g.fillEllipse(width / 2, height - 10, gap.width * 0.6, 4);
        }
    });
    scene.add.image(gap.x - 12, scene.level.groundY - 8, key).setOrigin(0).setDepth(3);
}
