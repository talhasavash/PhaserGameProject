// Ekran boyutuna göre görünür oyun alanını hesaplayarak mobilde nesnelerin daha büyük görünmesini sağlar.
// Platformların, karakterin ve fizik kurallarının gerçek boyutları değişmez.
export function gameView(width, height, touchLayout) {
    if (touchLayout && width > height) {
        const worldHeight = height < 500 ? 320 : 480;
        return { width: Math.round(worldHeight * width / Math.max(1, height)), height: worldHeight };
    }
    return { width: Math.max(960, Math.round(600 * width / Math.max(1, height))), height: 600 };
}
