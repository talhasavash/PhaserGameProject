// Yükleme göstergesini ve sahne hazır olduğunda yükleme ekranının kapanmasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { showLoading, updateLoading, finishLoading } from '../src/ui/scenePage.js';

test('The loading screen follows real progress and stays until the first rendered game frame', () => {
    const elements = { 'game-loading': { hidden: true }, 'loading-progress': { value: 0 } };
    globalThis.document = { getElementById: id => elements[id] };
    const scene = { load: new EventEmitter(), game: { events: new EventEmitter() } };
    showLoading();
    scene.load.on('progress', updateLoading);
    scene.load.emit('progress', 0.65);
    assert.equal(elements['loading-progress'].value, 0.65);
    finishLoading(scene);
    assert.equal(elements['game-loading'].hidden, false, 'Scene creation alone cannot expose an empty canvas');
    assert.equal(elements['loading-progress'].value, 1);
    assert.equal(scene.load.listenerCount('progress'), 0);
    scene.game.events.emit('postrender');
    assert.equal(elements['game-loading'].hidden, true);
    assert.equal(scene.game.events.listenerCount('postrender'), 0);
    showLoading();
    assert.equal(elements['loading-progress'].value, 0, 'Next chapter starts with a fresh loading state');
    delete globalThis.document;
});
