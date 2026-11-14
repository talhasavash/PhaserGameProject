import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadGameAssets } from '../src/assets.js';
import { levels } from '../src/level.js';

test('Both characters load existing assets and every chapter item and enemy has a texture', () => {
    for (const character of ['boy', 'girl']) {
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
        const base = character === 'boy' ? 'child' : 'girl';
        for (const expression of ['', 'sad-', 'happy-']) {
            for (let frame = 0; frame < 6; frame++) assert.ok(images.has(`${base}-${expression}${frame}`));
        }
        assert.ok(images.has('ogre-ember-angry'));
        for (const key of ['jump', 'collect', 'hurt', 'heal', 'key', 'boss-jump', 'boss-land']) assert.ok(sounds.has(key));
    }
});
