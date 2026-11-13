import { GameScene } from './GameScene.js';

// Önce HTML formundan karakter seçilir; ardından Phaser başlatılır.
// "import", başka bir dosyanın dışarı açtığı (export) kodu kullanmamızı sağlar.
const characterForm = document.getElementById('character-form');
const startButton = document.getElementById('start-button');
let gameStarted = false;
const fullscreenButton = document.getElementById('fullscreen-button');
fullscreenButton.hidden = !document.documentElement.requestFullscreen;
fullscreenButton.addEventListener('click', async () => {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else {
            await document.documentElement.requestFullscreen();
            if (matchMedia('(any-pointer: coarse)').matches && screen.orientation?.lock) {
                try { await screen.orientation.lock('landscape'); } catch { /* Elle çevirerek de oynanabilir. */ }
            }
        }
    } catch {
        document.getElementById('game-status').textContent = 'Bu tarayıcı tam ekrana geçişe izin vermedi.';
    }
});
document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? 'Küçült' : 'Tam ekran';
});

characterForm.reset();
characterForm.addEventListener('change', () => {
    startButton.disabled = !characterForm.querySelector('input[name="character"]:checked');
});

characterForm.addEventListener('submit', event => {
    event.preventDefault();
    const selected = characterForm.querySelector('input[name="character"]:checked');
    if (!selected || gameStarted) return;
    gameStarted = true;
    document.body.classList.add('playing');
    document.getElementById('touch-controls').hidden = false;
    startButton.disabled = true;
    document.getElementById('character-select').hidden = true;
    document.getElementById('game-stage').classList.remove('choosing');
    document.getElementById('toolbar-status').textContent = 'Bahçe hazırlanıyor…';
    startGame(selected.value);
});

function startGame(character) {
    const area = document.getElementById('game');
    // Yatay ekran genişledikçe dünyanın daha geniş bir parçasını göster; resmi esnetme.
    function viewWidth() { return Math.max(960, Math.round(600 * area.clientWidth / Math.max(1, area.clientHeight))); }
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: viewWidth(),
        height: 600,
        parent: 'game',
        backgroundColor: '#bce9ed',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        physics: {
            default: 'arcade', // Phaser'ın 2D platform oyunlarına uygun fizik sistemi.
            arcade: {
                gravity: { y: 1600 }, // Aşağı yön pozitif. Karakteri yere çeker.
                debug: false // true yaparsan çarpışma kutularını görebilirsin.
            }
        },
        scene: new GameScene(character),
        title: 'Meyve Oyunu 2026',
        render: { antialias: true, roundPixels: true }
    });
    new ResizeObserver(() => {
        const width = viewWidth();
        if (game.scale.width !== width) game.scale.setGameSize(width, 600);
    }).observe(area);
}
