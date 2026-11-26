// Tek yıldızlı fizik düzenekleri: bölüm yazarı kutu, köprü, rampa ve denge parçalarını birleştirir.
import {prop} from '../../physics/matter/definitions.js';
import type {MatterObjectDefinition, MatterJointDefinition, MatterSurface, PressureBridgeDefinition} from '../../physics/matter/definitions.js';
import type {Point, Platform, Gap} from './contracts.js';

export interface PhysicsPuzzle {
    star: Point;
    props: MatterObjectDefinition[];
    platforms: Platform[];
    gaps: Gap[];
    surfaces: MatterSurface[];
    links: MatterJointDefinition[];
    mechanisms: PressureBridgeDefinition[];
}
const part = (data: Partial<PhysicsPuzzle> & Pick<PhysicsPuzzle, 'star'>): PhysicsPuzzle =>
    ({props: [], platforms: [], gaps: [], surfaces: [], links: [], mechanisms: [], ...data});
const box = (id: string, x: number, y: number, width: number, height: number, fixedRotation = true): MatterObjectDefinition =>
    ({type: 'crate', id, x, y, width, height, fixedRotation});

function crateStep(variant: number, material?: 'ice' | 'rubber' | 'metal'): PhysicsPuzzle {
    const size = 80 + variant * 4, top = 520 - size - 85;
    const crate = material ? prop.block('step', 110, 520 - size / 2, size, size, material,
        {density: material === 'metal' ? .00055 : .00035, fixedRotation: true})
        : prop.crate('step', 110, 520 - size / 2, size, {fixedRotation: true});
    return part({star: {x: 350, y: top - 35}, props: [crate], platforms: [{x: 260, y: top, width: 180}]});
}

