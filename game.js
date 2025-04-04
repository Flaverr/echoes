// game.js
window.onload = () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const intro = document.getElementById("intro");
  const startBtn = document.getElementById("start-btn");
  const usernameInput = document.getElementById("username");
  const muteBtn = document.getElementById("mute-btn");
  const gameContainer = document.getElementById("game-container");

  let isMuted = localStorage.getItem("muted") === "true";
  let username = "";
  let gameRunning = false;
  let score = 0;
  let lives = 3;
  let phase = 1;
  let highScores = JSON.parse(localStorage.getItem("leaderboard")) || [];

  // Load assets
  const playerImg = new Image();
  playerImg.src = "assets/player/runner.png";

  const orbImg = new Image();
  orbImg.src = "assets/orbs/network_orb.png";

  const sounds = {
    music: new Audio("assets/sfx/music.mp3"),
    jump: new Audio("assets/sfx/jump.mp3"),
    collect: new Audio("assets/sfx/collect.mp3"),
    hit: new Audio("assets/sfx/hit.mp3"),
    powerup: new Audio("assets/sfx/powerup.mp3"),
  };

  for (let key in sounds) {
    sounds[key].volume = 0.5;
    if (key === "music") sounds[key].loop = true;
  }

  function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem("muted", isMuted);
    muteBtn.textContent = isMuted ? "🔇" : "🔊";
    if (isMuted) {
      for (let key in sounds) sounds[key].pause();
    } else {
      sounds.music.play();
    }
  }

  muteBtn.addEventListener("click", toggleSound);

  startBtn.onclick = () => {
    username = usernameInput.value.trim() || "Anon";
    intro.style.display = "none";
    gameContainer.style.display = "block";
    gameRunning = true;
    if (!isMuted) sounds.music.play();
    gameLoop();
  };

  const player = {
    x: 200,
    y: 900,
    width: 100,
    height: 100,
    vy: 0,
    gravity: 1.5,
    jumpForce: 30,
    grounded: false,
    doubleJumped: false,
    boostActive: false,
    boostTimer: 0,
  };

  const orbs = [];
  const spikes = [];
  const powerups = [];

  function spawnOrb() {
    orbs.push({ x: canvas.width + 100, y: 900, width: 40, height: 40 });
  }

  function spawnSpike() {
    spikes.push({ x: canvas.width + 100, y: 950, width: 50, height: 50 });
  }

  function spawnPowerup() {
    const types = ["🛡️", "🐢", "💙", "🔒"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({ x: canvas.width + 100, y: 870, width: 50, height: 50, type });
  }

  let lastSpawn = 0;
  let popupTimer = 0;
  let popupText = "";

  function drawPopup() {
    if (popupTimer > 0) {
      ctx.fillStyle = "rgba(0,255,255,0.1)";
      ctx.strokeStyle = "#0ff";
      ctx.font = "900 48px Raleway";
      ctx.textAlign = "center";
      ctx.shadowColor = "#0ff";
      ctx.shadowBlur = 20;
      ctx.fillText(popupText, canvas.width / 2, canvas.height / 3);
      popupTimer--;
    }
  }

  function activatePowerup(type) {
    switch (type) {
      case "🛡️":
        player.invincible = 300;
        popupText = "✅ Supercollateral Activated!";
        break;
      case "🐢":
        slowMo = 300;
        popupText = "✅ CDP Protocol Engaged";
        break;
      case "💙":
        if (lives < 3) lives++;
        popupText = "✅ Heart Restored";
        break;
      case "🔒":
        score += 500;
        popupText = "✅ Repayment Vault Reached";
        break;
    }
    popupTimer = 120;
    if (!isMuted) sounds.powerup.play();
  }

  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= 900) {
      player.y = 900;
      player.vy = 0;
      player.grounded = true;
      player.doubleJumped = false;
    }

    if (player.boostActive) {
      player.boostTimer--;
      if (player.boostTimer <= 0) player.boostActive = false;
    }

    if (player.invincible > 0) player.invincible--;
    if (slowMo > 0) slowMo--;

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.x -= 10;
      ctx.drawImage(orbImg, orb.x, orb.y, orb.width, orb.height);
      if (orb.x < -orb.width) orbs.splice(i, 1);
      else if (checkCollision(player, orb)) {
        score += 10;
        if (!isMuted) sounds.collect.play();
        orbs.splice(i, 1);
      }
    }

    for (let i = spikes.length - 1; i >= 0; i--) {
      const spike = spikes[i];
      spike.x -= 10;
      ctx.fillStyle = "red";
      ctx.fillRect(spike.x, spike.y, spike.width, spike.height);
      if (spike.x < -spike.width) spikes.splice(i, 1);
      else if (checkCollision(player, spike)) {
        if (!player.invincible) {
          lives--;
          if (!isMuted) sounds.hit.play();
          player.invincible = 60;
          if (lives <= 0) return endGame();
        }
        spikes.splice(i, 1);
      }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.x -= 10;
      ctx.font = "48px Raleway";
      ctx.fillText(p.type, p.x, p.y);
      if (checkCollision(player, p)) {
        activatePowerup(p.type);
        powerups.splice(i, 1);
      }
    }

    drawPopup();

    ctx.font = "700 32px Raleway";
    ctx.fillText(`Score: ${score}`, 50, 50);
    ctx.fillText(`Lives: ${lives}`, 50, 90);

    if (score >= phase * 500) {
      phase++;
      popupText = `🌌 Vault Phase ${phase} Unlocked!`;
      popupTimer = 120;
    }

    if (++lastSpawn % 60 === 0) spawnOrb();
    if (lastSpawn % 120 === 0) spawnSpike();
    if (lastSpawn % 300 === 0) spawnPowerup();

    requestAnimationFrame(gameLoop);
  }

  function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  function endGame() {
    gameRunning = false;
    highScores.push({ name: username, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem("leaderboard", JSON.stringify(highScores));
    alert("Game Over! Score: " + score);
    location.reload();
  }

  let slowMo = 0;

  document.addEventListener("keydown", e => {
    if (e.code === "Space") {
      if (player.grounded || !player.doubleJumped) {
        player.vy = -player.jumpForce;
        player.grounded = false;
        if (!player.doubleJumped && !player.grounded) player.doubleJumped = true;
        if (!isMuted) sounds.jump.play();
      }
    }
    if (e.code === "ShiftLeft" && !player.boostActive) {
      player.boostActive = true;
      player.boostTimer = 120;
    }
  });
};
