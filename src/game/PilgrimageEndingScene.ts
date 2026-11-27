// Kâbe dünyası finali: tüm karakterleri saldırı ve fizik olmadan bir araya getirir, kapanıştan menüye döner.
import {enemyTypes} from '../actors/enemies/EnemyCatalog.js';
import {characterSkin} from '../data/characters.js';
import {element} from '../ui/dom.js';
import {showLoading, updateLoading, finishLoading} from '../ui/scenePage.js';
import {PILGRIMAGE_ENDING_SCENE_KEY} from './sceneRouting.js';
import {cacheTexture} from '../graphics/texture.js';
import {levels} from '../world/levels/level.js';

interface PrayerPalette {cloth: number; edge: number; skin: number; headwear: number}
interface EndingActor {
    key: string; src: string; width: number; height: number; hero: boolean; size?: number; prayer?: PrayerPalette;
}
const congregation = [
    {name: 'elder', cloth: 0xe9e3cb, edge: 0x929b85, skin: 0xd5a47d, headwear: 0xf6f1df},
    {name: 'traveller', cloth: 0x536d8a, edge: 0xb4c6d3, skin: 0x9f6b4d, headwear: 0xe5dfc9},
    {name: 'father', cloth: 0x90725a, edge: 0xd9c4a2, skin: 0xe4b28b, headwear: 0x5d554a},
    {name: 'sage', cloth: 0x618c7b, edge: 0xc3d9cf, skin: 0xc18b65, headwear: 0xe3e8d7},
    {name: 'rose', cloth: 0xaa7383, edge: 0xe8c9cf, skin: 0xe4b28b, headwear: 0xf0d5be},
    {name: 'blue', cloth: 0x53678d, edge: 0xb3c5e0, skin: 0x9f6b4d, headwear: 0xafbfd2}
];

export function endingCast(): EndingActor[] {
    // Yuvarlanan nesneler ve güneş cemaate katılmaz.
    const enemies: EndingActor[] = [...enemyTypes].filter(([key, type]) => !type.radius && key !== 'cinder-sun')
        .map(([key, {asset}]) => ({key, hero: false,
        src: asset.src ?? `assets/images/${asset.folder ?? 'enemy'}/${key}.svg`,
        width: asset.width, height: asset.height}));
    const children = ['ihram_boy', 'chador_girl'].map((name, index) => {
            const skin = characterSkin(name);
            return {key: `${skin.prefix}-0`, hero: true,
                src: `assets/images/${skin.folder}/${skin.prefix}-0.svg`, width: 64, height: 80, size: 66,
                prayer: {cloth: index ? 0x303744 : 0xfffdf3, edge: index ? 0xa1adbd : 0xb3bdb7,
                    skin: 0xf2c8a0, headwear: index ? 0x303744 : 0xfffdf3}};
        });
    const adults = congregation.map(({name, ...prayer}) => ({
        key: `ending-person-${name}`, hero: true, prayer, size: 84,
        src: `assets/images/scene/ending-person-${name}.svg`, width: 64, height: 96
    }));
    return [...enemies, ...adults.slice(0, 3), ...children, ...adults.slice(3)];
}

export class PilgrimageEndingScene extends Phaser.Scene {
    private nextLevelIndex = 75;
    private finished = false;
    private stage!: Phaser.GameObjects.Container;

