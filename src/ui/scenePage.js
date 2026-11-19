// Sahnenin HTML düğmelerini, sonuç kartını ve bölüm yükleme ekranını yönetir.
import { levels, worldForLevel } from '../world/levels/level.js';
import { verses } from '../data/verses.js';

const SCENE_BUTTON_IDS = ['pause-button', 'play-again', 'next-level', 'retry-fall'];

// HTML düğmeleri sahneye bağlanır, bölüm kapanınca aynı listeden temizlenir.
export function prepareScenePage() {
    document.getElementById('game-stage').inert = false;
    document.getElementById('touch-controls').inert = false;
    document.getElementById('settings-panel').hidden = true;
    document.getElementById('settings-button').setAttribute('aria-expanded', 'false');
    document.getElementById('settings-button').setAttribute('aria-label', 'Oyun menüsünü aç');
    document.getElementById('fall-result').hidden = true;
    document.getElementById('touch-controls').hidden = false;
}

export function bindSceneButtons(scene) {
    const result = document.getElementById('game-result');
    result.hidden = true;
    document.getElementById('pause-button').setAttribute('aria-label', 'Devam et');
    document.getElementById('pause-button').disabled = false;
    document.getElementById('toolbar-status').textContent = `${scene.level.name} seni bekliyor`;
    document.getElementById('pause-button').onclick = () => document.getElementById('settings-button').click();
    document.getElementById('play-again').onclick = () => scene.continueAfterResult();
    document.getElementById('next-level').onclick = () => scene.continueAfterResult();
    document.getElementById('retry-fall').onclick = () => scene.retryFall();
    scene.sound.setMute(scene.soundMuted);
}

export function clearSceneButtons() {
    for (const id of SCENE_BUTTON_IDS) document.getElementById(id).onclick = null;
}

export function showCompletion(levelIndex) {
    const final = levelIndex === levels.length - 1;
    const title = final ? 'Oyun tamam!' : 'Bölüm tamam!';
    document.getElementById('result-title').textContent = title;
    const verse = levels[levelIndex]?.verse || worldForLevel(levelIndex)?.verse || verses[levelIndex] || verses[0];
    document.getElementById('result-verse').textContent = verse.text;
    document.getElementById('next-level').hidden = final;
    document.getElementById('play-again').hidden = !final;
    document.getElementById('game-result').hidden = false;
    document.getElementById(final ? 'play-again' : 'next-level').focus({ preventScroll: true });
    return title;
}

export function showLoading(progress = 0) {
    document.getElementById('game-loading').hidden = false;
    if (progress === null) document.getElementById('loading-progress').removeAttribute('value');
    else updateLoading(progress);
}

export function updateLoading(progress) {
    document.getElementById('loading-progress').value = Math.max(0, Math.min(1, progress));
}

export function hideLoading() {
    document.getElementById('game-loading').hidden = true;
}

export function finishLoading(scene) {
    scene.load.off('progress', updateLoading);
    updateLoading(1);
    // create bitse de canvas henüz çizilmemiş olabilir; ilk gerçek kareyi bekle.
    scene.game.events.once('postrender', hideLoading);
}
