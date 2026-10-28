// Bu dosya sadece bölümün verisidir; hareket veya çarpışma kodu içermez.
// x sağa, y aşağı doğru artar. Platformların y değeri üst yüzeyleridir.
export const garden = {
    name: 'Meyve Bahçesi', width: 3840, groundY: 520,
    spawn: { x: 100, y: 480 },
    checkpoint: { x: 1640, y: 480 },
    key: { x: 3220, y: 477 },
    exit: { x: 3580, y: 468 },
    platforms: [
        { x: 370, y: 430, width: 220 },
        { x: 1100, y: 430, width: 150 },
        { x: 1370, y: 430, width: 220 },
        { x: 2380, y: 430, width: 170 },
        { x: 2720, y: 430, width: 220 }
    ],
    fruits: [
        { id: 'apple-1', type: 'apple', x: 480, y: 394 },
        { id: 'apple-2', type: 'apple', x: 1480, y: 394 },
        { id: 'apple-3', type: 'apple', x: 2830, y: 394 },
        { id: 'bonus-0', type: 'berry', x: 270, y: 480 },
        { id: 'bonus-1', type: 'berry', x: 330, y: 480 },
        { id: 'bonus-2', type: 'bead', x: 660, y: 480 },
        { id: 'bonus-3', type: 'bead', x: 710, y: 480 },
        { id: 'bonus-4', type: 'berry', x: 1140, y: 404 },
        { id: 'bonus-5', type: 'mat', x: 1200, y: 400 },
        { id: 'bonus-6', type: 'bead', x: 2050, y: 480 },
        { id: 'bonus-7', type: 'bead', x: 2100, y: 480 },
        { id: 'bonus-8', type: 'mat', x: 2420, y: 390 },
        { id: 'bonus-9', type: 'berry', x: 2480, y: 394 },
        { id: 'bonus-10', type: 'berry', x: 2980, y: 480 },
        { id: 'bonus-11', type: 'bead', x: 3150, y: 480 }
    ],
    enemies: [
        { type: 'hedgehog', x: 850, minX: 790, maxX: 1010, speed: 65 },
        { type: 'snail', x: 2210, minX: 2140, maxX: 2330, speed: 45 },
        { type: 'hedgehog', x: 2540, minX: 2500, maxX: 2580, speed: 65 }
    ],
    ball: { type: 'ball', x: 3320, minX: 3280, maxX: 3460, speed: 100 },
    belt: { x: 1800, width: 220, speed: -85 },
    fountains: [
        { id: 'fountain-1', x: 1300 },
        { id: 'fountain-2', x: 3070 }
    ]
};
