// Yalnızca geliştirmede açılan Matter sahnesi; karakter girişini, fizik temaslarını ve deneme akışını yönetir.
import {matterLab} from './definition.js';
import {createLabWorld, drawLabObjects, wakeTouchedObjects, captureLabPositions, renderLabObjects, renderLabLinks} from './MatterObjects.js';
import type {MatterLabWorld, MatterLibrary, MatterContact, LabVisual} from './MatterObjects.js';
import {bindTouchControls} from '../../src/actors/player/TouchControls.js';
import {characterSkin} from '../../src/data/characters.js';
import {labMotion, moveLabPlayer} from './movement.js';
import {FixedStepSimulation} from './simulation.js';

export class MatterLabScene extends Phaser.Scene {
    private character: 'boy' | 'girl' = 'boy';
    private stationIndex = 0;
    private world!: MatterLabWorld;
    private player!: Phaser.GameObjects.Sprite;
    private visuals: LabVisual[] = [];
    private readonly simulation = new FixedStepSimulation();
    private matterLibrary!: MatterLibrary;
    private linkGraphics!: Phaser.GameObjects.Graphics;
    private controls!: ReturnType<typeof bindTouchControls>;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private groundedAt = -Infinity;
    private jumpAt = -Infinity;
    private queuedJumpAt = -Infinity;
    private resetting = false;
    private completed = false;
    paused = false;

    constructor() { super('MatterLab'); }

    init(data: {character?: 'boy' | 'girl'; station?: number} = {}) {
        this.character = data.character ?? this.character;
        this.stationIndex = Number.isInteger(data.station) && matterLab.stations[data.station!] ? data.station! : 0;
        this.groundedAt = this.jumpAt = this.queuedJumpAt = -Infinity;
        this.resetting = this.completed = this.paused = false;
        this.simulation.reset();
    }

    preload() {
        const prefix = characterSkin(this.character).prefix;
        for (let i = 0; i < 6; i++) if (!this.textures.exists(`lab-${prefix}-${i}`)) {
            this.load.svg(`lab-${prefix}-${i}`, `/assets/images/hero/${prefix}-${i}.svg`, {width: 64, height: 80});
        }
    }

    create() {
        // Matter motoru yalnızca bu sahneye aittir; Arcade sahnesi ve bölüm kayıtları kullanılmaz.
        const matter = (Phaser.Physics.Matter as unknown as {Matter: MatterLibrary}).Matter;
        this.matterLibrary = matter;
        const station = matterLab.stations[this.stationIndex];
        this.world = createLabWorld(matter, {...matterLab, spawn: station.spawn}, objects => this.matter.world.add(objects));
        this.drawWorkshop();
        this.visuals = drawLabObjects(this, this.world);
        const prefix = characterSkin(this.character).prefix;
        this.player = this.add.sprite(station.spawn.x, station.spawn.y, `lab-${prefix}-0`).setScale(.8).setDepth(8);
        this.visuals.push({body: this.world.player, image: this.player,
            previous: {...this.world.player.position, angle: 0}});
        this.linkGraphics = this.add.graphics().setDepth(4);
        renderLabLinks(this.linkGraphics, this.world, this.visuals);
        const animation = `lab-walk-${prefix}`;
        if (!this.anims.exists(animation)) this.anims.create({key: animation,
            frames: [1, 4, 2, 5].map(i => ({key: `lab-${prefix}-${i}`})), frameRate: 10, repeat: -1});
        this.controls = bindTouchControls();
        this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,R,ESC') as typeof this.keys;
        const contact = (event: {pairs: MatterContact[]}) => {
            wakeTouchedObjects(matter, this.world.player, event.pairs);
            this.observeGround(event.pairs);
        };
        this.matter.world.on('collisionstart', contact);
        this.matter.world.on('collisionactive', contact);
        this.matter.world.on('beforeupdate', (event: {delta: number}) => this.move(event.delta));
        this.cameras.main.setBounds(0, 0, matterLab.width, 600).startFollow(this.player, false, 1, 0);
        this.alignCamera();
        this.scale.on('resize', this.alignCamera, this);
        this.setDebug((document.getElementById('lab-debug') as HTMLInputElement).checked);
        this.status(station.instruction);
        const release = document.getElementById('lab-release') as HTMLButtonElement;
        release.hidden = !station.release?.length;
        release.disabled = false;
        this.updatePauseButton();
        document.getElementById('lab-loading')!.hidden = true;
        this.events.once('shutdown', () => {
            this.controls.destroy();
            this.scale.off('resize', this.alignCamera, this);
            // Matter eklentisi kapanırken kendi dünyasını ve temas dinleyicilerini temizler.
            this.anims.resumeAll();
        });
    }

    private observeGround(pairs: MatterContact[]) {
        if (this.time.now - this.jumpAt < 150) return;
        for (const pair of pairs) {
            const feet = pair.bodyA === this.world.feet || pair.bodyB === this.world.feet;
            const other = pair.bodyA === this.world.feet ? pair.bodyB : pair.bodyA;
            if (feet && !other.isSensor && Math.abs(pair.collision.normal.y) > .5) this.groundedAt = this.time.now;
        }
    }

