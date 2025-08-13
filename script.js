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

  class NPC {
    constructor(x, y, spriteSrc, frameWidth, frameHeight, frameCount, name, dialogueLines) {
      this.x = x;
      this.y = y;
      this.width = frameWidth;
      this.height = frameHeight;
      this.name = name;
      this.dialogueLines = dialogueLines;
      this.dialogueIndex = 0;

      this.spriteSheet = new Image();
      this.spriteSheet.src = spriteSrc;
      this.frameWidth = frameWidth;
      this.frameHeight = frameHeight;
      this.frameCount = frameCount;

      this.currentFrame = 0;
      this.frameTimer = 0;
      this.frameInterval = 200;
      this.talking = false;
    }

    isNear(player, range = 70) {
      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      return Math.sqrt(dx * dx + dy * dy) < range;
    }

    getNextDialogue() {
      const text = `${this.name}: ${this.dialogueLines[this.dialogueIndex]}`;
      this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueLines.length;
      this.talking = true;
      return text;
    }

    stopTalking() {
      this.talking = false;
      this.currentFrame = 0;
    }

    update(deltaTime) {
      if (this.talking) {
        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameInterval) {
          this.currentFrame = (this.currentFrame + 1) % this.frameCount;
          this.frameTimer = 0;
        }
      } else {
        this.currentFrame = 0;
      }
    }

    draw(ctx) {
      ctx.drawImage(
        this.spriteSheet,
        this.currentFrame * this.frameWidth, 0,
        this.frameWidth, this.frameHeight,
        this.x, this.y,
        this.width, this.height
      );
    }
  }

  const spriteSheet = new Image();
  spriteSheet.src = 'pics/spritesheet.png';
  const frameWidth = 64;
  const frameHeight = 64;
  const frameCount = 9;
  const directions = { up: 0, left: 1, down: 2, right: 3 };

  const player = new Player(50, 50, 2, spriteSheet, frameWidth, frameHeight, frameCount, directions);

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

  // Updated NPCs with spritesheet sources
  const npcs = [
    new NPC(300, 100, 'pics/npcSprites/captainZoom.png', 32, 32, 4, 'Professor Quirk', [
      "I swear these rocks are whispering secrets.",
      "Last night, I heard them plotting a heist.",
      "Do you think I'm losing it? Maybe..."
    ]),
    new NPC(100, 300, 'pics/npcSprites/captainZoom.png', 32, 32, 4, 'Ms. Noodle', [
      "Spaghetti is the key to life, trust me!",
      "Linguine? Overrated.",
      "Macaroni knows all my secrets."
    ]),
    new NPC(450, 350, 'pics/npcSprites/captainZoom.png', 32, 32, 4, 'Captain Zoom', [
      "Speed is everything, but where’s my spaceship?",
      "It was here a second ago...",
      "Do you think the rocks took it?"
    ])
  ];

  const keys = {};
  let paused = false;
  let debugMode = false;

  const dialogueBox = document.getElementById('dialogueBox');
  const dialogueText = document.getElementById('dialogueText');
  const interactionHint = document.getElementById('interactionHint');

  let activeNPC = null;
  let nearbyNPC = null;

  function checkNpcProximity() {
    nearbyNPC = null;
    for (const npc of npcs) {
      if (npc.isNear(player)) {
        nearbyNPC = npc;
        break;
      }
    }
    if (!nearbyNPC && activeNPC) {
      activeNPC.stopTalking();
      activeNPC = null;
      dialogueBox.style.display = 'none';
    }
  }

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'e') door.toggle();
    if (key === 'p') paused = !paused;
    if (key === 't') debugMode = !debugMode;

    if (key === 'enter') {
      if (nearbyNPC && !activeNPC) {
        activeNPC = nearbyNPC;
        dialogueText.textContent = activeNPC.getNextDialogue();
        dialogueBox.style.display = 'block';
      } else if (activeNPC) {
        dialogueText.textContent = activeNPC.getNextDialogue();
      }
    }
  });

  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

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

    walls.forEach(wall => wall.draw(ctx));

    npcs.forEach(npc => npc.draw(ctx));

    player.draw(ctx);

    if (debugMode) drawDebug(ctx);

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press E to open/close door | P to pause | T to toggle debug', 10, canvas.height - 10);

    if (nearbyNPC && !activeNPC) {
      interactionHint.style.display = 'block';
    } else {
      interactionHint.style.display = 'none';
    }
  }

  let lastTime = Date.now();
  function update() {
    const now = Date.now();
    const elapsed = now - lastTime;
    lastTime = now;

    if (!paused) {
      player.move(elapsed, keys, walls);
      npcs.forEach(npc => npc.update(elapsed));
    }
    checkNpcProximity();
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
