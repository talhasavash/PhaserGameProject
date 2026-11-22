// İnip yükselen kolonların çizimini, fizik gövdelerini ve geçiş zamanlamasını yönetir.

import { cacheTexture } from '../../graphics/texture.js';
import { isIceTheme } from '../scenery/themes.js';
import { createSnowballTexture } from '../../actors/enemies/WeaponCatalog.js';
import { platformThemes } from '../terrain/platforms.js';
import type { SurfaceStyle } from '../model/contracts.js';

const COLUMN_HEIGHT = 512;
export const RAISED_BOTTOM = 260;
export const CLOSED_BOTTOM = 520;

// Aşağı inen alt yüzeyin iki kare arasında geçtiği alanı da kontrol et.
export function columnCrushes(playerBody, columnBody, previousBottom, frame) {
    return frame.state === 'falling' || frame.state === 'closed'
        ? frame.bottom > previousBottom && previousBottom <= playerBody.bottom &&
            frame.bottom >= playerBody.top && playerBody.right > columnBody.left && playerBody.left < columnBody.right
        : false;
}

export function columnTiming(column) {
    return { open: column.openMs ?? 2100, warning: 500, fall: 220, closed: 750, rise: 900 };
}

// Yükseklik bölüm kurulurken bir kez seçilir; kareler arasında değişip titremez.
export function prepareColumn(definition, random = Math.random) {
    const [minimum, maximum] = definition.raisedRange || [150, 330];
    const raisedBottom = definition.raisedBottom ?? Math.round(minimum + random() * (maximum - minimum));
    return { ...definition, raisedBottom };
}

// Telefon kamerası dünyanın üstünü kırpar. Presin alt ucu beklerken de görünür kalsın.
export function visibleColumn(definition, viewHeight, groundY = CLOSED_BOTTOM) {
    const top = Math.max(0, 600 - viewHeight);
    const original = definition.raisedBottom ?? RAISED_BOTTOM;
    const visibleBottom = top + 56 + Math.max(0, original - 140) * 0.25;
    return { ...definition, raisedBottom: Math.min(groundY - 100, Math.max(original, visibleBottom)) };
}

// Oyun saati durunca kolon da durur. Bölüm yeniden kurulunca fazı sıfırlanır.
export function columnFrame(elapsed, column) {
    const timing = columnTiming(column);
    const raised = column.raisedBottom ?? RAISED_BOTTOM;
    const period = Object.values(timing).reduce((total, duration) => total + duration, 0);
    const clock = Math.max(0, elapsed - (column.startDelay || 0));
    let phase = (clock + (column.offset || 0)) % period;
    if (phase < timing.open) return { bottom: raised, state: 'open' };
    phase -= timing.open;
    if (phase < timing.warning) return { bottom: raised, state: 'warning' };
    phase -= timing.warning;
    if (phase < timing.fall) {
        const progress = phase / timing.fall;
        return { bottom: raised + (CLOSED_BOTTOM - raised) * progress ** 2, state: 'falling' };
    }
    phase -= timing.fall;
    if (phase < timing.closed) return { bottom: CLOSED_BOTTOM, state: 'closed' };
    phase -= timing.closed;
    return { bottom: CLOSED_BOTTOM - (CLOSED_BOTTOM - raised) * phase / timing.rise, state: 'rising' };
}

function columnTexture(scene, style?: SurfaceStyle) {
    const theme = style || scene.level.theme;
    const palette = style ? platformThemes[theme] : undefined;
    const key = `column-${theme}${style ? '-styled' : ''}`;
    return cacheTexture(scene, key, 80, COLUMN_HEIGHT, g => {
        if (isIceTheme(theme)) {
            g.fillStyle(palette?.body ?? 0x68afca); g.fillRoundedRect(4, 0, 72, COLUMN_HEIGHT, 6);
            g.fillStyle(palette?.detail ?? 0xbdebf5); g.fillRect(10, 0, 15, COLUMN_HEIGHT - 12);
            g.fillStyle(0xe7faff, 0.75); g.fillRect(14, 0, 4, COLUMN_HEIGHT - 20);
            g.lineStyle(2, 0xf0fcff, 0.8);
            for (let y = 40; y < COLUMN_HEIGHT - 30; y += 65) {
                g.lineBetween(27, y, 50, y + 24); g.lineBetween(50, y + 24, 42, y + 45);
            }
            g.fillStyle(palette?.edge ?? 0xe3f8ff); g.fillRoundedRect(0, COLUMN_HEIGHT - 20, 80, 20, 5);
            return;
        }
        const metal = theme === 'factory';
        g.fillStyle(palette?.body ?? (metal ? 0x718e9c : 0x6f627c)); g.fillRect(8, 0, 64, COLUMN_HEIGHT);
        g.fillStyle(palette?.edge ?? (metal ? 0xa9c4c7 : 0xa093ae)); g.fillRect(13, 0, 8, COLUMN_HEIGHT - 18);
        g.fillStyle(palette?.detail ?? (metal ? 0x365566 : 0x4b405b)); g.fillRect(57, 0, 10, COLUMN_HEIGHT - 18);
        for (let y = 30; y < COLUMN_HEIGHT - 20; y += 48) {
            g.lineStyle(3, palette?.detail ?? (metal ? 0x365566 : 0x4b405b)); g.lineBetween(20, y, 60, y);
        }
        g.fillStyle(palette?.edge ?? 0xd4b77b); g.fillRoundedRect(0, COLUMN_HEIGHT - 24, 80, 24, 4);
        g.fillStyle(0x443b51);
        for (let x = 6; x < 74; x += 16) g.fillTriangle(x, 491, x + 10, 491, x + 5, 504);
    });
}

