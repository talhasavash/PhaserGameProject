// Ortak doku önbelleğinin tekrar çizimi önlediğini ve geçici çizimleri temizlediğini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheTexture } from '../.build/src/graphics/texture.js';

function textureScene() {
    const cached = new Set();
    const generated = [];
    let created = 0;
    let destroyed = 0;
    const scene = {
        textures: { exists: key => cached.has(key) },
        make: { graphics: () => {
            created++;
            return {
                generateTexture(key, width, height) {
                    cached.add(key);
                    generated.push({ key, width, height });
                },
                destroy() { destroyed++; }
            };
        } }
    };
    return { scene, generated, counts: () => ({ created, destroyed }) };
}

test('Texture cache reuses keys and accepts different dimensions and drawings', () => {
    const { scene, generated, counts } = textureScene();
    const drawings = [];
    assert.equal(cacheTexture(scene, 'cloud', 128, 64, () => drawings.push('cloud')), 'cloud');
    cacheTexture(scene, 'cloud', 128, 64, () => assert.fail('Cached drawing must not run'));
    cacheTexture(scene, 'column', 80, 512, () => drawings.push('column'));
    assert.deepEqual(drawings, ['cloud', 'column']);
    assert.deepEqual(generated, [
        { key: 'cloud', width: 128, height: 64 },
        { key: 'column', width: 80, height: 512 }
    ]);
    assert.deepEqual(counts(), { created: 2, destroyed: 2 });
});

test('Failed drawings are cleaned up and may be retried', () => {
    const { scene, generated, counts } = textureScene();
    const error = new Error('Drawing failed');
    assert.throws(() => cacheTexture(scene, 'cloud', 128, 64, () => { throw error; }), error);
    assert.equal(generated.length, 0);
    assert.deepEqual(counts(), { created: 1, destroyed: 1 });
    cacheTexture(scene, 'cloud', 128, 64, () => {});
    assert.deepEqual(counts(), { created: 2, destroyed: 2 });
});