    private move(delta: number) {
        if (this.paused || this.resetting) return;
        const touch = this.controls.keys;
        const direction = Number(this.keys.RIGHT.isDown || this.keys.D.isDown || touch.right.isDown) -
            Number(this.keys.LEFT.isDown || this.keys.A.isDown || touch.left.isDown);
        moveLabPlayer(this.matterLibrary,
            this.world.player, direction, this.time.now - this.groundedAt < 110, delta);
    }

    update(time: number, delta: number) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) { this.restart(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.togglePause();
        if (this.paused || this.resetting) return;
        const touch = this.controls.keys;
        const direction = Number(this.keys.RIGHT.isDown || this.keys.D.isDown || touch.right.isDown) -
            Number(this.keys.LEFT.isDown || this.keys.A.isDown || touch.left.isDown);
        const body = this.world.player;
        const grounded = time - this.groundedAt < 110;
        const jump = [this.keys.UP, this.keys.W, this.keys.SPACE].some(key => Phaser.Input.Keyboard.JustDown(key));
        if (jump || touch.up.justPressed) this.queuedJumpAt = time;
        touch.up.justPressed = false;
        if (grounded && time - this.queuedJumpAt < 200 && time - this.jumpAt > 180) {
            this.matterLibrary.Body.setVelocity(body, {x: body.velocity.x, y: -labMotion.jump});
            this.jumpAt = time;
            this.queuedJumpAt = this.groundedAt = -Infinity;
        }
        const held = this.keys.UP.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || touch.up.isDown;
        if (!held && time - this.jumpAt > 70 && body.velocity.y < -labMotion.shortJump) {
            this.matterLibrary.Body.setVelocity(body, {x: body.velocity.x, y: -labMotion.shortJump});
        }
        const alpha = this.simulation.advance(delta, milliseconds => {
            captureLabPositions(this.visuals);
            this.matter.world.step(milliseconds);
        });
        renderLabObjects(this.visuals, alpha);
        renderLabLinks(this.linkGraphics, this.world, this.visuals);
        const prefix = characterSkin(this.character).prefix;
        if (direction) this.player.setFlipX(direction < 0);
        if (grounded && Math.abs(body.velocity.x) > .5) {
            this.player.play(`lab-walk-${prefix}`, true);
            this.player.anims.timeScale = .6 + Math.abs(body.velocity.x) / labMotion.speed * .8;
        }
        else { this.player.anims.stop(); this.player.setTexture(`lab-${prefix}-${grounded ? 0 : 3}`); }
        if (body.position.y > 720) {
            this.resetting = true;
            this.controls.reset();
            this.matter.world.pause();
            this.status('Çukura düştün. Deneme alanı yeniden kuruluyor…');
            this.time.delayedCall(550, () => this.restart());
        }
        if (!this.completed && body.position.x > matterLab.goal.x - 35) {
            this.completed = true;
            this.status('Deneme tamamlandı! Yenileyerek bütün nesneleri başa alabilirsin.');
            this.tweens.add({targets: this.goalGlow, alpha: .9, duration: 350, yoyo: true, repeat: 3});
        }
    }

    togglePause() {
        this.paused = !this.paused;
        this.controls.reset();
        this.simulation.reset();
        if (this.paused) { this.matter.world.pause(); this.anims.pauseAll(); }
        else { this.matter.world.resume(); this.anims.resumeAll(); }
        this.updatePauseButton();
    }

    restart() {
        this.matter.world.resume();
        this.anims.resumeAll();
        this.scene.restart({character: this.character, station: this.stationIndex});
    }

    goToStation(station: number) { this.scene.restart({character: this.character, station}); }

    releaseObjects() {
        if (this.paused) return;
        for (const id of matterLab.stations[this.stationIndex].release ?? []) {
            const object = this.world.objects.get(id);
            if (object) this.matterLibrary.Sleeping.set(object.body, false);
        }
        (document.getElementById('lab-release') as HTMLButtonElement).disabled = true;
    }

    setDebug(enabled: boolean) {
        this.matter.world.drawDebug = enabled;
        this.matter.world.debugGraphic.setVisible(enabled);
    }

    private alignCamera() {
        this.cameras.main.scrollY = Math.max(0, 600 - this.scale.height);
        this.cameras.main.setDeadzone(this.scale.width * .3, this.scale.height);
    }
    private status(text: string) { document.getElementById('lab-status')!.textContent = text; }
    private updatePauseButton() {
        const button = document.getElementById('lab-pause')!;
        button.textContent = this.paused ? '▶' : 'Ⅱ';
        button.setAttribute('aria-label', this.paused ? 'Devam et' : 'Duraklat');
    }
    private goalGlow!: Phaser.GameObjects.Arc;

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
