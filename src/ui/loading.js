// İlk bölümde dosya indirmeyi, sonraki bölümlerde sahnenin hazırlanmasını örter.
export function showLoading() {
    document.getElementById('game-loading').hidden = false;
    updateLoading(0);
}

export function updateLoading(progress) {
    document.getElementById('loading-progress').value = Math.max(0, Math.min(1, progress));
}

export function hideLoading() {
    document.getElementById('game-loading').hidden = true;
}

export function finishLoading(scene) {
    scene.load.off('progress', updateLoading);
    updateLoading(1);
    // create bitse de canvas henüz çizilmemiş olabilir; ilk gerçek kareyi bekle.
    scene.game.events.once('postrender', hideLoading);
}
