// Yeni düşman davranışlarını kaydeder; bölümler kayıtlı davranışları ad ve seçenekleriyle seçer.

import type { EnemyBehavior, EnemyType, EnemyInput, EnemyDefinition, BehaviorSelection } from '../../world/model/contracts.js';

export const enemyBehaviors: Map<string, EnemyBehavior> = new Map();
export const builtInBehaviors = new Set(['patrol', 'vertical', 'hop', 'visibility', 'jump', 'breath', 'rage', 'shoot']);

export function registerEnemyBehavior(name: string, behavior: EnemyBehavior) {
    if (!name || enemyBehaviors.has(name) || typeof behavior.update !== 'function') {
        throw new Error('Davranış benzersiz bir ad ve update fonksiyonu gerektirir.');
    }
    enemyBehaviors.set(name, behavior);
}

export function behaviorSelection(selection: string | BehaviorSelection) {
    const { type, ...options } = typeof selection === 'string' ? { type: selection } : selection;
    const definition = enemyBehaviors.get(type);
    if (!definition) throw new Error(`Bilinmeyen davranış: ${type}. Önce registerEnemyBehavior ile kaydet.`);
    return { type, definition, options };
}

// Örnek bir bağımsız hareket: oyuncu yakına gelince belirlenen sınırlar içinde takip et.
registerEnemyBehavior('chase', { update(scene, enemy, patrol, delta, options = {}) {
    if (patrol.hopActive) return;
    const { speed = 90, range = 350, minX = 0, maxX = scene.level.width } = options;
    const distance = scene.player.x - enemy.x;
    const direction = Math.sign(distance);
    const blocked = direction < 0 ? enemy.x <= minX : enemy.x >= maxX;
    const moving = Math.abs(distance) > 8 && Math.abs(distance) <= range && !blocked;
    if (moving) patrol.direction = direction;
    enemy.setVelocityX(moving ? direction * speed : 0);
} });

// Havada sabit yükseklikte takip eder; oyuncunun üstüne ışınlanmaz ve güvenli alanlara girmez.
registerEnemyBehavior('overhead', { update(scene, enemy, patrol, delta, options = {}) {
    const {speed = 80, minX = patrol.minX, maxX = patrol.maxX, distance = 80} = options;
    const target = Math.max(minX, Math.min(maxX, scene.player.x + distance));
    const difference = target - enemy.x;
    enemy.setVelocityX(Math.abs(difference) < 8 ? 0 : Math.sign(difference) * Math.min(speed, Math.abs(difference) * 2));
    const visibleY = (scene.cameras?.main.scrollY ?? 0) + (enemy.displayHeight ?? 0) / 2 + 12;
    const compact = scene.scale?.height <= 480;
    // Dar ekranda gökyüzünü görünür tutarken zıplayan çocuğun üstündeki yolu aç.
    const ceiling = compact && Number.isFinite(scene.player.y) ? scene.player.y - 120 : Infinity;
    const targetY = Math.min(Math.max(patrol.baseY, visibleY), ceiling);
    enemy.setVelocityY((targetY - enemy.y) * (compact ? 8 : 4));
} });

registerEnemyBehavior('face-player', {update(scene, enemy, patrol) {
    patrol.direction = scene.player.x < enemy.x ? -1 : 1;
    enemy.setFlipX(patrol.direction < 0);
}});

// Factory: düşman türünün görselini, fizik gövdesini ve ilk kurulumunu tek kayıtta tanımlar.

export const enemyTypes: Map<string, EnemyType> = new Map();

export function registerEnemyType(name: string, definition: EnemyType) {
    if (enemyTypes.has(name)) throw new Error(`Düşman zaten kayıtlı: ${name}`);
    if (!name || !(definition.asset?.width > 0) || !(definition.asset?.height > 0)) throw new Error('Düşman görsel boyutları gerekli.');
    enemyTypes.set(name, definition);
}

const regularEnemies = ['hedgehog', 'snail', 'bee', 'fox', 'penguin', 'frog', 'turtle', 'bat', 'bird', 'spider', 'salamander', 'robot', 'scarab',
    'night-owl', 'shadow-fox', 'moon-scorpion', 'moon-moth', 'cave-crab', 'dusk-wolf', 'snow-fox', 'ice-crab', 'frost-bat'] as const;
const rollingEnemies = ['ball', 'wheel'] as const;
const ogreEnemies = ['ogre', 'ogre-moss', 'ogre-stone', 'ogre-ember', 'ogre-ember-angry', 'ogre-flame'] as const;

