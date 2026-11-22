// Oyunun giriş noktasıdır; menü seçimini, Phaser oyununu başlatmayı ve ana ekrana dönüşü yönetir.

import { element } from './ui/dom.js';
import './extensions.js';
import { GameScene, GAME_SCENE_KEY } from './game/GameScene.js';
import { gameView, setupPwa, enterGameDisplay, releaseGameOrientation, bindDisplayRecovery, bindButtonFeedback } from './ui/browser.js';
import { levels, worldForLevel, isPlayableLevel } from './world/levels/level.js';
import { unlockedLevels } from './data/progress.js';
import { createWorldMenu, createLevelMenu, refreshLevelLocks, slideWorld } from './ui/levelMenu.js';
import { showLoading, hideLoading } from './ui/scenePage.js';
import { backgroundMusic, bindMusicLifecycle } from './audio/music.js';
import { menuMusic } from './data/music.js';
import { bindMusicButtons } from './ui/musicButton.js';
import { bindWelcomeMenu } from './ui/welcome.js';

// Önce HTML formundan karakter seçilir; ardından Phaser başlatılır.
// "import", başka bir dosyanın dışarı açtığı (export) kodu kullanmamızı sağlar.
const characterForm = element<HTMLFormElement>('character-form');
const settingsButton = element<HTMLButtonElement>('settings-button');
const settingsPanel = element('settings-panel');
const menuButton = element<HTMLButtonElement>('menu-button');
const levelGrid = element('level-grid');
const worldTabs = element('world-tabs');
let gameStarted = false;
let activeGame: Phaser.Game | null = null;
let selectedWorld = 1;

function closeSettings() {
    if (!settingsPanel.hidden) settingsButton.click();
}
function toggleSettings() {
    const opening = settingsPanel.hidden === true;
    settingsPanel.hidden = !opening;
    settingsButton.setAttribute('aria-expanded', String(opening));
    settingsButton.setAttribute('aria-label', opening ? 'Oyun menüsünü kapat' : 'Oyun menüsünü aç');
    element<HTMLButtonElement>('pause-button').hidden = !gameStarted;
    element('game-stage').inert = opening;
    element('touch-controls').inert = opening;
    const scene = (activeGame?.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined);
    if (scene?.player && !scene.gameState.complete && scene.paused !== opening) scene.togglePause();
    (opening ? element<HTMLButtonElement>('settings-close') : settingsButton).focus();
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
    const selected = characterForm.querySelector<HTMLInputElement>('input[name="character"]:checked');
    if (!selected || !isPlayableLevel(levelIndex) || levelIndex >= unlockedLevels(levels.length) || gameStarted) return;
    // Await etmeden, doğrudan dokunuş sırasında başlat: tarayıcı bu etkileşimi ister.
    void enterGameDisplay();
    gameStarted = true;
    showLoading();
    closeSettings();
    document.body.classList.add('playing');
    settingsButton.hidden = false;
    element('touch-controls').hidden = false;
    element('character-select').hidden = true;
    element('game-stage').classList.remove('choosing');
    element('toolbar-status').textContent = 'Bahçe hazırlanıyor…';
    menuButton.hidden = false;
    startGame(selected.value, levelIndex);
}

function startGame(character, levelIndex) {
    document.body.dataset.character = character;
    const area = element('game');
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
                gravity: { x: 0, y: 1600 }, // Aşağı yön pozitif. Karakteri yere çeker.
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
    const openMenu = async (levelIndex?: number) => {
        await returnToMenu(game, levelIndex);
        releaseGameOrientation();
    };
    menuButton.onclick = () => openMenu();
    game.events.on('world-complete', openMenu);
}

function returnToMenu(game, levelIndex?: number) {
    return new Promise<void>(resolve => {
        const selectedIndex = levelIndex ?? game.scene.getScene(GAME_SCENE_KEY).levelIndex;
        closeSettings();
        menuButton.disabled = true;
        game.events.once(Phaser.Core.Events.DESTROY, () => {
            gameStarted = false;
            activeGame = null;
            hideLoading();
            selectedWorld = worldForLevel(selectedIndex)!.id;
            createLevelMenu(levelGrid, selectedWorld, selectedIndex, startSelectedGame);
            refreshLevelLocks(worldTabs, levelGrid, selectedWorld);
            document.body.classList.remove('playing');
            settingsButton.hidden = true;
            element('touch-controls').hidden = true;
            element('game-result').hidden = true;
            element('fall-result').hidden = true;
            element('character-select').hidden = false;
            element('game-stage').classList.add('choosing');
            element<HTMLButtonElement>('pause-button').disabled = true;
            menuButton.hidden = true;
            menuButton.disabled = false;
            element('character-title').focus();
            backgroundMusic.setTrack(menuMusic);
            resolve();
        });
        game.destroy(true);
    });
}

setupPwa();
bindMusicButtons(backgroundMusic);
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
settingsButton.onclick = toggleSettings;
element<HTMLButtonElement>('settings-close').onclick = closeSettings;
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !settingsPanel.hidden) closeSettings();
});

// Bütün başlangıç bağlantıları hazır olduğunda Play açılır ve ilk yükleme kapanır.
bindWelcomeMenu({ enterDisplay: enterGameDisplay, showLoading, hideLoading });
