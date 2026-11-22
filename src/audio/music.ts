// Menü ve dünya müziklerini tek ses elemanıyla çalar; sahne değişimlerinde üst üste binmeyi önler.

import type { MusicTrack } from '../world/model/contracts.js';

export function createMusicPlayer(createAudio: () => HTMLAudioElement = () => {
    const audio = document.getElementById('background-music');
    if (!(audio instanceof HTMLAudioElement)) throw new Error('Müzik elemanı bulunamadı.');
    return audio;
}) {
    let audio: HTMLAudioElement | null = null;
    let track: MusicTrack | null = null;
    let unlocked = false;
    let enabled = true;
    const pauses = new Set<string>();

    function playIfAllowed() {
        if (!audio || !track || !enabled || !unlocked || pauses.size || !audio.paused) return;
        // Eski bir play isteği, parça değişince AbortError ile sonlanabilir; oyunu etkilemez.
        const playing = audio.play();
        playing?.catch(error => {
            if (!['NotAllowedError', 'AbortError'].includes(error.name)) console.warn('Müzik çalınamadı:', error.message);
        });
    }

    return {
        get enabled() { return enabled; },
        setEnabled(value) {
            enabled = Boolean(value);
            if (enabled) playIfAllowed();
            else audio?.pause();
        },
        setTrack(next?: MusicTrack | null) {
            if (track?.src === next?.src) {
                if (audio && next) audio.volume = Math.max(0, Math.min(1, next.volume ?? 0.15));
                playIfAllowed();
                return;
            }
            if (!audio && !next) return;
            audio ||= createAudio();
            audio.pause();
            track = next || null;
            if (track) {
                audio.src = track.src;
                audio.loop = true;
                audio.volume = Math.max(0, Math.min(1, track.volume ?? 0.15));
            } else audio.removeAttribute('src');
            audio.load();
            playIfAllowed();
        },
        unlock() { unlocked = true; playIfAllowed(); },
        pause(reason) { pauses.add(reason); audio?.pause(); },
        resume(reason) { pauses.delete(reason); playIfAllowed(); },
        destroy() {
            audio?.pause();
            audio?.removeAttribute('src');
            audio?.load();
            audio = null; track = null; unlocked = false; pauses.clear();
        }
    };
}

// HTML menü Phaser oyunu kurulmadan da görünür; bu oynatıcı Phaser'ın yaşam süresinden bağımsızdır.
export const backgroundMusic = createMusicPlayer();

export function bindMusicLifecycle(player = backgroundMusic, doc = document, win = window) {
    const unlock = () => player.unlock();
    const visibility = () => doc.hidden ? player.pause('background') : player.resume('background');
    const hide = () => player.pause('background');
    doc.addEventListener('pointerdown', unlock, true);
    doc.addEventListener('keydown', unlock);
    doc.addEventListener('visibilitychange', visibility);
    win.addEventListener('pagehide', hide);
    win.addEventListener('pageshow', visibility);
    visibility();
    return () => {
        doc.removeEventListener('pointerdown', unlock, true);
        doc.removeEventListener('keydown', unlock);
        doc.removeEventListener('visibilitychange', visibility);
        win.removeEventListener('pagehide', hide);
        win.removeEventListener('pageshow', visibility);
        player.destroy();
    };
}
