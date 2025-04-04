
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const startBtn = document.getElementById("start-btn");
  const usernameInput = document.getElementById("username");
  const introScreen = document.getElementById("intro-screen");
  const gameContainer = document.getElementById("game-container");
  const muteBtn = document.getElementById("mute-btn");

  const playerImg = new Image();
  playerImg.src = "assets/player/runner.png";
  const orbImg = new Image();
  orbImg.src = "assets/orbs/network_orb.png";

  const bg1 = new Image(); bg1.src = "assets/bg/layer1_background.png";
  const bg2 = new Image(); bg2.src = "assets/bg/layer2_midground.png";
  const bg3 = new Image(); bg3.src = "assets/bg/layer3_ground.png";

  let music = new Audio("assets/sfx/music.mp3");
  let jumpSfx = new Audio("assets/sfx/jump.mp3");
  let collectSfx = new Audio("assets/sfx/collect.mp3");
  let hitSfx = new Audio("assets/sfx/hit.mp3");
  let powerupSfx = new Audio("assets/sfx/powerup.mp3");

  let muted = false;
  let username = "", score = 0, lives = 3, frame = 0, gameRunning = false;
  let player = { x: 100, y: 880, width: 64, height: 80, vy: 0, gravity: 1.5, jumpPower: -25 };
  let jumpCount = 0, boostActive = false, boostTimer = 0, orbTrail = [];
  let orbs = [], spikes = [], powerups = [], phase = 1, nextPhase = 500;
  let backgroundX1 = 0, backgroundX2 = 0;

  const leaderboard = JSON.parse(localStorage.getItem("vaultLeaderboard") || "[]");

  function playSound(sfx) { if (!muted) { sfx.currentTime = 0; sfx.play(); } }

  function drawBackground() {
    backgroundX1 -= 0.2; if (backgroundX1 <= -1920) backgroundX1 = 0;
    backgroundX2 -= 0.4; if (backgroundX2 <= -1920) backgroundX2 = 0;
    ctx.drawImage(bg1, backgroundX1, 0); ctx.drawImage(bg1, backgroundX1 + 1920, 0);
    ctx.drawImage(bg2, backgroundX2, 0); ctx.drawImage(bg2, backgroundX2 + 1920, 0);
    ctx.drawImage(bg3, 0, 0);
  }

  function drawPlayer() {
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 15;
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
  }

  function drawTrail() {
    orbTrail.forEach((t, i) => {
      ctx.fillStyle = `rgba(0,255,255,${t.alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
      ctx.fill();
      t.alpha -= 0.05;
      if (t.alpha <= 0) orbTrail.splice(i, 1);
    });
  }

  function drawHUD() {
    ctx.fillStyle = "#0ff";
    ctx.font = "24px Raleway";
    ctx.fillText("🏃 Vault ID: " + username, 30, 40);
    ctx.fillText("🪙 Score: " + score, 30, 70);
    ctx.fillText("🧬 Vault Phase: " + phase, 30, 100);
    ctx.fillText("💙".repeat(lives), 30, 130);
  }

  function spawnOrb() {
    orbs.push({ x: 1920, y: 720 - Math.random() * 400, r: 24 });
  }

  function spawnSpike() {
    spikes.push({ x: 1920, y: 960 - 60, w: 60, h: 60 });
  }

  function spawnPowerup() {
    const types = ["shield", "slowmo", "heart"];
    const type = types[Math.floor(Math.random() * types.length)];
    const emoji = type === "shield" ? "🛡️" : type === "slowmo" ? "🐢" : "💙";
    powerups.push({ x: 1920, y: 800 - Math.random() * 300, type, emoji });
  }

  function drawAchievements(text) {
    ctx.fillStyle = "#fff";
    ctx.font = "32px Raleway";
    ctx.fillText("✅ " + text, canvas.width / 2 - 100, 100);
  }

  function endGame() {
    gameRunning = false;
    playSound(hitSfx);
    leaderboard.push({ user: username, score: score });
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem("vaultLeaderboard", JSON.stringify(leaderboard.slice(0, 5)));
    setTimeout(() => {
      let message = `💀 GAME OVER\n\n🏆 Score: ${score}\n🔐 Vault Phase: ${phase}\n\nTop Runners:\n`;
      leaderboard.slice(0, 5).forEach((e, i) => {
        message += `#${i + 1}: ${e.user} - ${e.score}\n`;
      });
      if (confirm(message + "\nPlay Again?")) location.reload();
    }, 500);
  }

  function gameLoop() {
    if (!gameRunning) return;
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Boost
    if (boostActive) {
      boostTimer--;
      orbTrail.push({ x: player.x + 30, y: player.y + 40, alpha: 1 });
      if (boostTimer <= 0) boostActive = false;
    }

    // Gravity
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.height > 960) {
      player.y = 960 - player.height;
      player.vy = 0;
      jumpCount = 0;
    }

    drawTrail();
    drawPlayer();
    drawHUD();

    // Orbs
    if (frame % 60 === 0) spawnOrb();
    orbs.forEach((orb, i) => {
      orb.x -= 6;
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.drawImage(orbImg, orb.x - orb.r / 2, orb.y - orb.r / 2, orb.r, orb.r);
      ctx.shadowBlur = 0;
      if (player.x < orb.x + orb.r && player.x + player.width > orb.x - orb.r &&
          player.y < orb.y + orb.r && player.y + player.height > orb.y - orb.r) {
        score += 10;
        orbs.splice(i, 1);
        playSound(collectSfx);
      }
    });

    // Powerups
    if (frame % 700 === 0) spawnPowerup();
    powerups.forEach((p, i) => {
      p.x -= 6;
      ctx.font = "28px Raleway";
      ctx.fillText(p.emoji, p.x, p.y);
      if (player.x < p.x + 30 && player.x + player.width > p.x &&
          player.y < p.y + 30 && player.y + player.height > p.y) {
        powerups.splice(i, 1);
        playSound(powerupSfx);
        if (p.type === "shield") {
          boostActive = true;
          boostTimer = 100;
          drawAchievements("Supercollateral Activated!");
        } else if (p.type === "slowmo") {
          drawAchievements("CDP Protocol Engaged");
          setTimeout(() => {}, 500);
        } else if (p.type === "heart" && lives < 3) {
          lives++;
          drawAchievements("Heart Restored");
        }
      }
    });

    // Spikes
    if (frame % 150 === 0) spawnSpike();
    spikes.forEach((s, i) => {
      s.x -= 6;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      if (player.x < s.x + s.w && player.x + player.width > s.x &&
          player.y < s.y + s.h && player.y + player.height > s.y) {
        spikes.splice(i, 1);
        lives--;
        playSound(hitSfx);
        if (lives <= 0) endGame();
      }
    });

    // Vault Phase
    if (score >= nextPhase) {
      phase++;
      nextPhase += 500;
      drawAchievements("Dynamic Repayment Vault Unlocked!");
    }

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && jumpCount < 2) {
      player.vy = jumpCount === 0 ? player.jumpPower : player.jumpPower * 1.2;
      jumpCount++;
      playSound(jumpSfx);
    }
    if (e.code === "ShiftLeft" && !boostActive) {
      boostActive = true;
      boostTimer = 60;
    }
  });

  startBtn.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (!username) return;
    introScreen.style.display = "none";
    gameContainer.style.display = "block";
    gameRunning = true;
    music.loop = true;
    if (!muted) music.play();
    gameLoop();
  });

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    muteBtn.textContent = muted ? "🔇" : "🔊";
    if (muted) music.pause(); else music.play();
  });
});
