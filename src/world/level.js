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
        { id: 'star-1', type: 'star', x: 480, y: 394 },
        { id: 'star-2', type: 'star', x: 1480, y: 394 },
        { id: 'star-3', type: 'star', x: 2830, y: 394 },
        { id: 'fruit-1', type: 'apple', x: 415, y: 394 },
        { id: 'fruit-2', type: 'orange', x: 1415, y: 394 },
        { id: 'fruit-3', type: 'banana', x: 2765, y: 394 },
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
        { x: 3250, y: 430, width: 90, single: true }, { x: 3380, y: 400, width: 64, single: true },
        { x: 3430, y: 430, width: 120 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 480, y: 394 },
        { id: 'star-2', type: 'star', x: 1540, y: 314 },
        { id: 'star-3', type: 'star', x: 2715, y: 314 },
        { id: 'fruit-1', type: 'pear', x: 415, y: 394 },
        { id: 'fruit-2', type: 'grapes', x: 1475, y: 314 },
        { id: 'fruit-3', type: 'strawberry', x: 2650, y: 314 },
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

// Çöl yolunda rastgele ateş yağmuru; önce belirgin bir uyarı görünür.
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
        { id: 'star-1', type: 'star', x: 520, y: 394 },
        { id: 'star-2', type: 'star', x: 1650, y: 314 },
        { id: 'star-3', type: 'star', x: 2970, y: 314 },
        { id: 'fruit-1', type: 'apple', x: 455, y: 394 },
        { id: 'fruit-2', type: 'orange', x: 1585, y: 314 },
        { id: 'fruit-3', type: 'banana', x: 2905, y: 314 },
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
    fireRain: [{ period: 9000, offset: 4000, speed: 270 }]
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
        { id: 'star-1', type: 'star', x: 670, y: 314 },
        { id: 'star-2', type: 'star', x: 1830, y: 314 },
        { id: 'star-3', type: 'star', x: 3130, y: 314 },
        { id: 'fruit-1', type: 'pear', x: 605, y: 314 },
        { id: 'fruit-2', type: 'grapes', x: 1765, y: 314 },
        { id: 'fruit-3', type: 'strawberry', x: 3065, y: 314 },
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
    fireRain: [{ period: 8500, offset: 4000, speed: 290 }]
};

// Ortak bölüm ayarları burada; aşağıda yalnızca farklı konumları yazıyoruz.
function trail(data) {
    return {
        groundY: 520, spawn: { x: 100, y: 480 },
        checkpoint: { x: data.width / 2, y: 480 },
        key: { x: data.width - 550, y: 477 }, exit: { x: data.width - 260, y: 468 },
        belt: { x: 2050, width: 180, speed: -100 },
        fountains: [{ id: 'fountain-1', x: 1250 }, { id: 'fountain-2', x: data.width - 950 }],
        ...data
    };
}

export const forest = trail({
    name: 'Arıların Orman Yolu', theme: 'forest', width: 4800,
    platforms: [
        { x: 420, y: 430, width: 80, single: true }, { x: 520, y: 390, width: 70, single: true },
        { x: 610, y: 350, width: 160 },
        { x: 1510, y: 430, width: 150 }, { x: 1690, y: 350, width: 150 },
        { x: 2880, y: 430, width: 140 }, { x: 3050, y: 350, width: 150 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 690, y: 314 },
        { id: 'star-2', type: 'star', x: 1770, y: 314 },
        { id: 'star-3', type: 'star', x: 3120, y: 314 },
        { id: 'fruit-1', type: 'apple', x: 300, y: 480 },
        { id: 'fruit-2', type: 'orange', x: 1570, y: 394 },
        { id: 'fruit-3', type: 'banana', x: 2940, y: 394 },
        { id: 'bead-1', type: 'bead', x: 1100, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 2300, y: 480 },
        { id: 'mat-1', type: 'mat', x: 4030, y: 480 }
    ],
    enemies: [
        { type: 'fox', x: 950, minX: 850, maxX: 1110, speed: 100 },
        { type: 'bee', x: 1850, y: 416, minX: 1730, maxX: 1980, speed: 85, bob: 20 },
        { type: 'fox', x: 2720, minX: 2600, maxX: 2820, speed: 115 },
        { type: 'bee', x: 3550, y: 420, minX: 3450, maxX: 3700, speed: 100, bob: 22 }
    ],
    gaps: [{ x: 1320, width: 90 }, { x: 3250, width: 100 }]
});

