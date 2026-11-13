import { levels } from './level.js';
import { createGameState, isKeyReady, recordFruit, takeKey, finishLevel, healAtFountain, FRUIT_TYPES } from './rules.js';
import { createPlayer, movePlayer, resetPlayerMovement, showPlayerExpression, showRecovery, updatePlayerEffects } from './player.js';
import { createScenery, createMosque, createFountain } from './background.js';
import { bindTouchControls } from './controls.js';
import { createFireRain, updateFireRain } from './fireRain.js';
import { unlockNext } from './progress.js';
import { verses } from './verses.js';
import { bossStep, bossMood, resetBossRage } from './boss.js';

const textStyle = { fontFamily: 'Trebuchet MS, sans-serif', color: '#294e4c' };
const COLLECTIBLE_SCALE = 0.75;
const ENEMY_SCALE = 0.8;
const HUD_PROGRESS_WIDTH = 96;

export class GameScene extends Phaser.Scene {
    // Tek sınıfımız bu: Phaser bir oyun ekranını "Scene" olarak yönetir.
    // "this", bu oyun ekranını temsil eder. Fizik ve kamera ona aittir.
    constructor(character = 'boy', levelIndex = 0) {
        super('Garden');
        this.character = character;
        this.soundMuted = false;
        this.levelIndex = levelIndex;
        this.carriedScore = 0;
        this.level = levels[levelIndex];
    }

    // Phaser, restart ile gönderilen bölüm bilgisini önce init'e verir.
    init(data = {}) {
        if (data.levelIndex !== undefined) this.levelIndex = data.levelIndex;
        if (data.score !== undefined) this.carriedScore = data.score;
        this.level = levels[this.levelIndex];
    }

    // Phaser önce preload'u çağırır: görselleri hazırla.
    preload() {
        let base = 'child';
        if (this.character === 'girl') base = 'girl';
        for (const expression of ['normal', 'sad', 'happy']) {
            let prefix = `${base}-`;
            if (expression !== 'normal') prefix = `${base}-${expression}-`;
            for (let frame = 0; frame < 6; frame++) {
                this.load.svg(`${prefix}${frame}`, `assets/images/${prefix}${frame}.svg`, { width: 64, height: 80 });
            }
        }
        for (const fruit of FRUIT_TYPES) {
            this.load.svg(fruit, `assets/images/${fruit}.svg`, { width: 40, height: 44 });
        }
        this.load.svg('star', 'assets/images/star.svg', { width: 44, height: 44 });
        this.load.svg('berry', 'assets/images/berry.svg', { width: 32, height: 36 });
        this.load.svg('hedgehog', 'assets/images/hedgehog.svg', { width: 76, height: 52 });
        this.load.svg('snail', 'assets/images/snail.svg', { width: 76, height: 52 });
        this.load.svg('ball', 'assets/images/ball.svg', { width: 52, height: 52 });
        this.load.svg('wheel', 'assets/images/wheel.svg', { width: 52, height: 52 });
        this.load.svg('ogre', 'assets/images/ogre.svg', { width: 96, height: 100 });
        for (const variant of ['moss', 'stone', 'ember', 'ember-angry']) {
            this.load.svg(`ogre-${variant}`, `assets/images/ogre-${variant}.svg`, { width: 96, height: 100 });
        }
        this.load.svg('allah-plaque', 'assets/images/allah-plaque.svg', { width: 96, height: 76 });
        for (const animal of ['bee', 'fox', 'penguin', 'frog', 'turtle', 'bat', 'bird', 'spider']) {
            this.load.svg(animal, `assets/images/${animal}.svg`, { width: 76, height: 52 });
        }
        this.load.svg('key', 'assets/images/key.svg', { width: 64, height: 40 });
        this.load.svg('bead', 'assets/images/bead.svg', { width: 40, height: 44 });
        this.load.svg('mat', 'assets/images/mat.svg', { width: 36, height: 52 });
        this.load.svg('lantern', 'assets/images/lantern.svg', { width: 40, height: 52 });
        this.load.svg('crescent', 'assets/images/crescent.svg', { width: 44, height: 46 });
        for (const effect of ['jump', 'collect', 'hurt', 'heal', 'key', 'boss-jump', 'boss-land']) {
            this.load.audio(effect, `assets/audio/${effect}.wav`);
        }
    }

