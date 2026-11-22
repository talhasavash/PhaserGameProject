// Çalışan yeni dünya örneği; menüye otomatik eklenmez. Kopyalayıp worlds.js listesine kaydet.

import { defineLevel, defineWorld, stairs, stars } from '../src/world/model/definitions.js';
import { defineEnemy } from '../src/actors/enemies/EnemyCatalog.js';

const firstLevel = defineLevel({
    template: 'standard',
    name: 'Yeni Yolculuk', width: 2800,
    platforms: stairs({ x: 400, y: 440, count: 3, width: 150 }),
    fruits: stars([{ x: 470, y: 405 }, { x: 650, y: 325 }, { x: 830, y: 245 }]),
    gaps: [{ x: 1300, width: 130 }],
    enemies: [defineEnemy('snowman', { x: 1650,
        behaviors: { patrol: { minX: 1500, maxX: 1800, speed: 45 },
            visibility: { visibleMs: 3000, hiddenMs: 2500 } } })]
});

export const exampleWorld = defineWorld({
    id: 6, title: 'Yeni Dünya', count: 15,
    defaults: { theme: 'moonwood' },
    menu: { image: 'assets/images/scene/menu-world2.svg', color: '#18294c' },
    levels: [firstLevel]
});
