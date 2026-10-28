import { GameScene } from './GameScene.js';

// Önce HTML formundan karakter seçilir; ardından Phaser başlatılır.
// "import", başka bir dosyanın dışarı açtığı (export) kodu kullanmamızı sağlar.
const characterForm = document.getElementById('character-form');
const startButton = document.getElementById('start-button');
let gameStarted = false;

characterForm.reset();
characterForm.addEventListener('change', () => {
    startButton.disabled = !characterForm.querySelector('input[name="character"]:checked');
});

characterForm.addEventListener('submit', event => {
    event.preventDefault();
    const selected = characterForm.querySelector('input[name="character"]:checked');
    if (!selected || gameStarted) return;
    gameStarted = true;
    startButton.disabled = true;
    document.getElementById('character-select').hidden = true;
    document.getElementById('game-stage').classList.remove('choosing');
    document.getElementById('toolbar-status').textContent = 'Bahçe hazırlanıyor…';
    startGame(selected.value);
});

function startGame(character) {
    new Phaser.Game({
        type: Phaser.AUTO,
        width: 960,
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
}
