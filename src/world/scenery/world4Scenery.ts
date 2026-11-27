// Ateş dünyasının volkan, bazalt, fırın kemeri ve kor göklerini mevcut parça Builder'ıyla kurar.
import type {BackgroundDefinition, BackgroundPart} from './BackgroundBuilder.js';

const palettes = [
    {sky: 0x492b42, far: 0x693c48, near: 0x3c3043, glow: 0xff9c4d},
    {sky: 0x211d35, far: 0x49314c, near: 0x302739, glow: 0xf47b49},
    {sky: 0x85483d, far: 0xa85b43, near: 0x54353d, glow: 0xffcb71},
    {sky: 0x372e4a, far: 0x5e465b, near: 0x292b3e, glow: 0xf9a954},
    {sky: 0x6b343c, far: 0x87484b, near: 0x392d3b, glow: 0xffb34e}
];
export type FireScenery = 'volcano' | 'cavern' | 'forge' | 'sunset' | 'ruins';

export function fireBackground(index: number, setting: FireScenery): BackgroundDefinition {
    const p = palettes[index % palettes.length];
    const parts: BackgroundPart[] = [
        {type: setting === 'sunset' ? 'sun' : 'circle', x: 570 + index * 17, y: 165,
            width: 250, height: 250, color: p.glow, alpha: .22, depth: -95, scrollFactor: .07},
        {type: 'cloud', x: 120, y: 110, color: p.far, alpha: .48, repeat: {count: 9, stepX: 510}},
        {type: 'hill', x: 180, y: 510, width: 800, height: 230, color: p.near,
            repeat: {count: 8, stepX: 630}, depth: -55, scrollFactor: .35}
    ];
    if (setting === 'volcano' || setting === 'sunset') {
        parts.push({type: 'volcano', x: 350, y: 350, width: 580, height: 340, color: p.far,
            detailColor: p.glow, repeat: {count: 6, stepX: 820}});
    } else if (setting === 'cavern') {
        parts.push({type: 'basalt', x: 90, y: 140, width: 210, height: 310, color: p.near,
            detailColor: p.glow, depth: -65, scrollFactor: .25, repeat: {count: 10, stepX: 450}});
    } else {
        parts.push({type: 'arch', x: 300, y: 360, width: setting === 'forge' ? 340 : 230,
            height: 290, color: p.far, detailColor: p.glow, repeat: {count: 8, stepX: 570}});
    }
    parts.push({type: 'basalt', x: 120 + index * 9, y: 455, width: 95, height: 150,
        color: p.near, detailColor: p.glow, repeat: {count: 12, stepX: 390}},
        {type: 'circle', x: 210, y: 300 + index % 3 * 38, width: 6, height: 6, color: p.glow,
            depth: -20, scrollFactor: .8, repeat: {count: 18, stepX: 240, stepY: -4}});
    return {sky: p.sky, ground: {body: 0x493641, edge: p.glow}, parts};
}
