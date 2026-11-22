// Phaser kullanmadan puan, yıldız, anahtar, can ve bölüm tamamlama kurallarını hesaplar.
export const FRUIT_TYPES = ['apple', 'pear', 'orange', 'banana', 'grapes', 'strawberry'] as const;
export interface GameState {
    collected: string[]; apples: number; stars: number; score: number; hearts: number;
    hasKey: boolean; checkpointActive: boolean; usedFountains: string[]; complete: boolean;
}
export function createGameState(initialScore = 0): GameState {
    return {
        collected: [],
        apples: 0,
        stars: 0,
        score: initialScore,
        hearts: 3,
        hasKey: false,
        checkpointActive: false,
        usedFountains: [],
        complete: false
    };
}

export function isKeyReady(state: GameState) {
    return state.stars === 3;
}

export function recordFruit(state: GameState, id: string, type: string) {
    // Aynı meyveyle tekrar temas edilirse ikinci kez puan vermeyelim.
    if (state.collected.includes(id)) return false;
    state.collected.push(id);

    if (type === 'star') {
        state.stars += 1;
        state.score += 40;
    } else if ((FRUIT_TYPES as readonly string[]).includes(type)) {
        if (type === 'apple') state.apples += 1;
        state.score += 30;
    } else if (['mat', 'lantern', 'crescent'].includes(type)) {
        state.score += 20;
    } else {
        state.score += 10;
    }
    return true;
}

export function takeKey(state: GameState) {
    if (!isKeyReady(state) || state.hasKey) return false;
    state.hasKey = true;
    return true;
}

export function finishLevel(state: GameState) {
    if (!state.hasKey || state.complete) return false;
    state.complete = true;
    return true;
}

// Her abdest alanı bir kez bir can yeniler. Canlar doluysa hakkı harcamaz.
export function healAtFountain(state: GameState, id: string) {
    if (state.hearts >= 3 || state.usedFountains.includes(id)) return false;
    state.hearts += 1;
    state.usedFountains.push(id);
    return true;
}
