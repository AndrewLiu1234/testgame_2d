window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

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

  const player = {
    x: 50,
    y: 50,
    size: 30,
    speed: 3
  };

  // Load player image sprite
  const playerImg = new Image();
  playerImg.src = 'pics/towerup.png'; // Put your uploaded PNG file path here

  // Walls and door setup (same as before)
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

  const walls = [
    wallTop,
    wallBottom,
    door,
    wallLeft,
    wallRight,
    wallTopEdge,
    wallBottomEdge
  ];

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
    let nextX = player.x;
    let nextY = player.y;

    if (keys['arrowup'] || keys['w']) nextY -= player.speed;
    if (keys['arrowdown'] || keys['s']) nextY += player.speed;
    if (keys['arrowleft'] || keys['a']) nextX -= player.speed;
    if (keys['arrowright'] || keys['d']) nextX += player.speed;

    let blocked = false;
    for (const wall of walls) {
      if (wall.collidable && isColliding(nextX, nextY, player.size, wall)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      player.x = nextX;
      player.y = nextY;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const wall of walls) {
      wall.draw(ctx);
    }

    // Draw player image if loaded, else fallback to rectangle
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
      ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
    } else {
      ctx.fillStyle = '#ffdd57';
      ctx.fillRect(player.x, player.y, player.size, player.size);
    }

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
