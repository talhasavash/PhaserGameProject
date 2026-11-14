import { GameScene } from './gameplay/GameScene.js';
import { gameView } from './ui/view.js';
import { levels, worlds, worldForLevel } from './world/level.js';
import { unlockedLevels } from './data/progress.js';

// Önce HTML formundan karakter seçilir; ardından Phaser başlatılır.
// "import", başka bir dosyanın dışarı açtığı (export) kodu kullanmamızı sağlar.
const characterForm = document.getElementById('character-form');
const startButton = document.getElementById('start-button');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const menuButton = document.getElementById('menu-button');
const levelGrid = document.getElementById('level-grid');
const worldTabs = document.getElementById('world-tabs');
const fullscreenButton = document.getElementById('fullscreen-button');
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
    const scene = activeGame?.scene.getScene('Garden');
    if (scene?.player && !scene.gameState.complete && scene.paused !== opening) scene.togglePause();
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

async function toggleFullscreen() {
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
}

function updateFullscreenButton() {
    fullscreenButton.textContent = document.fullscreenElement ? '⤢' : '⛶';
    fullscreenButton.setAttribute('aria-label', document.fullscreenElement ? 'Tam ekrandan çık' : 'Tam ekran');
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
    gameStarted = true;
    closeSettings();
    document.body.classList.add('playing');
    document.getElementById('touch-controls').hidden = false;
    startButton.disabled = true;
    document.getElementById('character-select').hidden = true;
    document.getElementById('game-stage').classList.remove('choosing');
    document.getElementById('toolbar-status').textContent = 'Bahçe hazırlanıyor…';
    menuButton.hidden = false;
    startGame(selected.value, Number(selectedLevel.value));
}

function startGame(character, levelIndex) {
    const area = document.getElementById('game');
    const touchLayout = matchMedia('(any-pointer: coarse), (max-width: 1024px)');
    function view() { return gameView(area.clientWidth, area.clientHeight, touchLayout.matches); }
    const initialView = view();
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: initialView.width,
        height: initialView.height,
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
    menuButton.onclick = () => returnToMenu(game);
}

function returnToMenu(game) {
    const currentIndex = game.scene.getScene('Garden').levelIndex;
    closeSettings();
    menuButton.disabled = true;
    game.events.once(Phaser.Core.Events.DESTROY, () => {
        gameStarted = false;
        activeGame = null;
        selectedWorld = worldForLevel(currentIndex).id;
        createLevelMenu(currentIndex);
        refreshLevelLocks();
        document.body.classList.remove('playing');
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
    });
    game.destroy(true);
}

createWorldMenu();
createLevelMenu();
refreshLevelLocks();
characterForm.reset();
characterForm.addEventListener('change', updateStartButton);
characterForm.addEventListener('submit', startSelectedGame);
settingsButton.onclick = toggleSettings;
fullscreenButton.hidden = !document.documentElement.requestFullscreen;
fullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);
