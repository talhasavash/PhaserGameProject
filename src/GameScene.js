import { garden } from './level.js';
import { createGameState, isKeyReady, recordFruit, takeKey, finishLevel, healAtFountain } from './rules.js';
import { createPlayer, movePlayer, resetPlayerMovement, showPlayerExpression, showRecovery, updatePlayerEffects } from './player.js';
import { createScenery, makeSign, createMosque, createFountain } from './background.js';

const textStyle = { fontFamily: 'Trebuchet MS, sans-serif', color: '#294e4c' };
const COLLECTIBLE_SCALE = 0.75;
const ENEMY_SCALE = 0.8;

export class GameScene extends Phaser.Scene {
    // Tek sınıfımız bu: Phaser bir oyun ekranını "Scene" olarak yönetir.
    // "this", bu oyun ekranını temsil eder. Fizik ve kamera ona aittir.
    constructor(character = 'boy') {
        super('Garden');
        this.character = character;
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
        this.load.svg('apple', 'assets/images/apple.svg', { width: 40, height: 44 });
        this.load.svg('berry', 'assets/images/berry.svg', { width: 32, height: 36 });
        this.load.svg('hedgehog', 'assets/images/hedgehog.svg', { width: 76, height: 52 });
        this.load.svg('snail', 'assets/images/snail.svg', { width: 76, height: 52 });
        this.load.svg('ball', 'assets/images/ball.svg', { width: 52, height: 52 });
        this.load.svg('key', 'assets/images/key.svg', { width: 64, height: 40 });
        this.load.svg('bead', 'assets/images/bead.svg', { width: 40, height: 44 });
        this.load.svg('mat', 'assets/images/mat.svg', { width: 36, height: 52 });
    }

    // Görseller yüklenince Phaser create'i bir kez çağırır: bölümü kur.
    create() {
        this.gameState = createGameState();
        this.elapsed = 0;
        this.hurtUntil = 0;
        this.knockbackUntil = 0;
        this.paused = false;
        this.lastGateHint = -Infinity;
        this.physics.world.setBounds(0, 0, garden.width, 600);
        createScenery(this, garden.width);
        this.createTerrain();
        this.createCollectibles();
        this.createHazards();
        this.createLandmarks();
        this.createHealingSpots();
        this.player = createPlayer(this, garden.spawn.x, garden.spawn.y, this.character);
        // collider: karakter platformun içinden geçmesin.
        // overlap: temas olunca belirtilen fonksiyonu çalıştır (örneğin meyve topla).
        this.physics.add.collider(this.player, this.solids);
        this.physics.add.overlap(this.player, this.fruits, this.collectFruit, null, this);
        this.physics.add.overlap(this.player, this.hazards, this.hitHazard, null, this);
        this.physics.add.overlap(this.player, this.keySprite, this.collectKey, null, this);
        this.physics.add.overlap(this.player, this.exitZone, this.reachExit, null, this);
        this.physics.add.overlap(this.player, this.fountains, this.useFountain, null, this);
        this.cameras.main.setBounds(0, 0, garden.width, 600);
        this.cameras.main.startFollow(this.player, true, 0.09, 1, -190, 0);
        this.createHud();
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.bindPageControls();
        this.events.once('shutdown', () => {
            document.getElementById('pause-button').onclick = null;
            document.getElementById('restart-button').onclick = null;
            document.getElementById('play-again').onclick = null;
        });
        this.announce('Üç elmayı bul. Meyve, tesbih ve seccadeler bonus puan!');
        this.updateHud();
    }

    // Zemini ve platformları sabit fizik gövdeleriyle oluştur.
    createTerrain() {
        this.solids = this.physics.add.staticGroup();
        this.solids.add(this.add.rectangle(garden.width / 2, 570, garden.width, 100).setVisible(false));
        for (const platform of garden.platforms) {
            const { x, y, width } = platform;
            const ground = this.add.rectangle(x + width / 2, y + 14, width, 28, 0x9c7653).setDepth(5);
            this.solids.add(ground);
            this.add.rectangle(x + width / 2, y + 2, width + 4, 8, 0x5d9d5e).setDepth(6);
            this.add.rectangle(x + width / 2, y + 29, width - 12, 5, 0x765a46, 0.35).setDepth(4);
            for (let xx = x + 16; xx < x + width; xx += 34) {
                this.add.rectangle(xx, y + 17, 12, 4, 0xb9956a).setDepth(6);
            }
        }
        const belt = garden.belt;
        this.add.rectangle(belt.x + belt.width / 2, 524, belt.width, 17, 0x466b72).setDepth(7);
        this.beltMarks = [];
        for (let i = 0; i < 10; i++) {
            this.beltMarks.push(this.add.text(belt.x + i * 22, 508, '‹', { ...textStyle, color: '#d2e7c8', fontSize: '23px' }).setDepth(8));
        }
        makeSign(this, 1770, 'Bant seni sola taşır\nSağa yürüyerek ilerle');
    }

