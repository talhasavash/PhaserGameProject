import test from 'node:test';
import assert from 'node:assert/strict';
import { enterGameDisplay, releaseGameOrientation } from '../src/ui/display.js';

test('Play requests fullscreen before locking landscape, without a launch-time orientation requirement', async () => {
    const calls = [];
    const doc = { fullscreenElement: null, documentElement: { async requestFullscreen() { calls.push('fullscreen'); } } };
    const screen = { orientation: { async lock(value) { calls.push(value); } } };
    const pending = enterGameDisplay(doc, screen, true);
    assert.deepEqual(calls, ['fullscreen'], 'Request starts synchronously in the user gesture');
    await pending;
    assert.deepEqual(calls, ['fullscreen', 'landscape']);
});

test('Unsupported fullscreen or orientation cannot prevent the game from starting', async () => {
    const denied = async () => { throw new Error('Not allowed'); };
    await assert.doesNotReject(enterGameDisplay({ documentElement: { requestFullscreen: denied } }, { orientation: { lock: denied } }, true));
    await assert.doesNotReject(enterGameDisplay({ documentElement: {} }, {}, true));
});

test('Returning to the menu releases orientation while keeping fullscreen', async () => {
    const calls = [];
    const screen = { orientation: { lock() { calls.push('lock'); }, unlock() { calls.push('unlock'); } } };
    const doc = { fullscreenElement: {}, documentElement: {}, async exitFullscreen() { calls.push('exit'); } };
    await enterGameDisplay(doc, screen, false);
    assert.deepEqual(calls, []);
    releaseGameOrientation(screen);
    assert.deepEqual(calls, ['unlock']);
});
