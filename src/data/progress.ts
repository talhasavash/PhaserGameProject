// Açılmış bölümleri localStorage içinde saklar ve sonraki bölümün kilidini açar.
import type {WorldDefinition} from '../world/model/contracts.js';
const STORAGE_KEY = 'meyve-oyunu-unlocked-levels';
let unlocked = 1;
const worldProgress = new Map<number, number>();
type ProgressWorld = Pick<WorldDefinition, 'id' | 'count' | 'independentProgress'> & {start: number};

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

// Sayı dünya içindeki açık bölüm sayısıdır; count+1 son bölümün de tamamlandığını belirtir.
export function worldUnlockedLevels(world: ProgressWorld, slotCount: number): number {
    if (!world.independentProgress) return Math.max(0, unlockedLevels(slotCount) - world.start);
    const key = `meyve-oyunu-world-${world.id}-unlocked`;
    let saved = 1;
    try {
        const value = Number(window.localStorage.getItem(key));
        if (Number.isInteger(value) && value >= 1) saved = Math.min(value, world.count + 1);
    } catch { /* Depolama kapalıysa oturum belleği kullanılır. */ }
    const value = Math.max(worldProgress.get(world.id) ?? 1, saved);
    worldProgress.set(world.id, value);
    return value;
}

export function unlockWorldNext(world: ProgressWorld, completedIndex: number, slotCount: number): number {
    if (!world.independentProgress) return unlockNext(completedIndex, slotCount);
    const value = Math.max(worldUnlockedLevels(world, slotCount), Math.min(completedIndex - world.start + 2, world.count + 1));
    worldProgress.set(world.id, value);
    try { window.localStorage.setItem(`meyve-oyunu-world-${world.id}-unlocked`, String(value)); } catch { /* Bellekte devam et. */ }
    return value;
}