export const mosqueHall = trail({
    name: 'Caminin İçinde', theme: 'interior', width: 5000,
    platforms: [
        { x: 450, y: 430, width: 160 }, { x: 640, y: 350, width: 150 },
        { x: 1590, y: 430, width: 140 }, { x: 1760, y: 350, width: 150 },
        { x: 3050, y: 430, width: 130 }, { x: 3210, y: 350, width: 150 },
        { x: 3840, y: 430, width: 150 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 715, y: 314 },
        { id: 'star-2', type: 'star', x: 1835, y: 314 },
        { id: 'star-3', type: 'star', x: 3285, y: 314 },
        { id: 'fruit-1', type: 'pear', x: 520, y: 394 },
        { id: 'fruit-2', type: 'grapes', x: 1650, y: 394 },
        { id: 'fruit-3', type: 'strawberry', x: 3900, y: 394 },
        { id: 'mat-1', type: 'mat', x: 300, y: 480 },
        { id: 'bead-1', type: 'bead', x: 1090, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 2350, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 4250, y: 480 }
    ],
    enemies: [
        { type: 'wheel', x: 970, minX: 850, maxX: 1110, speed: 115 },
        { type: 'spider', x: 1450, y: 405, minX: 1450, maxX: 1450, speed: 0, bob: 65 },
        { type: 'wheel', x: 2750, minX: 2620, maxX: 2900, speed: 125 },
        { type: 'spider', x: 3550, y: 410, minX: 3550, maxX: 3550, speed: 0, bob: 65 },
        { type: 'wheel', x: 4120, minX: 4020, maxX: 4240, speed: 130 }
    ],
    passages: [{ x: 1330, width: 220, y: 395 }, { x: 3400, width: 230, y: 395 }]
});

export const snowPass = trail({
    name: 'Karlı Dağ Geçidi', theme: 'snow', width: 5160,
    platforms: [
        { x: 420, y: 430, width: 150 }, { x: 600, y: 350, width: 140 },
        { x: 1630, y: 430, width: 70, single: true }, { x: 1720, y: 390, width: 60, single: true },
        { x: 1800, y: 350, width: 140 },
        { x: 3020, y: 430, width: 130 }, { x: 3180, y: 350, width: 140 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 670, y: 314 },
        { id: 'star-2', type: 'star', x: 1870, y: 314 },
        { id: 'star-3', type: 'star', x: 3250, y: 314 },
        { id: 'fruit-1', type: 'apple', x: 490, y: 394 },
        { id: 'fruit-2', type: 'orange', x: 1665, y: 394 },
        { id: 'fruit-3', type: 'banana', x: 3080, y: 394 },
        { id: 'lantern-1', type: 'lantern', x: 280, y: 480 },
        { id: 'mat-1', type: 'mat', x: 2350, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 4350, y: 480 }
    ],
    enemies: [
        { type: 'penguin', x: 950, minX: 840, maxX: 1110, speed: 110 },
        { type: 'bird', x: 1600, y: 405, minX: 1460, maxX: 1720, speed: 105, bob: 26 },
        { type: 'penguin', x: 2770, minX: 2670, maxX: 2890, speed: 125 },
        { type: 'wheel', x: 3830, minX: 3700, maxX: 3970, speed: 145 }
    ],
    gaps: [{ x: 1310, width: 105 }, { x: 2240, width: 110 }, { x: 3450, width: 110 }],
    ice: [{ x: 780, width: 400 }, { x: 2630, width: 360 }, { x: 3620, width: 420 }]
});

