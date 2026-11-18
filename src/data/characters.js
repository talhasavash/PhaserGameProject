// Kıyafet kaydı: Loader ve karakter animasyonları aynı SVG ön adını kullanır.
export const characterSkins = new Map([
    ['boy', 'child'], ['girl', 'girl'], ['ice_girl', 'ice_girl'], ['ice_boy', 'ice_boy']
]);

export function registerCharacterSkin(name, prefix) {
    if (!name || !prefix || characterSkins.has(name)) throw new Error('Kıyafet adı benzersiz, SVG ön adı dolu olmalı.');
    characterSkins.set(name, prefix);
}

export function characterPrefix(expression, character = 'boy') {
    const base = characterSkins.get(character);
    if (!base) throw new Error(`Bilinmeyen karakter kıyafeti: ${character}`);
    return expression === 'normal' ? `${base}-` : `${base}-${expression}-`;
}
