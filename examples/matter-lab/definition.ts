// Yerel fizik atölyesinin düzenekleri; nesne sözleşmeleri ana oyunla ortaktır.
import {createPhysicsExperiments} from './experiments.js';
import {prop} from '../../src/physics/matter/definitions.js';
import type {MatterLevelDefinition, MatterObjectDefinition, MatterSurface} from '../../src/physics/matter/definitions.js';
export * from '../../src/physics/matter/definitions.js';

// Tek bir dışbükey gövde: bitişik rampa kenarları karakteri yakalayıp durdurmaz.
function hill(x: number, width: number, height: number): MatterSurface {
    return {vertices: [{x, y: 520}, {x: x + width * .42, y: 520 - height},
        {x: x + width * .58, y: 520 - height}, {x: x + width, y: 520}]};
}

function stack(id: string, x: number, sizes: number[]): MatterObjectDefinition[] {
    let bottom = 520;
    return sizes.map((size, i) => {
        const box = prop.crate(`${id}-${i}`, x, bottom - size / 2, size);
        bottom -= size + 1;
        return box;
    });
}

const crateYard = [
    ...stack('yard-wide', 7910, [96, 64, 40]),
    ...stack('yard-even', 8100, [64, 64, 64]),
    ...stack('yard-overhang', 8290, [48, 80]),
    ...stack('yard-mixed', 8490, [88, 56, 36]),
    ...stack('yard-tower', 8690, [48, 48, 48, 48]),
    ...stack('yard-left', 8890, [64, 64]),
    ...stack('yard-right', 8956, [64, 64]),
    prop.crate('yard-cap', 8923, 358, 64),
    prop.crate('yard-small', 9170, 502, 36),
    prop.crate('yard-light', 9340, 492, 56, {density: .00015}),
    prop.crate('yard-heavy', 9510, 492, 56, {density: .0009}),
    prop.crate('yard-step', 9660, 498, 44),
    prop.crate('yard-large', 9730, 464, 112),
    ...stack('yard-last', 9940, [80, 48, 36]),
    prop.crate('yard-tilted', 10140, 488, 64, {angle: .08})
];
const extraExperiments = createPhysicsExperiments(prop);

export const matterLab: MatterLevelDefinition = {
    physics: 'matter', name: 'Fizik Atölyesi', width: 16000, groundY: 520, spawn: {x: 140, y: 485},
    gap: {x: 1920, width: 300}, goal: {x: 15850, y: 470},
    surfaces: [
        {x: 960, y: 570, width: 1920, height: 100},
        {x: 9110, y: 570, width: 13780, height: 100},
        {x: 860, y: 442.5, width: 280, height: 155},
        {x: 2700, y: 460, width: 360, height: 22, angle: 0.18},
        {x: 3150, y: 492, width: 40, height: 56},
        hill(3700, 850, 170), hill(4700, 460, 85),
        {x: 5500, y: 495, width: 26, height: 50},
        hill(6050, 620, 130),
        {x: -25, y: 300, width: 50, height: 700, hidden: true},
        {x: 16025, y: 300, width: 50, height: 700, hidden: true},
        ...extraExperiments.surfaces
    ],
    objects: [
        prop.crate('step-crate', 420, 480, 72, {fixedRotation: true}),
        prop.crate('stack-bottom', 1260, 483),
        prop.crate('stack-top', 1260, 405),
        prop.crate('loose-crate', 1640, 480, 66, {angle: 0.12}),
        prop.plank('bridge', 1900, 305, 24, 400, {asleep: true, density: 0.0004, angle: .025}),
        prop.rock('rolling-rock', 2620, 392, 42, {asleep: true, friction: 0.35}),
        prop.ball('hill-ball', 4200, 312, 32, {asleep: true, restitution: .15}),
        prop.crate('hill-crate', 4350, 390, 44),
        prop.plank('seesaw', 5500, 444, 360, 20, {density: .0005}),
        prop.ball('bounce-ball', 6340, 345, 30, {asleep: true}),
        ...Array.from({length: 6}, (_, i) =>
            prop.plank(`domino-${i}`, 6790 + i * 65, 465, 10, 110, {density: .0001, friction: .6})),
        ...crateYard, ...extraExperiments.objects
    ],
    // Tahta alt ucundan bağlıdır. Üstteki ağırlık itmeyle döner ve karşı kıyıya yaslanır.
    hinges: [{objectId: 'bridge', anchor: {x: 1900, y: 500}, localPoint: {x: 0, y: 195}},
        {objectId: 'seesaw', anchor: {x: 5500, y: 444}, localPoint: {x: 0, y: 0}}],
    links: extraExperiments.links,
    stations: [
        {name: '1 · Kutu ve basamak', spawn: {x: 140, y: 485}, instruction: 'Kutuyu sağa it. Üstüne çıkıp yüksek basamağa atla.'},
        {name: '2 · Denge ve dönme', spawn: {x: 1120, y: 485}, instruction: 'Yığılmış kutuları it. Sağdaki ayrı kutu serbestçe döner; desteği çekilen kutu düşer.'},
        {name: '3 · Tahta köprü', spawn: {x: 1740, y: 485}, instruction: 'Dik tahtayı biraz sağa it. Kıyıya oturmasını bekleyip üzerinden geç.'},
        {name: '4 · Yuvarlanan taş', spawn: {x: 2440, y: 485}, instruction: 'Eğime zıpla, taşı it ve yuvarlanmasını izle.'},
        {name: '5 · Tepeler ve hız', spawn: {x: 4000, y: 290}, instruction: 'Topu tepeden it. Yokuş aşağı hızlanır; sonraki tepeye tırmanırken yavaşlar.'},
        {name: '6 · Tahterevalli', spawn: {x: 5240, y: 485}, instruction: 'Tahtaya çık, iki ucuna yürü. Ağırlığınla dengesini değiştir.'},
        {name: '7 · Zıplayan top ve domino', spawn: {x: 6230, y: 320}, instruction: 'Esnek topu yokuştan it. Sekmesini ve domino tahtalarını devirmesini dene.'},
        {name: '8 · Kutu bahçesi', spawn: {x: 7730, y: 485}, instruction: 'Farklı boylardaki yığınları it. Aynı boydaki hafif ve ağır kutunun tepkisini karşılaştır.'},
        ...extraExperiments.stations
    ],
    signs: [
        {x: 440, y: 285, text: '1 · KUTUYU İT\nÜstüne çıkıp yüksek basamağa ulaş'},
        {x: 1330, y: 285, text: '2 · DENGE\nYığılmış kutuları it, desteğini çek'},
        {x: 1640, y: 335, text: 'SERBEST KUTU\nDöner ve devrilir'},
        {x: 1800, y: 80, text: '3 · KÖPRÜ\nTahtayı sağa it, köprüye oturmasını bekle'},
        {x: 2700, y: 275, text: '4 · YUVARLANMA\nTaşı eğimde it ve hareketini izle'},
        {x: 4140, y: 130, text: '5 · TEPELİ PARKUR\nYerçekimi · hızlanma · momentum'},
        {x: 5500, y: 235, text: '6 · TAHTEREVALLİ\nAğırlık ve denge'},
        {x: 6620, y: 190, text: '7 · SEKME VE DOMİNO\nTopla tahtaları devir'},
        {x: 8170, y: 135, text: '8 · KUTU BAHÇESİ\nBoyut · ağırlık · yığın · devrilme'},
        {x: 9340, y: 380, text: 'HAFİF\n56 × 56'},
        {x: 9510, y: 380, text: 'AĞIR\nAynı boy · 6 kat kütle'},
        ...extraExperiments.signs
    ]
};
