// Play hazır olmadan dokunuş kaybolmasın; açılış ve bölüm menüsü geçişinde yüklemeyi gösterir.
export function bindWelcomeMenu({ enterDisplay, showLoading, hideLoading,
    doc = document, nextFrame = requestAnimationFrame }) {
    const play = doc.getElementById('welcome-play');
    play.onclick = () => {
        if (play.disabled) return;
        play.disabled = true;
        // Tam ekran isteği doğrudan dokunuş içinde yapılmalıdır.
        void enterDisplay();
        showLoading(null);
        nextFrame(() => {
            doc.getElementById('welcome-screen').hidden = true;
            doc.getElementById('character-select').hidden = false;
            doc.getElementById('character-title').focus();
            // Menü çizilirken yükleme katmanı ekranda kalır.
            nextFrame(hideLoading);
        });
    };
    play.disabled = false;
    hideLoading();
}
