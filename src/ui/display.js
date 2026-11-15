// Bu istek yalnızca Oyna düğmesindeki kullanıcı dokunuşundan yapılır.
export async function enterGameDisplay(doc = document, deviceScreen = screen, mobile = matchMedia('(any-pointer: coarse)').matches) {
    try {
        if (!doc.fullscreenElement && doc.documentElement.requestFullscreen) {
            await doc.documentElement.requestFullscreen();
        }
    } catch { /* İzin verilmezse oyun mevcut ekran boyutuyla devam eder. */ }
    if (mobile && deviceScreen.orientation?.lock) {
        try { await deviceScreen.orientation.lock('landscape'); } catch { /* Elle çevirmek de mümkün. */ }
    }
}

// Bölüm seçimine dönünce yön serbest kalır; tam ekrandan çıkılmaz.
export function releaseGameOrientation(deviceScreen = screen) {
    try { deviceScreen.orientation?.unlock?.(); } catch { /* Desteklenmeyebilir. */ }
}
