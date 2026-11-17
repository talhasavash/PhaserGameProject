// Phaser görsel ve ses listesindeki dosyaların varlığını ve yükleme ayarlarını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadGameAssets } from '../src/data/assets.js';
import { levels } from '../src/world/levels/level.js';

test('Both characters load existing assets and every chapter item and enemy has a texture', () => {
    for (const character of ['boy', 'girl', 'ice_girl']) {
        const images = new Map();
        const sounds = new Set();
        const scene = { load: {
            svg(key, path, size) {
                assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path);
                assert.ok(size.width > 0 && size.height > 0);
                images.set(key, path);
            },
            audio(key, path) {
                assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path);
                sounds.add(key);
            }
        } };
        loadGameAssets(scene, character);
        for (const level of levels) {
            for (const fruit of level.fruits) assert.ok(images.has(fruit.type), fruit.type);
            const enemies = [...level.enemies, ...(level.extraHazards || [])];
            if (level.ball) enemies.push(level.ball);
            for (const enemy of enemies) assert.ok(images.has(enemy.texture || enemy.type), enemy.type);
        }
        const base = character === 'boy' ? 'child' : character;
        for (const expression of ['', 'sad-', 'happy-']) {
            for (let frame = 0; frame < 6; frame++) assert.ok(images.has(`${base}-${expression}${frame}`));
        }
        assert.ok(images.has('ogre-ember-angry'));
        for (const key of ['jump', 'collect', 'hurt', 'heal', 'key', 'boss-jump', 'boss-land', 'level-complete', 'boss-fire']) assert.ok(sounds.has(key));
    }
});

test('Chapter loading omits unused images and reuses cached character frames and sounds', () => {
    const cachedImages = new Set();
    const cachedSounds = new Set();
    let queuedImages = [];
    let queuedSounds = [];
    const scene = {
        textures: { exists: key => cachedImages.has(key) },
        cache: { audio: { exists: key => cachedSounds.has(key) } },
        load: {
            svg(key, path) { assert.ok(existsSync(new URL(`../${path}`, import.meta.url))); queuedImages.push(key); },
            audio(key) { queuedSounds.push(key); }
        }
    };
    loadGameAssets(scene, 'boy', levels[16]);
    const firstCount = queuedImages.length;
    assert.ok(firstCount < 40, `Unnecessary images in first chapter load: ${firstCount}`);
    assert.ok(queuedImages.includes('star') && queuedImages.includes('key'));
    assert.ok(!queuedImages.includes('penguin') && !queuedImages.includes('ogre-ember-angry'));
    for (const key of queuedImages) cachedImages.add(key);
    for (const key of queuedSounds) cachedSounds.add(key);
    queuedImages = []; queuedSounds = [];
    loadGameAssets(scene, 'boy', levels[16]);
    assert.deepEqual(queuedImages, [], 'Restart must not enqueue textures already in Phaser');
    assert.deepEqual(queuedSounds, []);
    loadGameAssets(scene, 'boy', levels[10]);
    assert.ok(queuedImages.includes('ogre-ember') && queuedImages.includes('ogre-ember-angry'));
    assert.ok(!queuedImages.includes('child-0'), 'Keep character frames on chapter changes');
    queuedImages = [];
    loadGameAssets(scene, 'girl', levels.find(level => level.theme === 'interior'));
    assert.ok(queuedImages.includes('allah-plaque') && queuedImages.includes('girl-0'));
});
