// Matter bölümlerinin oyun akışı; ortak kuralları, HUD'ı ve HTML menülerini kullanır.
import {levels, worldForLevel, isPlayableLevel, LEVEL_SLOT_COUNT} from '../world/levels/level.js';
import type {LevelDefinition, Collectible} from '../world/model/contracts.js';
import {MatterRuntime} from '../physics/matter/MatterRuntime.js';
import {MatterEnemies} from '../physics/matter/MatterEnemies.js';
import type {MatterEnemyActor} from '../physics/matter/MatterEnemies.js';
import {createBridgeMechanisms} from '../physics/matter/BridgeMechanisms.js';
import type {BridgeMechanisms} from '../physics/matter/BridgeMechanisms.js';
import {matterWorldForLevel} from '../physics/matter/levelWorld.js';
import type {MatterContact} from '../physics/matter/MatterObjects.js';
import {createGameState, recordFruit, isKeyReady, takeKey, finishLevel} from './rules.js';
import {GAME_SCENE_KEY, restartOrChangeLevel} from './sceneRouting.js';
import type {ActiveGameScene} from './sceneRouting.js';
import {loadGameAssets} from '../data/assets.js';
import {selectCharacterSkin, characterPrefix} from '../data/characters.js';
import {backgroundMusic} from '../audio/music.js';
import {unlockWorldNext} from '../data/progress.js';
import {drawMatterTerrain} from '../physics/matter/terrainArt.js';
import {createScenery, createMosque} from '../world/scenery/background.js';
import {createPlatformArt} from '../world/terrain/platforms.js';
import {createPitArt} from '../world/terrain/pits.js';
import {createHud, centerHud, updateHud} from '../ui/hud.js';
import {prepareScenePage, bindSceneButtons, clearSceneButtons, showLoading, updateLoading, finishLoading, showCompletion} from '../ui/scenePage.js';
import {createFeedback, animateCollection} from '../effects/GameEffects.js';
import {element} from '../ui/dom.js';

export class MatterGameScene extends Phaser.Scene implements ActiveGameScene {
    levelIndex: number;
    character: string;
    level!: LevelDefinition;
    player!: Phaser.GameObjects.Sprite;
    gameState = createGameState();
    soundMuted = false;
    paused = false;
    private carriedScore = 0;
    private characterSkin = 'boy';
    private runtime!: MatterRuntime;
    private enemies!: MatterEnemies;
    private mechanisms!: BridgeMechanisms;
    private elapsed = 0;
    private hurtUntil = 0;
    private lost = false;
    private resultShown = false;
    private sensors = new Map<MatterJS.BodyType, () => void>();
    private pending = new Set<() => void>();
    private keySprite!: Phaser.GameObjects.Image;
    private door!: {open(): void};

