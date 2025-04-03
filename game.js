
document.addEventListener("DOMContentLoaded", () => {
const startBtn = document.getElementById("start-btn");
const usernameInput = document.getElementById("username");
const introScreen = document.getElementById("intro-screen");
const gameContainer = document.getElementById("game-container");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let frameCount = 0;
let username = "";
let player, groundY, score, orbs, spikes, trail, boostActive, boostTimer, keys = {};
let currentPhase = 1;
let nextPhaseScore = 500;
let phaseFlash = 0;
let jumpCount = 0;

// Background layers for parallax
const layer1 = new Image(); layer1.src = "assets/bg/layer1_background.png";
const layer2 = new Image(); layer2.src = "assets/bg/layer2_midground.png";
const layer3 = new Image(); layer3.src = "assets/bg/layer3_foreground.png";
let x1 = 0, x2 = 0, x3 = 0;

const sounds = {
  jump: new Audio("assets/sounds/jump.mp3"),
  orb: new Audio("assets/sounds/orb.mp3"),
  boost: new Audio("assets/sounds/boost.mp3"),
  fail: new Audio("assets/sounds/fail.mp3"),
  phase: new Audio("assets/sounds/phase.mp3")
};
Object.values(sounds).forEach(s => s.volume = 0.5);

const playerImg = new Image();
playerImg.src = "assets/player/runner_vault_neon.png";

const orbImg = new Image();
orbImg.src = "assets/orbs/network_orb.png";

const obsImg = new Image();
obsImg.src = "assets/obstacles/chain_trap.png";

const muteToggle = document.createElement("button");
muteToggle.textContent = "🔊";
muteToggle.style.cssText = "position:absolute;top:20px;right:30px;background:transparent;border:2px solid #0ff;color:#0ff;padding:0.5rem;border-radius:10px;cursor:pointer;font-size:1.2rem;z-index:9999;";
document.body.appendChild(muteToggle);

let muted = false;
muteToggle.addEventListener("click", () => {
  muted = !muted;
  Object.values(sounds).forEach(s => s.muted = muted);
  muteToggle.textContent = muted ? "🔇" : "🔊";
});

const phaseBanner = document.createElement("div");
phaseBanner.id = "phase-banner";
phaseBanner.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:1rem 2rem;font-size:2rem;border:2px solid #0ff;color:#0ff;background:rgba(0,0,0,0.75);border-radius:20px;box-shadow:0 0 30px #0ff;z-index:1000;display:none;font-family:Raleway";
document.body.appendChild(phaseBanner);

function showPhaseBanner(phase) {
  phaseBanner.textContent = `Vault Phase ${phase}`;
  phaseBanner.style.display = "block";
  setTimeout(() => phaseBanner.style.display = "none", 2000);
}

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
  jumpCount = 0;

  player = {
    x: 100,
    y: groundY - 100,
    width: 60,
    height: 80,
    vy: 0,
    gravity: 1.5,
    jumpPower: -25,
    grounded: false,
    bob: 0
  };

  requestAnimationFrame(gameLoop);
  } catch (e) { console.error("Game crashed:", e); }
}

window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "ShiftLeft" && !boostActive) {
    boostActive = true;
    boostTimer = 60;
    sounds.boost.play();
  }
  if ((e.code === "Space" || e.code === "ArrowUp") && jumpCount < 2) {
    player.vy = jumpCount === 0 ? player.jumpPower : player.jumpPower * 1.3;
    sounds.jump.play();
    jumpCount++;
  }
});
window.addEventListener("keyup", e => keys[e.code] = false);

function drawParallax() {
  x1 -= 0.3;
  x2 -= 0.6;
  x3 -= 1.2;
  if (x1 <= -1920) x1 = 0;
  if (x2 <= -1920) x2 = 0;
  if (x3 <= -1920) x3 = 0;
  ctx.drawImage(layer1, x1, 0); ctx.drawImage(layer1, x1 + 1920, 0);
  ctx.drawImage(layer2, x2, 0); ctx.drawImage(layer2, x2 + 1920, 0);
  ctx.drawImage(layer3, 0, 0); // foreground layer fixed
}

function gameLoop() {
  try {
  frameCount++;
  if (!gameRunning) return;
  drawParallax();
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.grounded = true;
    jumpCount = 0;
  } else {
    player.grounded = false;
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

  player.bob += 0.2;
  const bobOffset = Math.sin(player.bob) * 2;
  const leanOffset = Math.sin(player.bob * 2) * 4;

  ctx.save();
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = boostActive ? 30 : 10;
  ctx.drawImage(playerImg, player.x + leanOffset, player.y + bobOffset, player.width, player.height);
  ctx.restore();

  if (Math.random() < 0.02) {
    orbs.push({ x: canvas.width + 30, y: groundY - 100 - Math.random() * 200, r: 24 });
  }

  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.x -= boostActive ? 10 : 5;
    ctx.drawImage(orbImg, o.x - o.r / 2, o.y - o.r / 2, o.r, o.r);
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

  if (frameCount > 300 && Math.random() < 0.015) {
    spikes.push({ x: canvas.width + 30, y: groundY - 60, w: 60, h: 60 });
  }

  for (let i = spikes.length - 1; i >= 0; i--) {
    const s = spikes[i];
    s.x -= boostActive ? 10 : 5;
    ctx.drawImage(obsImg, s.x, s.y, s.w, s.h);
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
  } catch (e) { console.error("Game crashed:", e); }
}

function endGame() {
  gameRunning = false;
  setTimeout(() => alert("You fell! Final score: " + score), 300);
  setTimeout(() => location.reload(), 1500);
}
});
