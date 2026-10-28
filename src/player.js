// Hızlar piksel/saniye, süreler milisaniye cinsindedir.
const WALK_SPEED = 265;
const JUMP_SPEED = 590;
const GROUND_ACCELERATION = 1500;
const AIR_ACCELERATION = 1350;
const GROUND_BRAKING = 700; // Tuş bırakıldığında hemen durmak yerine yavaşla.
const AIR_BRAKING = 220; // Havada hareketin ivmesini daha uzun koru.
const TURN_ACCELERATION = 2200; // Ters yöne basınca daha hızlı tepki ver.
const EDGE_JUMP_TIME = 110; // Kenardan ayrıldıktan sonra kısa bir zıplama toleransı.
const EARLY_JUMP_TIME = 140; // Yere inmeden hemen önce basılan zıplamayı hatırla.
const PLAYER_SCALE = 0.8; // Karakter önceki boyutundan %20 küçük.

export function createPlayer(scene, x, y, character = 'boy') {
    // Sprite'ı ve ona ait çarpışma gövdesini Phaser oluşturur.
    const player = scene.physics.add.sprite(x, y, `${characterPrefix('normal', character)}0`);
    player.character = character;
    player.setScale(PLAYER_SCALE);
    player.setDepth(15);
    player.setCollideWorldBounds(true);
    player.body.setSize(28, 54);
    player.body.setOffset(18, 18);
    player.keys = scene.input.keyboard.addKeys('A,D,W,SPACE,R,ENTER');
    player.cursors = scene.input.keyboard.createCursorKeys();
    player.movement = {
        lastGrounded: -Infinity,
        jumpQueued: -Infinity,
        jumpConsumed: false,
        wasJumpHeld: false,
        wasOnGround: false,
        lastDirection: 1
    };

    player.expression = 'normal';
    player.expressionUntil = 0;
    player.recoveryUntil = 0;

    // Üç ifade aynı yürüme hareketini kullanır; yalnızca yüz değişir.
    for (const expression of ['normal', 'sad', 'happy']) {
        const prefix = characterPrefix(expression, character);
        const animation = `${characterPrefix('normal', character)}walk-${expression}`;
        if (!scene.anims.exists(animation)) {
            scene.anims.create({
                key: animation,
                frames: [
                    { key: `${prefix}1` }, { key: `${prefix}4` },
                    { key: `${prefix}2` }, { key: `${prefix}5` }
                ],
                frameRate: 10,
                repeat: -1
            });
        }
    }
    // Parıltılar fizik gövdesi değildir; karakterin çevresinde görsel olarak döner.
    player.recoveryGlow = scene.add.circle(x, y, 26, 0xffe6a0).setDepth(14).setVisible(false);
    player.recoveryStars = [];
    for (let i = 0; i < 6; i++) {
        const star = scene.add.star(x, y, 5, 3, 7, 0xffd05b).setDepth(20).setVisible(false);
        star.setStrokeStyle(1, 0xfff7cb);
        player.recoveryStars.push(star);
    }
    return player;
}

function characterPrefix(expression, character = 'boy') {
    let base = 'child';
    if (character === 'girl') base = 'girl';
    if (expression === 'normal') return `${base}-`;
    return `${base}-${expression}-`;
}

export function currentExpression(player, time) {
    if (time < player.expressionUntil) return player.expression;
    return 'normal';
}

export function showPlayerExpression(player, expression, time, duration) {
    player.expression = expression;
    player.expressionUntil = time + duration;
    // Geri tepme sırasında hareket güncellenmese de yüz hemen değişsin.
    player.anims.stop();
    player.setTexture(`${characterPrefix(expression, player.character)}0`);
}

export function showRecovery(player, time) {
    player.recoveryUntil = time + 2200;
    showPlayerExpression(player, 'happy', time, 2200);
}

export function updatePlayerEffects(player, time) {
    const recovering = time < player.recoveryUntil;
    player.recoveryGlow.setVisible(recovering);
    player.recoveryGlow.setPosition(player.x, player.y - 5);
    player.recoveryGlow.setAlpha(0.16 + Math.sin(time / 110) * 0.07);

    for (let i = 0; i < player.recoveryStars.length; i++) {
        const star = player.recoveryStars[i];
        const angle = time / 350 + i * Math.PI / 3;
        star.setVisible(recovering);
        star.setPosition(player.x + Math.cos(angle) * 24, player.y - 5 + Math.sin(angle) * 29);
        star.setAlpha(0.6 + Math.sin(time / 100 + i) * 0.35);
        star.rotation = angle;
    }
}

export function resetPlayerMovement(player) {
    player.setVelocity(0, 0);
    player.movement.lastGrounded = -Infinity;
    player.movement.jumpQueued = -Infinity;
    player.movement.jumpConsumed = false;
    player.movement.wasOnGround = false;
    player.setRotation(0);
    player.expression = 'normal';
    player.expressionUntil = 0;
    player.recoveryUntil = 0;
}

