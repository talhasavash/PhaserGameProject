// Kolon tavana kadar uzanır. Yükseldiğinde altından yürünür; üstünden atlanamaz.
const COLUMN_HEIGHT = 512;
export const RAISED_BOTTOM = 410;
export const CLOSED_BOTTOM = 520;

export function columnTiming(column) {
    return { open: column.openMs ?? 2100, warning: 650, fall: 260, closed: 850, rise: 1100 };
}

// Oyun saati durunca kolon da durur. Bölüm yeniden kurulunca fazı sıfırlanır.
export function columnFrame(elapsed, column) {
    const timing = columnTiming(column);
    const period = Object.values(timing).reduce((total, duration) => total + duration, 0);
    let phase = (elapsed + (column.offset || 0)) % period;
    if (phase < timing.open) return { bottom: RAISED_BOTTOM, state: 'open' };
    phase -= timing.open;
    if (phase < timing.warning) return { bottom: RAISED_BOTTOM, state: 'warning' };
    phase -= timing.warning;
    if (phase < timing.fall) {
        const progress = phase / timing.fall;
        return { bottom: RAISED_BOTTOM + (CLOSED_BOTTOM - RAISED_BOTTOM) * progress ** 2, state: 'falling' };
    }
    phase -= timing.fall;
    if (phase < timing.closed) return { bottom: CLOSED_BOTTOM, state: 'closed' };
    phase -= timing.closed;
    return { bottom: CLOSED_BOTTOM - (CLOSED_BOTTOM - RAISED_BOTTOM) * phase / timing.rise, state: 'rising' };
}

export function createColumns(scene) {
    scene.columns = scene.physics.add.group({ allowGravity: false, immovable: true });
    const definitions = scene.level.columns || [];
    if (definitions.length === 0) return;
    const key = `column-${scene.level.theme}`;
    if (!scene.textures.exists(key)) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const metal = scene.level.theme === 'factory';
        g.fillStyle(metal ? 0x718e9c : 0x6f627c); g.fillRect(8, 0, 64, COLUMN_HEIGHT);
        g.fillStyle(metal ? 0xa9c4c7 : 0xa093ae); g.fillRect(13, 0, 8, COLUMN_HEIGHT - 18);
        g.fillStyle(metal ? 0x365566 : 0x4b405b); g.fillRect(57, 0, 10, COLUMN_HEIGHT - 18);
        for (let y = 30; y < COLUMN_HEIGHT - 20; y += 48) {
            g.lineStyle(3, metal ? 0x365566 : 0x4b405b); g.lineBetween(20, y, 60, y);
        }
        g.fillStyle(0xd4b77b); g.fillRoundedRect(0, COLUMN_HEIGHT - 24, 80, 24, 4);
        g.fillStyle(0x443b51);
        for (let x = 6; x < 74; x += 16) g.fillTriangle(x, 491, x + 10, 491, x + 5, 504);
        g.generateTexture(key, 80, COLUMN_HEIGHT); g.destroy();
    }
    for (const definition of definitions) {
        const frame = columnFrame(0, definition);
        const column = scene.columns.create(definition.x, frame.bottom - COLUMN_HEIGHT / 2, key).setDepth(13);
        column.setScale(definition.width / 80, 1);
        column.body.setSize(80, COLUMN_HEIGHT);
        const shadow = scene.add.ellipse(definition.x, 517, definition.width + 70, 10, 0xffe4a2, 0.9).setDepth(9);
        const lamp = scene.add.rectangle(definition.x, frame.bottom - 14, definition.width - 16, 5, 0x91dfb1).setDepth(14);
        column.setData('column', { definition, shadow, lamp, wasClosed: frame.state === 'closed' });
    }
}

export function updateColumns(scene) {
    for (const column of scene.columns.getChildren()) {
        const data = column.getData('column');
        const frame = columnFrame(scene.elapsed, data.definition);
        column.body.reset(data.definition.x, frame.bottom - COLUMN_HEIGHT / 2);
        const warning = frame.state === 'warning' || frame.state === 'falling';
        data.shadow.setVisible(warning);
        data.shadow.setAlpha(0.5 + Math.abs(Math.sin(scene.elapsed / 90)) * 0.45);
        data.lamp.setPosition(column.x, frame.bottom - 14);
        data.lamp.setFillStyle(frame.state === 'open' ? 0x91dfb1 : 0xffa66b);
        if (frame.state === 'closed' && !data.wasClosed && Math.abs(scene.player.x - column.x) < 550) {
            scene.sound.play('boss-land', { volume: 0.12 });
        }
        data.wasClosed = frame.state === 'closed';
    }
}
