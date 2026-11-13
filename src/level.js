// Bu dosya sadece bölümün verisidir; hareket veya çarpışma kodu içermez.
// x sağa, y aşağı doğru artar. Platformların y değeri üst yüzeyleridir.
export const garden = {
    name: 'Meyve Bahçesi', theme: 'garden', width: 3840, groundY: 520,
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
        { id: 'bonus-11', type: 'bead', x: 3150, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 960, y: 478 },
        { id: 'crescent-1', type: 'crescent', x: 1730, y: 478 }
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

// Aynı oyun kodu, farklı bölüm verileri. Yüksek platforma alttaki basamaktan çıkılır.
export const courtyard = {
    name: 'Kandilli Cami Avlusu', theme: 'courtyard', width: 4480, groundY: 520,
    spawn: { x: 100, y: 480 }, checkpoint: { x: 2180, y: 480 },
    key: { x: 3940, y: 477 }, exit: { x: 4240, y: 468 },
    platforms: [
        { x: 390, y: 430, width: 200 },
        { x: 1260, y: 430, width: 170 }, { x: 1450, y: 350, width: 180 },
        { x: 2450, y: 430, width: 160 }, { x: 2630, y: 350, width: 170 },
        { x: 3250, y: 430, width: 140 }, { x: 3430, y: 430, width: 120 }
    ],
    fruits: [
        { id: 'apple-1', type: 'apple', x: 480, y: 394 },
        { id: 'apple-2', type: 'apple', x: 1540, y: 314 },
        { id: 'apple-3', type: 'apple', x: 2715, y: 314 },
        { id: 'lantern-1', type: 'lantern', x: 290, y: 478 },
        { id: 'crescent-1', type: 'crescent', x: 680, y: 478 },
        { id: 'bead-1', type: 'bead', x: 1130, y: 480 },
        { id: 'mat-1', type: 'mat', x: 1340, y: 394 },
        { id: 'lantern-2', type: 'lantern', x: 1960, y: 478 },
        { id: 'berry-1', type: 'berry', x: 2290, y: 480 },
        { id: 'crescent-2', type: 'crescent', x: 2510, y: 394 },
        { id: 'bead-2', type: 'bead', x: 2940, y: 480 },
        { id: 'lantern-3', type: 'lantern', x: 3330, y: 394 },
        { id: 'mat-2', type: 'mat', x: 3500, y: 394 },
        { id: 'crescent-3', type: 'crescent', x: 4070, y: 478 }
    ],
    enemies: [
        { type: 'hedgehog', x: 880, minX: 800, maxX: 1080, speed: 95 },
        { type: 'snail', x: 1850, minX: 1770, maxX: 2060, speed: 100 },
        { type: 'hedgehog', x: 2360, minX: 2300, maxX: 2440, speed: 100 }
    ],
    ball: { type: 'ball', x: 3760, minX: 3680, maxX: 3880, speed: 145 },
    extraHazards: [{ type: 'ball', x: 3200, minX: 3160, maxX: 3380, speed: 130 }],
    belt: { x: 3040, width: 280, speed: -115 },
    fountains: [{ id: 'fountain-1', x: 1180 }, { id: 'fountain-2', x: 3590 }]
};

// Çöl yolunda ateşler sabit noktalara düşer; önce yerde bir uyarı görünür.
export const desert = {
    name: 'Hilalli Çöl Yolu', theme: 'desert', width: 4720, groundY: 520,
    spawn: { x: 100, y: 480 }, checkpoint: { x: 2300, y: 480 },
    key: { x: 4160, y: 477 }, exit: { x: 4460, y: 468 },
    platforms: [
        { x: 420, y: 430, width: 200 },
        { x: 1380, y: 430, width: 160 }, { x: 1560, y: 350, width: 190 },
        { x: 2700, y: 430, width: 160 }, { x: 2880, y: 350, width: 180 },
        { x: 3580, y: 430, width: 200 }
    ],
    fruits: [
        { id: 'apple-1', type: 'apple', x: 520, y: 394 },
        { id: 'apple-2', type: 'apple', x: 1650, y: 314 },
        { id: 'apple-3', type: 'apple', x: 2970, y: 314 },
        { id: 'bead-1', type: 'bead', x: 280, y: 478 },
        { id: 'lantern-1', type: 'lantern', x: 1080, y: 478 },
        { id: 'mat-1', type: 'mat', x: 1450, y: 394 },
        { id: 'crescent-1', type: 'crescent', x: 2200, y: 478 },
        { id: 'bead-2', type: 'bead', x: 2510, y: 478 },
        { id: 'lantern-2', type: 'lantern', x: 2770, y: 394 },
        { id: 'mat-2', type: 'mat', x: 3670, y: 394 },
        { id: 'crescent-2', type: 'crescent', x: 4310, y: 478 }
    ],
    enemies: [
        { type: 'snail', x: 820, minX: 760, maxX: 970, speed: 95 },
        { type: 'hedgehog', x: 2000, minX: 1920, maxX: 2130, speed: 110 },
        { type: 'hedgehog', x: 3290, minX: 3200, maxX: 3420, speed: 110 }
    ],
    ball: { type: 'ball', x: 3940, minX: 3860, maxX: 4050, speed: 145 },
    belt: { x: 2380, width: 240, speed: -105 },
    fountains: [{ id: 'fountain-1', x: 1230 }, { id: 'fountain-2', x: 3500 }],
    fireRain: [
        { x: 1060, period: 3400, offset: 0, speed: 270 },
        { x: 2550, period: 3600, offset: 1200, speed: 290 },
        { x: 3790, period: 3400, offset: 600, speed: 300 }
    ]
};

export const moonGarden = {
    name: 'Yıldızlı Kubbe Bahçesi', theme: 'night', width: 5040, groundY: 520,
    spawn: { x: 100, y: 480 }, checkpoint: { x: 2440, y: 480 },
    key: { x: 4450, y: 477 }, exit: { x: 4770, y: 468 },
    platforms: [
        { x: 400, y: 430, width: 150 }, { x: 580, y: 350, width: 180 },
        { x: 1570, y: 430, width: 140 }, { x: 1740, y: 350, width: 180 },
        { x: 2870, y: 430, width: 140 }, { x: 3040, y: 350, width: 180 },
        { x: 3710, y: 430, width: 150 }, { x: 3890, y: 350, width: 170 }
    ],
    fruits: [
        { id: 'apple-1', type: 'apple', x: 670, y: 314 },
        { id: 'apple-2', type: 'apple', x: 1830, y: 314 },
        { id: 'apple-3', type: 'apple', x: 3130, y: 314 },
        { id: 'lantern-1', type: 'lantern', x: 280, y: 478 },
        { id: 'mat-1', type: 'mat', x: 470, y: 394 },
        { id: 'crescent-1', type: 'crescent', x: 1150, y: 478 },
        { id: 'bead-1', type: 'bead', x: 1630, y: 394 },
        { id: 'lantern-2', type: 'lantern', x: 2370, y: 478 },
        { id: 'mat-2', type: 'mat', x: 2930, y: 394 },
        { id: 'crescent-2', type: 'crescent', x: 3970, y: 314 },
        { id: 'lantern-3', type: 'lantern', x: 4600, y: 478 }
    ],
    enemies: [
        { type: 'hedgehog', x: 950, minX: 870, maxX: 1080, speed: 115 },
        { type: 'snail', x: 2180, minX: 2070, maxX: 2290, speed: 105 },
        { type: 'hedgehog', x: 3400, minX: 3310, maxX: 3520, speed: 125 }
    ],
    ball: { type: 'ball', x: 4240, minX: 4160, maxX: 4340, speed: 155 },
    extraHazards: [{ type: 'ball', x: 2690, minX: 2600, maxX: 2770, speed: 140 }],
    belt: { x: 1210, width: 260, speed: -120 },
    fountains: [{ id: 'fountain-1', x: 1500 }, { id: 'fountain-2', x: 3600 }],
    fireRain: [
        { x: 1120, period: 3000, offset: 0, speed: 310 },
        { x: 2520, period: 3200, offset: 900, speed: 320 },
        { x: 3690, period: 3000, offset: 1800, speed: 330 },
        { x: 4090, period: 3100, offset: 500, speed: 320 }
    ]
};

export const levels = [garden, courtyard, desert, moonGarden];
