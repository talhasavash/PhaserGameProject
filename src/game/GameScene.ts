// Phaser sahnesidir; bölümü kurar, oyun döngüsünü ve toplama, çarpışma, kazanma akışını yönetir.

import { levels, worldForLevel, chapterNumber, LEVEL_SLOT_COUNT, isPlayableLevel } from '../world/levels/level.js';
import { createGameState, isKeyReady, recordFruit, takeKey, finishLevel, healAtFountain } from './rules.js';
import { createPlayer, movePlayer, resetPlayerMovement, showPlayerExpression, showRecovery, updatePlayerEffects } from '../actors/player/PlayerController.js';
import { bindTouchControls } from '../actors/player/TouchControls.js';
import { unlockNext } from '../data/progress.js';
import { isIcySurface } from '../world/terrain/terrain.js';
import { createHud, centerHud, updateHud } from '../ui/hud.js';
import { loadGameAssets } from '../data/assets.js';
import { prepareScenePage, bindSceneButtons, clearSceneButtons, showCompletion, showLoading, updateLoading, hideLoading, finishLoading } from '../ui/scenePage.js';
import { createFeedback, animateCollection, updateIceSparks } from '../effects/GameEffects.js';
import { touchFrozenItem } from '../world/objects/LevelObjects.js';
import { backgroundMusic } from '../audio/music.js';
import { selectCharacterSkin } from '../data/characters.js';
import { emitLevelEvent, preloadScenarios } from './LevelScenarios.js';
import { element } from '../ui/dom.js';
import type { PlayerSprite } from '../actors/player/PlayerController.js';
import type { Point, LevelDefinition } from '../world/model/contracts.js';
import { LevelRuntime, resetLevelEnemies } from './LevelRuntime.js';
import {GAME_SCENE_KEY, restartOrChangeLevel} from './sceneRouting.js';
import type {ActiveGameScene} from './sceneRouting.js';

export {GAME_SCENE_KEY} from './sceneRouting.js';
const ITEM_MESSAGES = {
    bead: 'Tesbih taneleri buldun! +10 puan.',
    mat: 'Bir seccade buldun! +20 puan.',
    lantern: 'Bir kandil buldun! +20 puan.',
    crescent: 'Hilal ve yıldız buldun! +20 puan.'
};

export class GameScene extends Phaser.Scene implements ActiveGameScene {
    declare runtime: LevelRuntime;
    declare character: string;
    declare characterSkin: string;
    declare soundMuted: boolean;
    declare levelIndex: number;
    declare carriedScore: number;
    declare level: LevelDefinition;
    declare gameState: ReturnType<typeof createGameState>;
    declare player: PlayerSprite;
    declare elapsed: number;
    declare hurtUntil: number;
    declare knockbackUntil: number;
    declare lastGateHint: number;
    declare paused: boolean;
    declare resultShown: boolean;
    declare lost: boolean;
    declare falling: boolean;
    declare touchControls: ReturnType<typeof bindTouchControls>;
    declare pauseKey: Phaser.Input.Keyboard.Key;
    declare solids: Phaser.Physics.Arcade.StaticGroup;
    declare fruits: Phaser.Physics.Arcade.StaticGroup;
    declare fountains: Phaser.Physics.Arcade.StaticGroup;
    declare hazards: Phaser.Physics.Arcade.Group;
    declare columns: Phaser.Physics.Arcade.Group;
    declare fireballs: Phaser.Physics.Arcade.Group;
    declare enemyProjectiles: Phaser.Physics.Arcade.Group;
    declare guardianFlames: Phaser.Physics.Arcade.Group;
    declare keySprite: Phaser.Physics.Arcade.Image;
    declare exitZone: Phaser.GameObjects.Zone;
    declare door: { open(): void };
    declare checkpointFlag: Phaser.GameObjects.Triangle;
    declare beltMarks: Phaser.GameObjects.Text[];
    // Oyun sahnemiz: Phaser bir oyun ekranını "Scene" olarak yönetir.
    // "this", bu oyun ekranını temsil eder. Fizik ve kamera ona aittir.
    constructor(character = 'boy', levelIndex = 0) {
        super(GAME_SCENE_KEY);
        this.character = character;
        this.soundMuted = false;
        this.levelIndex = levelIndex;
        this.carriedScore = 0;
        this.level = levels[levelIndex];
    }

