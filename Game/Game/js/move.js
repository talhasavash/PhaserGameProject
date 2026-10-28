var config = {
    type: Phaser.AUTO,
    width: 750,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 2000 },
            debug: false
        }
    },
    pixelArt: true,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    title: 'Meryem Betul'
};

var game = new Phaser.Game(config);
var hits = 0;
var f=0;
var health1,health2,health3,k,key,timer,door,door1,door2,door3,door4,cursors,posX,posY,platforms,player,ground,scoreText,fruits,mosque;
var gameOver = false;
var jumpTimer=0;
var score = 0;
var positions = [100,150,250,300,350,400,450,500,550,600];
var enemy;
var fires;
var startInterval;
var icePlatform;

function preload ()
{
  this.load.image('background','image/background1.png');
  this.load.image('ground','image/ground.png');
  this.load.image('mosque','image/mosque.png');
  this.load.spritesheet('fruit', 'image/fruit.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('player', 'image/player.png', { frameWidth: 32, frameHeight: 48 });
  this.load.spritesheet('stone', 'image/platform.png', { frameWidth: 64, frameHeight: 64 });

}

function create ()
{
  score=0;
  this.add.image(375, 300, 'background');
  scoreText = this.add.text(16, 16, 'Puan: 0', { fontSize: '20px', fill: '#000' });
  this.add.text(500, 16, 'Meyve Oyunu: ' + game.config.gameTitle, { font: '16px Courier', fill: '#000' });

  platforms = this.physics.add.staticGroup();
  icePlatform = this.physics.add.staticGroup();


  icePlatform.create( 300,505, 'stone',6).setScale(0.5).refreshBody();
  icePlatform.create( 332,505, 'stone',6).setScale(0.5).refreshBody();
  icePlatform.create( 364,505, 'stone',6).setScale(0.5).refreshBody();
  icePlatform.create( 396,505, 'stone',6).setScale(0.5).refreshBody();
  icePlatform.create( 428,505, 'stone',6).setScale(0.5).refreshBody();


  fires = this.physics.add.group();
  fruits = this.physics.add.group();
  key = this.physics.add.group();

  createGround();
  createFruits();

  mosque = this.add.image(680, 480, 'mosque').setScale(1);
  door1 = this.add.image(680, 494, 'stone',76).setScale(0.5);
  door2 = this.add.image(680, 522, 'stone',90).setScale(0.5);
  door3 = this.add.image(680, 494, 'stone',75).setScale(0.5);
  door4 = this.add.image(680, 522, 'stone',89).setScale(0.5);
  door3.visible=false;
  door4.visible=false;

  health1 = this.add.image(140, 27, 'stone',67).setScale(1);
  health1.visible=true;
  health2 = this.add.image(140, 27, 'stone',53).setScale(1);
  health2.visible=false;
  health3 = this.add.image(140, 27, 'stone',39).setScale(1);
  health3.visible=false;

  //enemy = platforms.create(285, 368, 'stone',71).setScale(0.5).refreshBody();
  player = this.physics.add.sprite(50, 400, 'player');
  player.setCollideWorldBounds(true);
  player.setTint(0xFFFF00);

  timer = this.time.addEvent({
   delay: 2000,
   callback: createFire,
   repeat: -1
  });

  this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
  });
  this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'player', frame: 4 }]
        // frameRate: 20
    });

        this.anims.create({
        key: 'win',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();
    this.physics.add.overlap(player, fruits, collectFruit, null, this);
    this.physics.add.overlap(player, enemy, hitBomb, null, this);
    this.physics.add.overlap(player, fires, hitFire, null, this);
    this.physics.add.overlap(player, key, collectKey, null, this);
    this.physics.add.collider(player, icePlatform,setFriction, null, this);
    this.physics.add.collider(platforms, icePlatform);
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(fruits, platforms);
    this.physics.add.collider(key,platforms);

}

function setFriction(player, icePlatform)
{
  player.body.x -= 2;
}
function collectKey(player, key)
{
  key.disableBody(true,true);
  door3.visible=true;
  door4.visible=true;
}

function createGround()
{

  platforms.create(400, 580, 'ground').setScale(2).refreshBody();
  platforms.create(50, 300, 'stone',45).setScale(0.5).refreshBody();
  platforms.create(100, 350, 'stone',45).setScale(0.5).refreshBody();
  platforms.create(400, 470, 'stone',45).setScale(0.5).refreshBody();

  var x=0;
  for(var i=0; i<5;i++)
  {
    platforms.create(150+x, 400, 'stone',45).setScale(0.5).refreshBody();
    platforms.create(300+x, 210, 'stone',45).setScale(0.5).refreshBody();
    platforms.create(400+x, 300, 'stone',45).setScale(0.5).refreshBody();
    platforms.create(500+x, 390, 'stone',45).setScale(0.5).refreshBody();
    x+=32;
  }

}

function createFire()
{
  fires.create(player.x-50, 0, 'stone',25).setScale(0.5).setVelocityX(20);

  f++;
}

function createFruits(){
  for(var i=0; i<10;i++){
    fruits.create(positions[i],0,'fruit',i).setBounce(0.4);
  }
}


function hitFire (player, fire)
{
  fire.disableBody(true,true);
  this.cameras.main.flash(250, 255, 0, 0);
  hits+=1;
  //console.log(hits);

  if (hits==1) {
    health1.visible=false;
    health2.visible=true;
  }
  else if (hits==2) {
    health2.visible=false;
    health3.visible=true;
  }

  if (hits==3) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
    timer.paused = true;
  }
}

function hitBomb (player, enemy)
{
    this.cameras.main.flash(250, 255, 0, 0);
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
    timer.paused = true;
}

function collectFruit (player, fruit)
{
    fruit.disableBody(true, true);
    score += 10;
    scoreText.setText('Puan: ' + score);
    if (fruits.countActive(true) === 0)
    {
        mosque.visible=true;
        timer.paused = true;
        door3.visible=false;
        door4.visible=false;
        key.create(20, 460, 'stone',63).setScale(0.7).setBounce(0.4);
    }
}


function update() 
{

    if (gameOver) {
        player.anims.stop();
        var over = this.add.text(300, 300, 'Kaybettiniz!', { fontSize: '32px', fill: '#000' });
        gameOver=false;
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-200);
        player.setBounce(0.4);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(200);
        player.setBounce(0.4);
        player.anims.play('right', true);
    }
    else if (cursors.space.isDown)
    {
      hits=0;
      this.registry.destroy(); // destroy registry
      this.events.off();
      this.scene.restart();
    }
    else
    {
        player.setVelocityX(0);
        //player.frames=4;
        //player.anims.stop();
        player.anims.play('turn');
    }

    if (cursors.up.isDown)
    {
      if(player.body.onFloor() && jumpTimer === 0)
      {
          jumpTimer = 1;
          player.setVelocityY(-330);
      }
      else if (jumpTimer > 0 && jumpTimer < 21)
      {
          jumpTimer++;
          player.body.velocity.y = -330 + (jumpTimer * 6);
      }
    }
    else
    {
      jumpTimer = 0;
    }
    if (door3.visible===true && door4.visible===true) {
      if (player.x > door3.x && player.x > door4.x) {
          this.add.text(300, 300, 'Kazandınız!', { fontSize: '32px', fill: '#000' });
          player.anims.stop();
      }
    }



}