export const river = trail({
    name: 'Köprüler ve Nilüferler', theme: 'river', width: 5400,
    fountains: [{ id: 'fountain-1', x: 1340 }, { id: 'fountain-2', x: 4450 }],
    platforms: [
        { x: 400, y: 430, width: 80, single: true }, { x: 500, y: 390, width: 60, single: true },
        { x: 570, y: 350, width: 140 },
        { x: 1730, y: 430, width: 130 }, { x: 1890, y: 350, width: 140 },
        { x: 3180, y: 430, width: 130 }, { x: 3340, y: 350, width: 130 },
        { x: 4050, y: 430, width: 120 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 640, y: 314 },
        { id: 'star-2', type: 'star', x: 1960, y: 314 },
        { id: 'star-3', type: 'star', x: 3405, y: 314 },
        { id: 'fruit-1', type: 'pear', x: 470, y: 394 },
        { id: 'fruit-2', type: 'grapes', x: 1790, y: 394 },
        { id: 'fruit-3', type: 'strawberry', x: 4110, y: 394 },
        { id: 'bead-1', type: 'bead', x: 270, y: 480 },
        { id: 'mat-1', type: 'mat', x: 2600, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 4700, y: 480 }
    ],
    enemies: [
        { type: 'frog', x: 930, minX: 850, maxX: 1080, speed: 100, bob: 18 },
        { type: 'turtle', x: 1550, minX: 1480, maxX: 1660, speed: 85 },
        { type: 'bee', x: 2340, y: 420, minX: 2250, maxX: 2470, speed: 115, bob: 24 },
        { type: 'frog', x: 3760, minX: 3680, maxX: 3920, speed: 125, bob: 20 },
        { type: 'turtle', x: 4610, minX: 4520, maxX: 4740, speed: 105 }
    ],
    gaps: [{ x: 1120, width: 115 }, { x: 2750, width: 120 }, { x: 3530, width: 125 }, { x: 4200, width: 120 }]
});

export const canyon = trail({
    name: 'Yankılı Kaya Vadisi', theme: 'canyon', width: 5600,
    fountains: [{ id: 'fountain-1', x: 1350 }, { id: 'fountain-2', x: 4590 }],
    platforms: [
        { x: 410, y: 430, width: 130 }, { x: 570, y: 350, width: 130 },
        { x: 1720, y: 430, width: 120 }, { x: 1870, y: 350, width: 130 },
        { x: 3220, y: 430, width: 70, single: true }, { x: 3310, y: 390, width: 50, single: true },
        { x: 3370, y: 350, width: 130 },
        { x: 4130, y: 430, width: 120 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 635, y: 314 },
        { id: 'star-2', type: 'star', x: 1935, y: 314 },
        { id: 'star-3', type: 'star', x: 3435, y: 314 },
        { id: 'fruit-1', type: 'apple', x: 470, y: 394 },
        { id: 'fruit-2', type: 'orange', x: 1780, y: 394 },
        { id: 'fruit-3', type: 'banana', x: 4190, y: 394 },
        { id: 'lantern-1', type: 'lantern', x: 260, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 2660, y: 480 },
        { id: 'bead-1', type: 'bead', x: 4800, y: 480 }
    ],
    enemies: [
        { type: 'bat', x: 950, y: 408, minX: 810, maxX: 1080, speed: 125, bob: 35 },
        { type: 'ball', x: 1510, minX: 1440, maxX: 1650, speed: 145 },
        { type: 'bat', x: 2440, y: 415, minX: 2320, maxX: 2580, speed: 135, bob: 35 },
        { type: 'spider', x: 3770, y: 410, minX: 3770, maxX: 3770, speed: 0, bob: 65 },
        { type: 'ball', x: 4800, minX: 4690, maxX: 4950, speed: 150 }
    ],
    gaps: [{ x: 1110, width: 125 }, { x: 2940, width: 130 }, { x: 4340, width: 135 }],
    passages: [{ x: 3610, width: 280, y: 395 }],
    ice: [{ x: 2280, width: 360 }, { x: 4500, width: 460 }],
    fireRain: [{ period: 10000, offset: 5000, speed: 300 }]
});

