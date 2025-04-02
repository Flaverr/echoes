const startBtn = document.getElementById("start-btn");
const usernameInput = document.getElementById("username");
const introScreen = document.getElementById("intro-screen");
const gameContainer = document.getElementById("game-container");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let username = "";
let player, groundY, score, orbs, keys = {};

startBtn.addEventListener("click", () => {
  username = usernameInput.value.trim();
  if (username === "") return;
  introScreen.style.display = "none";
  gameContainer.style.display = "block";
  startGame();
});

function startGame() {
  gameRunning = true;
  score = 0;
  groundY = 960;
  orbs = [];
  player = {
    x: 100,
    y: groundY - 60,
    width: 40,
    height: 60,
    vy: 0,
    gravity: 1.2,
    jumpPower: -20,
    grounded: false
  };
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background and ground
  ctx.fillStyle = "#033";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Player physics
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  if ((keys["Space"] || keys["ArrowUp"]) && player.grounded) {
    player.vy = player.jumpPower;
  }

  ctx.fillStyle = "#0ff";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Orbs
  if (Math.random() < 0.02) {
    orbs.push({
      x: canvas.width + 20,
      y: groundY - 80 - Math.random() * 200,
      r: 10
    });
  }

  ctx.fillStyle = "#0f0";
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    orb.x -= 6;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();

    if (
      player.x < orb.x + orb.r &&
      player.x + player.width > orb.x - orb.r &&
      player.y < orb.y + orb.r &&
      player.y + player.height > orb.y - orb.r
    ) {
      score += 10;
      orbs.splice(i, 1);
    }
  }

  ctx.fillStyle = "#0ff";
  ctx.font = "24px Raleway";
  ctx.fillText("Runner: " + username, 30, 40);
  ctx.fillText("Score: " + score, 30, 70);

  requestAnimationFrame(gameLoop);
}
