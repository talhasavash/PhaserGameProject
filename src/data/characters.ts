// Kıyafet kaydı: Loader ve karakter animasyonları aynı SVG ön adını kullanır.
const builtInSkins = { boy: 'child', girl: 'girl', ice_girl: 'ice_girl', ice_boy: 'ice_boy',
    ihram_boy: 'ihram_boy', chador_girl: 'chador_girl', workshop_boy: 'workshop_boy', workshop_girl: 'workshop_girl' };
export type BuiltInSkinName = keyof typeof builtInSkins;
export const characterSkins = new Map<string, string | import('../world/model/contracts.js').CharacterSkin>(Object.entries(builtInSkins));


export function registerCharacterSkin(name: string, prefix: string | import('../world/model/contracts.js').CharacterSkin) {
    if (!name || !(typeof prefix === 'string' ? prefix : prefix?.prefix) || characterSkins.has(name)) throw new Error('Kıyafet adı benzersiz, SVG ön adı dolu olmalı.');
    characterSkins.set(name, prefix);
}

export function characterSkin(name) {
    const skin = characterSkins.get(name);
    if (!skin) throw new Error(`Bilinmeyen karakter kıyafeti: ${name}`);
    return { folder: 'hero', ...(typeof skin === 'string' ? { prefix: skin } : skin) };
}

export function selectCharacterSkin(level, world, character) {
    const costume = level.player?.costume;
    const selected = (typeof costume === 'string' ? costume : costume?.[character])
        ?? level.characterSkin ?? world.characterSkins?.[character] ?? character;
    characterSkin(selected); // Bilinmeyen kayıt için SVG istekleri göndermeden anlaşılır hata ver.
    return selected;
}

export function characterPrefix(expression, character = 'boy') {
    const base = characterSkin(character).prefix;
    return expression === 'normal' ? `${base}-` : `${base}-${expression}-`;
}