    // level.js içindeki meyve konumlarını kullan; anahtarı başlangıçta gizle.
    createCollectibles() {
        this.fruits = this.physics.add.staticGroup();
        for (const fruit of garden.fruits) {
            const sprite = this.fruits.create(fruit.x, fruit.y, fruit.type).setDepth(10);
            sprite.setScale(COLLECTIBLE_SCALE).refreshBody();
            sprite.setData('item', fruit);
            // Görsel hafifçe süzülür; toplama kutusu yerinde kalır.
            this.tweens.add({ targets: sprite, y: fruit.y - 5, duration: 950, yoyo: true, repeat: -1, delay: fruit.x % 400, ease: 'Sine.easeInOut' });
        }
        this.keySprite = this.physics.add.staticImage(garden.key.x, garden.key.y, 'key').setDepth(10);
        this.keySprite.setScale(COLLECTIBLE_SCALE).refreshBody();
        this.keySprite.disableBody(true, true);
        this.add.ellipse(garden.key.x, 514, 100, 12, 0x528b56).setDepth(2);
        this.add.rectangle(garden.key.x, 506, 64, 18, 0xc8b78c).setDepth(3);
        this.keyCaption = this.add.text(garden.key.x, 431, '3 elma → anahtar', { ...textStyle, fontSize: '15px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(8);
    }

    createHazards() {
        this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });
        for (const enemy of garden.enemies) {
            this.createHazard(enemy);
        }
        this.createHazard(garden.ball);
        makeSign(this, 750, 'Hayvanlara dokunma\nÜzerlerinden zıpla');
        makeSign(this, 3245, 'Dikkat: yuvarlanan taş', '#885f42');
    }

    createHazard(data) {
        // Küçülünce de ayaklar yerde kalsın. Kutuların alt kenarı zeminle aynı hizada.
        let y = garden.groundY - 24 * ENEMY_SCALE;
        if (data.type === 'ball') y = garden.groundY - 22 * ENEMY_SCALE;
        const sprite = this.hazards.create(data.x, y, data.type).setDepth(12);
        sprite.setScale(ENEMY_SCALE);
        sprite.setData('patrol', {
            minX: data.minX,
            maxX: data.maxX,
            speed: data.speed,
            type: data.type,
            direction: 1
        });
        if (data.type === 'ball') {
            sprite.body.setCircle(22, 4, 4);
        } else {
            sprite.body.setSize(53, 27).setOffset(12, 23);
        }
    }

