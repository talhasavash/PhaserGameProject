// Silah kayıtları: görsel, atış planı ve hareket aynı tür altında tanımlanır; düşman türünden bağımsızdır.

import type { WeaponType } from '../../world/model/contracts.js';
import { cacheTexture } from '../../graphics/texture.js';

export const weaponTypes: Map<string, WeaponType> = new Map();

export function registerWeaponType(name: string, definition: WeaponType) {
    if (!name || weaponTypes.has(name) || !definition.texture ||
        typeof definition.launch !== 'function' || typeof definition.frame !== 'function') {
        throw new Error('Silah benzersiz bir ad, texture, launch ve frame gerektirir.');
    }
    weaponTypes.set(name, definition);
}

export function resolveWeapon(patrol) {
    if (patrol.weapon === false) return null;
    const input = patrol.weapon ?? (patrol.snowball ? { ...patrol.snowball, type: patrol.snowball.kind === 'shard' ? 'ice-shard' : 'snowball' } : null);
    if (!input) return null;
    const definition = weaponTypes.get(input.type);
    if (!definition) throw new Error(`Bilinmeyen silah: ${input.type}. Önce registerWeaponType ile kaydet.`);
    const config = { period: 3100, speed: 210, range: 540, volley: 1, ...definition.defaults, ...input };
    if (![config.period, config.speed, config.range].every(value => Number.isFinite(value) && value > 0) ||
        !Number.isInteger(config.volley) || config.volley < 1 || config.volley > 6 ||
        (config.initialDelay !== undefined && (!Number.isFinite(config.initialDelay) || config.initialDelay < 0))) {
        throw new Error(`${input.type}: atış süresi, hız veya salvo geçersiz.`);
    }
    return { definition, config };
}

export function preloadWeaponAsset(scene, selection) {
    const weapon = resolveWeapon({ weapon: selection });
    const asset = weapon?.definition.asset;
    if (!asset || scene.textures?.exists(weapon.definition.texture)) return;
    scene.weaponAssetKeys ||= new Set();
    if (scene.weaponAssetKeys.has(weapon.definition.texture)) return;
    scene.load.svg(weapon.definition.texture, asset.src, { width: asset.width, height: asset.height });
    scene.weaponAssetKeys.add(weapon.definition.texture);
}

export function createSnowballTexture(scene) {
    cacheTexture(scene, 'snowball', 48, 48, g => {
        g.fillStyle(0x8ebed5); g.fillCircle(24, 24, 23);
        g.fillStyle(0xe4f5ff); g.fillCircle(23, 22, 21);
        g.fillStyle(0xffffff); g.fillCircle(18, 16, 10);
        g.fillStyle(0xb5d9e9); g.fillCircle(33, 30, 4); g.fillCircle(18, 34, 3);
    });
}

export function snowballFrame(elapsed, shot) {
    const age = Math.max(0, elapsed - shot.startAt) / 1000;
    if (shot.kind === 'shard') return straightFrame(elapsed, shot);
    return { x: shot.x + shot.direction * shot.speed * age,
        y: shot.y - 45 * age + 55 * age * age, done: age > 3.2 };
}
function straightFrame(elapsed, shot) {
    const age = Math.max(0, elapsed - shot.startAt) / 1000;
    return { x: shot.x + shot.vx * age, y: shot.y + shot.vy * age, done: age > 3.2 };
}
function aimedLaunch(scene, enemy, config, index) {
    const direction = scene.player.x < enemy.x ? -1 : 1;
    const x = enemy.x + direction * 24;
    const y = enemy.y + (config.type === 'ice-shard' ? 28 : -2);
    // Eski buz boss'unun üçlü açısı aynı kalır; yeni silahlar salvo merkezini kendileri belirler.
    const spread = config.type === 'ice-shard' ? index - 1 : index - (config.volley - 1) / 2;
    const angle = Math.atan2((scene.player.y ?? enemy.y) - y, scene.player.x - x) + spread * (config.spread ?? 0.18);
    return { x, y, direction, kind: config.type === 'ice-shard' ? 'shard' : config.type,
        speed: config.speed, vx: Math.cos(angle) * config.speed, vy: Math.sin(angle) * config.speed, angle };
}

const builtInWeapons = {
    snowball: {
        texture: 'snowball', scale: 0.48, radius: 21, offset: 3, prepare: createSnowballTexture,
        launch(scene, enemy, config) {
            const direction = scene.player.x < enemy.x ? -1 : 1;
            return { x: enemy.x + direction * 24, y: enemy.y - 2, direction, speed: config.speed, kind: config.kind, angle: 0 };
        }, frame: snowballFrame
    },
    'ice-shard': {
        texture: 'ice-shard', scale: 0.75, radius: 14, offset: 10, warningTint: 0xffd5ff,
        defaults: { volley: 3, range: 720, period: 2900, speed: 230 },
        prepare(scene) {
            cacheTexture(scene, 'ice-shard', 48, 48, g => {
                g.fillStyle(0x7965cb); g.fillTriangle(0, 24, 24, 8, 48, 24); g.fillTriangle(0, 24, 24, 40, 48, 24);
                g.fillStyle(0xc7faff); g.fillTriangle(0, 24, 24, 8, 48, 24);
                g.lineStyle(2, 0xffffff); g.lineBetween(6, 24, 39, 24);
            });
        }, launch: aimedLaunch, frame: straightFrame
    },
    bullet: {
        texture: 'enemy-bullet', scale: 0.7, radius: 9, offset: 3,
        defaults: { speed: 280, period: 2200 },
        prepare(scene) {
            cacheTexture(scene, 'enemy-bullet', 24, 24, g => {
                g.fillStyle(0x6e5c88); g.fillCircle(12, 12, 11);
                g.fillStyle(0xffdc8e); g.fillCircle(10, 10, 7);
            });
        }, launch: aimedLaunch, frame: straightFrame
    }
} satisfies Record<string, WeaponType>;

export type BuiltInWeaponName = keyof typeof builtInWeapons;
for (const [name, definition] of Object.entries(builtInWeapons)) registerWeaponType(name, definition);
