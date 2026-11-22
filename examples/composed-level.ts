// Bağımsız parçaları birleştiren oynanabilir bölüm örneği; mevcut menüye kendiliğinden eklenmez.

import './extensions/winter-pack.js';
import { defineLevel, stars } from '../src/world/model/definitions.js';
import { defineEnemy } from '../src/actors/enemies/EnemyCatalog.js';

export const composedLevel = defineLevel({
    name: 'Karlı Ormandaki Muhafızlar', width: 4200,
    // Standart şablon nesne eklemez, yerleşimi veya düşman hızlarını değiştirmez.
    environment: {
        background: 'moonwood', platformStyle: 'snow',
        weather: { type: 'snow', intensity: 0.8, wind: -10 }
    },
    player: { costume: { boy: 'example-winter-boy', girl: 'example-winter-girl' } },
    platforms: [
        { x: 400, y: 430, width: 230, ice: true },
        { x: 1450, y: 405, width: 230, ice: false, style: 'moonwood' },
        { x: 2800, y: 400, width: 220, ice: true }
    ],
    fruits: [
        ...stars([{ x: 470, y: 395 }, { x: 1510, y: 370 }, { x: 2860, y: 365 }]),
        { id: 'apple-1', type: 'apple', x: 1150, y: 480 },
        { id: 'pear-1', type: 'pear', x: 2350, y: 480 }
    ],
    enemies: [
        defineEnemy('example-snow-guard', {
            id: 'gate-guard', x: 1950,
            movement: { type: 'patrol', minX: 1850, maxX: 2120, speed: 45 },
            behaviors: { hop: { walkMs: 2500, pauseMs: 350, height: 55, duration: 700 } },
            weapon: { type: 'snowball', period: 3000, speed: 190 }
        }),
        defineEnemy('example-snow-guard', {
            x: 3300, movement: { type: 'chase', minX: 3170, maxX: 3500, range: 300, speed: 70 },
            weapon: { type: 'bullet', period: 2800, speed: 200 }
        }),
        defineEnemy('penguin', {
            x: 2580, movement: { type: 'example-shuttle', minX: 2480, maxX: 2660, speed: 55 },
            weapon: { type: 'example-soft-orb' }
        })
    ],
    gaps: [{ x: 850, width: 130 }, { x: 2250, width: 140 }],
    ice: [{ x: 1000, width: 230 }, { x: 3050, width: 200 }],
    scenarios: [{ type: 'zones', zones: [{
        x: 1700, width: 350,
        actions: [
            { type: 'weapon', enemyId: 'gate-guard', weapon: { type: 'bullet', period: 2400, speed: 200 } },
            { type: 'example-flash' }
        ]
    }] }]
});