export function readDirection(player) {
    const leftHeld = player.cursors.left.isDown || player.keys.A.isDown;
    const rightHeld = player.cursors.right.isDown || player.keys.D.isDown;
    let direction = 0;

    if (leftHeld && rightHeld) {
        // İki yön aynı anda basılıysa son basılan yön kazanır.
        // timeDown, Phaser'ın tuşa basıldığı anda kaydettiği zamandır.
        let leftTime = 0;
        let rightTime = 0;
        if (player.cursors.left.isDown) leftTime = player.cursors.left.timeDown;
        if (player.keys.A.isDown) leftTime = Math.max(leftTime, player.keys.A.timeDown);
        if (player.cursors.right.isDown) rightTime = player.cursors.right.timeDown;
        if (player.keys.D.isDown) rightTime = Math.max(rightTime, player.keys.D.timeDown);
        direction = player.movement.lastDirection;
        if (rightTime > leftTime) direction = 1;
        if (leftTime > rightTime) direction = -1;
    } else if (leftHeld) {
        direction = -1;
    } else if (rightHeld) {
        direction = 1;
    }

    if (direction !== 0) player.movement.lastDirection = direction;
    return direction;
}

export function movePlayer(player, time, delta, conveyorSpeed) {
    const movement = player.movement;
    const grounded = player.body.blocked.down || player.body.touching.down;
    if (grounded) {
        movement.lastGrounded = time;
        if (!movement.wasOnGround) movement.jumpConsumed = false;
    }

    // 1. Klavyeyi oku: -1 sol, 0 dur, 1 sağ.
    const direction = readDirection(player);
    const jumpHeld = player.cursors.up.isDown || player.keys.W.isDown || player.keys.SPACE.isDown;
    if (jumpHeld && !movement.wasJumpHeld) movement.jumpQueued = time;

    // 2. Hedef hızı hesapla. Bant etkisini yalnızca yerdeyken ekle.
    let targetSpeed = direction * WALK_SPEED;
    let acceleration = AIR_ACCELERATION;
    if (grounded) {
        targetSpeed += conveyorSpeed;
        acceleration = GROUND_ACCELERATION;
    }

    // Tuşa basmak, tuşu bırakmak ve ters yöne dönmek farklı hissettirsin.
    if (direction === 0) {
        acceleration = AIR_BRAKING;
        if (grounded) acceleration = GROUND_BRAKING;
    } else if (direction * player.body.velocity.x < 0) {
        acceleration = TURN_ACCELERATION;
    }

    // delta: bir önceki kareden beri geçen süre. Farklı bilgisayarlarda hız aynı kalır.
    const seconds = Math.min(delta, 50) / 1000;
    const maxChange = acceleration * seconds;
    let speedChange = targetSpeed - player.body.velocity.x;
    speedChange = Phaser.Math.Clamp(speedChange, -maxChange, maxChange);
    player.setVelocityX(player.body.velocity.x + speedChange);
    // Süzülmenin sonundaki çok küçük hızı sıfırla; dururken piksel titremesi olmasın.
    if (direction === 0 && grounded && conveyorSpeed === 0 && Math.abs(player.body.velocity.x) < 5) {
        player.setVelocityX(0);
    }

    // 3. Zıplamak için yukarı hız ver. Yerçekimini Phaser uygular.
    const nearGround = time - movement.lastGrounded < EDGE_JUMP_TIME;
    const jumpRequested = time - movement.jumpQueued < EARLY_JUMP_TIME;
    if (!movement.jumpConsumed && nearGround && jumpRequested) {
        player.setVelocityY(-JUMP_SPEED);
        movement.jumpQueued = -Infinity;
        movement.lastGrounded = -Infinity;
        movement.jumpConsumed = true;
    }
    if (!jumpHeld && movement.wasJumpHeld && player.body.velocity.y < -240) {
        player.setVelocityY(-240); // Tuş erken bırakılırsa zıplama daha kısa olur.
    }

    // 4. Hareketin durumuna göre görseli seç. Animasyonu Phaser oynatır.
    const expression = currentExpression(player, time);
    const prefix = characterPrefix(expression, player.character);
    if (direction !== 0) player.setFlipX(direction < 0);
    if (!grounded) {
        player.anims.stop();
        player.setTexture(`${prefix}3`);
    } else if (Math.abs(player.body.velocity.x) > 20) {
        player.play(`${characterPrefix('normal', player.character)}walk-${expression}`, true);
        // Adımlar, karakterin gerçek hızına göre yavaşlar veya hızlanır.
        player.anims.timeScale = 0.6 + Math.abs(player.body.velocity.x) / WALK_SPEED * 0.8;
    } else {
        player.anims.stop();
        player.setTexture(`${prefix}0`);
    }

    // Hafif gövde eğimi dönüşü daha canlı gösterir; çarpışma kutusu değişmez.
    let targetLean = player.body.velocity.x / WALK_SPEED * 0.065;
    const leanChange = Math.min(seconds * 12, 1);
    if (direction === 0 && grounded && player.body.velocity.x === 0) {
        player.setRotation(0); // Bekleme pozunda sallanma veya nefes döngüsü yok.
    } else {
        player.setRotation(player.rotation + (targetLean - player.rotation) * leanChange);
    }
    movement.wasJumpHeld = jumpHeld;
    movement.wasOnGround = grounded;
}
