
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

let up = new Audio();
let right = new Audio();
let left = new Audio();
let down = new Audio();
up.src = "audio/up.mp3";
right.src = "audio/right.mp3";
left.src = "audio/left.mp3";
down.src = "audio/down.mp3";


var grid = 20;
var boxLastX;
var boxLastY;
var box =
{
  x: 300,
  y: 300,
  dx:grid,
  dy:0
};

var ball =
{
  x: 300,
  y: 300,
  dx:grid,
  dy:0
};

var img = new Image();
img.src = "image/food.png";
img.onload=start();

function start(){
  context.drawImage(img, 100, 100, 16, 18, 50,50, 16, 18);
}


context.fillStyle = 'red';
box.x = getRandomInt(0, 30) * grid;
box.y = getRandomInt(0, 30) * grid;
context.fillRect(box.x,box.y, grid-1, grid-1);
boxLastX = box.x;
boxLastY = box.y;

for (var i = 0; i < 10; i++)
{
  context.fillStyle = 'yellow';
  var x = getRandomInt(0, 30) * grid;
  var y = getRandomInt(0, 30) * grid;
  context.fillRect(x,y, grid-1, grid-1);
}


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// game loop
function loop()
{
  requestAnimationFrame(loop);

}


document.addEventListener('keydown', function(e)
{
  var isPressed = 0;

  // left arrow key
  if (e.which === 37) {
    box.dx = -grid;
    box.dy = 0;
    isPressed=1;
    left.currentTime=0;
    left.play();
  }
  // up arrow key
  else if (e.which === 38) {
    box.dy = -grid;
    box.dx = 0;
    isPressed=1;
    up.currentTime=0;
    up.play();
  }
  // right arrow key
  else if (e.which === 39) {
    box.dx = grid;
    box.dy = 0;
    isPressed=1;
    right.currentTime=0;
    right.play();
  }
  // down arrow key
  else if (e.which === 40) {
    box.dy = grid;
    box.dx = 0;
    isPressed=1;
    down.currentTime=0;
    down.play();
  }

  if (isPressed===1) {
    draw();
  }

});

function draw()
{
    context.clearRect(boxLastX,boxLastY,grid,grid);
    box.x += box.dx;
    box.y += box.dy;

    if (box.x < 0) {
      box.x = 0;
    }
    else if (box.x >= canvas.width) {
      box.x = canvas.width-grid;
    }

    if (box.y < 0) {
      box.y = 0;
    }
    else if (box.y >= canvas.height) {
      box.y = canvas.height-grid;
    }

    boxLastX = box.x;
    boxLastY = box.y;
    console.log(box.x +" "+box.y);
    context.fillStyle = 'red';
    context.fillRect(box.x, box.y, grid-1, grid-1);
}
// start the game
//requestAnimationFrame(loop);
