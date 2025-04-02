
const startBtn = document.getElementById("start-btn");
const usernameInput = document.getElementById("username");
const introScreen = document.getElementById("intro-screen");
const gameContainer = document.getElementById("game-container");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let username = "";
let player, groundY, score, orbs, spikes, trail, boostActive, boostTimer, keys = {};
let currentPhase = 1;
let nextPhaseScore = 500;
let phaseFlash = 0;

const sounds = {
  jump: new Audio("assets/sounds/jump.mp3"),
  orb: new Audio("assets/sounds/orb.mp3"),
  boost: new Audio("assets/sounds/boost.mp3"),
  fail: new Audio("assets/sounds/fail.mp3"),
  phase: new Audio("assets/sounds/phase.mp3")
};
Object.values(sounds).forEach(s => s.volume = 0.5);

// Mute toggle
const muteToggle = document.createElement("button");
muteToggle.textContent = "🔊";
muteToggle.style.position = "absolute";
muteToggle.style.top = "20px";
muteToggle.style.right = "30px";
muteToggle.style.background = "transparent";
muteToggle.style.border = "2px solid #0ff";
muteToggle.style.color = "#0ff";
muteToggle.style.padding = "0.5rem";
muteToggle.style.borderRadius = "10px";
muteToggle.style.cursor = "pointer";
muteToggle.style.fontSize = "1.2rem";
muteToggle.style.zIndex = 9999;
document.body.appendChild(muteToggle);

let muted = false;
muteToggle.addEventListener("click", () => {
  muted = !muted;
  Object.values(sounds).forEach(s => s.muted = muted);
  muteToggle.textContent = muted ? "🔇" : "🔊";
});

// Phase banner
const phaseBanner = document.createElement("div");
phaseBanner.id = "phase-banner";
phaseBanner.style.position = "absolute";
phaseBanner.style.top = "50%";
phaseBanner.style.left = "50%";
phaseBanner.style.transform = "translate(-50%, -50%)";
phaseBanner.style.padding = "1rem 2rem";
phaseBanner.style.fontSize = "2rem";
phaseBanner.style.border = "2px solid #0ff";
phaseBanner.style.color = "#0ff";
phaseBanner.style.background = "rgba(0, 0, 0, 0.75)";
phaseBanner.style.borderRadius = "20px";
phaseBanner.style.boxShadow = "0 0 30px #0ff";
phaseBanner.style.zIndex = "1000";
phaseBanner.style.display = "none";
phaseBanner.style.fontFamily = "Raleway";
document.body.appendChild(phaseBanner);

function showPhaseBanner(phase) {
  phaseBanner.textContent = `Vault Phase ${phase}`;
  phaseBanner.style.display = "block";
  setTimeout(() => {
    phaseBanner.style.display = "none";
  }, 2000);
}

const playerImg = new Image();
playerImg.src = "assets/player/runner_vault_neon.png";

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
  spikes = [];
  trail = [];
  boostActive = false;
  boostTimer = 0;

  player = {
    x: 100,
    y: groundY - 100,
    width: 60,
    height: 80,
    vy: 0,
    gravity: 1.5,
    jumpPower: -25,
    grounded: false
  };

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "ShiftLeft" && !boostActive) {
    boostActive = true;
    boostTimer = 60;
    sounds.boost.play();
  }
});
window.addEventListener("keyup", e => keys[e.code] = false);

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#022";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

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
    sounds.jump.play();
  }

  if (boostActive) {
    boostTimer--;
    if (boostTimer <= 0) boostActive = false;
    trail.push({ x: player.x + 10, y: player.y + 40, alpha: 1 });
  }

  for (let i = trail.length - 1; i >= 0; i--) {
    const t = trail[i];
    ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
    ctx.fill();
    t.alpha -= 0.05;
    if (t.alpha <= 0) trail.splice(i, 1);
  }

  ctx.save();
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = boostActive ? 30 : 10;
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  ctx.restore();

  if (Math.random() < 0.02) {
    orbs.push({ x: canvas.width + 30, y: groundY - 100 - Math.random() * 200, r: 12 });
  }

  ctx.fillStyle = "#0f0";
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.x -= boostActive ? 10 : 5;
    ctx.beginPath();
    ctx.shadowColor = "#0f0";
    ctx.shadowBlur = 15;
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (
      player.x < o.x + o.r &&
      player.x + player.width > o.x - o.r &&
      player.y < o.y + o.r &&
      player.y + player.height > o.y - o.r
    ) {
      score += 10;
      sounds.orb.play();
      orbs.splice(i, 1);
    }
  }

  if (Math.random() < 0.01) {
    spikes.push({ x: canvas.width + 20, y: groundY - 30, w: 30, h: 30 });
  }

  ctx.fillStyle = "#f00";
  for (let i = spikes.length - 1; i >= 0; i--) {
    const s = spikes[i];
    s.x -= boostActive ? 10 : 5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.h);
    ctx.lineTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x + s.w, s.y + s.h);
    ctx.closePath();
    ctx.fill();

    if (
      player.x < s.x + s.w &&
      player.x + player.width > s.x &&
      player.y < s.y + s.h &&
      player.y + player.height > s.y
    ) {
      sounds.fail.play();
      endGame();
    }
  }

  if (score >= nextPhaseScore) {
    currentPhase++;
    nextPhaseScore += 500;
    phaseFlash = 40;
    sounds.phase.play();
    showPhaseBanner(currentPhase);
  }

  if (phaseFlash > 0) {
    ctx.save();
    ctx.globalAlpha = phaseFlash / 40;
    ctx.fillStyle = "#0ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    phaseFlash--;
  }

  ctx.fillStyle = "#0ff";
  ctx.font = "24px Raleway";
  ctx.fillText("Runner: " + username, 30, 40);
  ctx.fillText("Score: " + score, 30, 70);
  ctx.fillText("Vault Phase: " + currentPhase, 30, 100);

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  setTimeout(() => alert("You fell! Final score: " + score), 300);
  setTimeout(() => location.reload(), 1500);
}