    createLandmarks() {
        const intro = this.add.container(48, 202).setDepth(10);
        intro.add([
            this.add.text(0, 0, '01 / MEYVE BAHÇESİ', { ...textStyle, fontSize: '15px', fontStyle: 'bold', letterSpacing: 3 }),
            this.add.text(0, 29, 'Küçük bir keşfe çık.', { ...textStyle, fontSize: '32px', fontStyle: 'bold' }),
            this.add.text(0, 77, '3 elmayı bul, anahtarı al, camiye ulaş.\nOklarla yürü. Yukarı ok veya boşlukla zıpla.', { ...textStyle, fontSize: '16px', lineSpacing: 7 })
        ]);
        const { x } = garden.checkpoint;
        this.add.rectangle(x, 476, 6, 88, 0x6b6e52).setDepth(6);
        this.checkpointFlag = this.add.triangle(x + 4, 433, 0, 0, 48, 12, 0, 27, 0xe3c37d).setOrigin(0, 0).setDepth(7);
        this.checkpointLabel = this.add.text(x, 407, 'KONTROL NOKTASI', { ...textStyle, fontSize: '13px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
        const exit = garden.exit;
        this.door = createMosque(this, exit.x);
        this.exitZone = this.add.zone(exit.x, 480, 68, 80);
        this.physics.add.existing(this.exitZone, true);
    }

    createHealingSpots() {
        this.fountains = this.physics.add.staticGroup();
        for (const fountain of garden.fountains) {
            const label = createFountain(this, fountain.x);
            const zone = this.add.zone(fountain.x, 480, 85, 80);
            zone.setData('id', fountain.id);
            zone.setData('label', label);
            this.fountains.add(zone);
        }
    }

    useFountain(player, zone) {
        if (!healAtFountain(this.gameState, zone.getData('id'))) return;
        showRecovery(player, this.elapsed);
        zone.getData('label').setText('DİNLENDİN · +1 CAN ✓');
        this.announce('Abdest alanında dinlendin. Bir canın yenilendi!');
        this.updateHud();
    }

    createHud() {
        // HUD: can ve puan gibi ekran bilgileri. ScrollFactor(0) ile kameradan bağımsız kalır.
        const bg = this.add.graphics().setScrollFactor(0).setDepth(100);
        bg.fillStyle(0xfffcf0, 0.96);
        bg.fillRoundedRect(18, 16, 924, 92, 16);
        bg.lineStyle(1, 0x94b7a0, 0.4);
        bg.strokeRoundedRect(18, 16, 924, 92, 16);
        const label = (x, y, content, size = 16) => this.add.text(x, y, content, { ...textStyle, fontSize: `${size}px`, fontStyle: 'bold' }).setScrollFactor(0).setDepth(101);
        label(38, 30, '01  MEYVE BAHÇESİ', 18);
        this.heartsText = label(345, 30, '', 22);
        this.appleText = label(500, 33, '', 17);
        this.keyText = label(690, 33, '', 16);
        this.scoreText = label(831, 33, '', 16);
        this.hintText = this.add.text(38, 67, '', { ...textStyle, fontSize: '14px' }).setScrollFactor(0).setDepth(101);
        this.progressTrack = this.add.rectangle(810, 82, 230, 5, 0xdce8d9).setScrollFactor(0).setDepth(101);
        this.progressFill = this.add.rectangle(695, 82, 1, 5, 0x649272).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);
        this.toast = this.add.text(480, 135, '', {
            ...textStyle, fontSize: '17px', fontStyle: 'bold', align: 'center',
            backgroundColor: '#fff3d4', padding: { x: 18, y: 12 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(110).setVisible(false);
    }

    bindPageControls() {
        const result = document.getElementById('game-result');
        result.hidden = true;
        document.getElementById('pause-button').textContent = 'Duraklat';
        document.getElementById('pause-button').disabled = false;
        document.getElementById('restart-button').disabled = false;
        document.getElementById('toolbar-status').textContent = 'Bahçe seni bekliyor';
        document.getElementById('pause-button').onclick = () => this.togglePause();
        document.getElementById('restart-button').onclick = () => this.restart();
        document.getElementById('play-again').onclick = () => this.restart();
    }

    updateHud() {
        this.heartsText.setText('♥'.repeat(this.gameState.hearts) + '♡'.repeat(3 - this.gameState.hearts));
        this.heartsText.setColor('#bd6959');
        this.appleText.setText(`ELMA  ${this.gameState.apples} / 3`);
        this.keyText.setText(this.gameState.hasKey ? 'ANAHTAR  ✓' : 'ANAHTAR  —');
        this.scoreText.setText(`${this.gameState.score} P`);
        if (this.gameState.hasKey) {
            this.hintText.setText('Anahtar sende! Cami girişine ulaş.');
        } else if (isKeyReady(this.gameState)) {
            this.hintText.setText('Üç elma tamam! İlerideki altın anahtarı al.');
        } else {
            this.hintText.setText('Görev: 3 elma bul. Meyve, tesbih ve seccadeler bonus puan.');
        }
    }

    announce(message) {
        document.getElementById('game-status').textContent = message;
        if (!this.toast) return;
        this.toast.setText(message).setVisible(true);
        if (this.toastTimer) this.toastTimer.remove();
        this.toastTimer = this.time.delayedCall(3600, () => this.toast.setVisible(false));
    }

    // Phaser, karakter meyveye değdiğinde bu fonksiyonu çağırır.
    collectFruit(player, fruit) {
        const item = fruit.getData('item');
        if (!recordFruit(this.gameState, item.id, item.type)) return;
        fruit.disableBody(true, true);
        this.tweens.killTweensOf(fruit);
        if (item.type === 'apple') {
            this.announce(`${this.gameState.apples} / 3 elma! ${isKeyReady(this.gameState) ? 'Anahtar ileride seni bekliyor.' : 'Keşfetmeye devam et.'}`);
        }
        if (item.type === 'bead') this.announce('Tesbih taneleri buldun! +10 puan.');
        if (item.type === 'mat') this.announce('Bir seccade buldun! +20 puan.');
        if (isKeyReady(this.gameState) && !this.gameState.hasKey && !this.keySprite.active) {
            this.keySprite.enableBody(false, garden.key.x, garden.key.y, true, true);
            this.keyCaption.setText('Anahtarını al!');
        }
        this.updateHud();
    }

    collectKey() {
        if (!takeKey(this.gameState)) return;
        this.keySprite.disableBody(true, true);
        this.keyCaption.setText('Kapıya doğru →');
        this.door.setFillStyle(0x394e49);
        this.announce('Anahtar sende! Şimdi cami girişine ulaş.');
        this.updateHud();
    }

    // Tehlikeye temas: can azalt, kısa süre koru, gerekirse geri döndür.
    hitHazard(player, hazard) {
        if (this.paused || this.gameState.complete || this.elapsed < this.hurtUntil) return;
        this.gameState.hearts -= 1;
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

    respawn() {
        let point = garden.spawn;
        if (this.gameState.checkpointActive) point = garden.checkpoint;
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
            this.physics.pause();
            this.player.anims.stop();
            showPlayerExpression(this.player, 'happy', this.elapsed, 2200);
            this.tweens.pauseAll();
            document.getElementById('result-score').textContent = `${this.gameState.score} puan · 3 elma · 1 anahtar`;
            document.getElementById('game-result').hidden = false;
            document.getElementById('play-again').focus({ preventScroll: true });
            this.announce('Keşif tamamlandı! Üç elmayı topladın ve camiye ulaştın.');
            this.updateHud();
        } else if (!this.gameState.complete && this.elapsed - this.lastGateHint > 4000) {
            this.lastGateHint = this.elapsed;
            this.announce(isKeyReady(this.gameState) ? 'Kapı için önce ilerideki altın anahtarı al.' : 'Kapı için üç elmayı tamamla. Geri dönüp keşfedebilirsin.');
        }
    }

    togglePause() {
        if (this.gameState.complete) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.physics.pause(); this.tweens.pauseAll(); this.time.paused = true;
            this.toast.setText('Kısa bir mola. Devam etmek için Esc veya Devam et.').setVisible(true);
        } else {
            this.physics.resume(); this.tweens.resumeAll(); this.time.paused = false;
            this.toast.setVisible(false);
        }
        document.getElementById('pause-button').textContent = this.paused ? 'Devam et' : 'Duraklat';
    }

    restart() {
        this.time.paused = false;
        this.tweens.resumeAll();
        this.physics.resume();
        this.scene.restart();
    }

    // Phaser update'i her karede çağırır: girişleri ve hareketleri güncelle.
    // Çarpışma hesaplarını ve ekrana çizimi Phaser kendisi yapar.
    update(time, delta) {
        if (!this.player) return;
        if (Phaser.Input.Keyboard.JustDown(this.player.keys.R)) { this.restart(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
        if (this.gameState.complete) {
            if (Phaser.Input.Keyboard.JustDown(this.player.keys.ENTER)) this.restart();
            return;
        }
        if (this.paused) return;
        this.elapsed += delta;
        const onBelt = this.player.x >= garden.belt.x && this.player.x <= garden.belt.x + garden.belt.width && this.player.body.bottom >= garden.groundY - 3;
        let conveyorSpeed = 0;
        if (onBelt) conveyorSpeed = garden.belt.speed;
        if (this.elapsed > this.knockbackUntil) {
            movePlayer(this.player, this.elapsed, delta, conveyorSpeed);
        }
        const recovering = this.elapsed < this.player.recoveryUntil;
        const protectedFromDamage = this.elapsed < this.hurtUntil;
        if (protectedFromDamage && !recovering) {
            this.player.setAlpha(Math.floor(this.elapsed / 95) % 2 ? 0.45 : 1);
        } else {
            this.player.setAlpha(1);
        }
        updatePlayerEffects(this.player, this.elapsed);
        for (const hazard of this.hazards.getChildren()) {
            const patrol = hazard.getData('patrol');
            if (hazard.x >= patrol.maxX) patrol.direction = -1;
            if (hazard.x <= patrol.minX) patrol.direction = 1;
            hazard.setVelocityX(patrol.speed * patrol.direction);
            if (patrol.type === 'ball') hazard.rotation += patrol.direction * delta * 0.003;
            else hazard.setFlipX(patrol.direction < 0);
        }
        // Bant oklarını sola kaydır. Soldan çıkan oku tekrar sağa taşı.
        for (const mark of this.beltMarks) {
            mark.x -= 35 * delta / 1000;
            if (mark.x < garden.belt.x) mark.x += garden.belt.width;
        }
        if (!this.gameState.checkpointActive && this.player.x > garden.checkpoint.x - 18) {
            this.gameState.checkpointActive = true;
            this.checkpointFlag.setFillStyle(0x55977b);
            this.checkpointLabel.setText('BURADAN DEVAM EDEBİLİRSİN');
            if (this.gameState.hearts < 3) showRecovery(this.player, this.elapsed);
            this.gameState.hearts = 3;
            this.announce('Kontrol noktası! Canların doldu. Buradan devam edebilirsin.');
            this.updateHud();
        }
        this.progressFill.width = Phaser.Math.Clamp(this.player.x / garden.exit.x, 0, 1) * 230;
    }
}
