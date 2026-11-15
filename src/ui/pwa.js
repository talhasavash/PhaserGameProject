// Kurulum Chrome/Safari menüsünden yapılır; oyun menüsü yalnızca oyun içindir.
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
