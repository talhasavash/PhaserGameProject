// Mevcut SVG düşmanlarını Matter sensörleriyle hafif devriyeye bağlar; kutu fiziğine müdahale etmez.
import {enemyTypes} from '../../actors/enemies/EnemyCatalog.js';
import type {EnemyDefinition} from '../../world/model/contracts.js';
import type {MatterLibrary} from './MatterObjects.js';

export function validateMatterEnemy(enemy: EnemyDefinition) {
    const movement = enemy.movement?.type;
    if ((movement && !['patrol', 'stationary'].includes(movement)) || enemy.components?.length ||
        enemy.weapon || enemy.snowball || enemy.hop || enemy.jump || enemy.rage || enemy.breath || enemy.visibility || enemy.behaviors) {
        throw new Error('Matter düşmanında henüz desteklenmeyen davranış; devriye veya sabit hareket kullan.');
    }
    const speed = enemy.movement?.speed ?? enemy.speed ?? 0;
    if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < 0) throw new Error('Matter düşman hızı geçersiz.');
    const options = enemy.movement?.type === 'patrol' ? enemy.movement : enemy;
    if (![options.minX ?? enemy.x, options.maxX ?? enemy.x].every(Number.isFinite) ||
        Number(options.minX ?? enemy.x) > Number(options.maxX ?? enemy.x)) throw new Error('Matter devriye sınırları geçersiz.');
}
export function matterEnemyFrame(enemy: EnemyDefinition, elapsed: number) {
    const options = enemy.movement?.type === 'patrol' ? enemy.movement : enemy;
    const min = Number(options.minX ?? enemy.x), max = Number(options.maxX ?? enemy.x);
    const speed = enemy.movement?.type === 'stationary' ? 0 : Number(options.speed ?? enemy.speed ?? 0), span = max - min;
    const distance = span > 0 ? ((Number(enemy.x) - min + elapsed / 1000 * speed) % (span * 2) + span * 2) % (span * 2) : 0;
    return {x: span > 0 ? min + (distance < span ? distance : span * 2 - distance) : Number(enemy.x),
        y: Number(enemy.y) + Math.sin(elapsed / 700 + (enemy.offset ?? 0)) * (enemy.bob ?? 0),
        left: distance >= span};
}
export interface MatterEnemyActor {
    body: MatterJS.BodyType;
    sprite: Phaser.GameObjects.Sprite;
    definition: EnemyDefinition;
    active: boolean;
}
export class MatterEnemies {
    readonly actors: MatterEnemyActor[] = [];
    private readonly actions = new Map<MatterJS.BodyType, () => void>();
    constructor(scene: Phaser.Scene, private readonly matter: MatterLibrary,
        player: MatterJS.BodyType, definitions: EnemyDefinition[], onHit: (enemy: MatterEnemyActor) => void, groundY = 520) {
        for (const source of definitions) {
            validateMatterEnemy(source);
            const asset = enemyTypes.get(source.type)!.asset, scale = source.scale ?? .7;
            const definition = {...source, y: source.y ?? groundY - asset.height * scale / 2};
            const sprite = scene.add.sprite(definition.x!, definition.y!, definition.texture ?? definition.type).setScale(scale).setDepth(9);
            const body = matter.Bodies.rectangle(definition.x!, definition.y!, asset.width * scale * .65, asset.height * scale * .7,
                {isStatic: true, isSensor: true, label: `enemy-${definition.id ?? this.actors.length}`});
            scene.matter.world.add(body);
            const actor = {body, sprite, definition, active: true};
            this.actors.push(actor);
            this.actions.set(body, () => {
                if (!actor.active) return;
                if (player.velocity.y > .8 && player.position.y < body.bounds.min.y - 8) {
                    actor.active = false; body.collisionFilter.mask = 0;
                    matter.Body.setVelocity(player, {x: player.velocity.x, y: -4.5});
                    scene.tweens.add({targets: sprite, alpha: 0, scaleY: .15, duration: 180});
                    scene.sound.play('collect', {volume: .13});
                } else onHit(actor);
            });
        }
    }
    actionFor(body: MatterJS.BodyType) {return this.actions.get(body);}
    update(elapsed: number) {
        for (const actor of this.actors) {
            if (!actor.active) continue;
            const frame = matterEnemyFrame(actor.definition, elapsed);
            this.matter.Body.setPosition(actor.body, frame);
            actor.sprite.setPosition(frame.x, frame.y).setFlipX(frame.left);
        }
    }
}