export const festival = trail({
    name: 'Bayramın Işıklı Bahçesi', theme: 'festival', width: 5880,
    fountains: [{ id: 'fountain-1', x: 1370 }, { id: 'fountain-2', x: 4930 }],
    platforms: [
        { x: 430, y: 430, width: 80, single: true }, { x: 520, y: 390, width: 50, single: true },
        { x: 580, y: 350, width: 130 },
        { x: 1750, y: 430, width: 120 }, { x: 1900, y: 350, width: 130 },
        { x: 3290, y: 430, width: 120 }, { x: 3440, y: 350, width: 120 },
        { x: 4300, y: 430, width: 120 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 645, y: 314 },
        { id: 'star-2', type: 'star', x: 1965, y: 314 },
        { id: 'star-3', type: 'star', x: 3500, y: 314 },
        { id: 'fruit-1', type: 'pear', x: 490, y: 394 },
        { id: 'fruit-2', type: 'grapes', x: 1810, y: 394 },
        { id: 'fruit-3', type: 'strawberry', x: 4360, y: 394 },
        { id: 'lantern-1', type: 'lantern', x: 280, y: 480 },
        { id: 'bead-1', type: 'bead', x: 2850, y: 480 },
        { id: 'mat-1', type: 'mat', x: 3200, y: 480 },
        { id: 'crescent-1', type: 'crescent', x: 5100, y: 480 }
    ],
    enemies: [
        { type: 'fox', x: 950, minX: 830, maxX: 1090, speed: 130 },
        { type: 'bird', x: 1550, y: 410, minX: 1450, maxX: 1670, speed: 125, bob: 30 },
        { type: 'wheel', x: 2470, minX: 2340, maxX: 2620, speed: 155 },
        { type: 'bee', x: 3780, y: 415, minX: 3690, maxX: 3930, speed: 130, bob: 28 },
        { type: 'spider', x: 4600, y: 410, minX: 4600, maxX: 4600, speed: 0, bob: 65 },
        { type: 'turtle', x: 5100, minX: 5010, maxX: 5200, speed: 115 }
    ],
    gaps: [{ x: 1130, width: 130 }, { x: 3000, width: 135 }, { x: 4080, width: 140 }],
    passages: [{ x: 4480, width: 230, y: 395 }],
    ice: [{ x: 2280, width: 420 }, { x: 3660, width: 340 }],
    fireRain: [{ period: 10000, offset: 6000, speed: 310 }]
});

export const bossGate = trail({
    name: 'Büyük Muhafızların Geçidi', theme: 'boss', boss: true, width: 5600,
    checkpoint: { x: 2600, y: 480 },
    fountains: [{ id: 'fountain-1', x: 1500 }, { id: 'fountain-2', x: 4900 }],
    platforms: [
        { x: 410, y: 430, width: 140 }, { x: 580, y: 350, width: 140 },
        { x: 1690, y: 430, width: 80, single: true }, { x: 1790, y: 390, width: 60, single: true },
        { x: 1860, y: 350, width: 140 },
        { x: 3040, y: 430, width: 140 }, { x: 3210, y: 350, width: 140 }
    ],
    fruits: [
        { id: 'star-1', type: 'star', x: 650, y: 314 },
        { id: 'star-2', type: 'star', x: 1930, y: 314 },
        { id: 'star-3', type: 'star', x: 3280, y: 314 },
        { id: 'fruit-1', type: 'apple', x: 480, y: 394 },
        { id: 'fruit-2', type: 'orange', x: 1760, y: 394 },
        { id: 'fruit-3', type: 'banana', x: 3110, y: 394 },
        { id: 'crescent-1', type: 'crescent', x: 2870, y: 480 },
        { id: 'lantern-1', type: 'lantern', x: 4370, y: 480 }
    ],
    enemies: [
        { type: 'ogre', x: 1050, minX: 1010, maxX: 1090, speed: 28, scale: 1.5, jump: { height: 180, duration: 1700, period: 3300, offset: 0 } },
        { type: 'ogre', texture: 'ogre-moss', x: 2350, minX: 2310, maxX: 2390, speed: 30, scale: 1.65, jump: { height: 200, duration: 1800, period: 3400, offset: 900 } },
        { type: 'ogre', texture: 'ogre-stone', x: 3690, minX: 3650, maxX: 3730, speed: 32, scale: 1.7, jump: { height: 210, duration: 1800, period: 3300, offset: 1400 } },
        { type: 'ogre', texture: 'ogre-ember', rage: true, x: 4630, minX: 4590, maxX: 4670, speed: 32, scale: 1.8, jump: { height: 220, duration: 1800, period: 3200, offset: 500 } }
    ],
    gaps: [{ x: 1320, width: 130 }, { x: 2730, width: 135 }, { x: 4100, width: 140 }],
    ice: [{ x: 4380, width: 380 }]
});

export const levels = [garden, courtyard, desert, moonGarden, forest, mosqueHall, snowPass, river, canyon, festival, bossGate];
