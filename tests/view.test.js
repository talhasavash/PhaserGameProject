import test from 'node:test';
import assert from 'node:assert/strict';
import { gameView } from '../src/view.js';

test('Landscape phone fills its game area with a closer, undistorted view', () => {
    const view = gameView(873, 265, true);
    const oldScale = 265 / 600;
    const newScale = 265 / view.height;
    assert.ok(newScale / oldScale > 1.6);
    assert.ok(Math.abs(view.width / view.height - 873 / 265) < 0.002);
    const top = 600 - view.height;
    assert.ok(top < 360, 'Jump apex must remain visible');
    assert.ok(520 > top && 520 < top + view.height, 'Ground must remain visible');
});

test('Tablet gets a closer view, while desktop and portrait keep their full height', () => {
    assert.equal(gameView(1024, 640, true).height, 480);
    assert.equal(gameView(1280, 720, false).height, 600);
    assert.equal(gameView(393, 745, true).height, 600);
});
