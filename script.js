window.addEventListener('DOMContentLoaded', () => {

  /*** =========
   * CANVAS SETUP
   * ========= */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  /*** =========
   * CLASSES
   * ========= */
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

  /*** =========
   * SPRITE SETUP
   * ========= */
  const spriteSheet = new Image();
  spriteSheet.src = 'pics/spritesheet.png';

  const frameWidth = 64;
  const frameHeight = 64;
  const frameCount = 9;
  const directions = { up: 0, left: 1, down: 2, right: 3 };

  let currentFrame = 0;
  let lastTime = Date.now();
  let frameTimer = 0;
  const frameDuration = 100; // ms per frame

  /*** =========
   * PLAYER SETUP
   * ========= */
  const player = {
    x: 50,
    y: 50,
    width: frameWidth,
    height: frameHeight,
    speed: 2,
    currentDirection: directions.down,
    moving: false,
  };

  /*** =========
   * WALLS & DOOR
   * ========= */
  const doorHeight = 100;
  const doorY = canvas.height / 2 - doorHeight / 2;

  const wallTop = new Wall(200, 0, 20, doorY);
  const wallBottom = new Wall(200, doorY + doorHeight, 20, canvas.height - (doorY + doorHeight));
  const door = new Wall(200, doorY, 20, doorHeight, '#884400', true);
  door.open = false;

  const wallLeft = new Wall(0, 0, 10, canvas.height);
  const wallRight = new Wall(canvas.width - 10, 0, 10, canvas.height);
  const wallTopEdge = new Wall(0, 0, canvas.width, 10);
  const wallBottomEdge = new Wall(0, canvas.height - 10, canvas.width, 10);

  const walls = [wallTop, wallBottom, door, wallLeft, wallRight, wallTopEdge, wallBottomEdge];

  /*** =========
   * INPUT HANDLING
   * ========= */
  const keys = {};
  let paused = false;
  let debugMode = false;

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'e') { // toggle door
      door.open = !door.open;
      door.setCollidable(!door.open);
      door.color = door.open ? '#555' : '#884400';
    }
    if (key === 'p') { // pause game
      paused = !paused;
    }
    if (key === 't') { // toggle debug mode
      debugMode = !debugMode;
    }
  });

  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  /*** =========
   * HELPER FUNCTIONS
   * ========= */
  function isColliding(px, py, pw, ph, obj) {
    return (
      px < obj.x + obj.width &&
      px + pw > obj.x &&
      py < obj.y + obj.height &&
      py + ph > obj.y
    );
  }

  function movePlayer(elapsed) {
    let nextX = player.x;
    let nextY = player.y;
    player.moving = false;

    // Determine movement vector
    let dx = 0, dy = 0;
    if (keys['arrowup'] || keys['w']) { dy -= 1; player.currentDirection = directions.up; }
    if (keys['arrowdown'] || keys['s']) { dy += 1; player.currentDirection = directions.down; }
    if (keys['arrowleft'] || keys['a']) { dx -= 1; player.currentDirection = directions.left; }
    if (keys['arrowright'] || keys['d']) { dx += 1; player.currentDirection = directions.right; }

    // Normalize diagonal movement
    if (dx !== 0 || dy !== 0) {
      player.moving = true;
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / length) * player.speed;
      dy = (dy / length) * player.speed;
    }

    nextX += dx;
    nextY += dy;

    // Collision detection
    let blocked = walls.some(wall => wall.collidable && isColliding(nextX, nextY, player.width, player.height, wall));

    // Animation frame update
    if (player.moving) {
      frameTimer += elapsed;
      if (frameTimer > frameDuration) {
        frameTimer = 0;
        currentFrame = (currentFrame + 1) % frameCount;
      }
      if (!blocked) {
        player.x = nextX;
        player.y = nextY;
      }
    } else {
      frameTimer = 0;
      currentFrame = 0;
    }
  }

  /*** =========
   * DRAW FUNCTIONS
   * ========= */
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

  function drawHUD(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`X: ${Math.floor(player.x)}, Y: ${Math.floor(player.y)}`, 10, 20);
    ctx.fillText(`Dir: ${Object.keys(directions).find(k => directions[k] === player.currentDirection)}`, 10, 40);
    ctx.fillText(`Paused: ${paused}`, 10, 60);
  }

  function drawDebug(ctx) {
    ctx.strokeStyle = 'red';
    for (const wall of walls) {
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const wall of walls) {
      wall.draw(ctx);
    }

    drawPlayer(ctx);
    //drawHUD(ctx);

    if (debugMode) drawDebug(ctx);

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press E to open/close door', 10, canvas.height - 10);
  }

  /*** =========
   * GAME LOOP
   * ========= */
  function update() {
    let now = Date.now();
    let elapsed = now - lastTime;
    lastTime = now;

    if (!paused) {
      movePlayer(elapsed);
    }
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();

});
