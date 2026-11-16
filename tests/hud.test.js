// Can kaybı ve iyileşmede üç kalbin dolgusunu, puanın yalnızca sayı olmasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { updateHud } from '../src/ui/hud.js';

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
