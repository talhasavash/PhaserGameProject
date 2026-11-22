// Tam ekran, yatay görünüm ve oyuna geri dönüldüğünde ekranı toparlama akışını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { enterGameDisplay, releaseGameOrientation, bindDisplayRecovery } from '../.build/src/ui/browser.js';

test('Play requests fullscreen before locking landscape, without a launch-time orientation requirement', async () => {
    const calls = [];
    const doc = { fullscreenElement: null, documentElement: { async requestFullscreen() { calls.push('fullscreen'); } } };
    const screen = { orientation: { async lock(value) { calls.push(value); } } };
    const pending = enterGameDisplay(doc, screen, true);
    assert.deepEqual(calls, ['fullscreen'], 'Request starts synchronously in the user gesture');
    await pending;
    assert.deepEqual(calls, ['fullscreen', 'landscape']);
});

test('An installed fullscreen PWA does not start a second element fullscreen session', async () => {
    const calls = [];
    const doc = { fullscreenElement: null, documentElement: { async requestFullscreen() { calls.push('fullscreen'); } } };
    const screen = { orientation: { async lock(value) { calls.push(value); } } };
    await enterGameDisplay(doc, screen, true, true);
    assert.deepEqual(calls, ['landscape']);
});

test('Background recovery waits for a real touch and runs once per return without reloading the game', () => {
    const handlers = {};
    const doc = { hidden: false, addEventListener: (type, handler) => { handlers[type] = handler; } };
    let restores = 0;
    let playing = true;
    bindDisplayRecovery(() => playing, doc, () => { restores++; });
    handlers.pointerup();
    assert.equal(restores, 0, 'Normal game touches do not request fullscreen');
    doc.hidden = true;
    handlers.visibilitychange();
    handlers.pointerup();
    assert.equal(restores, 0);
    doc.hidden = false;
    handlers.visibilitychange();
    assert.equal(restores, 0, 'Resuming does not make a gesture-less fullscreen request');
    handlers.pointerup();
    handlers.pointerup();
    assert.equal(restores, 1);
    doc.hidden = true;
    handlers.visibilitychange();
    doc.hidden = false;
    playing = false;
    handlers.pointerup();
    assert.equal(restores, 1, 'The character menu does not start gameplay orientation');
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
