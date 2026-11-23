// Yayın kopyasının dosyalarını, import yollarını ve sürüm bilgilerini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

function javascriptFiles(directory, extension = '.js') {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? javascriptFiles(target, extension) : entry.name.endsWith(extension) ? [target] : [];
    });
}

test('Published modules resolve across folders, share a version, and leave source files unchanged', () => {
    const sources = javascriptFiles(path.join(root, 'src'), '.ts');
    const originals = new Map(sources.map(file => [file, fs.readFileSync(file, 'utf8')]));
    const output = path.join(root, 'dist', 'src');
    fs.mkdirSync(output, { recursive: true });
    const obsolete = path.join(output, 'obsolete-build-test.js');
    fs.writeFileSync(obsolete, '// Simulate a file left over from the old layout.');
    const obsoleteCompiled = path.join(root, '.build', 'src', 'obsolete-build-test.js');
    fs.writeFileSync(obsoleteCompiled, '// Simulate a deleted TypeScript source.');

    execFileSync(process.execPath, [path.join(root, 'scripts', 'build-site.cjs')], {
        env: { ...process.env, GITHUB_SHA: '1234567890abcdef' }
    });

    assert.equal(fs.existsSync(obsolete), false);
    assert.equal(fs.existsSync(obsoleteCompiled), false);
    assert.deepEqual(fs.readdirSync(output).filter(name => name.endsWith('.js')), ['extensions.js', 'game.js']);
    assert.equal(javascriptFiles(output).length, sources.length);
    for (const source of sources) {
        assert.equal(fs.readFileSync(source, 'utf8'), originals.get(source));
        const published = path.join(output, path.relative(path.join(root, 'src'), source).replace(/\.ts$/, '.js'));
        const code = fs.readFileSync(published, 'utf8');
        for (const match of code.matchAll(/\b(?:from|import)\s*['"](\.\.?\/[^'"]+)['"]/g)) {
            const [relative, query] = match[1].split('?');
            assert.equal(new URLSearchParams(query).get('v'), '1234567', published);
            assert.ok(fs.existsSync(path.resolve(path.dirname(published), relative)), match[1]);
        }
    }
    const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
    assert.equal(fs.existsSync(path.join(root, 'dist', 'examples', 'matter-lab')), false);
    assert.equal(html.includes('matter-lab'), false, 'The private physics experiment is not linked in the public menu');
    assert.ok(html.includes('src/game.js?v=1234567'));
    assert.ok(html.includes('Demo · 1234567'));
    const assets = fs.readFileSync(path.join(output, 'data', 'assets.js'), 'utf8');
    assert.ok(assets.includes('assets/images/${heroFolder}/${key}.svg?v=1234567'));
    assert.ok(assets.includes('assets/images/${folder}/${key}.svg?v=1234567'));
    assert.ok(assets.includes('assets/audio/${key}.wav?v=1234567'));
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/manifest.webmanifest'), 'utf8'));
    assert.equal(manifest.start_url, './index.html');
    assert.equal(manifest.scope, './');
    assert.equal(manifest.display, 'fullscreen');
    assert.equal(manifest.orientation, 'any');
    assert.equal(manifest.id, './');
    for (const icon of manifest.icons) {
        const bytes = fs.readFileSync(path.join(root, 'dist', icon.src));
        assert.equal(bytes.readUInt32BE(16), Number(icon.sizes.split('x')[0]));
    }
    const worker = fs.readFileSync(path.join(root, 'dist/sw.js'), 'utf8');
    const precache = JSON.parse(worker.match(/const PRECACHE = (\[.*\]);/)[1]);
    assert.ok(precache.includes('./src/game.js?v=1234567'));
    for (const module of ['world/levels/level.js', 'world/levels/world1.js', 'world/levels/world2.js', 'world/levels/world3.js', 'world/scenery/background.js', 'world/scenery/world1Scenery.js', 'world/scenery/world2Scenery.js', 'world/scenery/world3Scenery.js', 'world/terrain/terrain.js', 'graphics/texture.js']) {
        assert.ok(precache.includes(`./src/${module}?v=1234567`), module);
    }
    assert.equal(fs.existsSync(path.join(output, 'world/background.js')), false);
    assert.equal(fs.existsSync(path.join(output, 'world/scenery/chapterScenery.js')), false);
    assert.ok(precache.includes('./lib/phaser.min.js?v=1234567'));
    assert.ok(precache.includes('./assets/images/hero/child-0.svg?v=1234567'));
    assert.ok(precache.includes('./assets/audio/jump.wav?v=1234567'));
    for (const name of ['menu.mpeg', 'world1.mpeg', 'world2.mpeg', 'world3.mp3', 'world4.mpeg', 'world5.aac']) {
        assert.ok(precache.includes(`./assets/audio/music/${name}`));
        assert.ok(precache.includes(`./assets/audio/music/${name}?v=1234567`));
    }
    assert.ok(fs.readFileSync(path.join(output, 'world/levels/worlds.js'), 'utf8').includes('assets/audio/music/world5.aac?v=1234567'));
    assert.ok(precache.includes('./assets/fonts/Baloo2.ttf?v=1234567'));
    assert.ok(fs.existsSync(path.join(root, 'dist/assets/fonts/OFL-Baloo2.txt')));
    for (let world = 1; world <= 5; world++) {
        assert.ok(precache.includes(`./assets/images/scene/menu-world${world}.svg?v=1234567`));
    }
    for (const file of precache) assert.ok(fs.existsSync(path.join(root, 'dist', file.split('?')[0])), file);
    assert.ok(html.includes('name="game-release"'));
});
