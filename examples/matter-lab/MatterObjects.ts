// Factory: tipli bölüm verisinden Matter gövdelerini, eklemlerini ve eşleşen Phaser görsellerini üretir.
import {cacheTexture} from '../../src/graphics/texture.js';
import type {MatterLevelDefinition, MatterObjectDefinition} from './definition.js';
import {labMotion} from './movement.js';

export interface MatterLibrary {
    Bodies: typeof MatterJS.Bodies;
    Body: Omit<typeof MatterJS.Body, 'create'> & {create(options: MatterJS.IBodyDefinition): MatterJS.BodyType};
    Constraint: typeof MatterJS.Constraint;
    Sleeping: typeof MatterJS.Sleeping;
    Vertices: typeof MatterJS.Vertices;
}
export interface MatterLabWorld {
    surfaces: MatterJS.BodyType[];
    objects: Map<string, {definition: MatterObjectDefinition; body: MatterJS.BodyType}>;
    hinges: MatterJS.ConstraintType[];
    links: MatterJS.ConstraintType[];
    player: MatterJS.BodyType;
    feet: MatterJS.BodyType;
}
export interface MatterContact {
    bodyA: MatterJS.BodyType;
    bodyB: MatterJS.BodyType;
    collision: {normal: {x: number; y: number}};
    friction?: number;
    frictionStatic?: number;
    restitution?: number;
}
export interface LabVisual {
    body: MatterJS.BodyType;
    image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    previous: {x: number; y: number; angle: number};
}
interface MatterObjectFactory {
    body(matter: MatterLibrary, definition: MatterObjectDefinition): MatterJS.BodyType;
    draw(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void;
}
// Kutular zeminde kayabilsin; üst üste dururken birbirlerine daha iyi tutunsun.
const crateGroundFriction = new WeakMap<MatterJS.BodyType, number>();

const wood: MatterObjectFactory = {
    body(matter, definition) {
        if (!('width' in definition)) throw new Error('Ahşap nesne için genişlik ve yükseklik gerekli.');
        return matter.Bodies.rectangle(definition.x, definition.y, definition.width, definition.height);
    },
    draw(g, width, height) {
        g.fillStyle(0x70452f); g.fillRoundedRect(0, 0, width, height, 3);
        g.fillStyle(0xc58c52); g.fillRect(4, 4, width - 8, height - 8);
        g.lineStyle(2, 0x9d643c);
        for (let y = 13; y < height - 5; y += 15) g.lineBetween(5, y, width - 5, y);
        g.lineStyle(5, 0xf0c58a); g.lineBetween(6, 6, width - 6, height - 6);
        g.lineBetween(width - 6, 6, 6, height - 6);
        g.fillStyle(0x564234);
        for (const x of [7, width - 7]) for (const y of [7, height - 7]) g.fillCircle(x, y, 2);
    }
};
const circleBody: MatterObjectFactory['body'] = (matter, definition) => {
    if (!('radius' in definition)) throw new Error('Yuvarlak nesne için yarıçap gerekli.');
    return matter.Bodies.circle(definition.x, definition.y, definition.radius);
};
function materialBlock(fill: number, edge: number, detail: number): MatterObjectFactory {
    return {body: wood.body, draw(g, width, height) {
        g.fillStyle(fill); g.fillRoundedRect(0, 0, width, height, 4);
        g.lineStyle(3, edge); g.strokeRoundedRect(2, 2, width - 4, height - 4, 3);
        g.lineStyle(2, detail); g.lineBetween(9, height - 10, width - 10, 10);
        g.lineBetween(width * .45, height * .5, width - 10, height - 12);
        g.fillStyle(0xffffff, .3); g.fillRect(7, 7, width - 14, 5);
    }};
}
const factories: Record<MatterObjectDefinition['type'], MatterObjectFactory> = {
    crate: wood,
    ice: materialBlock(0x94e1f6, 0xe5fbff, 0x4cabc8),
    rubber: materialBlock(0x9a68b3, 0x502f6b, 0xcda5e5),
    metal: materialBlock(0x8293a6, 0xd5e1e6, 0x41566e),
    plank: {...wood, draw(g, width, height) {
        g.fillStyle(0x724831); g.fillRoundedRect(0, 0, width, height, 3);
        g.fillStyle(0xd6a66b); g.fillRect(3, 3, width - 6, height - 6);
        g.lineStyle(2, 0xb77b47);
        for (const x of [width / 3, width * 2 / 3]) g.lineBetween(x, 7, x, height - 7);
        g.fillStyle(0x68513e); g.fillCircle(width / 2, 10, 3); g.fillCircle(width / 2, height - 10, 3);
    }},
    rock: {
        body: circleBody,
        draw(g, width) {
            const r = width / 2;
            g.fillStyle(0x4d6175); g.fillCircle(r, r, r);
            g.fillStyle(0x8fa5b6); g.fillCircle(r - 3, r - 4, r - 5);
            g.fillStyle(0xbacbd3); g.fillEllipse(r * .65, r * .5, r * .7, r * .4);
            // Asimetrik damar, daire şekli dönse de yuvarlanmanın görülmesini sağlar.
            g.lineStyle(4, 0x5d748a); g.lineBetween(r * .5, r, r * 1.5, r * 1.5);
            g.lineBetween(r * 1.5, r * 1.5, r * 1.4, r * .6);
        }
    },
    ball: {
        body: circleBody,
        draw(g, width) {
            const r = width / 2;
            g.fillStyle(0xd9575f); g.fillCircle(r, r, r);
            g.lineStyle(4, 0xffdc8c); g.strokeCircle(r, r, r * .7);
            g.lineBetween(r, 2, r, width - 2);
            g.fillStyle(0xfff4cb, .7); g.fillEllipse(r * .65, r * .5, r * .6, r * .3);
        }
    },
    weight: {body: circleBody, draw(g, width) {
        const r = width / 2;
        g.fillStyle(0x3b4a5d); g.fillCircle(r, r, r);
        g.fillStyle(0x8e9eaa); g.fillCircle(r - 2, r - 3, r - 5);
        g.lineStyle(3, 0xc6d5dc); g.strokeCircle(r, r, r * .65);
        g.fillStyle(0x35485d); g.fillCircle(r, r, r * .18);
        g.fillStyle(0xecf6fa, .5); g.fillEllipse(r * .65, r * .45, r * .65, r * .3);
    }}
};

export function createLabWorld(matter: MatterLibrary, level: MatterLevelDefinition,
    add: (objects: (MatterJS.BodyType | MatterJS.ConstraintType)[]) => void): MatterLabWorld {
    const surfaces = level.surfaces.map(p => {
        const options = {isStatic: true, friction: .6, label: 'lab-ground'};
        if ('vertices' in p) {
            const vertices = p.vertices.map(point => ({...point})) as MatterJS.Vector[];
            const centre = matter.Vertices.centre(vertices);
            return matter.Bodies.fromVertices(centre.x, centre.y, [vertices], options);
        }
        return matter.Bodies.rectangle(p.x, p.y, p.width, p.height, {...options, angle: p.angle || 0});
    });
    const objects: MatterLabWorld['objects'] = new Map();
    for (const definition of level.objects) {
        const body = factories[definition.type].body(matter, definition);
        matter.Body.set(body, {label: definition.id, friction: definition.friction ?? (definition.type === 'crate' ? .35 : .06),
            frictionStatic: .5, frictionAir: definition.frictionAir ?? .002,
            restitution: definition.restitution ?? 0, slop: .01});
        matter.Body.setDensity(body, definition.density ?? (definition.type === 'crate' ? .00035 : .0002));
        if (definition.type === 'crate') crateGroundFriction.set(body, definition.friction ?? .04);
        matter.Body.setAngle(body, definition.angle || 0);
        if (definition.fixedRotation) matter.Body.setInertia(body, Infinity);
        objects.set(definition.id, {definition, body});
    }
    const createJoint = (hinge: MatterLevelDefinition['hinges'][number]) => {
        const object = objects.get(hinge.objectId);
        if (!object) throw new Error(`Eklemin nesnesi bulunamadı: ${hinge.objectId}`);
        return matter.Constraint.create({bodyB: object.body, pointA: {...hinge.anchor},
            pointB: {...hinge.localPoint}, stiffness: hinge.stiffness ?? 1,
            length: hinge.length ?? 0, damping: hinge.damping ?? .01});
    };
    const hinges = level.hinges.map(createJoint);
    const links = (level.links ?? []).map(createJoint);
    const main = matter.Bodies.rectangle(level.spawn.x, level.spawn.y, 30, 56,
        {chamfer: {radius: 5}, friction: .2, frictionStatic: 1, frictionAir: 0, slop: .01});
    const feet = matter.Bodies.rectangle(level.spawn.x, level.spawn.y + 29, 22, 4,
        {isSensor: true, label: 'lab-feet'});
    const player = matter.Body.create({parts: [main, feet], label: 'lab-player',
        friction: .2, frictionStatic: 1, frictionAir: 0, restitution: 0, slop: .01, sleepThreshold: Infinity});
    matter.Body.setMass(player, labMotion.mass);
    matter.Body.setInertia(player, Infinity);
    add([...surfaces, ...Array.from(objects.values(), object => object.body), ...hinges, ...links, player]);
    for (const {definition, body} of objects.values()) if (definition.asleep) matter.Sleeping.set(body, true);
    return {surfaces, objects, hinges, links, player, feet};
}

export function drawLabObjects(scene: Phaser.Scene, world: MatterLabWorld): LabVisual[] {
    const visuals: LabVisual[] = [];
    for (const {definition, body} of world.objects.values()) {
        const width = 'radius' in definition ? definition.radius * 2 : definition.width;
        const height = 'radius' in definition ? definition.radius * 2 : definition.height;
        const key = `lab-${definition.type}-${width}-${height}`;
        cacheTexture(scene, key, width, height, g => factories[definition.type].draw(g, width, height));
        const image = scene.add.image(body.position.x, body.position.y, key).setDepth(5);
        visuals.push({body, image, previous: {...body.position, angle: body.angle}});
    }
    return visuals;
}

export function captureLabPositions(visuals: LabVisual[]) {
    for (const {body, previous} of visuals) {
        previous.x = body.position.x; previous.y = body.position.y; previous.angle = body.angle;
    }
}

// Görsellerin konumu fiziği değiştirmez; 60/90/120 Hz ekranlarda adımlar arasını tamamlar.
export function renderLabObjects(visuals: LabVisual[], alpha: number) {
    for (const {body, image, previous} of visuals) {
        image.setPosition(previous.x + (body.position.x - previous.x) * alpha,
            previous.y + (body.position.y - previous.y) * alpha);
        image.setRotation(previous.angle + (body.angle - previous.angle) * alpha);
    }
}

export function renderLabLinks(graphics: Phaser.GameObjects.Graphics, world: MatterLabWorld, visuals: LabVisual[]) {
    graphics.clear();
    graphics.lineStyle(4, 0x526b7a);
    for (const link of world.links) {
        const body = link.bodyB!;
        const image = visuals.find(visual => visual.body === body)!.image;
        const angle = image.rotation - body.angle;
        const point = link.pointB!;
        const x = image.x + point.x * Math.cos(angle) - point.y * Math.sin(angle);
        const y = image.y + point.x * Math.sin(angle) + point.y * Math.cos(angle);
        const anchor = link.pointA!;
        graphics.lineBetween(anchor.x, anchor.y, x, y);
        const segments = Math.max(1, Math.floor(Math.hypot(x - anchor.x, y - anchor.y) / 18));
        for (let i = 1; i < segments; i++) graphics.strokeCircle(
            anchor.x + (x - anchor.x) * i / segments, anchor.y + (y - anchor.y) * i / segments, 3);
        graphics.fillStyle(0xe2ba74); graphics.fillCircle(anchor.x, anchor.y, 7);
    }
}

// Yalnızca senaryoda bekletilen gövdeleri temasla başlatır; normal kutular uyutulmaz.
export function wakeTouchedObjects(matter: MatterLibrary, player: MatterJS.BodyType, pairs: MatterContact[]) {
    for (const pair of pairs) {
        const a = pair.bodyA.parent, b = pair.bodyB.parent;
        const groundFriction = b.isStatic ? crateGroundFriction.get(a) : a.isStatic ? crateGroundFriction.get(b) : undefined;
        if (groundFriction !== undefined) pair.friction = groundFriction;
        const other = a === player ? b : b === player ? a : undefined;
        if (other && Math.abs(pair.collision.normal.x) > .5) {
            // Yan temas kutuyu çekmesin; üst yüzeydeki sürtünmeyi ise koru.
            pair.friction = pair.frictionStatic = 0;
        }
        if (other) pair.restitution = 0;
        if (other && other !== player && !other.isStatic && other.isSleeping) matter.Sleeping.set(other, false);
        if (!pair.bodyA.isSensor && !pair.bodyB.isSensor && !a.isStatic && !b.isStatic) {
            if (a.isSleeping && !b.isSleeping && b.speed > .05) matter.Sleeping.set(a, false);
            if (b.isSleeping && !a.isSleeping && a.speed > .05) matter.Sleeping.set(b, false);
        }
    }
}
