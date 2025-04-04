document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const startBtn = document.getElementById("start-btn");
  const usernameInput = document.getElementById("username");
  const introScreen = document.getElementById("intro-screen");
  const gameContainer = document.getElementById("game-container");

  let username = "";
  let player, score, orbs, spikes, trail, boostActive, boostTimer, jumpCount, gameRunning;
  let currentPhase = 1;
  const bg1 = new Image(); bg1.src = "assets/bg/layer1_background.png";
  const bg2 = new Image(); bg2.src = "assets/bg/layer2_midground.png";
  const bg3 = new Image(); bg3.src = "assets/bg/layer3_foreground.png";
  let x1 = 0, x2 = 0;

  let nextPhaseScore = 500;
  const groundY = 960;

  startBtn.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (!username) return;
    introScreen.style.display = "none";
    gameContainer.style.display = "block";
    startGame();
  });

  function startGame() {
    score = 0;
    jumpCount = 0;
    trail = [];
    orbs = [];
    spikes = [];
    boostActive = false;
    boostTimer = 0;
    gameRunning = true;
    currentPhase = 1;
    nextPhaseScore = 500;

    player = {
      x: 100,
      y: groundY - 100,
      width: 60,
      height: 80,
      vy: 0,
      gravity: 1.5,
      jumpPower: -25
    };

    requestAnimationFrame(gameLoop);
  }

  function drawTrail() {
    for (let i = trail.length - 1; i >= 0; i--) {
      let t = trail[i];
      ctx.fillStyle = `rgba(0,255,255,${t.alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
      ctx.fill();
      t.alpha -= 0.05;
      if (t.alpha <= 0) trail.splice(i, 1);
    }
  }

  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw parallax background layers
    x1 -= 0.3;
    x2 -= 0.6;
    if (x1 <= -1920) x1 = 0;
    if (x2 <= -1920) x2 = 0;
    ctx.drawImage(bg1, x1, 0); ctx.drawImage(bg1, x1 + 1920, 0);
    ctx.drawImage(bg2, x2, 0); ctx.drawImage(bg2, x2 + 1920, 0);
    ctx.drawImage(bg3, 0, 0); // static foreground layer


    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y + player.height >= groundY) {
      player.y = groundY - player.height;
      player.vy = 0;
      jumpCount = 0;
    }

    if (boostActive) {
      boostTimer--;
      trail.push({ x: player.x + 30, y: player.y + 40, alpha: 1 });
      if (boostTimer <= 0) boostActive = false;
    }
    drawTrail();

    ctx.fillStyle = "#0ff";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    if (Math.random() < 0.02) {
      orbs.push({ x: 1920, y: groundY - 150 - Math.random() * 200, r: 24 });
    }

    orbs.forEach((orb, i) => {
      orb.x -= boostActive ? 10 : 5;
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
    });

    if (Math.random() < 0.015) {
      spikes.push({ x: 1920, y: groundY - 60, w: 60, h: 60 });
    }

    spikes.forEach((spike, i) => {
      spike.x -= boostActive ? 10 : 5;
      ctx.fillRect(spike.x, spike.y, spike.w, spike.h);
      if (
        player.x < spike.x + spike.w &&
        player.x + player.width > spike.x &&
        player.y < spike.y + spike.h &&
        player.y + player.height > spike.y
      ) {
        endGame();
      }
    });

    ctx.fillStyle = "#0ff";
    ctx.font = "24px Raleway";
    ctx.fillText("Runner: " + username, 30, 40);
    ctx.fillText("Score: " + score, 30, 70);
    ctx.fillText("Vault Phase: " + currentPhase, 30, 100);

    if (score >= nextPhaseScore) {
      currentPhase++;
      nextPhaseScore += 500;
    }

    requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameRunning = false;
    setTimeout(function () {
      alert("💀 You hit a spike! Final score: " + score);
      location.reload();
    }, 500);
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      if (jumpCount < 2) {
        player.vy = jumpCount === 0 ? player.jumpPower : player.jumpPower * 1.2;
        jumpCount++;
      }
    } else if (e.code === "ShiftLeft" && !boostActive) {
      boostActive = true;
      boostTimer = 60;
    }
  });
});
