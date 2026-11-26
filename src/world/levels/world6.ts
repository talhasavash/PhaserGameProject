// Denge Atölyesi: her bölüm üç farklı fizik bulmacasıyla üç yıldız, anahtar ve cami yolunu kurar.
import {createLevelBuilder} from '../model/definitions.js';
import {makePhysicsPuzzle} from '../model/physicsPuzzles.js';
import type {PhysicsPuzzleName} from '../model/physicsPuzzles.js';
import type {BackgroundDefinition} from '../scenery/BackgroundBuilder.js';
import {verses} from '../../data/verses.js';

interface WorkshopChapter {name: string; puzzles: [PhysicsPuzzleName, PhysicsPuzzleName, PhysicsPuzzleName]}
const chapters: WorkshopChapter[] = [
    {name: 'İlk Sandıklar', puzzles: ['crate', 'rubber', 'tower']},
    {name: 'Kaydır ve Dengele', puzzles: ['ice', 'metal', 'crate']},
    {name: 'Yuvarlanan Yol', puzzles: ['ramp', 'bridge', 'rubber']},
    {name: 'Domino Geçidi', puzzles: ['domino', 'tower', 'ice']},
    {name: 'Ağırlık Oyunu', puzzles: ['seesaw', 'metal', 'bridge']},
    {name: 'İp Köprüler', puzzles: ['suspended', 'crate', 'tower']},
    {name: 'Sarkaç Bahçesi', puzzles: ['pendulum', 'domino', 'ramp']},
    {name: 'Kargoyu Taşı', puzzles: ['balance', 'rubber', 'bridge']},
    {name: 'Sandık Kuleleri', puzzles: ['tower', 'suspended', 'domino']},
    {name: 'Taş ve Terazi', puzzles: ['ramp', 'pendulum', 'seesaw']},
    {name: 'Üç Köprü', puzzles: ['bridge', 'suspended', 'balance']},
    {name: 'Ağır İşler', puzzles: ['metal', 'tower', 'seesaw']},
    {name: 'Zincirleme Hareket', puzzles: ['domino', 'ramp', 'pendulum']},
    {name: 'Ustanın Yolu', puzzles: ['suspended', 'balance', 'tower']},
    {name: 'Büyük Denge', puzzles: ['tower', 'balance', 'bridge']}
];
const palettes = [
    {sky: 0xc3e7ed, far: 0x92b9bd, near: 0x608d91, earth: 0x8c705b, edge: 0xdbb785},
    {sky: 0xe9d4b8, far: 0xbba797, near: 0x927d81, earth: 0x79666d, edge: 0xe8b875},
    {sky: 0xc8d5ed, far: 0x9aa5c7, near: 0x6d83a9, earth: 0x666879, edge: 0xc9be9b},
    {sky: 0x263f5b, far: 0x425c78, near: 0x527380, earth: 0x4e586a, edge: 0xd4bc82},
    {sky: 0xd2e4cc, far: 0xa3b9a0, near: 0x718e80, earth: 0x7b6a57, edge: 0xd5b875}
];
function workshopBackground(index: number): BackgroundDefinition {
    const p = palettes[index % palettes.length];
    return {sky: p.sky, ground: {body: p.earth, edge: p.edge}, parts: [
        {type: index % 5 === 3 ? 'moon' : 'sun', x: 580 + index * 11, y: 105, scale: 1.15},
        {type: 'mountain', x: 100, y: 300, width: 500, height: 320, color: p.far,
            detailColor: p.edge, repeat: {count: 10, stepX: 440}},
        {type: 'hill', x: 200, y: 480, width: 700, height: 200, color: p.near, repeat: {count: 8, stepX: 580}},
        {type: 'cloud', x: 180, y: 150, alpha: .65, repeat: {count: 10, stepX: 370}},
        {type: 'pine', x: 130, y: 440, height: 160, color: p.near, detailColor: p.earth,
            repeat: {count: 12, stepX: 330}},
        {type: 'circle', x: 380, y: 455, width: 110, height: 110, color: p.edge, alpha: .18,
            repeat: {count: 10, stepX: 360}}
    ]};
}
const build = createLevelBuilder({physics: 'matter', theme: 'factory', width: 3700, groundY: 520,
    spawn: {x: 100, y: 480}, checkpoint: {x: 100, y: 480}, key: {x: 3320, y: 475}, exit: {x: 3520, y: 468}});

export const worldSixLevels = chapters.map((chapter, index) => {
    const variant = Math.floor(index / 5);
    const sections = chapter.puzzles.map((kind, i) => makePhysicsPuzzle(kind, 250 + i * 1020, `p${i}`, variant));
    return build({id: `workshop-${index + 1}`, name: chapter.name, platformTheme: ['factory', 'forest', 'castle'][index % 3],
        platforms: sections.flatMap(p => p.platforms), gaps: sections.flatMap(p => p.gaps),
        props: sections.flatMap(p => p.props), links: sections.flatMap(p => p.links), matterSurfaces: sections.flatMap(p => p.surfaces),
        fruits: [
            ...sections.map((p, i) => ({id: `star-${i + 1}`, type: 'star', ...p.star})),
            ...sections.flatMap((_, section) => ['apple', 'pear', 'orange', 'banana', 'grapes', 'strawberry'].map((type, i) => ({
                type, x: 180 + section * 1020 + i * 115, y: 475 - (i % 2) * 15
            }))).filter(item => !sections.some(p => p.gaps.some(gap => item.x >= gap.x && item.x <= gap.x + gap.width)))
                .map(item => {
                    const ramp = sections.flatMap(p => p.surfaces).find(surface => 'vertices' in surface &&
                        item.x >= surface.vertices[0].x && item.x <= surface.vertices[2].x);
                    if (!ramp || !('vertices' in ramp)) return item;
                    const [low, high] = ramp.vertices;
                    const top = item.x >= high.x ? high.y : low.y + (high.y - low.y) * (item.x - low.x) / (high.x - low.x);
                    return {...item, y: top - 38};
                })
        ],
        environment: {scenery: workshopBackground(index)}, verse: verses[index % verses.length],
        mosqueStyle: {wall: palettes[index % 5].sky, roof: palettes[(index + 2) % 5].near,
            trim: palettes[index % 5].edge, width: 170 + (index % 4) * 12}
    });
});
