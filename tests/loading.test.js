// Yükleme göstergesini ve sahne hazır olduğunda yükleme ekranının kapanmasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { showLoading, updateLoading, finishLoading } from '../src/ui/scenePage.js';
import { bindWelcomeMenu } from '../src/ui/welcome.js';
import { readFileSync } from 'node:fs';

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

test('Slow initial downloads show loading before JavaScript is ready instead of an unbound Play button', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html.match(/<button id="welcome-play"[^>]*>/)[0], /\bdisabled\b/);
    assert.doesNotMatch(html.match(/<section id="game-loading"[^>]*>/)[0], /\bhidden\b/);
    assert.doesNotMatch(html.match(/<progress id="loading-progress"[^>]*>/)[0], /\bvalue=/);
});

test('The first Play tap shows loading immediately and opens the menu once after a paint', () => {
    const elements = {
        'welcome-play': { disabled: true }, 'welcome-screen': { hidden: false },
        'character-select': { hidden: true }, 'character-title': { focus() { this.focused = true; } }
    };
    const frames = [];
    let loading = true;
    let displayCalls = 0;
    bindWelcomeMenu({ doc: { getElementById: id => elements[id] },
        nextFrame: callback => frames.push(callback),
        enterDisplay: () => { displayCalls++; },
        showLoading: progress => { assert.equal(progress, null); loading = true; },
        hideLoading: () => { loading = false; }
    });
    const play = elements['welcome-play'];
    assert.equal(play.disabled, false);
    assert.equal(loading, false);
    play.onclick(); play.onclick();
    assert.equal(displayCalls, 1, 'Fullscreen starts within the original user gesture');
    assert.equal(loading, true);
    assert.equal(elements['character-select'].hidden, true);
    frames.shift()();
    assert.equal(elements['character-select'].hidden, false);
    assert.equal(elements['welcome-screen'].hidden, true);
    assert.equal(elements['character-title'].focused, true);
    assert.equal(loading, true, 'The loader covers the first menu paint');
    frames.shift()();
    assert.equal(loading, false);
});

test('Menu loading is indeterminate and level loading returns to measured progress', () => {
    const bar = { value: 0.9, removeAttribute(name) { assert.equal(name, 'value'); delete this.value; } };
    const elements = { 'game-loading': { hidden: true }, 'loading-progress': bar };
    globalThis.document = { getElementById: id => elements[id] };
    try {
        showLoading(null);
        assert.equal('value' in bar, false);
        assert.equal(elements['game-loading'].hidden, false);
        showLoading();
        assert.equal(bar.value, 0);
    } finally { delete globalThis.document; }
});