    constructor(character = 'boy', levelIndex = 0, score = 0) {
        super(GAME_SCENE_KEY);
        this.character = character;
        this.levelIndex = levelIndex;
        this.carriedScore = score;
    }
    init(data: {levelIndex?: number; score?: number} = {}) {
        this.levelIndex = data.levelIndex ?? this.levelIndex;
        this.carriedScore = data.score ?? this.carriedScore;
        this.level = levels[this.levelIndex];
        this.characterSkin = selectCharacterSkin(this.level, worldForLevel(this.levelIndex), this.character);
        this.gameState = createGameState(this.carriedScore);
        this.paused = this.lost = this.resultShown = false;
        this.elapsed = this.hurtUntil = 0;
        this.sensors.clear(); this.pending.clear();
    }
    preload() {
        showLoading();
        this.load.on('progress', updateLoading);
        backgroundMusic.setTrack(worldForLevel(this.levelIndex)!.music);
        loadGameAssets(this, this.characterSkin, this.level);
    }
    create() {
        prepareScenePage();
        createScenery(this, this.level.width, this.level.theme);
        drawMatterTerrain(this, this.level.matterSurfaces ?? []);
        for (const gap of this.level.gaps) createPitArt(this, gap);
        for (const platform of this.level.platforms) createPlatformArt(this, platform,
            platform.style || this.level.platformTheme || this.level.theme);
        this.runtime = new MatterRuntime(this, matterWorldForLevel(this.level), characterPrefix('normal', this.characterSkin));
        this.player = this.runtime.player;
        this.runtime.setDebug(false);
        this.runtime.onJump = () => this.sound.play('jump', {volume: .2});
        createFeedback(this);
        this.enemies = new MatterEnemies(this, this.runtime.library, this.runtime.world.player, this.level.enemies,
            enemy => this.hitEnemy(enemy), this.level.groundY);
        this.mechanisms = createBridgeMechanisms(this, this.runtime.library, this.runtime.world, this.level.mechanisms ?? []);
        for (const item of this.level.fruits) this.createItem(item);
        this.keySprite = this.add.image(this.level.key.x, this.level.key.y, 'key').setScale(.75).setDepth(10).setVisible(false);
        this.door = createMosque(this, this.level.exit.x, this.level.theme, this.level.mosqueStyle);
        this.sensor(this.level.exit.x, this.level.exit.y, 70, 100, () => this.reachExit());
        const contact = (event: {pairs: MatterContact[]}) => {
            for (const pair of event.pairs) {
                const a = pair.bodyA.parent, b = pair.bodyB.parent;
                const other = a === this.runtime.world.player ? b : b === this.runtime.world.player ? a : undefined;
                const action = other && (this.sensors.get(other) ?? this.enemies.actionFor(other));
                if (action) this.pending.add(action);
            }
        };
        this.matter.world.on('collisionstart', contact);
        this.matter.world.on('collisionactive', contact);
        this.cameras.main.setBounds(0, 0, this.level.width, 600).startFollow(this.player, false, 1, .12);
        createHud(this); this.centerHud();
        this.scale.on('resize', this.centerHud, this);
        bindSceneButtons(this);
        this.updateHud();
        this.events.once('shutdown', () => {
            this.runtime.destroy();
            this.scale.off('resize', this.centerHud, this);
            clearSceneButtons();
        });
        finishLoading(this);
    }
    private sensor(x: number, y: number, width: number, height: number, action: () => void) {
        const body = this.runtime.library.Bodies.rectangle(x, y, width, height, {isStatic: true, isSensor: true});
        this.matter.world.add(body);
        this.sensors.set(body, action);
        return body;
    }
    private removeSensor(body: MatterJS.BodyType) {
        this.sensors.delete(body);
        this.matter.world.remove(body);
    }
    private createItem(item: Collectible) {
        const sprite = this.add.image(item.x, item.y, item.type).setScale(.75).setDepth(10);
        const body = this.sensor(item.x, item.y, 32, 36, () => {
            if (this.paused || this.lost || this.gameState.complete || !recordFruit(this.gameState, item.id, item.type)) return;
            animateCollection(this, sprite, () => this.removeSensor(body));
            this.sound.play('collect', {volume: .2});
            if (isKeyReady(this.gameState) && !this.keySprite.visible && !this.gameState.hasKey) this.enableKey();
            this.updateHud();
        });
        this.tweens.add({targets: sprite, y: item.y - 5, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'});
    }
    private enableKey() {
        this.keySprite.setVisible(true);
        const key = this.level.key;
        const body = this.sensor(key.x, key.y, 42, 36, () => {
            if (!takeKey(this.gameState)) return;
            animateCollection(this, this.keySprite, () => this.removeSensor(body));
            this.door.open();
            this.sound.play('key', {volume: .22});
            this.updateHud();
        });
    }
    private reachExit() {
        if (this.paused || this.lost || !finishLevel(this.gameState)) return;
        // Pilot bitirmek gerçek kullanıcının açılmış bölüm kaydını değiştirmez.
        if (!this.level.draft) unlockWorldNext(worldForLevel(this.levelIndex)!, this.levelIndex, LEVEL_SLOT_COUNT);
        this.runtime.setPaused(true);
        this.runtime.library.Body.setVelocity(this.runtime.world.player, {x: 0, y: 0});
        this.player.anims.stop();
        this.player.setTexture(`${characterPrefix('happy', this.characterSkin)}0`);
        const glow = this.add.circle(this.level.exit.x, 455, 70, 0xffe49d, .1).setDepth(12);
        this.tweens.add({targets: glow, alpha: .75, scale: 1.3, duration: 350, yoyo: true, repeat: 2});
        this.sound.play('key', {volume: .22});
        element('touch-controls').hidden = true;
        this.time.delayedCall(1200, () => {
            this.resultShown = true;
            showCompletion(this.levelIndex);
            this.sound.play('level-complete', {volume: .22});
        });
    }
    private hitEnemy(enemy: MatterEnemyActor) {
        if (this.paused || this.lost || this.gameState.complete || this.elapsed < this.hurtUntil) return;
        this.hurtUntil = this.elapsed + 2000;
        this.gameState.hearts--;
        this.sound.play('hurt', {volume: .18});
        const body = this.runtime.world.player;
        this.runtime.library.Body.setVelocity(body, {x: body.position.x < enemy.body.position.x ? -2.5 : 2.5, y: -3});
        this.tweens.add({targets: this.player, alpha: .3, duration: 100, yoyo: true, repeat: 8,
            onComplete: () => this.player.setAlpha(1)});
        this.updateHud();
        if (this.gameState.hearts <= 0) this.loseAttempt();
    }
    private loseAttempt() {
        if (this.lost) return;
        this.lost = true;
        this.gameState.hearts = 0;
        this.runtime.setPaused(true);
        this.player.setTexture(`${characterPrefix('sad', this.characterSkin)}0`);
        element('touch-controls').hidden = true;
        element('fall-result').hidden = false;
        element('retry-fall').focus({preventScroll: true});
        this.updateHud();
    }
    update(time: number, delta: number) {
        if (!this.runtime) return;
        const keys = this.runtime.keys;
        if (Phaser.Input.Keyboard.JustDown(keys.R)) { this.restart(); return; }
        if (Phaser.Input.Keyboard.JustDown(keys.ESC)) element('settings-button').click();
        if (this.gameState.complete) {
            if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) this.continueAfterResult();
            return;
        }
        if (this.paused || this.lost) return;
        this.elapsed += Math.min(delta, 100);
        this.enemies.update(this.elapsed);
        this.mechanisms.update(Math.min(delta, 100));
        this.runtime.update(time, delta);
        // Oyun kurallarını fizik çözümleyicisinin ortasında çalıştırma.
        for (const action of this.pending) action();
        this.pending.clear();
        if (this.runtime.world.player.position.y > 640) {
            this.sound.play('hurt', {volume: .23});
            this.loseAttempt();
        }
    }
    togglePause() {
        if (this.gameState.complete || this.lost) return;
        this.paused = !this.paused;
        this.runtime.setPaused(this.paused);
        this.tweens[this.paused ? 'pauseAll' : 'resumeAll']();
        this.time.paused = this.paused;
    }
    restart(fromBeginning = false) {
        this.time.paused = false; this.tweens.resumeAll(); this.runtime.setPaused(false);
        restartOrChangeLevel(this, {levelIndex: fromBeginning ? 0 : this.levelIndex, score: fromBeginning ? 0 : this.carriedScore});
    }
    retryFall() { if (this.lost) this.restart(); }
    continueAfterResult() {
        if (!this.gameState.complete || !this.resultShown) return;
        this.resultShown = false;
        const next = this.levelIndex + 1;
        if (this.level.draft || !isPlayableLevel(next)) { element('menu-button').click(); return; }
        if (worldForLevel(next)!.id !== worldForLevel(this.levelIndex)!.id) {
            this.game.events.emit('world-complete', next); return;
        }
        restartOrChangeLevel(this, {levelIndex: next, score: this.gameState.score});
    }
    centerHud() {
        centerHud(this);
        // Yüksek sandık kuleleri telefonda üst kenarın dışında kalmasın.
        this.cameras.main.setDeadzone(this.scale.width * .3, this.scale.height * .3);
    }
    updateHud() { updateHud(this); }
}