    constructor() { super(PILGRIMAGE_ENDING_SCENE_KEY); }
    init(data: {nextLevelIndex: number}) { this.nextLevelIndex = data.nextLevelIndex; this.finished = false; }
    preload() {
        showLoading();
        this.load.on('progress', updateLoading);
        if (!this.textures.exists('pilgrimage-ending')) {
            this.load.svg('pilgrimage-ending', 'assets/images/scene/pilgrimage-ending.svg', {width: 1000, height: 600});
        }
        for (const actor of endingCast()) if (!this.textures.exists(actor.key)) {
            this.load.svg(actor.key, actor.src, {width: actor.width, height: actor.height});
        }
    }
    create() {
        for (const id of ['game-result', 'fall-result', 'touch-controls', 'settings-button', 'settings-panel']) element(id).hidden = true;
        element('game-stage').inert = false;
        element('toolbar-status').textContent = 'Kâbe’nin Yolları · kapanış';
        this.cameras.main.setBackgroundColor('#13203d');
        this.stage = this.add.container(0, 0);
        this.stage.add(this.add.image(0, 0, 'pilgrimage-ending').setOrigin(0));
        const cast = endingCast();
        const enemies = cast.filter(actor => !actor.hero);
        for (const [index, actor] of cast.entries()) {
            const heroIndex = index - enemies.length;
            const row = actor.hero ? 4 : Math.floor(index / 11);
            const count = actor.hero ? cast.length - enemies.length : Math.min(11, enemies.length - row * 11);
            const column = actor.hero ? heroIndex : index % 11;
            const x = 500 + (column - (count - 1) / 2) * (actor.hero ? 90 : 77);
            const y = actor.hero ? 570 : 345 + row * 45;
            const size = actor.size ?? 36;
            const scale = Math.min(size / actor.width, size / actor.height);
            const fromLeft = index % 2 === 0;
            const sprite = this.add.image(fromLeft ? -80 : 1080, y, actor.key).setOrigin(.5, 1).setScale(scale);
            const group = this.add.container(0, 0, [sprite]);
            this.stage.add(group);
            const delay = row * 380 + column * 85;
            this.tweens.add({targets: sprite, x, duration: 2300, delay, ease: 'Sine.easeOut'});
            // Hafif adım hareketi; bittiğinde tüm katılımcılar aynı anda saf tutar.
            this.tweens.add({targets: sprite, y: y - 3, duration: 150, delay, yoyo: true, repeat: 7});
            this.time.delayedCall(5900, () => {
                if (actor.prayer) this.bowHero(sprite, x, y, actor.key, actor.prayer, size / 80);
                else this.tweens.add({targets: sprite, scaleX: scale * .65, scaleY: scale * .9, angle: 75,
                    duration: 1150, ease: 'Sine.easeInOut'});
            });
        }
        const title = this.add.text(500, 35, 'MEYVE BAHÇESİ', {fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '26px', fontStyle: 'bold', color: '#f4e6bd', stroke: '#182640', strokeThickness: 3})
            .setResolution(2).setOrigin(.5).setAlpha(0);
        this.stage.add(title);
        this.tweens.add({targets: title, alpha: 1, duration: 1200, delay: 10000});
        const verse = this.add.text(500, 68, levels[this.nextLevelIndex - 1].verse?.text ?? '', {
            fontFamily: 'Trebuchet MS, sans-serif', fontSize: '19px', color: '#f8edd0',
            align: 'center', wordWrap: {width: 650}, stroke: '#182640', strokeThickness: 3
        }).setResolution(2).setOrigin(.5).setAlpha(0);
        this.stage.add(verse);
        this.tweens.add({targets: verse, alpha: 1, duration: 1200, delay: 10500});
        this.addContinueButton();
        this.fitStage();
        this.scale.on('resize', this.fitStage, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.fitStage, this);
            this.load.off('progress', updateLoading);
        });
        this.time.delayedCall(22000, () => this.finish());
        finishLoading(this);
    }
    private bowHero(sprite: Phaser.GameObjects.Image, x: number, y: number, actorKey: string, palette: PrayerPalette, scale: number) {
        const key = `ending-prayer-${actorKey}`;
        cacheTexture(this, key, 64, 64, g => {
            const {cloth, edge, skin, headwear} = palette;
            // Sağ profilden secde: dizler solda, alın ve eller sağda zemine değer.
            g.fillStyle(edge); g.fillEllipse(10, 56, 16, 7);
            g.fillStyle(cloth); g.fillEllipse(20, 49, 23, 16);
            g.fillEllipse(28, 35, 29, 20);
            g.lineStyle(1.5, edge); g.strokeEllipse(28, 35, 29, 20);
            g.lineStyle(12, cloth); g.lineBetween(33, 35, 45, 44);
            g.lineStyle(6, cloth); g.lineBetween(35, 40, 39, 52); g.lineBetween(39, 52, 54, 55);
            g.fillStyle(skin); g.fillEllipse(49, 48, 16, 16);
            g.fillStyle(headwear); g.fillEllipse(46, 44, 13, 13);
            g.fillStyle(skin); g.fillEllipse(55, 56, 9, 5);
            g.lineStyle(1.2, edge); g.lineBetween(21, 34, 18, 42); g.lineBetween(28, 32, 34, 39);
        });
        const pose = this.add.image(x, y, key).setOrigin(.5, 1).setScale(scale * .9).setAlpha(0);
        this.stage.add(pose);
        this.tweens.add({targets: sprite, scaleY: sprite.scaleY * .6, alpha: 0, duration: 900, ease: 'Sine.easeInOut'});
        this.tweens.add({targets: pose, alpha: 1, duration: 800, delay: 450});
    }
    private addContinueButton() {
        const button = this.add.container(938, 548).setAlpha(0).setSize(72, 72);
        const disc = this.add.circle(0, 0, 32, 0x29495e, .85).setStrokeStyle(3, 0xf2dfac);
        button.add([disc, this.add.triangle(2, 0, -9, -13, -9, 13, 13, 0, 0xf9edce)]);
        this.stage.add(button);
        this.time.delayedCall(11000, () => {
            this.tweens.add({targets: button, alpha: 1, duration: 700});
            button.setInteractive({useHandCursor: true});
            button.on('pointerdown', () => button.setScale(.9));
            button.on('pointerout', () => button.setScale(1));
            button.on('pointerup', () => this.finish());
        });
        this.input.keyboard?.on('keydown-ENTER', () => { if (button.alpha === 1) this.finish(); });
    }
    private fitStage() {
        const scale = Math.min(this.scale.width / 1000, this.scale.height / 600);
        this.stage.setScale(scale).setPosition((this.scale.width - 1000 * scale) / 2, (this.scale.height - 600 * scale) / 2);
    }
    private finish() {
        if (this.finished) return;
        this.finished = true;
        this.game.events.emit('world-complete', this.nextLevelIndex);
    }
}
