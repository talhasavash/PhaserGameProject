// Oyunun giriş noktasıdır; menü seçimini, Phaser oyununu başlatmayı ve ana ekrana dönüşü yönetir.
import { GameScene, GAME_SCENE_KEY } from './gameplay/GameScene.js';
import { gameView, setupPwa, enterGameDisplay, releaseGameOrientation, bindDisplayRecovery, bindButtonFeedback } from './ui/browser.js';
import { levels, worldForLevel } from './world/levels/level.js';
import { unlockedLevels } from './data/progress.js';
import { createWorldMenu, createLevelMenu, refreshLevelLocks, slideWorld } from './ui/levelMenu.js';
import { showLoading, hideLoading } from './ui/scenePage.js';
import { backgroundMusic, bindMusicLifecycle } from './audio/music.js';
import { menuMusic } from './data/music.js';

// Önce HTML formundan karakter seçilir; ardından Phaser başlatılır.
// "import", başka bir dosyanın dışarı açtığı (export) kodu kullanmamızı sağlar.
const characterForm = document.getElementById('character-form');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const menuButton = document.getElementById('menu-button');
const levelGrid = document.getElementById('level-grid');
const worldTabs = document.getElementById('world-tabs');
let gameStarted = false;
let activeGame = null;
let selectedWorld = 1;

function closeSettings() {
    if (!settingsPanel.hidden) settingsButton.click();
}
function toggleSettings() {
    const opening = settingsPanel.hidden;
    settingsPanel.hidden = !opening;
    settingsButton.setAttribute('aria-expanded', String(opening));
    settingsButton.setAttribute('aria-label', opening ? 'Oyun menüsünü kapat' : 'Oyun menüsünü aç');
    document.getElementById('pause-button').hidden = !gameStarted;
    document.getElementById('game-stage').inert = opening;
    document.getElementById('touch-controls').inert = opening;
    const scene = activeGame?.scene.getScene(GAME_SCENE_KEY);
    if (scene?.player && !scene.gameState.complete && scene.paused !== opening) scene.togglePause();
    (opening ? document.getElementById('settings-close') : settingsButton).focus();
}

// Kullanıcı dünya seçince bölüm listesi ve kilitleri birlikte yenilenir.
function selectWorld(worldId) {
    if (gameStarted) return;
    return slideWorld(levelGrid, selectedWorld, worldId, () => {
        selectedWorld = worldId;
        createLevelMenu(levelGrid, selectedWorld, undefined, startSelectedGame);
        refreshLevelLocks(worldTabs, levelGrid, selectedWorld);
    });
}

function startSelectedGame(levelIndex) {
    const selected = characterForm.querySelector('input[name="character"]:checked');
    if (!selected || !levels[levelIndex] || levelIndex >= unlockedLevels(levels.length) || gameStarted) return;
    // Await etmeden, doğrudan dokunuş sırasında başlat: tarayıcı bu etkileşimi ister.
    void enterGameDisplay();
    gameStarted = true;
    showLoading();
    closeSettings();
    document.body.classList.add('playing');
    settingsButton.hidden = false;
    document.getElementById('touch-controls').hidden = false;
    document.getElementById('character-select').hidden = true;
    document.getElementById('game-stage').classList.remove('choosing');
    document.getElementById('toolbar-status').textContent = 'Bahçe hazırlanıyor…';
    menuButton.hidden = false;
    startGame(selected.value, levelIndex);
}

function startGame(character, levelIndex) {
    document.body.dataset.character = character;
    const area = document.getElementById('game');
    const touchLayout = matchMedia('(any-pointer: coarse), (max-width: 1024px)');
    function view() { return gameView(area.clientWidth, area.clientHeight, touchLayout.matches); }
    const initialView = view();
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: initialView.width,
        height: initialView.height,
        parent: 'game',
        backgroundColor: '#183c36',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        physics: {
            default: 'arcade', // Phaser'ın 2D platform oyunlarına uygun fizik sistemi.
            arcade: {
                gravity: { y: 1600 }, // Aşağı yön pozitif. Karakteri yere çeker.
                debug: false // true yaparsan çarpışma kutularını görebilirsin.
            }
        },
        scene: new GameScene(character, levelIndex),
        title: 'Meyve Oyunu 2026',
        render: { antialias: true, roundPixels: true }
    });
    activeGame = game;
    const alignPause = () => {
        if (!game.canvas) return;
        const top = game.canvas.getBoundingClientRect().top;
        document.documentElement.style.setProperty('--game-canvas-top', `${Math.round(top)}px`);
    };
    game.events.once('postrender', alignPause);
    game.scale.on(Phaser.Scale.Events.RESIZE, alignPause);
    const observer = new ResizeObserver(() => {
        const size = view();
        if (game.scale.width !== size.width || game.scale.height !== size.height) {
            game.scale.setGameSize(size.width, size.height);
        }
    });
    observer.observe(area);
    game.events.once(Phaser.Core.Events.DESTROY, () => {
        observer.disconnect();
        game.scale.off(Phaser.Scale.Events.RESIZE, alignPause);
        document.documentElement.style.removeProperty('--game-canvas-top');
    });
    const openMenu = async levelIndex => {
        await returnToMenu(game, levelIndex);
        releaseGameOrientation();
    };
    menuButton.onclick = () => openMenu();
    game.events.on('world-complete', openMenu);
}

function returnToMenu(game, levelIndex) {
    return new Promise(resolve => {
        const selectedIndex = levelIndex ?? game.scene.getScene(GAME_SCENE_KEY).levelIndex;
        closeSettings();
        menuButton.disabled = true;
        game.events.once(Phaser.Core.Events.DESTROY, () => {
            gameStarted = false;
            activeGame = null;
            hideLoading();
            selectedWorld = worldForLevel(selectedIndex).id;
            createLevelMenu(levelGrid, selectedWorld, selectedIndex, startSelectedGame);
            refreshLevelLocks(worldTabs, levelGrid, selectedWorld);
            document.body.classList.remove('playing');
            settingsButton.hidden = true;
            document.getElementById('touch-controls').hidden = true;
            document.getElementById('game-result').hidden = true;
            document.getElementById('fall-result').hidden = true;
            document.getElementById('character-select').hidden = false;
            document.getElementById('game-stage').classList.add('choosing');
            document.getElementById('pause-button').disabled = true;
            menuButton.hidden = true;
            menuButton.disabled = false;
            document.getElementById('character-title').focus();
            backgroundMusic.setTrack(menuMusic);
            resolve();
        });
        game.destroy(true);
    });
}

setupPwa();
backgroundMusic.setTrack(menuMusic);
bindMusicLifecycle();
bindButtonFeedback();
bindDisplayRecovery(() => gameStarted);
createWorldMenu(worldTabs, selectWorld);
createLevelMenu(levelGrid, selectedWorld, undefined, startSelectedGame);
refreshLevelLocks(worldTabs, levelGrid, selectedWorld);
characterForm.reset();
characterForm.addEventListener('submit', event => event.preventDefault());
// Karşılama yalnızca açılışta görünür; oyundan dönüş doğrudan bölüm menüsünedir.
document.getElementById('welcome-play').onclick = () => {
    void enterGameDisplay();
    document.getElementById('welcome-screen').hidden = true;
    document.getElementById('character-select').hidden = false;
    document.getElementById('character-title').focus();
};
settingsButton.onclick = toggleSettings;
document.getElementById('settings-close').onclick = closeSettings;
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !settingsPanel.hidden) closeSettings();
});