    // Görseller yüklenince Phaser create'i bir kez çağırır: bölümü kur.
    create() {
        this.gameState = createGameState(this.carriedScore);
        this.elapsed = 0;
        this.hurtUntil = 0;
        this.knockbackUntil = 0;
        this.paused = false;
        this.resultShown = false;
        this.lost = false;
        this.falling = false;
        document.getElementById('settings-panel').hidden = true;
        document.getElementById('settings-button').setAttribute('aria-expanded', 'false');
        document.getElementById('settings-button').setAttribute('aria-label', 'Oyun menüsünü aç');
        document.getElementById('fall-result').hidden = true;
        document.getElementById('touch-controls').hidden = false;
        this.lastGateHint = -Infinity;
        this.physics.world.setBounds(0, 0, this.level.width, 600);
        createScenery(this, this.level.width, this.level.theme);
        this.createTerrain();
        this.createCollectibles();
        this.createHazards();
        createFireRain(this);
        this.createLandmarks();
        this.createHealingSpots();
        this.player = createPlayer(this, this.level.spawn.x, this.level.spawn.y, this.character);
        this.player.onJump = () => this.sound.play('jump', { volume: 0.20 });
        this.touchControls = bindTouchControls();
        this.player.touchKeys = this.touchControls.keys;
        // collider: karakter platformun içinden geçmesin.
        // overlap: temas olunca belirtilen fonksiyonu çalıştır (örneğin meyve topla).
        this.physics.add.collider(this.player, this.solids);
        this.physics.add.overlap(this.player, this.fruits, this.collectFruit, null, this);
        this.physics.add.overlap(this.player, this.hazards, this.hitHazard, null, this);
        this.physics.add.overlap(this.player, this.fireballs, this.hitHazard, null, this);
        this.physics.add.overlap(this.player, this.keySprite, this.collectKey, null, this);
        this.physics.add.overlap(this.player, this.exitZone, this.reachExit, null, this);
        this.physics.add.overlap(this.player, this.fountains, this.useFountain, null, this);
        this.cameras.main.setBounds(0, 0, this.level.width, 600);
        this.cameras.main.startFollow(this.player, true, 0.09, 0, -190, 0);
        this.createHud();
        this.centerHud();
        this.scale.on('resize', this.centerHud, this);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.bindPageControls();
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.centerHud, this);
            this.touchControls.destroy();
            document.getElementById('pause-button').onclick = null;
            document.getElementById('restart-button').onclick = null;
            document.getElementById('play-again').onclick = null;
            document.getElementById('next-level').onclick = null;
            document.getElementById('retry-fall').onclick = null;
            document.getElementById('sound-button').onclick = null;
        });
        this.announce(`${this.levelIndex + 1}. bölüm: ${this.level.name}. Üç yıldızı bul, anahtarı al ve camiye ulaş.`);
        this.updateHud();
    }

    // Zemini ve platformları sabit fizik gövdeleriyle oluştur.
    createTerrain() {
        this.solids = this.physics.add.staticGroup();
        // Çukurlarda fizik zemini yoktur; yalnızca arka planı kapatan boşluk çizilir.
        let start = 0;
        for (const gap of [...(this.level.gaps || []), { x: this.level.width, width: 0 }]) {
            const width = gap.x - start;
            if (width > 0) this.solids.add(this.add.rectangle(start + width / 2, 570, width, 100).setVisible(false));
            if (gap.width > 0) {
                const water = this.level.theme === 'river';
                this.add.rectangle(gap.x + gap.width / 2, 560, gap.width, 86, water ? 0x397b91 : 0x263342).setDepth(3);
                this.add.rectangle(gap.x + gap.width / 2, 528, gap.width - 6, 5, water ? 0x82ccd1 : 0x465167).setDepth(4);
                for (const side of [gap.x - 4, gap.x + gap.width + 4]) this.add.rectangle(side, 560, 8, 80, 0x816e62).setDepth(4);
            }
            start = gap.x + gap.width;
        }
        for (const passage of this.level.passages || []) {
            const roof = this.add.rectangle(passage.x + passage.width / 2, passage.y + 12, passage.width, 24, this.level.theme === 'interior' ? 0xb79a79 : 0x8f817b).setDepth(5);
            this.solids.add(roof);
            this.add.rectangle(passage.x + passage.width / 2, passage.y, passage.width, 5, 0xd8c59f).setDepth(6);
        }
        for (const ice of this.level.ice || []) {
            this.add.rectangle(ice.x + ice.width / 2, 522, ice.width, 10, 0xbcecf0, 0.95).setDepth(7);
            for (let x = ice.x + 15; x < ice.x + ice.width; x += 55) {
                this.add.line(x, 520, 0, 0, 24, -3, 0xffffff, 0.85).setDepth(8);
            }
        }
        for (const platform of this.level.platforms) {
            const { x, y, width } = platform;
            const ground = this.add.rectangle(x + width / 2, y + 14, width, 28, 0x9c7653).setDepth(5);
            this.solids.add(ground);
            this.add.rectangle(x + width / 2, y + 2, width + 4, 8, 0x5d9d5e).setDepth(6);
            this.add.rectangle(x + width / 2, y + 29, width - 12, 5, 0x765a46, 0.35).setDepth(4);
            for (let xx = x + 16; xx < x + width; xx += 34) {
                this.add.rectangle(xx, y + 17, 12, 4, 0xb9956a).setDepth(6);
            }
        }
        const belt = this.level.belt;
        this.add.rectangle(belt.x + belt.width / 2, 524, belt.width, 17, 0x466b72).setDepth(7);
        this.beltMarks = [];
        for (let i = 0; i < 10; i++) {
            this.beltMarks.push(this.add.text(belt.x + i * 22, 508, '‹', { ...textStyle, color: '#d2e7c8', fontSize: '23px' }).setDepth(8));
        }
    }

    // level.js içindeki meyve konumlarını kullan; anahtarı başlangıçta gizle.
    createCollectibles() {
        this.fruits = this.physics.add.staticGroup();
        for (const fruit of this.level.fruits) {
            const sprite = this.fruits.create(fruit.x, fruit.y, fruit.type).setDepth(10);
            sprite.setScale(COLLECTIBLE_SCALE).refreshBody();
            sprite.setData('item', fruit);
            // Görsel hafifçe süzülür; toplama kutusu yerinde kalır.
            this.tweens.add({ targets: sprite, y: fruit.y - 5, duration: 950, yoyo: true, repeat: -1, delay: fruit.x % 400, ease: 'Sine.easeInOut' });
        }
        this.keySprite = this.physics.add.staticImage(this.level.key.x, this.level.key.y, 'key').setDepth(10);
        this.keySprite.setScale(COLLECTIBLE_SCALE).refreshBody();
        this.keySprite.disableBody(true, true);
        this.add.ellipse(this.level.key.x, 514, 100, 12, 0x528b56).setDepth(2);
        this.add.rectangle(this.level.key.x, 506, 64, 18, 0xc8b78c).setDepth(3);
    }

    createHazards() {
        this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });
        for (const enemy of this.level.enemies) {
            this.createHazard(enemy);
        }
        if (this.level.ball) this.createHazard(this.level.ball);
        for (const hazard of this.level.extraHazards || []) this.createHazard(hazard);
    }

    createHazard(data) {
        // Küçülünce de ayaklar yerde kalsın. Kutuların alt kenarı zeminle aynı hizada.
        let y = this.level.groundY - 24 * ENEMY_SCALE;
        if (data.type === 'ball' || data.type === 'wheel') y = this.level.groundY - 22 * ENEMY_SCALE;
        if (data.y !== undefined) y = data.y;
        if (data.type === 'ogre') y = this.level.groundY - 44 * data.scale;
        const sprite = this.hazards.create(data.x, y, data.texture || data.type).setDepth(12);
        sprite.setScale(data.scale || ENEMY_SCALE);
        sprite.setData('patrol', {
            minX: data.minX,
            maxX: data.maxX,
            speed: data.speed,
            type: data.type,
            baseY: y,
            bob: data.bob || 0,
            grounded: data.y === undefined,
            jump: data.jump,
            jumpClock: 0,
            rage: data.rage || false,
            engagedAt: null,
            direction: 1
        });
        if (data.type === 'spider') {
            const thread = this.add.line(data.x, 0, 0, 250, 0, 480, 0x9b919f, 0.65).setOrigin(0).setDepth(8);
            sprite.setData('thread', thread);
        }
        if (data.type === 'ogre') {
            sprite.body.setSize(58, 66).setOffset(19, 28);
            sprite.setData('shadow', this.add.ellipse(data.x, 517, 76 * data.scale, 12, 0x332d4b, 0.23).setDepth(8));
        } else if (data.type === 'ball' || data.type === 'wheel') {
            sprite.body.setCircle(22, 4, 4);
        } else if (data.y !== undefined) {
            sprite.body.setSize(48, 26).setOffset(14, 16);
        } else {
            sprite.body.setSize(53, 27).setOffset(12, 23);
        }
    }

    createLandmarks() {
        const { x } = this.level.checkpoint;
        this.add.rectangle(x, 476, 6, 88, 0x6b6e52).setDepth(6);
        this.checkpointFlag = this.add.triangle(x + 4, 433, 0, 0, 48, 12, 0, 27, 0xe3c37d).setOrigin(0, 0).setDepth(7);
        const exit = this.level.exit;
        this.door = createMosque(this, exit.x, this.level.theme);
        this.exitZone = this.add.zone(exit.x, 480, 68, 80);
        this.physics.add.existing(this.exitZone, true);
    }

    createHealingSpots() {
        this.fountains = this.physics.add.staticGroup();
        for (const fountain of this.level.fountains) {
            const water = createFountain(this, fountain.x);
            const zone = this.add.zone(fountain.x, 480, 85, 80);
            zone.setData('id', fountain.id);
            zone.setData('water', water);
            this.fountains.add(zone);
        }
    }

    useFountain(player, zone) {
        if (!healAtFountain(this.gameState, zone.getData('id'))) return;
        this.sound.play('heal', { volume: 0.20 });
        showRecovery(player, this.elapsed);
        zone.getData('water').setFillStyle(0xd9efda);
        this.announce('Abdest alanında dinlendin. Bir canın yenilendi!');
        this.updateHud();
    }

    createHud() {
        this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
        // HUD: can ve puan gibi ekran bilgileri. ScrollFactor(0) ile kameradan bağımsız kalır.
        const bg = this.add.graphics().setScrollFactor(0).setDepth(100);
        bg.fillStyle(0xfffcf0, 0.83);
        bg.fillRoundedRect(0, 0, 600, 28, 8);
        bg.lineStyle(1, 0x94b7a0, 0.4);
        bg.strokeRoundedRect(0, 0, 600, 28, 8);
        const label = (x, y, content, size = 16) => {
            const text = this.add.text(x, y, content, { ...textStyle, fontSize: `${size}px`, fontStyle: 'bold' }).setScrollFactor(0).setDepth(101);
            this.hud.add(text);
            return text;
        };
        this.hud.add(bg);
        this.hud.add(this.add.circle(18, 14, 10, 0xedd59c).setScrollFactor(0).setDepth(101));
        label(18, 6, String(this.levelIndex + 1), 14).setOrigin(0.5, 0).setColor('#684b23');
        this.heartsText = label(42, 5, '', 16);
        this.hud.add(this.add.image(118, 14, 'star').setDisplaySize(15, 15).setScrollFactor(0).setDepth(101));
        this.starText = label(134, 6, '', 14);
        this.hud.add(this.add.image(230, 14, 'key').setDisplaySize(21, 13).setScrollFactor(0).setDepth(101));
        this.keyText = label(245, 6, '', 14);
        this.scoreText = label(390, 6, '', 14);
        this.progressTrack = this.add.rectangle(528, 14, HUD_PROGRESS_WIDTH, 3, 0xdce8d9).setScrollFactor(0).setDepth(101);
        this.progressFill = this.add.rectangle(480, 14, 1, 3, 0x649272).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);
        this.hud.add([this.progressTrack, this.progressFill]);
    }

    centerHud() {
        const hudScale = this.scale.width / 960;
        this.hud.setScale(hudScale);
        this.hud.setPosition((this.scale.width - 600 * hudScale) / 2, 6 * hudScale);
        // Zemini aynı yerde tut: zıplarken ekran yukarı-aşağı sallanmasın.
        this.cameras.main.scrollY = Math.max(0, 600 - this.scale.height);
        this.cameras.main.setFollowOffset(-Math.min(190, this.scale.width * 0.2), 0);
    }

    bindPageControls() {
        const result = document.getElementById('game-result');
        result.hidden = true;
        document.getElementById('pause-button').textContent = 'Devam et';
        document.getElementById('pause-button').setAttribute('aria-label', 'Devam et');
        document.getElementById('pause-button').disabled = false;
        document.getElementById('restart-button').disabled = false;
        document.getElementById('toolbar-status').textContent = `${this.level.name} seni bekliyor`;
        document.getElementById('pause-button').onclick = () => document.getElementById('settings-button').click();
        document.getElementById('restart-button').onclick = () => {
            document.getElementById('settings-button').click();
            this.restart();
        };
        document.getElementById('play-again').onclick = () => this.restart(true);
        document.getElementById('next-level').onclick = () => this.continueAfterResult();
        document.getElementById('retry-fall').onclick = () => this.retryFall();
        const soundButton = document.getElementById('sound-button');
        soundButton.disabled = false;
        this.sound.setMute(this.soundMuted);
        const updateSoundButton = () => {
            soundButton.textContent = this.soundMuted ? 'Ses: kapalı' : 'Ses: açık';
            soundButton.setAttribute('aria-label', this.soundMuted ? 'Sesi aç' : 'Sesi kapat');
            soundButton.setAttribute('aria-pressed', String(this.soundMuted));
        };
        updateSoundButton();
        soundButton.onclick = () => {
            this.soundMuted = !this.soundMuted;
            this.sound.setMute(this.soundMuted);
            updateSoundButton();
        };
    }

    updateHud() {
        this.heartsText.setText('♥'.repeat(this.gameState.hearts) + '♡'.repeat(3 - this.gameState.hearts));
        this.heartsText.setColor('#bd6959');
        this.starText.setText(`${this.gameState.stars}/3`);
        this.keyText.setText(this.gameState.hasKey ? '✓' : '—');
        this.scoreText.setText(`☆ ${this.gameState.score}`);
    }

    announce(message) {
        // Ekranda kutu açma; ekran okuyucu için durum bilgisini koru.
        document.getElementById('game-status').textContent = message;
    }

    // Phaser, karakter meyveye değdiğinde bu fonksiyonu çağırır.
    collectFruit(player, fruit) {
        const item = fruit.getData('item');
        if (!recordFruit(this.gameState, item.id, item.type)) return;
        this.sound.play('collect', { volume: 0.18 });
        fruit.disableBody(true, true);
        this.tweens.killTweensOf(fruit);
        if (item.type === 'star') {
            this.announce(`${this.gameState.stars} / 3 yıldız! ${isKeyReady(this.gameState) ? 'Anahtar ileride seni bekliyor.' : 'Yıldızları aramaya devam et.'}`);
        }
        if (item.type === 'bead') this.announce('Tesbih taneleri buldun! +10 puan.');
        if (item.type === 'mat') this.announce('Bir seccade buldun! +20 puan.');
        if (item.type === 'lantern') this.announce('Bir kandil buldun! +20 puan.');
        if (item.type === 'crescent') this.announce('Hilal ve yıldız buldun! +20 puan.');
        if (isKeyReady(this.gameState) && !this.gameState.hasKey && !this.keySprite.active) {
            this.keySprite.enableBody(false, this.level.key.x, this.level.key.y, true, true);
        }
        this.updateHud();
    }

    collectKey() {
        if (!takeKey(this.gameState)) return;
        this.sound.play('key', { volume: 0.20 });
        this.keySprite.disableBody(true, true);
        this.door.open();
        this.announce('Anahtar sende! Şimdi cami girişine ulaş.');
        this.updateHud();
    }

    // Tehlikeye temas: can azalt, kısa süre koru, gerekirse geri döndür.
    hitHazard(player, hazard) {
        if (this.paused || this.gameState.complete || this.elapsed < this.hurtUntil) return;
        this.gameState.hearts -= 1;
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
        this.announce('Biraz mesafe bırak ve zıpla. Kısa süre korunuyorsun.');
        this.updateHud();
    }

    respawn(point = null) {
        resetBossRage(this.hazards.getChildren());
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
    }

    reachExit() {
        if (finishLevel(this.gameState)) {
            unlockNext(this.levelIndex, levels.length);
            this.touchControls.reset();
            this.player.setVelocity(0, 0);
            this.player.setAlpha(1);
            this.physics.pause();
            showRecovery(this.player, this.elapsed);
            this.sound.play('key', { volume: 0.22 });
            document.getElementById('touch-controls').hidden = true;
            // Önce camide kazanma parlamasını göster, sonra aynı sonuç kartını aç.
            this.time.delayedCall(1200, () => this.showLevelResult());
            this.updateHud();
        } else if (!this.gameState.complete && this.elapsed - this.lastGateHint > 4000) {
            this.lastGateHint = this.elapsed;
            this.announce(isKeyReady(this.gameState) ? 'Kapı için önce ilerideki altın anahtarı al.' : 'Kapı için üç yıldızı tamamla.');
        }
    }

    showLevelResult() {
        this.resultShown = true;
        this.tweens.pauseAll();
        const final = this.levelIndex === levels.length - 1;
        document.getElementById('result-eyebrow').textContent = final ? 'OYUN TAMAMLANDI' : 'BÖLÜM TAMAMLANDI';
        document.getElementById('result-title').textContent = final ? 'Tebrikler!' : `${this.levelIndex + 1}. bölümü bitirdiniz!`;
        document.getElementById('result-message').textContent = final ? 'Bütün bölümleri bitirdiniz.' : `${this.levelIndex + 2}. bölüm artık açık.`;
        document.getElementById('result-verse').textContent = verses[this.levelIndex].text;
        document.getElementById('result-score').textContent = `${this.gameState.score} puan`;
        document.getElementById('next-level').hidden = final;
        document.getElementById('play-again').hidden = !final;
        document.getElementById('game-result').hidden = false;
        document.getElementById(final ? 'play-again' : 'next-level').focus({ preventScroll: true });
        this.announce(document.getElementById('result-title').textContent);
    }

    continueAfterResult() {
        if (!this.gameState.complete || !this.resultShown) return;
        this.resultShown = false;
        if (this.levelIndex === levels.length - 1) { this.restart(true); return; }
        this.tweens.resumeAll();
        this.physics.resume();
        this.scene.restart({ levelIndex: this.levelIndex + 1, score: this.gameState.score });
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
    update(time, delta) {
        if (!this.player) return;
        if (Phaser.Input.Keyboard.JustDown(this.player.keys.R)) { this.restart(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) document.getElementById('settings-button').click();
        if (this.gameState.complete) {
            this.elapsed += delta;
            updatePlayerEffects(this.player, this.elapsed);
            if (Phaser.Input.Keyboard.JustDown(this.player.keys.ENTER)) this.continueAfterResult();
            return;
        }
        if (this.lost) return;
        if (this.paused) return;
        this.elapsed += delta;
        updateFireRain(this);
        const onBelt = this.player.x >= this.level.belt.x && this.player.x <= this.level.belt.x + this.level.belt.width && this.player.body.bottom >= this.level.groundY - 3;
        let conveyorSpeed = 0;
        if (onBelt) conveyorSpeed = this.level.belt.speed;
        const onIce = this.player.body.bottom >= this.level.groundY - 3 &&
            (this.level.ice || []).some(ice => this.player.x >= ice.x && this.player.x <= ice.x + ice.width);
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
        // Yüksek basamaklarda karakteri görünürde tut; yerdeyken kamera sabit kalsın.
        const camera = this.cameras.main;
        let top = Phaser.Math.Clamp(camera.scrollY, this.player.y - this.scale.height + 80, this.player.y - 80);
        top = Phaser.Math.Clamp(top, 0, Math.max(0, 600 - this.scale.height));
        camera.scrollY += (top - camera.scrollY) * Math.min(delta / 100, 1);
        for (const hazard of this.hazards.getChildren()) {
            const patrol = hazard.getData('patrol');
            if (patrol.jump) {
                let jumpSpeed = 1;
                if (patrol.rage) {
                    if (patrol.engagedAt === null && Math.abs(this.player.x - hazard.x) < 450) patrol.engagedAt = this.elapsed;
                    const mood = bossMood(this.elapsed, patrol.engagedAt, Math.abs(this.player.x - hazard.x));
                    jumpSpeed = mood.speed;
                    hazard.setTint(mood.tint);
                    hazard.setTexture(mood.angry ? 'ogre-ember-angry' : 'ogre-ember');
                }
                // Saati biriktirmek, hız değişirken zıplamanın ortasında sıçramayı önler.
                const previousClock = patrol.jumpClock;
                patrol.jumpClock += delta * jumpSpeed;
                const step = bossStep(previousClock, patrol.jumpClock, patrol.jump);
                if (step.sound) {
                    const distance = Math.abs(this.player.x - hazard.x);
                    const range = Math.max(500, this.scale.width * 0.7);
                    if (distance < range) {
                        const volume = (step.sound === 'boss-land' ? 0.24 : 0.14) * (1 - distance / range);
                        this.sound.play(step.sound, { volume });
                    }
                }
                // Gövde ve görsel birlikte taşınır; hava boşluğunda görünmez çarpışma kalmaz.
                hazard.body.reset(hazard.x, patrol.baseY - step.lift);
                hazard.getData('shadow').setPosition(hazard.x, 517);
            }
            if (hazard.x >= patrol.maxX) patrol.direction = -1;
            if (hazard.x <= patrol.minX) patrol.direction = 1;
            hazard.setVelocityX(patrol.speed * patrol.direction);
            if (patrol.bob) {
                const wave = Math.sin(this.elapsed / 550);
                const targetY = patrol.baseY + (patrol.grounded ? -Math.abs(wave) : wave) * patrol.bob;
                hazard.setVelocityY((targetY - hazard.y) * 10);
            }
            const thread = hazard.getData('thread');
            if (thread) thread.geom.y2 = hazard.y;
            if (patrol.type === 'ball' || patrol.type === 'wheel') hazard.rotation += patrol.direction * delta * 0.003;
            else hazard.setFlipX(patrol.direction < 0);
        }
        // Bant oklarını sola kaydır. Soldan çıkan oku tekrar sağa taşı.
        for (const mark of this.beltMarks) {
            mark.x -= 35 * delta / 1000;
            if (mark.x < this.level.belt.x) mark.x += this.level.belt.width;
        }
        if (!this.gameState.checkpointActive && this.player.x > this.level.checkpoint.x - 18) {
            this.gameState.checkpointActive = true;
            this.checkpointFlag.setFillStyle(0x55977b);
            if (this.gameState.hearts < 3) {
                showRecovery(this.player, this.elapsed);
                this.sound.play('heal', { volume: 0.20 });
            }
            this.gameState.hearts = 3;
            this.announce('Kontrol noktası! Canların doldu. Buradan devam edebilirsin.');
            this.updateHud();
        }
        this.progressFill.width = Phaser.Math.Clamp(this.player.x / this.level.exit.x, 0, 1) * HUD_PROGRESS_WIDTH;
        this.checkPits();
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
            this.physics.pause();
            this.gameState.hearts = 0;
            this.sound.play('hurt', { volume: 0.23 });
            document.getElementById('touch-controls').hidden = true;
            document.getElementById('fall-result').hidden = false;
            document.getElementById('retry-fall').focus({ preventScroll: true });
            this.updateHud();
        }
    }

    retryFall() {
        if (!this.lost) return;
        this.restart();
    }
}
