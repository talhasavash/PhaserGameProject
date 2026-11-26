// Matter dünyası, karakter kontrolü ve sabit fizik adımı; ana oyun ve atölye aynı ayarları kullanır.
import {bindTouchControls} from '../../actors/player/TouchControls.js';
import {createLabWorld, drawLabObjects, captureLabPositions, renderLabObjects, renderLabLinks, wakeTouchedObjects} from './MatterObjects.js';
import type {MatterContact, MatterLibrary, MatterLabWorld, LabVisual} from './MatterObjects.js';
import type {MatterWorldDefinition} from './definitions.js';
import {labMotion, moveLabPlayer} from './movement.js';
import {FixedStepSimulation} from './simulation.js';

export class MatterRuntime {
    readonly library = (Phaser.Physics.Matter as unknown as {Matter: MatterLibrary}).Matter;
    readonly world: MatterLabWorld;
    readonly player: Phaser.GameObjects.Sprite;
    readonly controls = bindTouchControls();
    readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
    onJump?: () => void;
    private readonly simulation = new FixedStepSimulation();
    private readonly visuals: LabVisual[];
    private readonly chains: Phaser.GameObjects.Graphics;
    private groundedAt = -Infinity;
    private jumpAt = -Infinity;
    private queuedJumpAt = -Infinity;
    private paused = false;

    constructor(private readonly scene: Phaser.Scene, definition: MatterWorldDefinition, private readonly prefix: string) {
        this.world = createLabWorld(this.library, definition, objects => scene.matter.world.add(objects));
        this.visuals = drawLabObjects(scene, this.world);
        this.player = scene.add.sprite(definition.spawn.x, definition.spawn.y, `${prefix}0`).setScale(.8).setDepth(15);
        this.visuals.push({body: this.world.player, image: this.player,
            previous: {...this.world.player.position, angle: 0}});
        this.chains = scene.add.graphics().setDepth(4);
        const animation = `matter-walk-${prefix}`;
        if (!scene.anims.exists(animation)) scene.anims.create({key: animation,
            frames: [1, 4, 2, 5].map(frame => ({key: `${prefix}${frame}`})), frameRate: 10, repeat: -1});
        this.keys = scene.input.keyboard!.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,R,ESC,ENTER') as typeof this.keys;
        const contacts = (event: {pairs: MatterContact[]}) => {
            wakeTouchedObjects(this.library, this.world.player, event.pairs);
            if (scene.time.now - this.jumpAt < 150) return;
            for (const pair of event.pairs) {
                const feet = pair.bodyA === this.world.feet || pair.bodyB === this.world.feet;
                const other = pair.bodyA === this.world.feet ? pair.bodyB : pair.bodyA;
                if (feet && !other.isSensor && Math.abs(pair.collision.normal.y) > .5) this.groundedAt = scene.time.now;
            }
        };
        scene.matter.world.on('collisionstart', contacts);
        scene.matter.world.on('collisionactive', contacts);
        scene.matter.world.on('beforeupdate', (event: {delta: number}) => moveLabPlayer(this.library,
            this.world.player, this.direction(), scene.time.now - this.groundedAt < 110, event.delta));
        this.render(0);
    }

    private direction() {
        const touch = this.controls.keys;
        return Number(this.keys.RIGHT.isDown || this.keys.D.isDown || touch.right.isDown) -
            Number(this.keys.LEFT.isDown || this.keys.A.isDown || touch.left.isDown);
    }

    update(time: number, delta: number) {
        if (this.paused) return;
        const body = this.world.player, touch = this.controls.keys;
        const grounded = time - this.groundedAt < 110;
        const jump = [this.keys.UP, this.keys.W, this.keys.SPACE].some(key => Phaser.Input.Keyboard.JustDown(key));
        if (jump || touch.up.justPressed) this.queuedJumpAt = time;
        touch.up.justPressed = false;
        if (grounded && time - this.queuedJumpAt < 200 && time - this.jumpAt > 180) {
            this.library.Body.setVelocity(body, {x: body.velocity.x, y: -labMotion.jump});
            this.jumpAt = time;
            this.queuedJumpAt = this.groundedAt = -Infinity;
            this.onJump?.();
        }
        const held = this.keys.UP.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || touch.up.isDown;
        if (!held && time - this.jumpAt > 70 && body.velocity.y < -labMotion.shortJump) {
            this.library.Body.setVelocity(body, {x: body.velocity.x, y: -labMotion.shortJump});
        }
        const alpha = this.simulation.advance(delta, milliseconds => {
            captureLabPositions(this.visuals);
            this.scene.matter.world.step(milliseconds);
        });
        this.render(alpha);
        const direction = this.direction();
        if (direction) this.player.setFlipX(direction < 0);
        if (grounded && Math.abs(body.velocity.x) > .5) {
            this.player.play(`matter-walk-${this.prefix}`, true);
            this.player.anims.timeScale = .6 + Math.abs(body.velocity.x) / labMotion.speed * .8;
        } else {
            this.player.anims.stop();
            this.player.setTexture(`${this.prefix}${grounded ? 0 : 3}`);
        }
    }

    private render(alpha: number) {
        renderLabObjects(this.visuals, alpha);
        renderLabLinks(this.chains, this.world, this.visuals);
    }

    setPaused(paused: boolean) {
        this.paused = paused;
        this.controls.reset();
        this.simulation.reset();
        if (paused) { this.scene.matter.world.pause(); this.scene.anims.pauseAll(); }
        else { this.scene.matter.world.resume(); this.scene.anims.resumeAll(); }
    }

    setDebug(enabled: boolean) {
        this.scene.matter.world.drawDebug = enabled;
        this.scene.matter.world.debugGraphic.setVisible(enabled);
    }

    destroy() {
        this.controls.destroy();
        // Matter eklentisi dünyasıyla birlikte kendi olay dinleyicilerini temizler.
        this.scene.anims.resumeAll();
    }
}
