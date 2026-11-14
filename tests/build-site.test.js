import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

function javascriptFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? javascriptFiles(target) : entry.name.endsWith('.js') ? [target] : [];
    });
}

test('Published modules resolve across folders, share a version, and leave source files unchanged', () => {
    const sources = javascriptFiles(path.join(root, 'src'));
    const originals = new Map(sources.map(file => [file, fs.readFileSync(file, 'utf8')]));
    const output = path.join(root, 'dist', 'src');
    fs.mkdirSync(output, { recursive: true });
    const obsolete = path.join(output, 'obsolete-build-test.js');
    fs.writeFileSync(obsolete, '// Simulate a file left over from the old layout.');

    execFileSync(process.execPath, [path.join(root, 'scripts', 'build-site.cjs')], {
        env: { ...process.env, GITHUB_SHA: '1234567890abcdef' }
    });

    assert.equal(fs.existsSync(obsolete), false);
    assert.deepEqual(fs.readdirSync(output).filter(name => name.endsWith('.js')), ['game.js']);
    assert.equal(javascriptFiles(output).length, sources.length);
    for (const source of sources) {
        assert.equal(fs.readFileSync(source, 'utf8'), originals.get(source));
        const published = path.join(output, path.relative(path.join(root, 'src'), source));
        const code = fs.readFileSync(published, 'utf8');
        for (const match of code.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)) {
            const [relative, query] = match[1].split('?');
            assert.equal(new URLSearchParams(query).get('v'), '1234567', published);
            assert.ok(fs.existsSync(path.resolve(path.dirname(published), relative)), match[1]);
        }
    }
    const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
    assert.ok(html.includes('src/game.js?v=1234567'));
    assert.ok(html.includes('Demo · 1234567'));
    const assets = fs.readFileSync(path.join(output, 'data', 'assets.js'), 'utf8');
    assert.ok(assets.includes('assets/images/${key}.svg?v=1234567'));
    assert.ok(assets.includes('assets/audio/${key}.wav?v=1234567'));
});