const puzzles = {
    crate: (variant: number) => crateStep(variant),
    ice: (variant: number) => crateStep(variant, 'ice'),
    rubber: (variant: number) => crateStep(variant, 'rubber'),
    metal: (variant: number) => crateStep(variant, 'metal'),
    tunnel(variant: number): PhysicsPuzzle {
        // Yassı kargo alçak tünelden geçer; dışarıda yüksek rafa çıkmak için basamak olur.
        return part({star: {x: 570, y: 345}, platforms: [{x: 120, y: 420, width: 220}, {x: 490, y: 380, width: 160}],
            props: [prop.block('cargo', 65, 496, 110, 48, 'metal', {density: .00035, fixedRotation: true}),
                prop.ball('small-ball', 380, 495, 25, {restitution: .25 + variant * .05})]});
    },
    drop(variant: number): PhysicsPuzzle {
        // Sandığı yüksekteki rafın ucuna taşı; aradaki boşluğu onun üzerinden aş.
        return part({star: {x: 785, y: 165}, platforms: [
            {x: 80, y: 450, width: 100}, {x: 220, y: 380, width: 120},
            {x: 390, y: 310, width: 180}, {x: 700, y: 200, width: 160}],
            props: [prop.crate('high-cargo', 470, 270, 80, {fixedRotation: true}),
                prop.ball('ball', 90, 495, 25 + variant, {restitution: .45})]});
    },
    sled(variant: number): PhysicsPuzzle {
        const size = 80 + variant * 4;
        return part({star: {x: 650, y: 265}, platforms: [{x: 570, y: 300, width: 160}],
            surfaces: [{vertices: [{x: 110, y: 520}, {x: 310, y: 450}, {x: 510, y: 450}, {x: 510, y: 520}]},
                {x: 510, y: 444, width: 12, height: 12}],
            props: [prop.block('sled', 65, 520 - size / 2, size, size, 'ice', {density: .0003, fixedRotation: true})]});
    },
    stepping(variant: number): PhysicsPuzzle {
        // Farklı yüksekliklerdeki serbest blokları iki aralıklı raf arasında kullan.
        return part({star: {x: 690, y: 255}, platforms: [{x: 240, y: 415, width: 150}, {x: 610, y: 290, width: 160}],
            props: [prop.crate('low', 95, 490, 60, {fixedRotation: true}),
                prop.block('high', 470, 460, 90, 120, 'rubber', {fixedRotation: true, density: .0003}),
                prop.plank('loose-step', 480, 392, 140 + variant * 10, 16, {density: .0002, fixedRotation: true})]});
    },
    tower(variant: number): PhysicsPuzzle {
        // Geniş alt sandığın solunda üst sandığa çıkabilecek bir basamak kalır.
        const top = 320 - variant * 8;
        return part({star: {x: 410, y: top - 35}, platforms: [{x: 330, y: top, width: 160}],
            props: [box('base', 190, 490, 140, 60), box('upper', 220, 430, 72, 60, false),
                prop.crate('spare', 70, 492, 56, {fixedRotation: true})]});
    },
    bridge(variant: number): PhysicsPuzzle {
        const width = 260 + variant * 15, length = width + 120;
        return part({star: {x: 650, y: 475}, gaps: [{x: 250, width, style: 'factory'}],
            props: [prop.plank('bridge', 210, 500 - (length / 2 - 5), 22, length,
                {asleep: true, density: .0004, angle: .025}),
                variant === 2 ? prop.rock('switch-cargo', 80, 486, 34, {density: .0003})
                    : prop.crate('switch-cargo', 80, 480, 80, {fixedRotation: true})],
            links: [{objectId: 'bridge', anchor: {x: 210, y: 500}, localPoint: {x: 0, y: length / 2 - 5}, length: 0}],
            mechanisms: [{id: 'release', type: 'pressure-bridge', cargoId: 'switch-cargo', plankId: 'bridge',
                plate: {x: 145, y: 520, width: 110}, holdMs: 450}]});
    },
    balance(variant: number): PhysicsPuzzle {
        // Sandık geniş çukurun karşısına itilmeden yüksek yıldız rafına ulaşılamaz.
        const span = 360 + variant * 15;
        return part({star: {x: 810, y: 315}, gaps: [{x: 240, width: span, style: 'factory'}],
            platforms: [{x: 730, y: 350, width: 160}],
            surfaces: [
                {vertices: [{x: 135, y: 520}, {x: 215, y: 498}, {x: 215, y: 520}]},
                {vertices: [{x: 265 + span, y: 510}, {x: 345 + span, y: 520}, {x: 265 + span, y: 520}]}
            ],
            props: [prop.plank('beam', 240 + span / 2, 508, span + 50, 20, {density: .0005}),
                prop.crate('cargo', 100, 480, 80, {fixedRotation: true})],
            links: [{objectId: 'beam', anchor: {x: 240 + span / 2, y: 508}, localPoint: {x: 0, y: 0}, length: 0}]});
    },
    seesaw(variant: number): PhysicsPuzzle {
        return part({star: {x: 540, y: 295}, platforms: [{x: 460, y: 330, width: 160}],
            props: [prop.crate('entry', 40, 480, 80, {fixedRotation: true}),
                prop.plank('lever', 250, 420, 360, 22, {density: .0005}),
                prop.block('weight', 145, 370, 55, 55, 'metal', {density: .0016 + variant * .0002, friction: .85})],
            links: [{objectId: 'lever', anchor: {x: 250, y: 420}, localPoint: {x: 0, y: 0}, length: 0}]});
    },
    suspended(variant: number): PhysicsPuzzle {
        const width = 360 + variant * 15;
        return part({star: {x: 610, y: 285}, platforms: [{x: 530, y: 320, width: 160}],
            props: [prop.crate('entry', 70, 480, 80, {fixedRotation: true}),
                prop.plank('hanging', 330, 420, width, 24, {density: .00045})],
            links: [-120, 120].map(x => ({objectId: 'hanging', anchor: {x: 330 + x, y: 210},
                localPoint: {x, y: 0}, length: 210, stiffness: .92, damping: .04}))});
    },
    ramp(variant: number): PhysicsPuzzle {
        const radius = 38 + variant * 2;
        return part({star: {x: 790, y: 225}, platforms: [{x: 710, y: 260, width: 160}],
            surfaces: [{vertices: [{x: 60, y: 520}, {x: 380, y: 400}, {x: 670, y: 400}, {x: 670, y: 520}]}],
            props: [prop.rock('stone', 500, 400 - radius, radius, {density: .0003}),
                prop.ball('ball', 250, 390, 25, {restitution: .35})]});
    },
    domino(variant: number): PhysicsPuzzle {
        return part({star: {x: 670, y: 315}, platforms: [{x: 590, y: 350, width: 160}],
            props: [prop.crate('step', 400, 480, 80, {fixedRotation: true}),
                ...Array.from({length: 5 + variant}, (_, i) => prop.plank(`domino-${i}`, 100 + i * 38, 445,
                    12, 150, {asleep: true, density: .00012, friction: .55}))]});
    },
    pendulum(variant: number): PhysicsPuzzle {
        return part({star: {x: 620, y: 315}, platforms: [{x: 540, y: 350, width: 160}],
            props: [prop.weight('pendulum', 260, 440, 36 + variant * 2, {density: .0008}),
                prop.crate('step', 90, 480, 80, {fixedRotation: true})],
            links: [{objectId: 'pendulum', anchor: {x: 260, y: 200}, localPoint: {x: 0, y: 0}, length: 240,
                stiffness: .95, damping: .025}]});
    }
};
export type PhysicsPuzzleName = keyof typeof puzzles;

/** Dünya koordinatlarına yerleştirir; bağlantının localPoint değeri gövdeye göre kalır. */
export function makePhysicsPuzzle(name: PhysicsPuzzleName, x: number, id: string, variant = 0): PhysicsPuzzle {
    const source = puzzles[name](variant);
    return {
        star: {...source.star, x: source.star.x + x},
        props: source.props.map(p => ({...p, id: `${id}-${p.id}`, x: p.x + x})),
        platforms: source.platforms.map(p => ({...p, x: p.x + x})),
        gaps: source.gaps.map(p => ({...p, x: p.x + x})),
        surfaces: source.surfaces.map(p => 'vertices' in p
            ? {...p, vertices: p.vertices.map(point => ({...point, x: point.x + x}))} : {...p, x: p.x + x}),
        links: source.links.map(link => ({...link, objectId: `${id}-${link.objectId}`,
            anchor: {...link.anchor, x: link.anchor.x + x}, localPoint: {...link.localPoint}})),
        mechanisms: source.mechanisms.map(m => ({...m, id: `${id}-${m.id}`, cargoId: `${id}-${m.cargoId}`,
            plankId: `${id}-${m.plankId}`, plate: {...m.plate, x: m.plate.x + x}}))
    };
}
