// Seçilen arka plan parçalarını Phaser ile kurar; aynı şeklin çizim dokusunu tekrar kullanır.
import { cacheTexture } from '../../graphics/texture.js';

export type BackgroundPartType = 'sun' | 'moon' | 'cloud' | 'hill' | 'mountain' | 'tree' | 'pine' | 'circle' | 'triangle' | 'volcano' | 'basalt' | 'arch'
    | 'crescent' | 'minaret' | 'palm' | 'lantern' | 'rosette' | 'dome';

export interface BackgroundPart {
    type: BackgroundPartType;
    /** Bütün parçaların x/y konumu şeklin merkezidir. */
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: number;
    detailColor?: number;
    scale?: number;
    alpha?: number;
    depth?: number;
    scrollFactor?: number;
    repeat?: { count: number; stepX: number; stepY?: number };
}

export interface BackgroundDefinition {
    sky: number;
    ground?: { body: number; edge: number };
    parts: BackgroundPart[];
}

interface PartStyle { width: number; height: number; color: number; detailColor: number }
interface PartFactory extends PartStyle {
    depth: number;
    scrollFactor: number;
    draw(graphics: Phaser.GameObjects.Graphics, style: PartStyle): void;
}

// Factory: yeni bir hazır şekil bu listeye eklenir; bölümün çizim kodunu bilmesi gerekmez.
const factories: Record<BackgroundPartType, PartFactory> = {
    crescent: {width: 100, height: 100, color: 0xffe9ad, detailColor: 0x18294c, depth: -90, scrollFactor: .08,
        draw(g, p) {
            g.fillStyle(p.color); g.fillEllipse(p.width * .48, p.height * .5, p.width * .9, p.height * .9);
            g.fillStyle(p.detailColor); g.fillEllipse(p.width * .66, p.height * .38, p.width * .75, p.height * .75);
        }},
    minaret: {width: 65, height: 300, color: 0xe5d7ba, detailColor: 0xd4b469, depth: -55, scrollFactor: .4,
        draw(g, p) {
            const mid = p.width / 2;
            g.fillStyle(p.color); g.fillRect(mid - p.width * .14, p.height * .22, p.width * .28, p.height * .78);
            g.fillStyle(p.detailColor);
            g.fillTriangle(mid - p.width * .18, p.height * .22, mid, p.height * .04, mid + p.width * .18, p.height * .22);
            for (const y of [.3, .52, .75]) g.fillRect(p.width * .2, p.height * y, p.width * .6, 7);
            g.fillStyle(0x557e83); g.fillRoundedRect(mid - 4, p.height * .38, 8, 18, 4);
            g.lineStyle(2, p.detailColor); g.lineBetween(mid, 0, mid, p.height * .08);
        }},
    palm: {width: 160, height: 220, color: 0x52836a, detailColor: 0xb3865a, depth: -40, scrollFactor: .7,
        draw(g, p) {
            const mid = p.width / 2, crown = p.height * .25;
            g.fillStyle(p.detailColor); g.fillRect(mid - 7, crown, 14, p.height - crown);
            g.fillStyle(p.color);
            for (const direction of [-1, 1]) {
                g.fillTriangle(mid, crown, mid + direction * p.width * .48, crown + 30, mid + direction * p.width * .3, crown - 20);
                g.fillTriangle(mid, crown, mid + direction * p.width * .35, 2, mid + direction * p.width * .12, crown - 8);
            }
            g.fillStyle(0x99704c); g.fillEllipse(mid + 10, crown + 16, 12, 18);
        }},
    lantern: {width: 48, height: 110, color: 0xf7d98b, detailColor: 0x98794d, depth: -25, scrollFactor: .8,
        draw(g, p) {
            const mid = p.width / 2;
            g.lineStyle(2, p.detailColor); g.lineBetween(mid, 0, mid, p.height * .25);
            g.fillStyle(p.color, .15); g.fillEllipse(mid, p.height * .6, p.width, p.height * .65);
            g.fillStyle(p.color); g.fillRoundedRect(p.width * .24, p.height * .4, p.width * .52, p.height * .35, 4);
            g.fillStyle(p.detailColor); g.fillTriangle(p.width * .12, p.height * .4, mid, p.height * .24, p.width * .88, p.height * .4);
            g.fillRect(p.width * .2, p.height * .74, p.width * .6, 6);
            g.lineStyle(2, p.detailColor); g.lineBetween(mid, p.height * .4, mid, p.height * .74);
        }},
    rosette: {width: 90, height: 90, color: 0xe4c77f, detailColor: 0x4b8587, depth: -45, scrollFactor: .55,
        draw(g, p) {
            g.fillStyle(p.color); g.fillRect(p.width * .2, p.height * .2, p.width * .6, p.height * .6);
            g.fillTriangle(p.width / 2, 0, 0, p.height / 2, p.width / 2, p.height);
            g.fillTriangle(p.width / 2, 0, p.width, p.height / 2, p.width / 2, p.height);
            g.fillStyle(p.detailColor); g.fillEllipse(p.width / 2, p.height / 2, p.width * .3, p.height * .3);
        }},
    dome: {width: 220, height: 170, color: 0xd9e7dc, detailColor: 0x58948d, depth: -60, scrollFactor: .3,
        draw(g, p) {
            g.fillStyle(p.color); g.fillRect(p.width * .08, p.height * .5, p.width * .84, p.height * .5);
            g.fillStyle(p.detailColor); g.fillEllipse(p.width / 2, p.height * .48, p.width * .9, p.height * .75);
            g.fillStyle(p.color); g.fillRect(p.width * .05, p.height * .65, p.width * .9, p.height * .35);
            g.lineStyle(3, p.detailColor); g.lineBetween(p.width / 2, 0, p.width / 2, p.height * .2);
            g.fillStyle(p.detailColor); g.fillRoundedRect(p.width * .44, p.height * .73, p.width * .12, p.height * .27, 8);
        }},
    volcano: {width: 500, height: 320, color: 0x513544, detailColor: 0xff9b45, depth: -70, scrollFactor: .2,
        draw(g, p) {
            g.fillStyle(p.color);
            g.fillTriangle(0, p.height, p.width * .39, 35, p.width * .61, 35);
            g.fillTriangle(0, p.height, p.width * .61, 35, p.width, p.height);
            g.fillStyle(p.detailColor); g.fillEllipse(p.width / 2, 35, p.width * .24, 20);
            g.fillTriangle(p.width * .48, 36, p.width * .57, 36, p.width * .6, p.height * .6);
            g.fillTriangle(p.width * .55, p.height * .45, p.width * .72, p.height, p.width * .62, p.height);
            g.fillStyle(0xffe4a0); g.fillEllipse(p.width * .49, 32, p.width * .12, 7);
        }},
    basalt: {width: 160, height: 300, color: 0x392f43, detailColor: 0xbb6447, depth: -40, scrollFactor: .65,
        draw(g, p) {
            for (let i = 0; i < 4; i++) {
                const x = i * p.width / 4, top = (i % 3) * p.height * .15;
                g.fillStyle(p.color); g.fillRect(x, top, p.width / 4 - 3, p.height - top);
                g.fillStyle(p.detailColor, .5); g.fillRect(x + 3, top + 8, 3, p.height - top - 8);
            }
        }},
    arch: {width: 300, height: 300, color: 0x4c3540, detailColor: 0xa16a50, depth: -50, scrollFactor: .5,
        draw(g, p) {
            g.lineStyle(p.width * .16, p.color); g.strokeEllipse(p.width / 2, p.height * .38, p.width * .8, p.height * .6);
            g.fillStyle(p.color); g.fillRect(p.width * .02, p.height * .35, p.width * .17, p.height * .65);
            g.fillRect(p.width * .81, p.height * .35, p.width * .17, p.height * .65);
            g.fillStyle(p.detailColor); g.fillRect(0, p.height * .38, p.width * .21, 10);
            g.fillRect(p.width * .79, p.height * .38, p.width * .21, 10);
        }},
    sun: { width: 100, height: 100, color: 0xffdf87, detailColor: 0xfff3b5, depth: -90, scrollFactor: 0.08,
        draw(g, p) {
            g.fillStyle(p.color, 0.18); g.fillEllipse(p.width / 2, p.height / 2, p.width, p.height);
            g.fillStyle(p.color); g.fillEllipse(p.width / 2, p.height / 2, p.width * 0.8, p.height * 0.8);
            g.fillStyle(p.detailColor, 0.5); g.fillEllipse(p.width * 0.4, p.height * 0.35, p.width * 0.2, p.height * 0.15);
        } },
    moon: { width: 90, height: 90, color: 0xf1e9c7, detailColor: 0xcac7bc, depth: -90, scrollFactor: 0.08,
        draw(g, p) {
            g.fillStyle(p.color); g.fillEllipse(p.width / 2, p.height / 2, p.width * 0.94, p.height * 0.94);
            g.fillStyle(p.detailColor, 0.45);
            for (const [x, y, size] of [[0.35, 0.3, 0.2], [0.65, 0.55, 0.26], [0.35, 0.7, 0.12]]) {
                g.fillEllipse(p.width * x, p.height * y, p.width * size, p.height * size);
            }
        } },
    cloud: { width: 160, height: 80, color: 0xf5faf3, detailColor: 0xf5faf3, depth: -80, scrollFactor: 0.18,
        draw(g, p) {
            g.fillStyle(p.color);
            g.fillEllipse(p.width * 0.5, p.height * 0.7, p.width, p.height * 0.5);
            g.fillEllipse(p.width * 0.3, p.height * 0.45, p.width * 0.45, p.height * 0.65);
            g.fillEllipse(p.width * 0.62, p.height * 0.4, p.width * 0.5, p.height * 0.75);
        } },
    hill: { width: 700, height: 320, color: 0x90bca3, detailColor: 0x90bca3, depth: -60, scrollFactor: 0.4,
        draw(g, p) { g.fillStyle(p.color); g.fillEllipse(p.width / 2, p.height / 2, p.width, p.height); } },
    mountain: { width: 360, height: 300, color: 0x8eafce, detailColor: 0xf0f9ff, depth: -70, scrollFactor: 0.3,
        draw(g, p) {
            g.fillStyle(p.color); g.fillTriangle(0, p.height, p.width / 2, 0, p.width, p.height);
            g.fillStyle(p.detailColor); g.fillTriangle(p.width * 0.32, p.height * 0.36, p.width / 2, 0, p.width * 0.68, p.height * 0.36);
        } },
    tree: { width: 140, height: 220, color: 0x5c9575, detailColor: 0x80634f, depth: -40, scrollFactor: 0.75,
        draw(g, p) {
            g.fillStyle(p.detailColor); g.fillRect(p.width * 0.45, p.height * 0.4, p.width * 0.1, p.height * 0.6);
            g.fillStyle(p.color);
            g.fillEllipse(p.width * 0.5, p.height * 0.3, p.width * 0.7, p.height * 0.6);
            g.fillEllipse(p.width * 0.3, p.height * 0.45, p.width * 0.6, p.height * 0.45);
            g.fillEllipse(p.width * 0.7, p.height * 0.45, p.width * 0.6, p.height * 0.45);
        } },
    pine: { width: 130, height: 240, color: 0x53867c, detailColor: 0x80634f, depth: -40, scrollFactor: 0.75,
        draw(g, p) {
            g.fillStyle(p.detailColor); g.fillRect(p.width * 0.45, p.height * 0.6, p.width * 0.1, p.height * 0.4);
            g.fillStyle(p.color);
            g.fillTriangle(0, p.height * 0.82, p.width / 2, p.height * 0.15, p.width, p.height * 0.82);
            g.fillTriangle(p.width * 0.15, p.height * 0.5, p.width / 2, 0, p.width * 0.85, p.height * 0.5);
        } },
    circle: { width: 80, height: 80, color: 0xcbe8f6, detailColor: 0xcbe8f6, depth: -60, scrollFactor: 0.4,
        draw(g, p) { g.fillStyle(p.color); g.fillEllipse(p.width / 2, p.height / 2, p.width, p.height); } },
    triangle: { width: 100, height: 100, color: 0x708fb3, detailColor: 0x708fb3, depth: -60, scrollFactor: 0.4,
        draw(g, p) { g.fillStyle(p.color); g.fillTriangle(0, p.height, p.width / 2, 0, p.width, p.height); } }
};

