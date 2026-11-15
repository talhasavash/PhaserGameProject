// Bu istek yalnızca Oyna düğmesindeki kullanıcı dokunuşundan yapılır.
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