export function createColumns(scene) {
    scene.columns = scene.physics.add.group({ allowGravity: false, immovable: true });
    const definitions = scene.level.columns || [];
    for (const source of definitions) {
        const key = columnTexture(scene, source.style);
        const definition = prepareColumn(source);
        const frame = columnFrame(0, visibleColumn(definition, scene.scale.height, scene.level.groundY));
        const column = scene.columns.create(definition.x, frame.bottom - COLUMN_HEIGHT / 2, key).setDepth(13);
        column.setScale(definition.width / 80, 1);
        column.body.setSize(80, COLUMN_HEIGHT);
        const lamp = scene.add.rectangle(definition.x, frame.bottom - 14, definition.width - 16, 5, 0x91dfb1).setDepth(14);
        column.setData('column', { definition, lamp, bottom: frame.bottom, wasClosed: frame.state === 'closed' });
    }
}

export function updateColumns(scene) {
    for (const column of scene.columns.getChildren()) {
        const data = column.getData('column');
        const frame = columnFrame(scene.elapsed, visibleColumn(data.definition, scene.scale.height, scene.level.groundY));
        if (columnCrushes(scene.player.body, column.body, data.bottom, frame)) scene.crushPlayer(frame.bottom);
        data.bottom = frame.bottom;
        column.body.reset(data.definition.x, frame.bottom - COLUMN_HEIGHT / 2);
        data.lamp.setPosition(column.x, frame.bottom - 14);
        data.lamp.setFillStyle(frame.state === 'open' ? 0x91dfb1 : 0xffa66b);
        data.lamp.setAlpha(frame.state === 'warning' ? 0.55 + Math.abs(Math.sin(scene.elapsed / 70)) * 0.45 : 1);
        if (frame.state === 'closed' && !data.wasClosed && Math.abs(scene.player.x - column.x) < 550) {
            scene.sound.play('boss-land', { volume: 0.12 });
        }
        data.wasClosed = frame.state === 'closed';
    }
}

// Gökyüzünden düşen ateş toplarının rastgele konumlarını, zamanlamasını ve hareketini yönetir.

const WARNING_MS = 1500;

export function fireWait(rain, random = Math.random) {
    return Math.max(8000, rain.period * (0.9 + random() * 0.5));
}

// Rastgele yer seçilirken başlangıç, cami ve dinlenme alanları korunur.
export function chooseFireX(level, playerX, random = Math.random, occupied = []) {
    const left = Math.max(180, playerX - 180);
    const right = Math.min(level.key.x - 100, playerX + 500);
    if (right <= left) return null;
    const safe = [level.spawn.x, level.checkpoint.x, level.exit.x, ...level.fountains.map(f => f.x)];
    for (let attempt = 0; attempt < 16; attempt++) {
        const x = left + random() * (right - left);
        const onGround = (level.gaps || []).every(gap => x < gap.x - 30 || x > gap.x + gap.width + 30);
        if (onGround && safe.every(point => Math.abs(x - point) > 110) && occupied.every(point => Math.abs(x - point) > 90)) return x;
    }
    return null; // Uygun yer yoksa bu atışı beklet; güvenli alanı bozma.
}

export function fireFrame(elapsed, plan) {
    const age = elapsed - plan.startAt;
    const y = 80 + Math.max(0, age - WARNING_MS) * plan.speed / 1000;
    return { warning: age >= 0 && age < WARNING_MS, falling: age >= WARNING_MS && y < 510, y, done: age >= WARNING_MS && y >= 510 };
}

export function createFireRain(scene) {
    scene.fireballs = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.rainDrops = [];
    if (!scene.level.fireRain?.length) return;
    if (scene.level.fireRain.some(rain => rain.kind === 'snow')) createSnowballTexture(scene);
    cacheTexture(scene, 'fireball', 32, 40, g => {
        g.fillStyle(0xef7d44); g.fillTriangle(6, 24, 16, 0, 27, 24); g.fillCircle(16, 22, 12);
        g.fillStyle(0xffdf88); g.fillCircle(16, 24, 6);
    });
    // Aynı anda yalnızca bir ateş: yeni atış, önceki bittikten uzun süre sonra gelir.
    scene.rainDrops = scene.level.fireRain.slice(0, 1).map(rain => {
        const snow = rain.kind === 'snow';
        const sprite = scene.fireballs.create(0, 80, snow ? 'snowball' : 'fireball').setDepth(14);
        if (snow) { sprite.setScale(1.3); sprite.body.setCircle(21, 3, 3); }
        else sprite.body.setCircle(10, 6, 14);
        sprite.disableBody(true, true);
        return { rain, sprite, plan: null, nextAt: 600 + rain.offset };
    });
}

export function updateFireRain(scene) {
    for (const drop of scene.rainDrops) {
        if (!drop.plan && scene.elapsed >= drop.nextAt) {
            const occupied = scene.rainDrops.filter(other => other.plan).map(other => other.plan.x);
            const x = chooseFireX(scene.level, scene.player.x, Math.random, occupied);
            drop.nextAt = scene.elapsed + 600;
            if (x !== null) drop.plan = { x, startAt: scene.elapsed, speed: drop.rain.speed * (0.85 + Math.random() * 0.3) };
        }
        if (!drop.plan) continue;
        const frame = fireFrame(scene.elapsed, drop.plan);
        if (frame.falling) drop.sprite.enableBody(true, drop.plan.x, frame.y, true, true);
        else if (drop.sprite.active) drop.sprite.disableBody(true, true);
        if (frame.done) {
            drop.plan = null;
            drop.nextAt = scene.elapsed + fireWait(drop.rain);
        }
    }
}
