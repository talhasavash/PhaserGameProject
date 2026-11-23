// Yeni fizik düzeneklerini aynı nesne oluşturucuları ile tanımlar; mevcut parkurun ayarlarını değiştirmez.
import type {MatterLevelDefinition, prop as builders} from './definition.js';

export function createPhysicsExperiments(prop: typeof builders): Pick<MatterLevelDefinition,
    'objects' | 'surfaces' | 'links' | 'stations' | 'signs'> {
    return {
        objects: [
            prop.weight('pendulum', 11200, 450, 38),
            prop.crate('pendulum-target', 11400, 488, 64),
            prop.block('metal-target', 11540, 488, 64, 64, 'metal'),
            prop.plank('suspended-platform', 12200, 410, 280, 20, {density: .0006}),
            prop.crate('platform-load', 12270, 379, 40),
            prop.crate('platform-step', 11970, 490, 60),
            prop.block('ice-slider', 12960, 370, 60, 60, 'ice'),
            prop.block('rubber-slider', 13710, 370, 60, 60, 'rubber'),
            prop.weight('drop-steel', 14900, 230, 30, {asleep: true, restitution: .08, frictionAir: .001}),
            prop.ball('drop-rubber', 15060, 230, 30, {asleep: true, restitution: .8}),
            prop.ball('drop-soft', 15220, 230, 30, {asleep: true, restitution: 0})
        ],
        surfaces: [
            {x: 12950, y: 410, width: 100, height: 20},
            {vertices: [{x: 13000, y: 400}, {x: 13450, y: 520}, {x: 13000, y: 520}]},
            {x: 13700, y: 410, width: 100, height: 20},
            {x: 13615, y: 490, width: 60, height: 60},
            {vertices: [{x: 13750, y: 400}, {x: 14200, y: 520}, {x: 13750, y: 520}]}
        ],
        links: [
            {objectId: 'pendulum', anchor: {x: 11200, y: 150}, localPoint: {x: 0, y: 0}, length: 300},
            {objectId: 'suspended-platform', anchor: {x: 12090, y: 160}, localPoint: {x: -110, y: 0}, length: 250},
            {objectId: 'suspended-platform', anchor: {x: 12310, y: 160}, localPoint: {x: 110, y: 0}, length: 250}
        ],
        stations: [
            {name: '9 · Sarkaç', spawn: {x: 11040, y: 485},
                instruction: 'Ağır sarkacı it. Sallanmasını ve kutuya çarparken momentum aktarmasını dene.'},
            {name: '10 · Asılı platform', spawn: {x: 11830, y: 485},
                instruction: 'Basamak kutusundan asılı platforma çık; yük ekleyip salınımını değiştir.'},
            {name: '11 · Buz ve kauçuk', spawn: {x: 12915, y: 350},
                instruction: 'Blokları eş eğimli rampalara it. Buz kaygan, kauçuk daha çok tutunur.'},
            {name: '12 · Sekme karşılaştırması', spawn: {x: 15000, y: 485},
                instruction: 'Üstteki ↓ düğmesi üç topu aynı yükseklikten bırakır. Sekme yüksekliklerini karşılaştır.',
                release: ['drop-steel', 'drop-rubber', 'drop-soft']}
        ],
        signs: [
            {x: 11200, y: 70, text: '9 · SARKAÇ\nYerçekimi ve momentum'},
            {x: 11540, y: 370, text: 'AĞIR METAL\nAynı boy · daha büyük kütle'},
            {x: 12200, y: 70, text: '10 · ASILI PLATFORM\nİki askı · değişen yük'},
            {x: 13100, y: 220, text: '11 · SÜRTÜNME\nBUZ · kaygan yüzey'},
            {x: 13850, y: 220, text: 'KAUÇUK\nAynı boy ve kütle · yüksek sürtünme'},
            {x: 15100, y: 90, text: '12 · SEKME\n↓ ile aynı anda bırak'},
            {x: 14900, y: 430, text: 'ÇELİK\nAz seker'},
            {x: 15060, y: 430, text: 'KAUÇUK\nÇok seker'},
            {x: 15220, y: 430, text: 'YUMUŞAK TOP\nSekmez'}
        ]
    };
}
