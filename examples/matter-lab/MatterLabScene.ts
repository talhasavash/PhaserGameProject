// Yerel atölyenin ekranı ve deneme seçimi; fizik ve karakter ana oyunla aynı Runtime'dan gelir.
import {matterLab} from './definition.js';
import {MatterRuntime} from '../../src/physics/matter/MatterRuntime.js';
import {characterSkin} from '../../src/data/characters.js';

export class MatterLabScene extends Phaser.Scene {
    private character: 'boy' | 'girl' = 'boy';
    private stationIndex = 0;
    private runtime!: MatterRuntime;
    private resetting = false;
    private completed = false;
    private goalGlow!: Phaser.GameObjects.Arc;
    paused = false;
    private get world() { return this.runtime.world; }
    private get player() { return this.runtime.player; }
    constructor() { super('MatterLab'); }

    init(data: {character?: 'boy' | 'girl'; station?: number} = {}) {
        this.character = data.character ?? this.character;
        this.stationIndex = Number.isInteger(data.station) && matterLab.stations[data.station!] ? data.station! : 0;
        this.resetting = this.completed = this.paused = false;
    }

    preload() {
        const prefix = characterSkin(this.character).prefix;
        for (let i = 0; i < 6; i++) if (!this.textures.exists(`lab-${prefix}-${i}`)) {
            this.load.svg(`lab-${prefix}-${i}`, `/assets/images/hero/${prefix}-${i}.svg`, {width: 64, height: 80});
        }
    }

    create() {
        const station = matterLab.stations[this.stationIndex];
        this.runtime = new MatterRuntime(this, {...matterLab, spawn: station.spawn}, `lab-${characterSkin(this.character).prefix}-`);
        this.drawWorkshop();
        this.cameras.main.setBounds(0, 0, matterLab.width, 600).startFollow(this.player, false, 1, 0);
        this.alignCamera();
        this.scale.on('resize', this.alignCamera, this);
        this.setDebug((document.getElementById('lab-debug') as HTMLInputElement).checked);
        document.getElementById('lab-status')!.textContent = station.instruction;
        const release = document.getElementById('lab-release') as HTMLButtonElement;
        release.hidden = !station.release?.length;
        release.disabled = false;
        this.updatePauseButton();
        document.getElementById('lab-loading')!.hidden = true;
        this.events.once('shutdown', () => {
            this.runtime.destroy();
            this.scale.off('resize', this.alignCamera, this);
        });
    }

    update(time: number, delta: number) {
        if (Phaser.Input.Keyboard.JustDown(this.runtime.keys.R)) { this.restart(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.runtime.keys.ESC)) this.togglePause();
        if (this.paused || this.resetting) return;
        this.runtime.update(time, delta);
        if (this.world.player.position.y > 720) {
            this.resetting = true;
            this.runtime.setPaused(true);
            document.getElementById('lab-status')!.textContent = 'Çukura düştün. Deneme alanı yeniden kuruluyor…';
            this.time.delayedCall(550, () => this.restart());
        }
        if (!this.completed && this.world.player.position.x > matterLab.goal.x - 35) {
            this.completed = true;
            document.getElementById('lab-status')!.textContent = 'Deneme tamamlandı! Yenileyerek bütün nesneleri başa alabilirsin.';
            this.tweens.add({targets: this.goalGlow, alpha: .9, duration: 350, yoyo: true, repeat: 3});
        }
    }

    togglePause() {
        this.paused = !this.paused;
        this.runtime.setPaused(this.paused);
        this.updatePauseButton();
    }
    restart() { this.runtime.setPaused(false); this.scene.restart({character: this.character, station: this.stationIndex}); }
    goToStation(station: number) { this.scene.restart({character: this.character, station}); }
    setDebug(enabled: boolean) { this.runtime.setDebug(enabled); }
    releaseObjects() {
        if (this.paused) return;
        for (const id of matterLab.stations[this.stationIndex].release ?? []) {
            const object = this.world.objects.get(id);
            if (object) this.runtime.library.Sleeping.set(object.body, false);
        }
        (document.getElementById('lab-release') as HTMLButtonElement).disabled = true;
    }
    private alignCamera() {
        this.cameras.main.scrollY = Math.max(0, 600 - this.scale.height);
        this.cameras.main.setDeadzone(this.scale.width * .3, this.scale.height);
    }
    private updatePauseButton() {
        const button = document.getElementById('lab-pause')!;
        button.textContent = this.paused ? '▶' : 'Ⅱ';
        button.setAttribute('aria-label', this.paused ? 'Devam et' : 'Duraklat');
    }
    private drawWorkshop() {
        this.cameras.main.setBackgroundColor(0xc9e6eb);
        this.add.circle(700, 130, 60, 0xffe7a5).setScrollFactor(.12).setDepth(-9);
        for (let x = 160; x < matterLab.width; x += 430) {
            this.add.ellipse(x, 440, 600, 200, 0x92b8be).setScrollFactor(.3).setDepth(-8);
            this.add.ellipse(x + 120, 495, 480, 160, 0x739eab).setScrollFactor(.55).setDepth(-7);
        }
        this.add.rectangle(2070, 590, 300, 140, 0x1c3449).setDepth(-5);
        const terrain = this.add.graphics();
        terrain.fillStyle(0x607f90); terrain.lineStyle(3, 0xd0e8df);
        this.world.surfaces.forEach((body, i) => {
            if (matterLab.surfaces[i].hidden) return;
            const points = (body.vertices ?? []).map(p => new Phaser.Math.Vector2(p.x, p.y));
            terrain.fillPoints(points, true); terrain.strokePoints(points, true);
        });
        for (const sign of matterLab.signs) this.add.text(sign.x, sign.y, sign.text, {
            fontFamily: 'Trebuchet MS, sans-serif', fontSize: '19px', color: '#244455',
            align: 'center', backgroundColor: '#f4f4d9dd', padding: {x: 14, y: 10}
        }).setOrigin(.5);
        this.goalGlow = this.add.circle(matterLab.goal.x, 463, 45, 0xffdc7c, .3);
        this.add.star(matterLab.goal.x, 463, 5, 22, 40, 0xffdb68).setStrokeStyle(3, 0xfff9dd);
        this.add.text(matterLab.goal.x, 400, 'BİTİŞ', {fontSize: '20px', color: '#345569'}).setOrigin(.5);
        for (const hinge of matterLab.hinges) {
            this.add.rectangle(hinge.anchor.x, hinge.anchor.y + 12, 18, 16, 0x617484).setDepth(3);
            this.add.circle(hinge.anchor.x, hinge.anchor.y, 7, 0xe2ba74).setStrokeStyle(2, 0x70533c).setDepth(7);
        }
    }
}
