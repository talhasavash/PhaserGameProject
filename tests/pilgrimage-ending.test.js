// Dünya 5 finalinin tek kez açılmasını, bütün katılımcıları, mobil yerleşimi ve menüye dönüşünü doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {EventEmitter} from 'node:events';
import {enemyTypes} from '../.build/src/actors/enemies/EnemyCatalog.js';
import {hasPilgrimageEnding, PILGRIMAGE_ENDING_SCENE_KEY} from '../.build/src/game/sceneRouting.js';

globalThis.Phaser = {Scene: class {}};
const {PilgrimageEndingScene, endingCast} = await import('../.build/src/game/PilgrimageEndingScene.js');

test('Only chapter 75 opens the ending; children and six adults join without rolling objects or sun', () => {
    for (let i = 0; i < 90; i++) assert.equal(hasPilgrimageEnding(i), i === 74);
    const cast = endingCast();
    assert.equal(cast.filter(actor => actor.hero).length, 8);
    assert.deepEqual(cast.filter(actor => !actor.hero).map(actor => actor.key),
        [...enemyTypes].filter(([key, type]) => !type.radius && key !== 'cinder-sun').map(([key]) => key));
    assert.ok(['ball', 'wheel', 'cinder-sun'].every(key => !cast.some(actor => actor.key === key)));
    assert.equal(cast.filter(actor => actor.hero && actor.key.startsWith('ending-person-')).length, 6);
    assert.equal(new Set(cast.filter(actor => actor.hero).map(actor => actor.prayer.cloth)).size, 8);
    for (const actor of cast) assert.ok(existsSync(new URL(`../${actor.src}`, import.meta.url)), actor.src);
});

test('Ending loads only missing textures, bows after arrival, fits mobile and returns once to World 6 menu', () => {
    const nodes = new Map();
    globalThis.document = {getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {hidden: false, value: 0});
        return nodes.get(id);
    }};
    const scene = new PilgrimageEndingScene();
    const timers = [], tweens = [], images = [], loaded = [], cached = new Set(['ihram_boy-0']);
    function shape() {
        return Object.assign(new EventEmitter(), {
            x: 0, y: 0, alpha: 1,
            setOrigin() {return this;}, setScale(scale) {this.scale = scale; this.scaleY = scale; return this;},
            setPosition(x, y) {this.x = x; this.y = y; return this;},
            setAlpha(alpha) {this.alpha = alpha; return this;}, setSize() {return this;},
            setStrokeStyle() {return this;}, setResolution() {return this;},
            setInteractive() {this.interactive = true; return this;},
            add() {return this;}
        });
    }
    scene.load = Object.assign(new EventEmitter(), {svg(key, src) {
        assert.ok(existsSync(new URL(`../${src}`, import.meta.url)), src);
        loaded.push(key);
    }});
    scene.textures = {exists: key => cached.has(key)};
    scene.scale = Object.assign(new EventEmitter(), {width: 711, height: 320});
    scene.events = new EventEmitter();
    scene.game = {events: new EventEmitter()};
    scene.cameras = {main: {setBackgroundColor() {}}};
    scene.tweens = {add(config) {tweens.push(config);}};
    scene.time = {delayedCall(delay, callback) {timers.push({delay, callback});}};
    scene.input = {keyboard: new EventEmitter()};
    scene.add = {
        container: () => shape(), image(x, y, key) {const s = shape(); s.x = x; s.y = y; s.key = key; images.push(s); return s;},
        text: () => shape(), circle: () => shape(), triangle: () => shape()
    };
    scene.make = {graphics() {
        return {fillStyle() {}, fillEllipse() {}, lineStyle() {}, lineBetween() {}, strokeEllipse() {},
            generateTexture(key) {cached.add(key);}, destroy() {}};
    }};
    scene.init({nextLevelIndex: 75});
    scene.preload();
    assert.ok(!loaded.includes('ihram_boy-0'));
    assert.equal(loaded.length, endingCast().length);
    scene.create();
    assert.equal(nodes.get('touch-controls').hidden, true);
    assert.equal(nodes.get('settings-button').hidden, true);
    const stage = scene.stage;
    assert.ok(stage.scale * 1000 <= 711 && stage.scale * 600 <= 320);
    assert.equal(tweens.filter(tween => tween.x !== undefined).length, endingCast().length);
    for (const timer of [...timers].filter(timer => timer.delay === 5900)) timer.callback();
    assert.equal(tweens.filter(tween => tween.angle !== undefined).length, endingCast().filter(actor => !actor.hero).length);
    assert.ok(tweens.filter(tween => tween.angle !== undefined).every(tween => tween.angle === 75),
        'Every enemy bows to its right, including actors on the right side of the scene');
    assert.equal(images.filter(image => image.key.startsWith('ending-prayer-')).length, 8);
    for (const person of endingCast().filter(actor => actor.hero)) {
        assert.ok(images.some(image => image.key === `ending-prayer-${person.key}`));
    }
    const result = [];
    scene.game.events.on('world-complete', index => result.push(index));
    timers.find(timer => timer.delay === 22000).callback();
    scene.finish();
    assert.deepEqual(result, [75]);
    scene.events.emit('shutdown');
    assert.equal(scene.scale.listenerCount('resize'), 0);
    assert.equal(scene.load.listenerCount('progress'), 0);
    assert.equal(PILGRIMAGE_ENDING_SCENE_KEY, 'PilgrimageEnding');
});