export function validateBackground(definition: BackgroundDefinition): void {
    const fail = (message: string): never => { throw new Error(`Arka plan: ${message}`); };
    const color = (value: number) => Number.isInteger(value) && value >= 0 && value <= 0xffffff;
    if (!color(definition.sky) || !Array.isArray(definition.parts)) fail('sky rengi ve parts dizisi gerekli.');
    if (definition.ground && (!color(definition.ground.body) || !color(definition.ground.edge))) fail('Zemin renkleri geçersiz.');
    for (const part of definition.parts) {
        if (!Object.hasOwn(factories, part.type)) fail(`Bilinmeyen parça: ${part.type}`);
        if (![part.x, part.y].every(Number.isFinite)) fail('Parça x/y konumları sayı olmalı.');
        for (const value of [part.width, part.height, part.scale]) {
            if (value !== undefined && (!Number.isFinite(value) || value <= 0)) fail('Boyut ve ölçek pozitif olmalı.');
        }
        for (const value of [part.color, part.detailColor]) if (value !== undefined && !color(value)) fail('Parça rengi geçersiz.');
        if (part.alpha !== undefined && (!Number.isFinite(part.alpha) || part.alpha < 0 || part.alpha > 1)) fail('alpha 0–1 arasında olmalı.');
        if (part.depth !== undefined && (!Number.isFinite(part.depth) || part.depth >= 0)) fail('Arka plan depth değeri negatif olmalı.');
        if (part.scrollFactor !== undefined && (!Number.isFinite(part.scrollFactor) || part.scrollFactor < 0)) fail('scrollFactor negatif olamaz.');
        if (part.repeat && (!Number.isInteger(part.repeat.count) || part.repeat.count < 1 || part.repeat.count > 200 ||
            !Number.isFinite(part.repeat.stepX) || !Number.isFinite(part.repeat.stepY ?? 0))) fail('Tekrar sayısı 1–200, adımlar sayı olmalı.');
    }
}

