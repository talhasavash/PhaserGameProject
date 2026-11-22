// Sahnenin HTML düğmelerini, sonuç kartını ve bölüm yükleme ekranını yönetir.

import { element } from './dom.js';
import { levels, worldForLevel, isPlayableLevel } from '../world/levels/level.js';
import { verses } from '../data/verses.js';

const SCENE_BUTTON_IDS = ['pause-button', 'play-again', 'next-level', 'retry-fall'];

// HTML düğmeleri sahneye bağlanır, bölüm kapanınca aynı listeden temizlenir.
export function prepareScenePage() {
    element('game-stage').inert = false;
    element('touch-controls').inert = false;
    element('settings-panel').hidden = true;
    element<HTMLButtonElement>('settings-button').setAttribute('aria-expanded', 'false');
    element<HTMLButtonElement>('settings-button').setAttribute('aria-label', 'Oyun menüsünü aç');
    element('fall-result').hidden = true;
    element('touch-controls').hidden = false;
}

export function bindSceneButtons(scene) {
    const result = element('game-result');
    result.hidden = true;
    element<HTMLButtonElement>('pause-button').setAttribute('aria-label', 'Devam et');
    element<HTMLButtonElement>('pause-button').disabled = false;
    element('toolbar-status').textContent = `${scene.level.name} seni bekliyor`;
    element<HTMLButtonElement>('pause-button').onclick = () => element<HTMLButtonElement>('settings-button').click();
    element<HTMLButtonElement>('play-again').onclick = () => scene.continueAfterResult();
    element<HTMLButtonElement>('next-level').onclick = () => scene.continueAfterResult();
    element<HTMLButtonElement>('retry-fall').onclick = () => scene.retryFall();
    scene.sound.setMute(scene.soundMuted);
}

export function clearSceneButtons() {
    for (const id of SCENE_BUTTON_IDS) element<HTMLButtonElement>(id).onclick = null;
}

export function showCompletion(levelIndex) {
    const final = !isPlayableLevel(levelIndex + 1);
    const title = final ? 'Oyun tamam!' : 'Bölüm tamam!';
    element('result-title').textContent = title;
    const verse = levels[levelIndex]?.verse || worldForLevel(levelIndex)?.verse || verses[levelIndex] || verses[0];
    element('result-verse').textContent = verse.text;
    element<HTMLButtonElement>('next-level').hidden = final;
    element<HTMLButtonElement>('play-again').hidden = !final;
    element('game-result').hidden = false;
    element<HTMLButtonElement>(final ? 'play-again' : 'next-level').focus({ preventScroll: true });
    return title;
}

export function showLoading(progress: number | null = 0) {
    element('game-loading').hidden = false;
    if (progress === null) element<HTMLProgressElement>('loading-progress').removeAttribute('value');
    else updateLoading(progress);
}

export function updateLoading(progress) {
    element<HTMLProgressElement>('loading-progress').value = Math.max(0, Math.min(1, progress));
}

export function hideLoading() {
    element('game-loading').hidden = true;
}

export function finishLoading(scene) {
    scene.load.off('progress', updateLoading);
    updateLoading(1);
    // create bitse de canvas henüz çizilmemiş olabilir; ilk gerçek kareyi bekle.
    scene.game.events.once('postrender', hideLoading);
}
