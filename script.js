const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const dialogueBox = document.getElementById("dialogueBox");
const dialogueText = document.getElementById("dialogueText");

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 32;
    this.speed = 3;
    this.color = "dodgerblue";
  }

  move(keys) {
    if (keys["w"] || keys["ArrowUp"]) this.y -= this.speed;
    if (keys["s"] || keys["ArrowDown"]) this.y += this.speed;
    if (keys["a"] || keys["ArrowLeft"]) this.x -= this.speed;
    if (keys["d"] || keys["ArrowRight"]) this.x += this.speed;

    // Clamp inside canvas bounds
    this.x = Math.max(0, Math.min(canvas.width - this.size, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.size, this.y));
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// NPC class
class NPC {
  constructor(x, y, color, name, dialogue) {
    this.x = x;
    this.y = y;
    this.size = 32;
    this.color = color;
    this.name = name;
    this.dialogue = dialogue;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  isNear(player, range = 50) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < range;
  }
}

// Initialize player & NPCs
const player = new Player(50, 50);
const npcs = [
  new NPC(300, 100, "crimson", "Professor Quirk", "I swear these rocks are whispering secrets."),
  new NPC(150, 250, "purple", "Ms. Noodle", "Spaghetti is the key to life, trust me!"),
  new NPC(450, 300, "orange", "Captain Zoom", "Speed is everything, but where’s my spaceship?")
];

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let currentDialogue = null;
let activeNPC = null;

function update() {
  player.move(keys);

  // Check for NPC proximity
  let foundNPC = null;
  for (const npc of npcs) {
    if (npc.isNear(player)) {
      foundNPC = npc;
      break;
    }
  }

  if (foundNPC) {
    if (activeNPC !== foundNPC) {
      // New NPC approached — show their dialogue
      activeNPC = foundNPC;
      currentDialogue = foundNPC.dialogue;
      dialogueBox.style.display = "block";
      dialogueText.textContent = `${foundNPC.name}: ${currentDialogue}`;
    }
  } else {
    // No NPC nearby — hide dialogue
    activeNPC = null;
    currentDialogue = null;
    dialogueBox.style.display = "none";
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.draw(ctx);

  for (const npc of npcs) {
    npc.draw(ctx);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
