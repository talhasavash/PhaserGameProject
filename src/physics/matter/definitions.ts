// Matter nesne, bağlantı ve dünya sözleşmeleri; kısa oluşturucular yalnızca veri üretir.
import type { Point } from '../../world/model/contracts.js';
interface PhysicalObject extends Point {
    id: string;
    angle?: number;
    density?: number;
    friction?: number;
    fixedRotation?: boolean;
    asleep?: boolean;
    restitution?: number;
    frictionAir?: number;
}
export type MatterObjectDefinition = PhysicalObject & (
    {type: 'crate' | 'plank' | 'ice' | 'rubber' | 'metal'; width: number; height: number} |
    {type: 'rock' | 'ball' | 'weight'; radius: number}
);
export interface MatterJointDefinition {
    objectId: string; anchor: Point; localPoint: Point;
    length?: number; stiffness?: number; damping?: number;
}
export type MatterSurface = ({x: number; y: number; width: number; height: number; angle?: number} |
    {vertices: Point[]}) & {hidden?: boolean};
export interface MatterWorldDefinition {
    width: number;
    groundY: number;
    spawn: Point;
    surfaces: MatterSurface[];
    objects: MatterObjectDefinition[];
    hinges: MatterJointDefinition[];
    links?: MatterJointDefinition[];
}
export interface MatterLevelDefinition extends MatterWorldDefinition {
    physics: 'matter';
    name: string;
    gap: {x: number; width: number};
    goal: Point;
    signs: (Point & {text: string})[];
    stations: {name: string; spawn: Point; instruction: string; release?: string[]}[];
}

type ObjectOptions = Partial<Omit<PhysicalObject, 'id' | 'x' | 'y'>>;
export const prop = {
    crate(id: string, x: number, y: number, size = 72, options: ObjectOptions = {}): MatterObjectDefinition {
        return {type: 'crate', id, x, y, width: size, height: size, ...options};
    },
    plank(id: string, x: number, y: number, width: number, height: number, options: ObjectOptions = {}): MatterObjectDefinition {
        return {type: 'plank', id, x, y, width, height, friction: .3, ...options};
    },
    rock(id: string, x: number, y: number, radius = 42, options: ObjectOptions = {}): MatterObjectDefinition {
        return {type: 'rock', id, x, y, radius, ...options};
    },
    ball(id: string, x: number, y: number, radius = 30, options: ObjectOptions = {}): MatterObjectDefinition {
        return {type: 'ball', id, x, y, radius, friction: .3, frictionAir: .001, restitution: .8, ...options};
    },
    weight(id: string, x: number, y: number, radius = 38, options: ObjectOptions = {}): MatterObjectDefinition {
        return {type: 'weight', id, x, y, radius, density: .001, friction: .3, restitution: .03, ...options};
    },
    block(id: string, x: number, y: number, width: number, height: number,
        material: 'ice' | 'rubber' | 'metal', options: ObjectOptions = {}): MatterObjectDefinition {
        return {type: material, id, x, y, width, height, density: material === 'metal' ? .0012 : .0004,
            friction: material === 'ice' ? .0001 : material === 'rubber' ? .8 : .2,
            restitution: 0, ...options};
    }
};
