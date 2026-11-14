// Kurulum tarayıcının kendi penceresiyle yapılır; oyun için APK gerekmez.
export function setupPwa() {
    const button = document.getElementById('install-button');
    let installPrompt = null;
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        installPrompt = event;
        button.hidden = matchMedia('(display-mode: standalone)').matches;
    });
    button.onclick = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        installPrompt = null;
        button.hidden = true;
    };
    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        button.hidden = true;
    });
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