    // Phaser, restart ile gönderilen bölüm bilgisini önce init'e verir.
    init(data: { levelIndex?: number; score?: number } = {}) {
        if (data.levelIndex !== undefined) this.levelIndex = data.levelIndex;
        if (data.score !== undefined) this.carriedScore = data.score;
        this.level = levels[this.levelIndex];
        const world = worldForLevel(this.levelIndex);

        this.characterSkin = selectCharacterSkin(this.level, world, this.character);
    }

    // Phaser önce preload'u çağırır: görselleri hazırla.
    preload() {
        backgroundMusic.setTrack(worldForLevel(this.levelIndex)!.music);
        showLoading();
        this.load.on('progress', updateLoading);
        loadGameAssets(this, this.characterSkin, this.level);
        preloadScenarios(this);
    }

    // Görseller yüklenince Phaser create'i bir kez çağırır: bölümü kur.
    create() {
        this.resetLevelState();
        prepareScenePage();
        // Önce dünya ve temas bölgeleri kurulur.
        this.physics.world.setBounds(0, 0, this.level.width, 600);
        this.runtime = new LevelRuntime(this);
        this.runtime.build();
        // Ardından karakter, kontroller ve çarpışma bağlantıları hazırlanır.
        this.player = createPlayer(this, this.level.spawn.x, this.level.spawn.y, this.characterSkin);
        createFeedback(this);
        this.player.onJump = () => this.sound.play('jump', { volume: 0.20 });
        this.touchControls = bindTouchControls();
        this.player.touchKeys = this.touchControls.keys;
        this.bindCollisions();
        // Son olarak kamera, puan çubuğu ve sayfa düğmeleri bağlanır.
        this.cameras.main.setBounds(0, 0, this.level.width, 600);
        this.cameras.main.startFollow(this.player, true, 0.09, 0, -190, 0);
        createHud(this);
        this.centerHud();
        this.scale.on(Phaser.Scale.Events.RESIZE, this.centerHud, this);
        this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        bindSceneButtons(this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdownScene, this);
        this.announce(`Dünya ${worldForLevel(this.levelIndex)!.id} · ${chapterNumber(this.levelIndex)}. bölüm: ${this.level.name}. Üç yıldızı bul, anahtarı al ve ${this.level.exitLabel || 'camiye'} ulaş.`);
        this.updateHud();
        this.runtime.start();
        finishLoading(this);
    }

    resetLevelState() {
        this.gameState = createGameState(this.carriedScore);
        this.elapsed = 0;
        this.hurtUntil = 0;
        this.knockbackUntil = 0;
        this.paused = false;
        this.resultShown = false;
        this.lost = false;
        this.falling = false;
        this.lastGateHint = -Infinity;
    }

    bindCollisions() {
        // collider: karakter platformun içinden geçmesin.
        // overlap: temas olunca belirtilen fonksiyonu çalıştır (örneğin meyve topla).
        this.physics.add.collider(this.player, this.solids);
        this.physics.add.overlap(this.player, this.fruits, this.collectFruit, undefined, this);
        this.physics.add.overlap(this.player, this.hazards, this.hitHazard, undefined, this);
        this.physics.add.overlap(this.player, this.fireballs, this.hitHazard, undefined, this);
        this.physics.add.overlap(this.player, this.enemyProjectiles, this.hitHazard, undefined, this);
        this.physics.add.overlap(this.player, this.guardianFlames, this.hitHazard, undefined, this);
        this.physics.add.overlap(this.player, this.keySprite, this.collectKey, undefined, this);
        this.physics.add.overlap(this.player, this.exitZone, this.reachExit, undefined, this);
        this.physics.add.overlap(this.player, this.fountains, this.useFountain, undefined, this);
        // Kolon bir tehlike olduğu kadar katı engeldir: zıplarken de içinden geçilmez.
        this.physics.add.collider(this.player, this.columns, this.hitHazard, undefined, this);
        this.physics.add.overlap(this.player, this.columns, this.hitHazard, undefined, this);
    }

