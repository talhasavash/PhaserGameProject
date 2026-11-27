// Can kaybı ve iyileşmede üç kalbin dolgusunu, puanın yalnızca sayı olmasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { centerHud, updateHud, levelViewHeight } from '../.build/src/ui/hud.js';
import {levels} from '../.build/src/world/levels/level.js';

test('All authored levels keep ground and platform jumps in view on phones and tablets without shrinking HUD', () => {
    assert.ok(levels[49] && levels[57], 'Includes chapters 50 and 58');
    for (const level of levels.filter(Boolean)) {
    for (const [width, height] of [[711, 320], [768, 480], [1067, 600]]) {
        const camera = {setZoom(z) {this.zoom = z;}, setFollowOffset() {}};
        const hud = {setScale(s) {this.scale = s; return this;}, setPosition(x, y) {this.x = x; this.y = y;}};
        const scene = {level, scale: {width, height}, cameras: {main: camera}, hud,
            scoreText: {setX(x) {this.x = x;}, width: 50}, starHud: {setX() {}}};
        centerHud(scene);
        const top = camera.scrollY + height / 2 - height / camera.zoom / 2;
        const bottom = top + height / camera.zoom;
        assert.ok(level.groundY >= top && level.groundY < bottom, 'Lava remains visible');
        const apex = Math.min(...level.platforms.map(p => p.y)) - 80 - 590 ** 2 / (2 * 1600);
        assert.ok(Math.max(0, apex) >= top, `${level.name}: player stays visible within world bounds`);
        assert.ok(Math.abs(hud.scale * camera.zoom - Math.min(1.1, width / 680)) < 1e-9);
        const screenX = width / 2 + (hud.x - width / 2) * camera.zoom;
        assert.ok(Math.abs(screenX - 14 * Math.min(1.1, width / 680)) < 1e-9);
        const screenY = height / 2 + (hud.y - height / 2) * camera.zoom;
        assert.ok(Math.abs(screenY - 12 * Math.min(1.1, width / 680)) < 1e-9);
    }
    }
});

test('Flat levels keep the close phone view and rotating the device recalculates the required height', () => {
    const flat = {groundY: 520, platforms: []};
    assert.equal(levelViewHeight(flat, 320), 320);
    const high = {groundY: 520, platforms: [{y: 315}]};
    assert.equal(levelViewHeight(high, 320), 505);
    assert.equal(levelViewHeight(high, 600), 600);
    assert.equal(levelViewHeight(high, 320), 505);
});

test('Overhead suns stay fully visible above the route on mobile instead of disappearing above the camera', () => {
    const sunLevels = levels.filter(level => level?.enemies.some(enemy => enemy.type === 'cinder-sun'));
    assert.ok(sunLevels.length > 0);
    for (const level of sunLevels) for (const height of [320, 480, 600]) {
        const top = Math.max(0, 600 - levelViewHeight(level, height));
        for (const enemy of level.enemies.filter(enemy => enemy.type === 'cinder-sun')) {
            assert.ok(top <= enemy.y - 100, `${level.name}: leave room for the sun and HUD`);
            assert.ok(level.groundY < top + levelViewHeight(level, height), 'Ground also remains visible');
        }
    }
});

test('HUD empties lost hearts, restores healing and shows only the score number', () => {
    const hearts = Array.from({ length: 3 }, () => ({
        clear() {}, fillStyle(color, alpha) { this.color = color; this.alpha = alpha; },
        fillPoints() {}, lineStyle() {}, strokePoints() {}
    }));
    const scene = {
        hearts, gameState: { hearts: 3, score: 120, stars: 0 },
        scoreText: { setText(value) { this.value = value; } },
        starHud: { setX() {} },
        starIcons: Array.from({ length: 3 }, () => ({ ...hearts[0] }))
    };
    for (const count of [3, 2, 1, 0, 1, 3]) {
        scene.gameState.hearts = count;
        updateHud(scene);
        assert.equal(hearts.filter(heart => heart.alpha === 1).length, count);
        assert.equal(hearts.length, 3);
        assert.equal(scene.scoreText.value, '120');
    }
    for (const stars of [0, 1, 2, 3, 0]) {
        scene.gameState.stars = stars;
        updateHud(scene);
        assert.equal(scene.starIcons.filter(segment => segment.color === 0xffd35c).length, stars);
    }
});
