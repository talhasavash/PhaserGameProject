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
    'flame-orb': {
        texture: 'flame-orb', scale: .75, radius: 12, offset: 10, warningTint: 0xffbf65,
        defaults: {period: 3200, speed: 205, range: 580},
        prepare: createFlameOrb,
        launch(scene, enemy, config, index) {
            const shot = aimedLaunch(scene, enemy, config, index);
            // Çenenin ucundan çıkar; farklı boydaki ateş canlıları aynı silahı kullanabilir.
            return {...shot, x: enemy.x + shot.direction * enemy.displayWidth * .34,
                y: enemy.y + enemy.displayHeight * .08};
        },
        frame: straightFrame
    },
    'sun-ember': {
        texture: 'flame-orb', scale: .65, radius: 12, offset: 10, warningTint: 0xffe8a0,
        defaults: {period: 3800, initialDelay: 3000, speed: 180, range: 460},
        prepare: createFlameOrb,
        launch(scene, enemy, config) {
            // Atış anındaki konuma nişan alır; sonradan çocuğu takip etmez.
            const y = enemy.y + enemy.displayHeight * .32;
            const angle = Math.atan2(Math.max(100, scene.player.y - y), scene.player.x - enemy.x);
            return {x: enemy.x, y, vx: Math.cos(angle) * config.speed!, vy: Math.sin(angle) * config.speed!};
        }, frame: straightFrame
    },
    'ice-axe': {
        texture: 'ice-axe', scale: 0.8, radius: 16, offset: 8, warningTint: 0xb9f5ff,
        defaults: {speed: 170, period: 4300, range: 620},
        prepare(scene) {
            // Buz baltasının şekli: sap, iki kristal ağız ve beyaz yansımalar.
            cacheTexture(scene, 'ice-axe', 48, 48, g => {
                g.fillStyle(0x527fa8); g.fillRoundedRect(21, 12, 6, 34, 2);
                g.fillStyle(0x69bfdf);
                g.fillTriangle(4, 5, 24, 16, 4, 31);
                g.fillTriangle(44, 5, 24, 16, 44, 31);
                g.fillStyle(0xd6faff);
                g.fillTriangle(4, 5, 24, 16, 8, 18);
                g.fillTriangle(44, 5, 24, 16, 40, 18);
                g.lineStyle(2, 0xffffff); g.lineBetween(6, 8, 6, 25); g.lineBetween(42, 8, 42, 25);
                g.fillStyle(0xf0ffff); g.fillCircle(24, 17, 4);
            });
        },
        launch: aimedLaunch,
        frame(elapsed, shot) {
            const age = Math.max(0, elapsed - shot.startAt) / 1000;
            return {...straightFrame(elapsed, shot), rotation: shot.angle + age * 8};
        }
    },
    'snow-disc': {
        texture: 'snow-disc', scale: 0.65, radius: 14, offset: 6, warningTint: 0xb6ffff,
        defaults: {speed: 190, period: 3600, range: 480},
        prepare(scene) {
            cacheTexture(scene, 'snow-disc', 40, 40, g => {
                g.fillStyle(0x457fa9); g.fillCircle(20, 20, 18);
                g.fillStyle(0xb9f4ff); g.fillCircle(20, 20, 14);
                g.lineStyle(3, 0xffffff);
                for (let i = 0; i < 3; i++) {
                    const a = i * Math.PI / 3;
                    g.lineBetween(20 - Math.cos(a) * 12, 20 - Math.sin(a) * 12,
                        20 + Math.cos(a) * 12, 20 + Math.sin(a) * 12);
                }
            });
        },
        launch(scene, enemy, config) {
            return {x: enemy.x, y: enemy.y, direction: scene.player.x < enemy.x ? -1 : 1, speed: config.speed};
        },
        frame(elapsed, shot) {
            const age = Math.max(0, elapsed - shot.startAt) / 1000;
            // Önce uzaklaşır, sonra aynı noktaya döner; yeniden atıştan önce kaybolur.
            const distance = shot.speed * (age <= 1.1 ? age : 2.2 - age);
            return {x: shot.x + shot.direction * distance, y: shot.y, rotation: age * 7, done: age >= 2.2};
        }
    },
    'frost-wave': {
        texture: 'frost-wave', scale: 0.7, radius: 10, offset: 6, warningTint: 0xded1ff,
        defaults: {speed: 180, period: 3400, range: 520},
        prepare(scene) {
            cacheTexture(scene, 'frost-wave', 32, 32, g => {
                g.fillStyle(0x827ed7); g.fillCircle(16, 16, 15);
                g.fillStyle(0xd7faff); g.fillCircle(16, 16, 10);
                g.fillStyle(0xffffff); g.fillCircle(12, 12, 4);
            });
        },
        launch(scene, enemy, config) {
            return {x: enemy.x, y: enemy.y, direction: scene.player.x < enemy.x ? -1 : 1, speed: config.speed};
        },
        frame(elapsed, shot) {
            const age = Math.max(0, elapsed - shot.startAt) / 1000;
            return {x: shot.x + shot.direction * shot.speed * age,
                y: shot.y + Math.sin(age * 5) * 26, done: age >= 3};
        }
    },
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

function createFlameOrb(scene) {
    cacheTexture(scene, 'flame-orb', 48, 48, g => {
        g.fillStyle(0xff5d2c, .3); g.fillCircle(24, 24, 23);
        g.fillStyle(0xe94824); g.fillCircle(24, 24, 17);
        g.fillStyle(0xffb73e); g.fillCircle(22, 22, 13);
        g.fillStyle(0xfff1a5); g.fillEllipse(20, 20, 12, 16);
    });
}

export type BuiltInWeaponName = keyof typeof builtInWeapons;
for (const [name, definition] of Object.entries(builtInWeapons)) registerWeaponType(name, definition);
