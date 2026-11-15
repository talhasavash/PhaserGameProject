import { GameScene } from './gameplay/GameScene.js';
import { gameView } from './ui/view.js';
import { levels, worlds, worldForLevel } from './world/level.js';
import { unlockedLevels } from './data/progress.js';
import { setupPwa } from './ui/pwa.js';
import { enterGameDisplay, releaseGameOrientation } from './ui/display.js';
import { showLoading, hideLoading } from './ui/loading.js';

// Önce HTML formundan karakter seçilir; ardından Phaser başlatılır.
// "import", başka bir dosyanın dışarı açtığı (export) kodu kullanmamızı sağlar.
const characterForm = document.getElementById('character-form');
const startButton = document.getElementById('start-button');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const menuButton = document.getElementById('menu-button');
const levelGrid = document.getElementById('level-grid');
const worldTabs = document.getElementById('world-tabs');
let gameStarted = false;
let activeGame = null;
let selectedWorld = 0;

function closeSettings() {
    if (!settingsPanel.hidden) settingsButton.click();
}
function toggleSettings() {
    const opening = settingsPanel.hidden;
    settingsPanel.hidden = !opening;
    settingsButton.setAttribute('aria-expanded', String(opening));
    settingsButton.setAttribute('aria-label', opening ? 'Oyun menüsünü kapat' : 'Oyun menüsünü aç');
    document.getElementById('settings-title').textContent = gameStarted ? 'Bir mola' : 'Ayarlar';
    document.getElementById('pause-button').hidden = !gameStarted;
    document.getElementById('sound-button').hidden = !gameStarted;
    document.getElementById('game-stage').inert = opening;
    document.getElementById('touch-controls').inert = opening;
    const scene = activeGame?.scene.getScene('Garden');
    if (scene?.player && !scene.gameState.complete && scene.paused !== opening) scene.togglePause();
    (opening ? document.getElementById('settings-close') : settingsButton).focus();
}

// Bölüm sayısı değişince menü de aynı veriden oluşur.
function createWorldMenu() {
    for (const world of worlds) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.world = world.id;
        button.onclick = () => {
            selectedWorld = world.id;
            createLevelMenu();
            refreshLevelLocks();
            updateStartButton();
        };
        worldTabs.append(button);
    }
}

function createLevelMenu(preferredIndex) {
    const world = worlds[selectedWorld];
    levelGrid.replaceChildren();
    levelGrid.dataset.world = world.id;
    levels.slice(world.start, world.start + world.count).forEach((level, localIndex) => {
        const index = world.start + localIndex;
        const label = document.createElement('label');
        label.className = 'level-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'level';
        input.value = index;
        input.required = true;
        input.defaultChecked = index === (preferredIndex ?? world.start);
        const card = document.createElement('span');
        card.className = 'level-card';
        const number = document.createElement('strong');
        number.textContent = localIndex + 1;
        label.dataset.theme = level.theme;
        if (level.boss) label.classList.add('boss-level');
        card.append(number);
        label.append(input, card);
        levelGrid.append(label);
    });
}

function refreshLevelLocks() {
    const unlocked = unlockedLevels(levels.length);
    for (const button of worldTabs.querySelectorAll('button')) {
        const world = worlds[Number(button.dataset.world)];
        button.disabled = world.start >= unlocked;
        button.setAttribute('aria-pressed', String(world.id === selectedWorld));
        button.textContent = `Dünya ${world.id}${button.disabled ? ' 🔒' : ''}`;
        button.setAttribute('aria-label', `Dünya ${world.id}${button.disabled ? ' · Dünya 0 tamamlanınca açılır' : ''}`);
    }
    for (const input of levelGrid.querySelectorAll('input')) {
        const index = Number(input.value);
        input.disabled = index >= unlocked;
        input.parentElement.classList.toggle('locked', input.disabled);
        const bossLabel = levels[index].boss ? ' · Boss' : '';
        const lockLabel = input.disabled ? ' · Kilitli' : '';
        const localNumber = index - worlds[selectedWorld].start + 1;
        input.setAttribute('aria-label', `${localNumber}. bölüm${bossLabel}${lockLabel}`);
    }
}

function updateStartButton() {
    startButton.disabled = !characterForm.querySelector('input[name="character"]:checked') ||
        !characterForm.querySelector('input[name="level"]:checked');
}

function startSelectedGame(event) {
    event.preventDefault();
    const selected = characterForm.querySelector('input[name="character"]:checked');
    const selectedLevel = characterForm.querySelector('input[name="level"]:checked');
    if (!selected || !selectedLevel || Number(selectedLevel.value) >= unlockedLevels(levels.length) || gameStarted) return;
    // Await etmeden, doğrudan dokunuş sırasında başlat: tarayıcı bu etkileşimi ister.
    void enterGameDisplay();
    gameStarted = true;
    showLoading();
    closeSettings();
    document.body.classList.add('playing');
    settingsButton.textContent = 'Ⅱ';
    settingsButton.hidden = false;
    document.getElementById('touch-controls').hidden = false;
    startButton.disabled = true;
    document.getElementById('character-select').hidden = true;
    document.getElementById('game-stage').classList.remove('choosing');
    document.getElementById('toolbar-status').textContent = 'Bahçe hazırlanıyor…';
    menuButton.hidden = false;
    startGame(selected.value, Number(selectedLevel.value));
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
    const observer = new ResizeObserver(() => {
        const size = view();
        if (game.scale.width !== size.width || game.scale.height !== size.height) {
            game.scale.setGameSize(size.width, size.height);
        }
    });
    observer.observe(area);
    game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
    menuButton.onclick = async () => {
        await returnToMenu(game);
        releaseGameOrientation();
    };
}

function returnToMenu(game) {
    return new Promise(resolve => {
        const currentIndex = game.scene.getScene('Garden').levelIndex;
        closeSettings();
        menuButton.disabled = true;
        game.events.once(Phaser.Core.Events.DESTROY, () => {
            gameStarted = false;
            activeGame = null;
            hideLoading();
            selectedWorld = worldForLevel(currentIndex).id;
            createLevelMenu(currentIndex);
            refreshLevelLocks();
            document.body.classList.remove('playing');
            settingsButton.hidden = true;
            document.getElementById('touch-controls').hidden = true;
            document.getElementById('game-result').hidden = true;
            document.getElementById('fall-result').hidden = true;
            document.getElementById('character-select').hidden = false;
            document.getElementById('game-stage').classList.add('choosing');
            for (const id of ['sound-button', 'pause-button', 'restart-button']) document.getElementById(id).disabled = true;
            menuButton.hidden = true;
            menuButton.disabled = false;
            startButton.disabled = false;
            document.getElementById('character-title').focus();
            resolve();
        });
        game.destroy(true);
    });
}

setupPwa();
createWorldMenu();
createLevelMenu();
refreshLevelLocks();
characterForm.reset();
characterForm.addEventListener('change', updateStartButton);
characterForm.addEventListener('submit', startSelectedGame);
settingsButton.onclick = toggleSettings;
document.getElementById('settings-close').onclick = closeSettings;
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !settingsPanel.hidden) closeSettings();
});
