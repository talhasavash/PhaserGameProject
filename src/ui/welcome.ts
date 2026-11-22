// Play hazır olmadan dokunuş kaybolmasın; açılış ve bölüm menüsü geçişinde yüklemeyi gösterir.

import { element } from './dom.js';

export function bindWelcomeMenu({ enterDisplay, showLoading, hideLoading,
    doc = document, nextFrame = requestAnimationFrame }) {
    const play = element<HTMLButtonElement>('welcome-play', doc);
    play.onclick = () => {
        if (play.disabled) return;
        play.disabled = true;
        // Tam ekran isteği doğrudan dokunuş içinde yapılmalıdır.
        void enterDisplay();
        showLoading(null);
        nextFrame(() => {
            element('welcome-screen', doc).hidden = true;
            element('character-select', doc).hidden = false;
            element('character-title', doc).focus();
            // Menü çizilirken yükleme katmanı ekranda kalır.
            nextFrame(hideLoading);
        });
    };
    play.disabled = false;
    hideLoading();
}
