// Şekil çizimlerini anahtar ve boyutla önbelleğe alır; geçici Phaser Graphics nesnesini temizler.
export function cacheTexture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return key;
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    try {
        draw(graphics);
        graphics.generateTexture(key, width, height);
    } finally {
        graphics.destroy();
    }
    return key;
}