    shutdownScene() {
        this.runtime.destroy();
        this.load.off('progress', updateLoading);
        this.game.events.off('postrender', hideLoading);
        // Bölüm değişimi ve ana menüye dönüş aynı temizliği kullanır.
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this);
        this.events.off(Phaser.Scenes.Events.DESTROY, this.shutdownScene, this);
        this.scale.off(Phaser.Scale.Events.RESIZE, this.centerHud, this);
        this.touchControls.destroy();
        clearSceneButtons();
    }

    useFountain(player, zone) {
        if (!healAtFountain(this.gameState, zone.getData('id'))) return;
        this.sound.play('heal', { volume: 0.20 });
        showRecovery(player, this.elapsed);
        zone.getData('water').setFillStyle(0xd9efda);
        this.announce('Abdest alanında dinlendin. Bir canın yenilendi!');
        this.updateHud();
    }

    centerHud() {
        centerHud(this);
    }

    updateHud() {
        updateHud(this);
    }

    announce(message: string) {
        // Ekranda kutu açma; ekran okuyucu için durum bilgisini koru.
        element('game-status').textContent = message;
    }

    // Phaser, karakter meyveye değdiğinde bu fonksiyonu çağırır.
    collectFruit(player, fruit) {
        if (touchFrozenItem(this, fruit)) return;
        const item = fruit.getData('item');
        if (!recordFruit(this.gameState, item.id, item.type)) return;
        emitLevelEvent(this, 'collect', item);
        this.sound.play('collect', { volume: 0.18 });
        animateCollection(this, fruit);
        if (item.type === 'star') {
            this.announce(`${this.gameState.stars} / 3 yıldız! ${isKeyReady(this.gameState) ? 'Anahtar ileride seni bekliyor.' : 'Yıldızları aramaya devam et.'}`);
        }
        if (ITEM_MESSAGES[item.type]) this.announce(ITEM_MESSAGES[item.type]);
        if (isKeyReady(this.gameState) && !this.gameState.hasKey && !this.keySprite.active) {
            this.keySprite.enableBody(false, this.level.key.x, this.level.key.y, true, true);
        }
        this.updateHud();
    }

    collectKey() {
        if (touchFrozenItem(this, this.keySprite)) return;
        if (!takeKey(this.gameState)) return;
        emitLevelEvent(this, 'key');
        this.sound.play('key', { volume: 0.20 });
        animateCollection(this, this.keySprite);
        this.door.open();
        this.announce(`Anahtar sende! Şimdi ${this.level.exitLabel || 'cami girişine'} ulaş.`);
        this.updateHud();
    }

    // Tehlikeye temas: can azalt, kısa süre koru, gerekirse geri döndür.
    hitHazard(player, hazard) {
        if (this.paused || this.lost || this.gameState.complete || this.elapsed < this.hurtUntil) return;
        this.gameState.hearts -= 1;
        emitLevelEvent(this, 'hurt', { hazard, hearts: this.gameState.hearts });
        this.sound.play('hurt', { volume: 0.23 });
        this.cameras.main.shake(110, 0.002);
        if (this.gameState.hearts === 0) {
            this.respawn();
            return;
        }
        this.hurtUntil = this.elapsed + 1700;
        showPlayerExpression(player, 'sad', this.elapsed, 1500);
        player.recoveryUntil = 0; // Yeni çarpma, önceki sevinç efektini bitirsin.
        this.knockbackUntil = this.elapsed + 260;
        player.setVelocity(player.x < hazard.x ? -210 : 210, -230);
        this.announce(hazard.getData?.('column')
            ? 'Kolonun yükselmesini bekle, altından yürüyerek geç. Kısa süre korunuyorsun.'
            : 'Biraz mesafe bırak ve zıpla. Kısa süre korunuyorsun.');
        this.updateHud();
    }

    crushPlayer(bottom) {
        if (this.lost || this.paused || this.gameState.complete || this.falling) return;
        this.lost = true;
        emitLevelEvent(this, 'crushed');
        this.touchControls.reset();
        this.physics.pause();
        this.player.setVelocity(0, 0).setAlpha(1);
        showPlayerExpression(this.player, 'sad', this.elapsed, 1500);
        this.player.recoveryGlow.setVisible(false);
        this.player.recoveryStars.forEach(star => star.setVisible(false));
        this.sound.play('hurt', { volume: 0.23 });
        this.cameras.main.shake(160, 0.004);
        // Fizik durur, Phaser Tween çocuğu temas noktasında zararsız bir çizgi film gibi yassılaştırır.
        this.tweens.add({ targets: this.player, scaleX: 1.1, scaleY: 0.12,
            y: Math.min(this.level.groundY, bottom) - 5, duration: 160, ease: 'Quad.easeOut' });
        this.time.delayedCall(950, () => this.restart());
    }

    respawn(point: Point | null = null) {
        resetLevelEnemies(this);
        if (!point) point = this.gameState.checkpointActive ? this.level.checkpoint : this.level.spawn;
        this.gameState.hearts = 3;
        this.player.setPosition(point.x, point.y);
        this.player.body.reset(point.x, point.y);
        resetPlayerMovement(this.player);
        showPlayerExpression(this.player, 'sad', this.elapsed, 1500);
        this.hurtUntil = this.elapsed + 2200;
        this.knockbackUntil = this.elapsed + 150;
        this.cameras.main.flash(160, 255, 249, 224);
        this.announce('Yeniden deneyelim! Topladıkların sende kaldı.');
        this.updateHud();
        emitLevelEvent(this, 'respawn', point);
    }

    reachExit() {
        if (finishLevel(this.gameState)) {
            emitLevelEvent(this, 'complete');
            unlockNext(this.levelIndex, LEVEL_SLOT_COUNT);
            this.touchControls.reset();
            this.player.setVelocity(0, 0);
            this.player.setAlpha(1);
            this.physics.pause();
            showRecovery(this.player, this.elapsed);
            this.sound.play('key', { volume: 0.22 });
            element('touch-controls').hidden = true;
            // Önce camide kazanma parlamasını göster, sonra aynı sonuç kartını aç.
            this.time.delayedCall(1200, () => this.showLevelResult());
            this.updateHud();
        } else if (!this.gameState.complete && this.elapsed - this.lastGateHint > 4000) {
            this.lastGateHint = this.elapsed;
            this.announce(isKeyReady(this.gameState) ? 'Kapı için önce ilerideki altın anahtarı al.' : 'Kapı için üç yıldızı tamamla.');
        }
    }

    showLevelResult() {
        if (this.resultShown) return;
        this.resultShown = true;
        this.tweens.pauseAll();
        const title = showCompletion(this.levelIndex);
        this.sound.play('level-complete', { volume: 0.22 });
        this.announce(title);
    }

    continueAfterResult() {
        if (!this.gameState.complete || !this.resultShown) return;
        this.resultShown = false;
        const nextWorld = worldForLevel(this.levelIndex + 1);
        if (nextWorld && nextWorld.id !== worldForLevel(this.levelIndex)!.id) {
            this.game.events.emit('world-complete', nextWorld.start);
            return;
        }
        if (!isPlayableLevel(this.levelIndex + 1)) {
            element('menu-button').click();
            return;
        }
        this.tweens.resumeAll();
        this.physics.resume();
        restartOrChangeLevel(this, { levelIndex: this.levelIndex + 1, score: this.gameState.score });
    }

    togglePause() {
        if (this.gameState.complete || this.lost) return;
        this.touchControls.reset();
        this.paused = !this.paused;
        if (this.paused) {
            this.physics.pause(); this.tweens.pauseAll(); this.time.paused = true;
        } else {
            this.physics.resume(); this.tweens.resumeAll(); this.time.paused = false;
        }
    }

    restart(fromBeginning = false) {
        this.time.paused = false;
        this.tweens.resumeAll();
        this.physics.resume();
        this.scene.restart({
            levelIndex: fromBeginning ? 0 : this.levelIndex,
            score: fromBeginning ? 0 : this.carriedScore
        });
    }

    // Phaser update'i her karede çağırır: girişleri ve hareketleri güncelle.
    // Çarpışma hesaplarını ve ekrana çizimi Phaser kendisi yapar.
    update(time: number, delta: number) {
        if (!this.player) return;
        if (Phaser.Input.Keyboard.JustDown(this.player.keys.R)) {
            this.restart();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) element('settings-button').click();
        if (this.gameState.complete) {
            this.elapsed += delta;
            updatePlayerEffects(this.player, this.elapsed);
            if (Phaser.Input.Keyboard.JustDown(this.player.keys.ENTER)) this.continueAfterResult();
            return;
        }
        if (this.lost || this.paused) return;
        this.elapsed += delta;
        this.runtime.update(delta);
    }

    updatePlayer(delta: number) {
        const onGround = this.player.body.bottom >= this.level.groundY - 3;
        const belt = (this.level.belts || [this.level.belt]).find(strip =>
            onGround && this.player.x >= strip.x && this.player.x <= strip.x + strip.width);
        const conveyorSpeed = belt ? belt.speed : 0;
        const onIce = isIcySurface(this.level, this.player);
        updateIceSparks(this, onIce);
        if (this.elapsed > this.knockbackUntil && !this.falling) {
            movePlayer(this.player, this.elapsed, delta, conveyorSpeed, onIce ? 0.14 : 1);
        }
        const recovering = this.elapsed < this.player.recoveryUntil;
        const protectedFromDamage = this.elapsed < this.hurtUntil;
        if (protectedFromDamage && !recovering) {
            this.player.setAlpha(Math.floor(this.elapsed / 95) % 2 ? 0.45 : 1);
        } else {
            this.player.setAlpha(1);
        }
        updatePlayerEffects(this.player, this.elapsed);
    }

    updateCamera(delta: number) {
        // Yüksek basamaklarda karakteri görünürde tut; yerdeyken kamera sabit kalsın.
        const camera = this.cameras.main;
        let top = Phaser.Math.Clamp(camera.scrollY, this.player.y - this.scale.height + 80, this.player.y - 80);
        top = Phaser.Math.Clamp(top, 0, Math.max(0, 600 - this.scale.height));
        camera.scrollY = Phaser.Math.Linear(camera.scrollY, top, Math.min(delta / 100, 1));
    }

    updateConveyor(delta: number) {
        for (const mark of this.beltMarks) {
            const { x, width, speed } = mark.getData('belt');
            mark.x = Phaser.Math.Wrap(mark.x + Math.sign(speed) * 35 * delta / 1000, x, x + width);
        }
    }

    updateCheckpoint() {
        if (!this.gameState.checkpointActive && this.player.x > this.level.checkpoint.x - 18) {
            this.gameState.checkpointActive = true;
            emitLevelEvent(this, 'checkpoint');
            this.checkpointFlag.setFillStyle(0x55977b);
            if (this.gameState.hearts < 3) {
                showRecovery(this.player, this.elapsed);
                this.sound.play('heal', { volume: 0.20 });
            }
            this.gameState.hearts = 3;
            this.announce('Kontrol noktası! Canların doldu. Buradan devam edebilirsin.');
            this.updateHud();
        }
    }

    checkPits() {
        const gaps = this.level.gaps || [];
        if (!this.falling && this.player.body.bottom > 534 && gaps.some(gap => this.player.x > gap.x && this.player.x < gap.x + gap.width)) {
            this.falling = true;
            showPlayerExpression(this.player, 'sad', this.elapsed, 5000);
            this.player.setVelocityX(0);
            this.touchControls.reset();
        }
        if (this.falling && this.player.y > 565) {
            this.lost = true;
            emitLevelEvent(this, 'fall');
            this.physics.pause();
            this.gameState.hearts = 0;
            this.sound.play('hurt', { volume: 0.23 });
            element('touch-controls').hidden = true;
            element('fall-result').hidden = false;
            element('retry-fall').focus({ preventScroll: true });
            this.updateHud();
        }
    }

    retryFall() {
        if (!this.lost) return;
        this.restart();
    }
}
