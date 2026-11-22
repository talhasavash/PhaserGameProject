// Telefon, tablet ve masaüstü ekranlarında görünür oyun alanı ölçülerini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { gameView } from '../.build/src/ui/browser.js';

test('Landscape phone fills its game area with a closer, undistorted view', () => {
    const view = gameView(873, 393, true);
    const oldScale = 265 / 600;
    const newScale = 393 / view.height;
    assert.ok(newScale / oldScale > 2.7);
    assert.ok(Math.abs(view.width / view.height - 873 / 393) < 0.002);
    const top = 600 - view.height;
    assert.ok(top < 360, 'Jump apex must remain visible');
    assert.ok(520 > top && 520 < top + view.height, 'Ground must remain visible');
    assert.ok((600 - 520) * newScale > 80, 'Controls need room below the ground');
});

test('Tablet gets a closer view, while desktop and portrait keep their full height', () => {
    assert.equal(gameView(1024, 640, true).height, 480);
    assert.equal(gameView(1280, 720, false).height, 600);
    assert.equal(gameView(393, 745, true).height, 600);
});
