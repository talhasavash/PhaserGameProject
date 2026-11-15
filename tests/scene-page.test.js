// Bölüm değişince HTML düğmelerinin eski sahne bağlantılarının temizlendiğini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bindSceneButtons, clearSceneButtons } from '../src/ui/scenePage.js';

test('Scene buttons release old callbacks before binding the next chapter', () => {
    const ids = ['game-result', 'pause-button', 'settings-button', 'toolbar-status', 'play-again', 'next-level', 'retry-fall'];
    const elements = new Map(ids.map(id => [id, { setAttribute() {}, click() { this.onclick?.(); } }]));
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: id => elements.get(id) };
    const calls = [];
    const makeScene = name => ({
        level: { name }, sound: { setMute() {} }, soundMuted: false,
        continueAfterResult: () => calls.push(`${name}:next`),
        retryFall: () => calls.push(`${name}:retry`)
    });
    try {
        bindSceneButtons(makeScene('first'));
        elements.get('next-level').click();
        clearSceneButtons();
        elements.get('next-level').click();
        assert.equal(elements.get('retry-fall').onclick, null);
        assert.equal(elements.get('pause-button').onclick, null);
        bindSceneButtons(makeScene('second'));
        elements.get('next-level').click();
        elements.get('retry-fall').click();
        assert.deepEqual(calls, ['first:next', 'second:next', 'second:retry']);
    } finally {
        globalThis.document = previousDocument;
    }
});
