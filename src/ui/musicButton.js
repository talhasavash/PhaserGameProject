// Menüdeki müzik düğmelerini eşitler; yalnızca müzik tercihini localStorage'da saklar.
const STORAGE_KEY = 'meyve-oyunu-music-enabled';

export function bindMusicButtons(player, root = document, getStorage = () => window.localStorage) {
    const buttons = [...root.querySelectorAll('[data-music-toggle]')];
    try { player.setEnabled(getStorage().getItem(STORAGE_KEY) !== 'false'); }
    catch { /* Depolama kapalıysa mevcut oturumda çalışmaya devam et. */ }

    function refresh() {
        for (const button of buttons) {
            const label = player.enabled ? 'Müziği kapat' : 'Müziği aç';
            button.setAttribute('aria-pressed', String(player.enabled));
            button.setAttribute('aria-label', label);
            button.title = label;
        }
    }
    function toggle() {
        player.setEnabled(!player.enabled);
        player.unlock();
        try { getStorage().setItem(STORAGE_KEY, String(player.enabled)); }
        catch { /* Tercih bellekte korunur. */ }
        refresh();
    }
    for (const button of buttons) button.addEventListener('click', toggle);
    refresh();
}
