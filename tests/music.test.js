// Tek müzik örneğini, dünya geçişlerini, yükleme ve arka plan duraklamalarını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createMusicPlayer, bindMusicLifecycle } from '../src/audio/music.js';
import { worlds } from '../src/world/levels/level.js';
import { menuMusic } from '../src/data/music.js';

function fixture(play = () => Promise.resolve()) {
    const audio = { paused: true, currentTime: 0, plays: 0, loads: 0, pauses: 0,
        play() { this.plays++; this.paused = false; return play(); },
        pause() { this.pauses++; this.paused = true; }, load() { this.loads++; this.currentTime = 0; },
        removeAttribute() { this.src = ''; } };
    let created = 0;
    const player = createMusicPlayer(() => { created++; return audio; });
    return { audio, player, created: () => created };
}

test('Menu and all five worlds reference real music files', () => {
    assert.ok(existsSync(new URL('../' + menuMusic.src, import.meta.url)));
    assert.equal(worlds[2].music.src, 'assets/audio/music/world3.mp3');
    for (const id of [1, 2, 3, 4, 5]) {
        const track = worlds.find(world => world.id === id).music;
        assert.ok(track.volume > 0 && track.volume < 0.3);
        assert.ok(existsSync(new URL('../' + track.src, import.meta.url)), track.src);
    }
});

test('Music waits for interaction and the same world keeps one track and its position across chapters', () => {
    const { player, audio, created } = fixture();
    player.setTrack(menuMusic);
    assert.equal(audio.plays, 0);
    player.unlock();
    assert.equal(audio.plays, 1);
    player.pause('loading');
    player.setTrack(worlds[0].music);
    assert.equal(audio.paused, true);
    player.resume('loading');
    audio.currentTime = 42;
    const loads = audio.loads;
    player.pause('loading');
    player.setTrack({ ...worlds[0].music });
    player.resume('loading');
    assert.equal(audio.currentTime, 42);
    assert.equal(audio.loads, loads);
    assert.equal(audio.loop, true);
    assert.equal(created(), 1);
});

test('Pause reasons combine: returning to foreground waits for loading to finish', () => {
    const { player, audio } = fixture();
    player.setTrack(worlds[1].music); player.unlock();
    player.pause('loading'); player.pause('background'); player.resume('background');
    assert.equal(audio.paused, true);
    player.resume('loading');
    assert.equal(audio.paused, false);
    player.pause('loading'); player.pause('background');
    player.setTrack(menuMusic);
    player.resume('background');
    assert.equal(audio.paused, true);
    player.resume('loading');
    assert.equal(audio.paused, false);
    assert.equal(audio.src, menuMusic.src);
});

test('Changing worlds replaces the source; a world without music stops and releases the previous track', () => {
    const { player, audio, created } = fixture();
    player.unlock(); player.setTrack(worlds[0].music);
    player.setTrack(worlds[1].music);
    assert.equal(audio.src, worlds[1].music.src);
    assert.equal(created(), 1);
    player.setTrack(undefined);
    assert.equal(audio.src, ''); assert.equal(audio.paused, true);
    const plays = audio.plays;
    player.resume('loading'); player.unlock();
    assert.equal(audio.plays, plays);
    player.destroy();
    assert.equal(audio.paused, true);
});

test('Autoplay rejection does not interrupt the game and a later gesture can retry', async () => {
    let blocked = true;
    const { player, audio } = fixture(() => blocked ? Promise.reject({ name: 'NotAllowedError' }) : Promise.resolve());
    player.setTrack(menuMusic); player.unlock();
    await Promise.resolve();
    blocked = false; audio.paused = true;
    player.unlock();
    assert.equal(audio.plays, 2);
});

test('Tab hiding pauses music and lifecycle cleanup removes listeners', () => {
    const doc = new EventTarget(); doc.hidden = false;
    const win = new EventTarget();
    const { player, audio } = fixture();
    player.setTrack(menuMusic);
    const release = bindMusicLifecycle(player, doc, win);
    doc.dispatchEvent(new Event('pointerdown'));
    assert.equal(audio.paused, false);
    doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(audio.paused, true);
    doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(audio.paused, false);
    release();
    const plays = audio.plays;
    doc.dispatchEvent(new Event('pointerdown')); win.dispatchEvent(new Event('pageshow'));
    assert.equal(audio.plays, plays);
});
