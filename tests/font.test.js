// Başlık fontunda Türkçe harflerin gerçekten bulunduğunu doğrular; yedek fonta düşmeyi önler.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function hasGlyph(font, code) {
    // TrueType tablosundaki Unicode karakter eşlemesini (cmap, format 4) oku.
    let cmap;
    for (let i = 0; i < font.readUInt16BE(4); i++) {
        const entry = 12 + i * 16;
        if (font.toString('ascii', entry, entry + 4) === 'cmap') cmap = font.readUInt32BE(entry + 8);
    }
    assert.ok(cmap, 'Font has a character map');
    for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
        const entry = cmap + 4 + i * 8;
        const start = cmap + font.readUInt32BE(entry + 4);
        if (![0, 3].includes(font.readUInt16BE(entry)) || font.readUInt16BE(start) !== 4) continue;
        const count = font.readUInt16BE(start + 6) / 2;
        const ends = start + 14;
        const starts = ends + count * 2 + 2;
        const deltas = starts + count * 2;
        const ranges = deltas + count * 2;
        for (let segment = 0; segment < count; segment++) {
            const first = font.readUInt16BE(starts + segment * 2);
            if (code < first || code > font.readUInt16BE(ends + segment * 2)) continue;
            const offset = font.readUInt16BE(ranges + segment * 2);
            const delta = font.readInt16BE(deltas + segment * 2);
            const glyph = offset ? font.readUInt16BE(ranges + segment * 2 + offset + 2 * (code - first)) : code;
            if (offset && glyph === 0) continue;
            if (((glyph + delta) & 0xffff) !== 0) return true;
        }
    }
    return false;
}

test('Bubble font contains all Turkish letters without fallback glyphs', () => {
    const font = fs.readFileSync(new URL('../assets/fonts/Baloo2.ttf', import.meta.url));
    for (const character of 'ÇĞİÖŞÜçğıöşü') {
        assert.ok(hasGlyph(font, character.codePointAt(0)), `Missing Turkish glyph: ${character}`);
    }
});
