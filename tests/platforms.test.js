// Bölüme özel platform çizimlerini ve doku tekrar kullanımını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatformArt, platformThemes } from '../src/world/terrain/platforms.js';
import { levels } from '../src/world/levels/level.js';

test('Every chapter has a platform skin, and cached steps use one small image per platform', () => {
    const textures = new Map();
    let generated = 0;
    const graphics = {};
    for (const method of ['fillStyle','fillRect','fillRoundedRect','fillEllipse','fillCircle','fillTriangle','fillPoints','lineStyle','lineBetween','strokeRect','strokeCircle','strokeRoundedRect','destroy']) graphics[method] = () => graphics;
    graphics.generateTexture = (key, width, height) => { generated++; textures.set(key, { width, height }); };
    const image = { setOrigin() { return this; }, setDepth() { return this; } };
    const scene = { textures: { exists: key => textures.has(key) }, make: { graphics: () => graphics }, add: { image: () => image } };
    for (const level of levels) {
        assert.ok(platformThemes[level.theme]);
        for (const platform of level.platforms) createPlatformArt(scene, platform, level.theme);
    }
    const firstPass = generated;
    for (const level of levels) for (const platform of level.platforms) createPlatformArt(scene, platform, level.theme);
    assert.equal(generated, firstPass, 'Restart must reuse generated step textures');
    for (const size of textures.values()) {
        assert.ok(size.width <= 256 && (size.width & (size.width - 1)) === 0);
        assert.equal(size.height, 64);
    }
    const narrow = levels.flatMap(level => level.platforms.filter(platform => platform.single));
    assert.ok(narrow.length >= 10);
    assert.ok(narrow.every(platform => platform.width >= 50 && platform.width <= 90));
});
