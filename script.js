window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  //LOADING CLASSES
  class Wall {
    constructor(x, y, width, height, color = '#333', collidable = true) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.collidable = collidable;
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    setCollidable(state) {
      this.collidable = state;
    }
  }


  //PICTURE UPLOAD
  const spriteSheet = new Image();
  spriteSheet.src = 'spritesheet.png'; // Your uploaded file path
  //spriteSheet.src = 'pics/spritesheet.png'; // Your uploaded file path
  //const playerImg = new Image();
  //playerImg.src = 'pics/towerup.png'; // Put your uploaded PNG file path here
   
  //SPRITE SHEET INFO
  const frameWidth = 64;  // change according to your sprite
  const frameHeight = 64; // change according to your sprite


  const frameCount = 9;  // number of frames per row (columns)
  const directions = {
    up: 0,
    left: 1,
    down: 2,
    right: 3,
  };

   let currentFrame = 0;
   //let currentDirection = directions.down; // default facing down
   let lastTime = Date.now();

   let frameTimer = 0;
   const frameDuration = 100; // ms per frame
   //END SPRITE SHEET INFO

  //DEF PLAYER
  const player = {
    x: 50,
    y: 50,
    width: frameWidth,
    height: frameHeight,
    speed: 2,
    currentDirection: directions.down,
    moving: false,
   };


  // SET UP WALLS/BORDERS
  const doorHeight = 60;
  const doorY = canvas.height / 2 - doorHeight / 2;

  const wallTop = new Wall(200, 0, 20, doorY);
  const wallBottom = new Wall(200, doorY + doorHeight, 20, canvas.height - (doorY + doorHeight));
  const door = new Wall(200, doorY, 20, doorHeight, '#884400', true);
  door.open = false;

  const wallLeft = new Wall(0, 0, 10, canvas.height);
  const wallRight = new Wall(canvas.width - 10, 0, 10, canvas.height);
  const wallTopEdge = new Wall(0, 0, canvas.width, 10);
  const wallBottomEdge = new Wall(0, canvas.height - 10, canvas.width, 10);

  //DEFINE WALLS
  const walls = [
    wallTop,
    wallBottom,
    door,
    wallLeft,
    wallRight,
    wallTopEdge,
    wallBottomEdge
  ];

  //MOVEMENT / CONTROLS
  const keys = {};

  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'e') {
      door.open = !door.open;
      door.setCollidable(!door.open);
      door.color = door.open ? '#555' : '#884400';
    }
  });

  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  function isColliding(px, py, ps, obj) {
    return (
      px < obj.x + obj.width &&
      px + ps > obj.x &&
      py < obj.y + obj.height &&
      py + ps > obj.y
    );
  }



  function update() {
    let now = Date.now();
    let elapsed = now-lastTime;
    lastTime = now;

    let nextX = player.x;
    let nextY = player.y;
    player.moving = false;

    if (keys['arrowup'] || keys['w']) {
        nextY -= player.speed;
        player.currentDirection = directions.up;
        player.moving = true;
    }
    if (keys['arrowdown'] || keys['s']) {
        nextY += player.speed;
        player.currentDirection = directions.down;
        player.moving = true;
    }
    if (keys['arrowleft'] || keys['a']) {
        nextX -= player.speed;
        player.currentDirection = directions.left;
        player.moving = true;
    }
    if (keys['arrowright'] || keys['d']) {
        nextX += player.speed;
        player.currentDirection = directions.right;
        player.moving = true;
    }

    let blocked = false;
    for (const wall of walls) {
      if (wall.collidable && isColliding(nextX, nextY, player.size, wall)) {
        blocked = true;
        break;
      }
    }

    if (player.moving) {
        //moving animation continues regardless
        frameTimer += elapsed;
        if (frameTimer > frameDuration) {
            frameTimer = 0;
            currentFrame = (currentFrame + 1) % frameCount;
        }

        //doesnt move if blocked by wall or sum
        if (!blocked) {
            player.x = nextX;
            player.y = nextY;
        }
    } else {
        frameTimer = 0;
        currentFrame = 0;
    }

  }


  function drawPlayer(ctx) {
    ctx.drawImage(
        spriteSheet,
        currentFrame * frameWidth,
        player.currentDirection * frameHeight,
        frameWidth,
        frameHeight,
        player.x,
        player.y,
        player.width,
        player.height
    );
   }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const wall of walls) {
      wall.draw(ctx);
    }

    drawPlayer(ctx);

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press E to open/close door', 10, canvas.height - 10);
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
