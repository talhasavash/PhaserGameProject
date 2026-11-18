// Factory: düşman türünün görselini, fizik gövdesini ve ilk kurulumunu tek kayıtta tanımlar.
/** @type {Map<string, import('../world/model/contracts.js').EnemyType>} */
export const enemyTypes = new Map();

export function registerEnemyType(name, definition) {
    if (enemyTypes.has(name)) throw new Error(`Düşman zaten kayıtlı: ${name}`);
    if (!name || !(definition.asset?.width > 0) || !(definition.asset?.height > 0)) throw new Error('Düşman görsel boyutları gerekli.');
    enemyTypes.set(name, definition);
}

for (const name of ['hedgehog', 'snail', 'bee', 'fox', 'penguin', 'frog', 'turtle', 'bat', 'bird', 'spider', 'salamander', 'robot', 'scarab',
    'night-owl', 'shadow-fox', 'moon-scorpion', 'moon-moth', 'cave-crab', 'dusk-wolf', 'snow-fox', 'ice-crab', 'frost-bat']) {
    registerEnemyType(name, { asset: { width: 76, height: 52 } });
}
enemyTypes.get('spider').setup = (scene, sprite, data) => {
    const thread = scene.add.line(data.x, 0, 0, data.threadTop ?? 220, 0, sprite.y - 12, 0xd0cde0, 0.7).setOrigin(0).setDepth(8);
    sprite.setData('thread', thread);
};
for (const name of ['ball', 'wheel']) registerEnemyType(name, { asset: { width: 52, height: 52 }, radius: 22, groundOffset: 22 });
registerEnemyType('snowman', { asset: { width: 64, height: 80 }, groundOffset: 36,
    body: { width: 42, height: 64, x: 11, y: 12 }, defaults: { snowball: { period: 3100, speed: 210 } } });
registerEnemyType('frost-warden', { asset: { width: 160, height: 160 }, body: { width: 82, height: 106, x: 39, y: 35 },
    defaults: { y: 325, scale: 1.3, bob: 18, snowball: { kind: 'shard', volley: 3, period: 2900, speed: 230, range: 720 } } });
const ogre = { asset: { width: 96, height: 100 }, groundOffset: 44, defaults: { scale: 1.8 }, body: { width: 58, height: 66, x: 19, y: 28 },
    setup(scene, sprite, data) { sprite.setData('shadow', scene.add.ellipse(data.x, 517, 76 * data.scale, 12, 0x332d4b, 0.23).setDepth(8)); } };
for (const name of ['ogre', 'ogre-moss', 'ogre-stone', 'ogre-ember', 'ogre-ember-angry', 'ogre-flame']) registerEnemyType(name, ogre);

// Composition: davranış seçenekleri eski bölüm alanlarına çevrilir; eski tanımlar da çalışır.
/** @param {string} type @param {Partial<import('../world/model/contracts.js').EnemyDefinition> & {x: number}} options */
export function defineEnemy(type, options) {
    const { behaviors = {}, ...data } = options;
    const x = data.x;
    return { minX: x, maxX: x, speed: 0, ...enemyTypes.get(type)?.defaults, ...data, type,
        ...behaviors.patrol,
        ...behaviors.vertical,
        ...(behaviors.hop ? { hop: behaviors.hop } : {}),
        ...(behaviors.visibility ? { visibility: behaviors.visibility } : {}),
        ...(behaviors.jump ? { jump: behaviors.jump } : {}),
        ...(behaviors.breath ? { breath: behaviors.breath } : {}),
        ...(behaviors.rage !== undefined ? { rage: behaviors.rage } : {}),
        ...(behaviors.shoot ? { snowball: behaviors.shoot } : {}) };
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
        ? { width: 48, height: 26, x: 14, y: 16 } : { width: 53, height: 27, x: 12, y: 23 });
    if (definition.radius) sprite.body.setCircle(definition.radius, 4, 4);
    else sprite.body.setSize(body.width, body.height).setOffset(body.x, body.y);
    definition.setup?.(scene, sprite, data);
    return { sprite, y };
}