for (const name of regularEnemies) {
    registerEnemyType(name, {asset: {width: 76, height: 52}});
}
enemyTypes.get('spider')!.setup = (scene, sprite, data) => {
    const thread = scene.add.line(data.x, 0, 0, data.threadTop ?? 220, 0, sprite.y - 12, 0xd0cde0, 0.7).setOrigin(0).setDepth(8);
    sprite.setData('thread', thread);
};
for (const name of rollingEnemies) registerEnemyType(name, {
    asset: {width: 52, height: 52},
    radius: 22,
    groundOffset: 22
});
const specialEnemies = {
    'ember-bat': {asset: {width: 88, height: 64}, body: {width: 48, height: 30, x: 20, y: 17}},
    'basalt-crab': {asset: {width: 88, height: 64}, groundOffset: 30, body: {width: 60, height: 35, x: 14, y: 23}},
    'fire-salamander': {asset: {width: 100, height: 64}, groundOffset: 30, body: {width: 68, height: 34, x: 16, y: 24}},
    'magma-drake': {asset: {width: 140, height: 120}, groundOffset: 54, body: {width: 85, height: 78, x: 28, y: 30}},
    'cinder-sun': {asset: {width: 112, height: 112}, body: {width: 70, height: 70, x: 21, y: 21}, groundOffset: 56,
        setup(scene, sprite, data) {
            const resize = () => {
                const height = scene.scale.height;
                sprite.setScale((data.scale ?? .9) * (height <= 360 ? .55 : height <= 480 ? .72 : 1));
            };
            resize();
            const cleanup = () => {
                scene.scale.off('resize', resize);
                scene.events.off('shutdown', cleanup); scene.events.off('destroy', cleanup);
                sprite.off('destroy', cleanup);
            };
            scene.scale.on('resize', resize);
            scene.events.once('shutdown', cleanup); scene.events.once('destroy', cleanup);
            sprite.once('destroy', cleanup);
        }},
    'snow-hare': {
        asset: {width: 80, height: 64}, groundOffset: 30,
        body: {width: 49, height: 37, x: 15, y: 22}
    },
    'ice-owl': {
        asset: {width: 88, height: 64}, groundOffset: 30,
        body: {width: 50, height: 39, x: 19, y: 13}
    },
    'ice-sentinel': {
        asset: {width: 80, height: 96}, groundOffset: 46,
        body: {width: 45, height: 73, x: 18, y: 17}
    },
    'glacier-mammoth': {
        asset: {width: 180, height: 160}, groundOffset: 80,
        body: {width: 126, height: 126, x: 27, y: 26}, defaults: {scale: 1.25}
    },
    snowman: {
        asset: {width: 64, height: 80}, groundOffset: 36,
        body: {width: 42, height: 64, x: 11, y: 12}, defaults: {snowball: {period: 3100, speed: 210}}
    },
    'frost-warden': {
        asset: {width: 160, height: 160}, body: {width: 82, height: 106, x: 39, y: 35},
        defaults: {y: 325, scale: 1.3, bob: 18, snowball: {kind: 'shard', volley: 3, period: 2900, speed: 230, range: 720}}
    }
} satisfies Record<string, EnemyType>;
for (const [name, definition] of Object.entries(specialEnemies)) registerEnemyType(name, definition);

export type BuiltInEnemyName = typeof regularEnemies[number] | typeof rollingEnemies[number]
    | keyof typeof specialEnemies | typeof ogreEnemies[number];
const ogre = {
    asset: {width: 96, height: 100},
    groundOffset: 44,
    defaults: {scale: 1.8},
    body: {width: 58, height: 66, x: 19, y: 28},
    setup(scene, sprite, data) {
        sprite.setData('shadow', scene.add.ellipse(data.x, 517, 76 * data.scale, 12, 0x332d4b, 0.23).setDepth(8));
    }
};
for (const name of ogreEnemies) registerEnemyType(name, ogre);

// Composition: davranış seçenekleri eski bölüm alanlarına çevrilir; eski tanımlar da çalışır.

export function defineEnemy(type: EnemyDefinition['type'], options: EnemyInput): EnemyDefinition {
    if (!enemyTypes.has(type)) throw new Error(`Bilinmeyen düşman: ${type}. Önce registerEnemyType ile kaydet.`);
    const {behaviors = {}, movement, components = [], ...data} = options;
    const selections = [...components];
    const movementFields = {};
    if (movement) {
        const {type: name, ...config} = movement;
        if (name === 'patrol') Object.assign(movementFields, config);
        else if (name === 'stationary') Object.assign(movementFields, {speed: 0});
        else {
            behaviorSelection(movement);
            selections.push(movement);
            Object.assign(movementFields, {speed: 0});
        }
    }
    for (const [name, config] of Object.entries(behaviors)) {
        if (!builtInBehaviors.has(name) && config !== false) {
            const selection = {...(config as Record<string, unknown>), type: name};
            behaviorSelection(selection);
            selections.push(selection);
        }
    }
    for (const selection of selections) behaviorSelection(selection);
    const x = data.x;
    return {
        minX: x, maxX: x, speed: 0, ...enemyTypes.get(type)?.defaults, ...data, type,
        ...behaviors.patrol,
        ...behaviors.vertical,
        ...(behaviors.hop ? {hop: behaviors.hop} : {}),
        ...(behaviors.visibility ? {visibility: behaviors.visibility} : {}),
        ...(behaviors.jump ? {jump: behaviors.jump} : {}),
        ...(behaviors.breath ? {breath: behaviors.breath} : {}),
        ...(behaviors.rage !== undefined ? {rage: behaviors.rage} : {}),
        ...(behaviors.shoot ? {snowball: behaviors.shoot} : {}),
        ...movementFields,
        ...(selections.length ? {components: selections} : {})
    };
}

export function createEnemySprite(scene, data) {
    const definition = enemyTypes.get(data.type);
    if (!definition) throw new Error(`Bilinmeyen düşman: ${data.type}`);
    const platform = data.platform === undefined ? null : scene.level.platforms[data.platform];
    const scale = data.scale || 0.8;
    const y = data.y ?? (platform?.y ?? scene.level.groundY) - (definition.groundOffset ?? 24) * scale;
    const sprite = scene.hazards.create(data.x, y, data.texture || data.type).setDepth(12);
    sprite.setScale(scale);
    const body = definition.body || (data.y !== undefined
        ? {width: 48, height: 26, x: 14, y: 16} : {width: 53, height: 27, x: 12, y: 23});
    if (definition.radius) sprite.body.setCircle(definition.radius, 4, 4);
    else sprite.body.setSize(body.width, body.height).setOffset(body.x, body.y);
    definition.setup?.(scene, sprite, data);
    return {sprite, y};
}
