// Denge Atölyesi: her bölüm üç farklı fizik bulmacasıyla üç yıldız, anahtar ve cami yolunu kurar.
import {createLevelBuilder} from '../model/definitions.js';
import {makePhysicsPuzzle} from '../model/physicsPuzzles.js';
import type {PhysicsPuzzleName} from '../model/physicsPuzzles.js';
import type {BackgroundDefinition} from '../scenery/BackgroundBuilder.js';
import {verses} from '../../data/verses.js';

interface WorkshopChapter {name: string; puzzles: [PhysicsPuzzleName, PhysicsPuzzleName, PhysicsPuzzleName]}
const guardTypes = ['snail', 'turtle', 'robot', 'frog', 'bee', 'bird'] as const;
const chapters: WorkshopChapter[] = [
    {name: 'İlk Sandıklar', puzzles: ['crate', 'bridge', 'tower']},
    {name: 'Kaydır ve Dengele', puzzles: ['sled', 'tunnel', 'stepping']},
    {name: 'Yuvarlanan Yol', puzzles: ['ramp', 'bridge', 'drop']},
    {name: 'Domino Geçidi', puzzles: ['domino', 'tower', 'sled']},
    {name: 'Ağırlık Oyunu', puzzles: ['seesaw', 'tunnel', 'bridge']},
    {name: 'İp Köprüler', puzzles: ['suspended', 'drop', 'tower']},
    {name: 'Sarkaç Bahçesi', puzzles: ['pendulum', 'domino', 'ramp']},
    {name: 'Kargoyu Taşı', puzzles: ['balance', 'tunnel', 'bridge']},
    {name: 'Sandık Kuleleri', puzzles: ['tower', 'suspended', 'domino']},
    {name: 'Taş ve Terazi', puzzles: ['ramp', 'pendulum', 'seesaw']},
    {name: 'Üç Köprü', puzzles: ['bridge', 'suspended', 'balance']},
    {name: 'Ağır İşler', puzzles: ['tunnel', 'drop', 'seesaw']},
    {name: 'Zincirleme Hareket', puzzles: ['domino', 'stepping', 'pendulum']},
    {name: 'Ustanın Yolu', puzzles: ['suspended', 'balance', 'drop']},
    {name: 'Büyük Denge', puzzles: ['stepping', 'balance', 'bridge']}
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
    const origins = index % 3 === 0 ? [250, 1270, 2290] : index % 3 === 1 ? [200, 1240, 2320] : [280, 1310, 2350];
    const sections = chapter.puzzles.map((kind, i) => makePhysicsPuzzle(kind, origins[i], `p${i}`, variant));
    return build({id: `workshop-${index + 1}`, name: chapter.name, platformTheme: ['factory', 'forest', 'castle'][index % 3],
        platforms: sections.flatMap(p => p.platforms), gaps: sections.flatMap(p => p.gaps),
        props: sections.flatMap(p => p.props), links: sections.flatMap(p => p.links), matterSurfaces: sections.flatMap(p => p.surfaces),
        mechanisms: sections.flatMap(p => p.mechanisms),
        fountains: origins.slice(0, 2).map((x, i) => ({id: `fountain-${i + 1}`, x: x + 800})),
        enemies: origins.slice(0, 2).map((x, i) => {
            const type = guardTypes[(index + i) % guardTypes.length];
            return {id: `guard-${i}`, type, x: x + 925, y: type === 'bee' || type === 'bird' ? 430 : 502,
                minX: x + 900, maxX: x + 960, speed: 32 + variant * 5, scale: .7, weapon: false};
        }),
        fruits: [
            ...sections.map((p, i) => ({id: `star-${i + 1}`, type: 'star', ...p.star})),
            ...sections.flatMap((_, section) => ['apple', 'pear', 'orange', 'banana', 'grapes', 'strawberry'].map((type, i) => ({
                type, x: origins[section] + 20 + i * 125, y: 475 - (i % 2) * 15
            }))).filter(item => !sections.some(p => p.gaps.some(gap => item.x >= gap.x && item.x <= gap.x + gap.width)))
                .map(item => {
                    const ramp = sections.flatMap(p => p.surfaces).find(surface => 'vertices' in surface &&
                        item.x >= surface.vertices[0].x && item.x <= surface.vertices[2].x);
                    if (!ramp || !('vertices' in ramp)) {
                        const platform = sections.flatMap(p => p.platforms).find(p => item.x >= p.x && item.x <= p.x + p.width);
                        return platform ? {...item, y: platform.y - 36} : item;
                    }
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
