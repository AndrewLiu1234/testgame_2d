window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  /*** =========
   * WALL CLASS
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
   * DOOR CLASS
   * ========= */
  class Door extends Wall {
    constructor(x, y, width, height, closedColor = '#884400', openColor = '#555') {
      super(x, y, width, height, closedColor, true);
      this.closedColor = closedColor;
      this.openColor = openColor;
      this.open = false;
    }
    toggle() {
      this.open = !this.open;
      this.setCollidable(!this.open);
      this.color = this.open ? this.openColor : this.closedColor;
    }
  }

  /*** =========
   * PLAYER CLASS
   * ========= */
  class Player {
    constructor(x, y, speed, spriteSheet, frameWidth, frameHeight, frameCount, directions) {
      this.x = x;
      this.y = y;
      this.width = frameWidth;
      this.height = frameHeight;
      this.speed = speed;
      this.spriteSheet = spriteSheet;
      this.frameWidth = frameWidth;
      this.frameHeight = frameHeight;
      this.frameCount = frameCount;
      this.directions = directions;
      this.currentDirection = directions.down;
      this.moving = false;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.frameDuration = 100;
    }

    isColliding(px, py, pw, ph, obj) {
      return (
        px < obj.x + obj.width &&
        px + pw > obj.x &&
        py < obj.y + obj.height &&
        py + ph > obj.y
      );
    }

    move(elapsed, keys, walls) {
      let nextX = this.x;
      let nextY = this.y;
      this.moving = false;

      let dx = 0, dy = 0;
      if (keys['arrowup'] || keys['w']) { dy -= 1; this.currentDirection = this.directions.up; }
      if (keys['arrowdown'] || keys['s']) { dy += 1; this.currentDirection = this.directions.down; }
      if (keys['arrowleft'] || keys['a']) { dx -= 1; this.currentDirection = this.directions.left; }
      if (keys['arrowright'] || keys['d']) { dx += 1; this.currentDirection = this.directions.right; }

      if (dx !== 0 || dy !== 0) {
        this.moving = true;
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length) * this.speed;
        dy = (dy / length) * this.speed;
      }

      nextX += dx;
      nextY += dy;

      const blocked = walls.some(wall => wall.collidable && this.isColliding(nextX, nextY, this.width, this.height, wall));

      if (this.moving) {
        this.frameTimer += elapsed;
        if (this.frameTimer > this.frameDuration) {
          this.frameTimer = 0;
          this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
        if (!blocked) {
          this.x = nextX;
          this.y = nextY;
        }
      } else {
        this.frameTimer = 0;
        this.currentFrame = 0;
      }
    }

    draw(ctx) {
      ctx.drawImage(
        this.spriteSheet,
        this.currentFrame * this.frameWidth,
        this.currentDirection * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  /*** =========
   * NPC CLASS
   * ========= */
  class NPC {
    constructor(x, y, color, name, dialogue) {
      this.x = x;
      this.y = y;
      this.width = 40;
      this.height = 40;
      this.color = color;
      this.name = name;
      this.dialogue = dialogue; // array of strings
    }
    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    getRandomLine() {
      const index = Math.floor(Math.random() * this.dialogue.length);
      return this.dialogue[index];
    }
    isNear(player, range = 50) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      return Math.sqrt(dx * dx + dy * dy) < range;
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

  /*** =========
   * PLAYER INSTANCE
   * ========= */
  const player = new Player(50, 50, 2, spriteSheet, frameWidth, frameHeight, frameCount, directions);

  /*** =========
   * WALLS & DOOR
   * ========= */
  const doorHeight = 100;
  const doorY = canvas.height / 2 - doorHeight / 2;
  const wallTop = new Wall(200, 0, 20, doorY);
  const wallBottom = new Wall(200, doorY + doorHeight, 20, canvas.height - (doorY + doorHeight));
  const door = new Door(200, doorY, 20, doorHeight);
  const wallLeft = new Wall(0, 0, 10, canvas.height);
  const wallRight = new Wall(canvas.width - 10, 0, 10, canvas.height);
  const wallTopEdge = new Wall(0, 0, canvas.width, 10);
  const wallBottomEdge = new Wall(0, canvas.height - 10, canvas.width, 10);

  const walls = [wallTop, wallBottom, door, wallLeft, wallRight, wallTopEdge, wallBottomEdge];

  /*** =========
   * NPC INSTANCES
   * ========= */
  const npcs = [
    new NPC(300, 150, '#0088ff', 'Professor Quirk', [
      "Did you know I once taught a rock to whistle?",
      "The moon is just Earth's hat.",
      "I’m allergic to Tuesdays.",
    ]),
    new NPC(100, 300, '#ff00aa', 'Ms. Noodle', [
      "Spaghetti is just long bread if you think about it.",
      "I own seventeen identical hats.",
      "Bananas are just upside-down moons.",
    ])
  ];

  /*** =========
   * INPUT
   * ========= */
  const keys = {};
  let paused = false;
  let debugMode = false;
  let currentDialogue = null; // {name, text}

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'e') {
      door.toggle();
    }
    if (key === 'p') {
      paused = !paused;
    }
    if (key === 't') {
      debugMode = !debugMode;
    }
    if (key === 'f') {
      // talk to nearest NPC if in range
      const nearby = npcs.find(npc => npc.isNear(player));
      if (nearby) {
        currentDialogue = {
          name: nearby.name,
          text: nearby.getRandomLine()
        };
      }
    }
  });

  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  /*** =========
   * DRAW
   * ========= */
  function drawDebug(ctx) {
    ctx.strokeStyle = 'red';
    for (const wall of walls) {
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
  }

  function drawDialogueBox(ctx, name, text) {
    const boxHeight = 80;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`${name}: ${text}`, 10, canvas.height - boxHeight + 25);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    walls.forEach(wall => wall.draw(ctx));
    npcs.forEach(npc => npc.draw(ctx));
    player.draw(ctx);

    // Show "Press F" when near NPC
    const nearby = npcs.find(npc => npc.isNear(player));
    if (nearby && !currentDialogue) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Press F to talk to ${nearby.name}`, 10, 20);
    }

    if (debugMode) drawDebug(ctx);
    if (currentDialogue) {
      drawDialogueBox(ctx, currentDialogue.name, currentDialogue.text);
    }
  }

  /*** =========
   * LOOP
   * ========= */
  let lastTime = Date.now();
  function update() {
    const now = Date.now();
    const elapsed = now - lastTime;
    lastTime = now;

    if (!paused) {
      player.move(elapsed, keys, walls);
    }
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
