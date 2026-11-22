// Tarayıcıya ait PWA kaydını, oyun ekranı ölçülerini ve mobil tam ekran/yön davranışını yönetir.
export function setupPwa() {
    // Geliştirme sunucusunda önbellek oluşturmayız; yalnızca yayın kopyası kaydeder.
    if (!document.querySelector('meta[name="game-release"]') || !('serviceWorker' in navigator)) return;
    async function registerWorker() {
        try {
            await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
        } catch (error) {
            console.warn('Çevrimdışı oyun desteği başlatılamadı.', error);
        }
    }
    if (document.readyState === 'complete') registerWorker();
    else window.addEventListener('load', registerWorker, { once: true });
}

// Bu istek bölüm düğmesine yapılan kullanıcı dokunuşundan başlatılır.
export async function enterGameDisplay(
    doc = document,
    deviceScreen = screen,
    mobile = matchMedia('(any-pointer: coarse)').matches,
    appFullscreen = globalThis.matchMedia?.('(display-mode: fullscreen)').matches ?? false
) {
    try {
        // Kurulu PWA'nın tam ekranı document.fullscreenElement içinde görünmez.
        // Üstüne ikinci bir tam ekran açmak, arka plandan dönüşü bozabilir.
        if (!appFullscreen && !doc.fullscreenElement && doc.documentElement.requestFullscreen) {
            await doc.documentElement.requestFullscreen();
        }
    } catch { /* İzin verilmezse oyun mevcut ekran boyutuyla devam eder. */ }
    if (mobile && deviceScreen.orientation?.lock) {
        try { await deviceScreen.orientation.lock('landscape'); } catch { /* Elle çevirmek de mümkün. */ }
    }
}

// Sistem tam ekranı bırakmışsa doğal ilk dokunuşu kullan; düğme veya otomatik reload yok.
export function bindDisplayRecovery(isPlaying, doc = document, restore = () => enterGameDisplay()) {
    let returning = false;
    doc.addEventListener('visibilitychange', () => {
        if (doc.hidden) returning = true;
    });
    doc.addEventListener('pointerup', () => {
        if (!returning || doc.hidden) return;
        returning = false;
        if (isPlaying()) void restore();
    }, { capture: true });
}

// Bölüm seçimine dönünce yön serbest kalır; tam ekrandan çıkılmaz.
export function releaseGameOrientation(deviceScreen = screen) {
    try { deviceScreen.orientation?.unlock?.(); } catch { /* Desteklenmeyebilir. */ }
}

// Tek bağlantıyla menü, bölüm ve sonuç düğmelerine kısa bir basma hissi verir.
export function bindButtonFeedback(root = document) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    function press(event) {
        if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return;
        if (event.type === 'pointerdown' && event.button !== 0) return;
        const button = event.target.closest('button, .character-option');
        // Hareket tuşlarının görseli, parmak basılı kaldığı sürece controls.js tarafından yönetilir.
        if (!button || button.disabled || button.matches('.touch-button') || reducedMotion.matches) return;
        const levelButton = button.matches('.level-option');
        button.animate(levelButton ? [
            {scale: '1', filter: 'brightness(1)'},
            {scale: '.82', filter: 'brightness(1.25)', offset: .28},
            {scale: '1.12', filter: 'brightness(1.12)', offset: .72},
            {scale: '1', filter: 'brightness(1)'}
        ] : [{scale: '.94'}, {scale: '1'}], {duration: levelButton ? 340 : 180, easing: 'ease-out'});
    }
    root.addEventListener('pointerdown', press, { capture: true });
    root.addEventListener('keydown', press);
}

// Platformların, karakterin ve fizik kurallarının gerçek boyutları değişmez.
export function gameView(width, height, touchLayout) {
    if (touchLayout && width > height) {
        const worldHeight = height < 500 ? 320 : 480;
        return { width: Math.round(worldHeight * width / Math.max(1, height)), height: worldHeight };
    }
    return { width: Math.max(960, Math.round(600 * width / Math.max(1, height))), height: 600 };
}
