// Kâbe yolculuğunun hurmalık, revak, fener ve hilal sahnelerini ortak arka plan parçalarıyla kurar.
import type {BackgroundDefinition, BackgroundPart} from './BackgroundBuilder.js';

export type PilgrimageScenery = 'dunes' | 'oasis' | 'lanterns' | 'courtyard' | 'canyon' | 'night' | 'sanctuary';
const palettes = [
    {sky: 0xf2d9b1, far: 0xd4ad83, near: 0xb88c6e, wall: 0xeee3cc, trim: 0xa98048},
    {sky: 0xb9ddd6, far: 0x8cb8b1, near: 0x5d9588, wall: 0xf4ead3, trim: 0xc6a661},
    {sky: 0x233451, far: 0x4a5775, near: 0x35475e, wall: 0xc2cfc8, trim: 0xecd08e},
    {sky: 0xe4d3df, far: 0xb9a8c1, near: 0x8c819f, wall: 0xf3eadc, trim: 0xbc995c},
    {sky: 0x182b40, far: 0x36536a, near: 0x294354, wall: 0xd9e5dc, trim: 0xf0d595}
];

export function pilgrimageBackground(index: number, setting: PilgrimageScenery): BackgroundDefinition {
    const dark = ['night', 'lanterns', 'sanctuary'].includes(setting);
    const p = palettes[dark ? (setting === 'sanctuary' ? 4 : 2) : index % 2 ? 1 : index % 4 === 0 ? 0 : 3];
    const parts: BackgroundPart[] = [
        {type: dark ? 'crescent' : 'sun', x: 560 + index * 9, y: 110, width: dark ? 130 : 100,
            height: dark ? 130 : 100, color: 0xffe3a1, detailColor: p.sky},
        {type: 'mountain', x: 160, y: 355, width: 650, height: 285, color: p.far,
            detailColor: p.far, depth: -80, scrollFactor: .2, repeat: {count: 7, stepX: 710}}
    ];
    if (dark) parts.push({type: 'circle', x: 110, y: 75, width: 4, height: 4, color: 0xffefc7,
        depth: -94, scrollFactor: .05, repeat: {count: 24, stepX: 140, stepY: 3}});
    if (setting === 'dunes' || setting === 'canyon') {
        parts.push({type: 'hill', x: 200, y: 470, width: 750, height: 190, color: p.near,
            repeat: {count: 8, stepX: 570}});
    } else {
        parts.push({type: 'arch', x: 230, y: 365, width: setting === 'sanctuary' ? 310 : 240,
            height: 280, color: p.wall, detailColor: p.trim, repeat: {count: 9, stepX: 480}});
    }
    parts.push({type: 'minaret', x: 370, y: 350, height: 300 + index % 3 * 24, color: p.wall,
        detailColor: p.trim, depth: -65, scrollFactor: .3, repeat: {count: 6, stepX: 860}},
        {type: 'dome', x: 580, y: 420, width: 220, height: 170, color: p.wall, detailColor: p.near,
            repeat: {count: 5, stepX: 940}});
    if (['oasis', 'dunes', 'canyon'].includes(setting)) parts.push({type: 'palm', x: 170, y: 420,
        width: setting === 'oasis' ? 170 : 125, height: 200, color: 0x548875,
        detailColor: 0xad855d, repeat: {count: 11, stepX: 400 + index * 3}});
    else parts.push({type: 'lantern', x: 140, y: 310, width: 38, height: 105,
        color: 0xffdf94, detailColor: p.trim, repeat: {count: 13, stepX: 330 + index * 2}});
    parts.push({type: 'rosette', x: 360, y: 470, width: 42, height: 42, color: p.trim,
        detailColor: p.near, alpha: .55, repeat: {count: 12, stepX: 370}, depth: -20, scrollFactor: .85});
    return {sky: p.sky, ground: {body: setting === 'dunes' || setting === 'canyon' ? 0xbe9876 : 0xd4cdbb,
        edge: dark ? 0xdfd8bc : 0xf5edd8}, parts};
}
