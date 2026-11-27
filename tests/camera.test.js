// Yakınlaştırma yapmadan üst platformları ve alt iniş noktalarını görünürde tutan kamera hesabı.
import test from 'node:test';
import assert from 'node:assert/strict';
import {platformCameraTop} from '../.build/src/game/camera.js';
import {levels} from '../.build/src/world/levels/level.js';

test('Chapters 50 and 58 frame nearby platforms instead of staying at the top after a jump', () => {
    for (const index of [49, 57]) {
        const level = levels[index];
        for (const platform of level.platforms) {
            const y = platform.y - 32, x = platform.x + platform.width / 2;
            const top = platformCameraTop(level, x, y, platform.y, 320);
            assert.ok(y - 32 >= top, 'Standing player stays visible');
            assert.ok(platform.y < top + 320, 'Landing stays visible');
            assert.ok(level.groundY < top + 320, 'Ground below the standing player stays visible');
        }
        const x = level.width - 150;
        const apex = platformCameraTop(level, x, 180, 210, 320);
        const descending = platformCameraTop(level, x, 360, 390, 320);
        assert.ok(descending > apex, 'Camera returns down during descent');
        assert.ok(descending + 320 > level.groundY, 'Ground reappears before landing');
        assert.equal(platformCameraTop(level, x, 480, 510, 600), 0);
    }
});

test('Very high platforms frame a lower landing rather than the supporting platform', () => {
    const level = {groundY: 520, platforms: [
        {x: 400, y: 200, width: 180}, {x: 580, y: 350, width: 180}
    ]};
    const top = platformCameraTop(level, 490, 168, 200, 320);
    assert.ok(top <= 168 - 32, 'Player remains visible');
    assert.ok(top + 320 > 350, 'Lower landing remains visible');
    assert.ok(top > 0, 'Camera looks below instead of framing the upper platform');
});