export class BackgroundBuilder {
    constructor(private readonly scene: Phaser.Scene) {}

    build(definition: BackgroundDefinition, width: number, groundY: number): void {
        validateBackground(definition);
        this.scene.cameras.main.setBackgroundColor(definition.sky);
        const ground = definition.ground ?? { body: 0x92715d, edge: 0x9fc67b };
        this.scene.add.rectangle(width / 2, (groundY + 600) / 2, width, 600 - groundY, ground.body).setDepth(-5);
        this.scene.add.rectangle(width / 2, groundY + 4, width, 8, ground.edge).setDepth(-4);
        for (const part of definition.parts) this.add(part);
    }

    private add(part: BackgroundPart): void {
        const factory = factories[part.type];
        const style = { width: part.width ?? factory.width, height: part.height ?? factory.height,
            color: part.color ?? factory.color, detailColor: part.detailColor ?? factory.detailColor };
        const key = `scenery-part-${part.type}-${style.width}-${style.height}-${style.color}-${style.detailColor}`;
        cacheTexture(this.scene, key, style.width, style.height, g => factory.draw(g, style));
        for (let i = 0; i < (part.repeat?.count ?? 1); i++) {
            this.scene.add.image(part.x + i * (part.repeat?.stepX ?? 0), part.y + i * (part.repeat?.stepY ?? 0), key)
                .setOrigin(0.5).setScale(part.scale ?? 1).setAlpha(part.alpha ?? 1)
                .setDepth(part.depth ?? factory.depth).setScrollFactor(part.scrollFactor ?? factory.scrollFactor);
        }
    }
}
