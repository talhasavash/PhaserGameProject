// Hesap veya sunucu gerekmez: bu tarayıcıdaki en son açılan bölüm saklanır.
const STORAGE_KEY = 'meyve-oyunu-unlocked-levels';
let unlocked = 1;

export function readUnlocked(storage, count) {
    try {
        const saved = Number(storage.getItem(STORAGE_KEY));
        return Number.isInteger(saved) && saved >= 1 ? Math.min(saved, count) : 1;
    } catch { return 1; }
}

export function unlockedLevels(count) {
    // Depolama kapalı olsa da aynı oturumda ilerleme korunur.
    try { unlocked = Math.max(unlocked, readUnlocked(window.localStorage, count)); } catch { /* Bellekte devam et. */ }
    return Math.min(unlocked, count);
}

export function unlockNext(completedIndex, count) {
    unlocked = Math.max(unlockedLevels(count), Math.min(completedIndex + 2, count));
    try { window.localStorage.setItem(STORAGE_KEY, String(unlocked)); } catch { /* Bellekte devam et. */ }
    return unlocked;
}
