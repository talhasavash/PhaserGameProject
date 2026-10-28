// Burada Phaser yok. Sadece puan, elma, anahtar ve can bilgisi var.
export function createGameState() {
    return {
        collected: [],
        apples: 0,
        score: 0,
        hearts: 3,
        hasKey: false,
        checkpointActive: false,
        usedFountains: [],
        complete: false
    };
}

export function isKeyReady(state) {
    return state.apples === 3;
}

export function recordFruit(state, id, type) {
    // Aynı meyveyle tekrar temas edilirse ikinci kez puan vermeyelim.
    if (state.collected.includes(id)) return false;
    state.collected.push(id);

    if (type === 'apple') {
        state.apples += 1;
        state.score += 30;
    } else if (type === 'mat') {
        state.score += 20;
    } else {
        state.score += 10;
    }
    return true;
}

export function takeKey(state) {
    if (!isKeyReady(state) || state.hasKey) return false;
    state.hasKey = true;
    return true;
}

export function finishLevel(state) {
    if (!state.hasKey || state.complete) return false;
    state.complete = true;
    return true;
}

// Her abdest alanı bir kez bir can yeniler. Canlar doluysa hakkı harcamaz.
export function healAtFountain(state, id) {
    if (state.hearts >= 3 || state.usedFountains.includes(id)) return false;
    state.hearts += 1;
    state.usedFountains.push(id);
    return true;
}
