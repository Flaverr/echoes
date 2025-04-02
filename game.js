const startBtn = document.getElementById("start-btn");
const usernameInput = document.getElementById("username");
const introScreen = document.getElementById("intro-screen");
const gameContainer = document.getElementById("game-container");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let username = "";

startBtn.addEventListener("click", () => {
  username = usernameInput.value.trim();
  if (username === "") return;
  introScreen.style.display = "none";
  gameContainer.style.display = "block";
  canvas.focus();
  startGame();
});

function startGame() {
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0ff";
  ctx.font = "48px Raleway";
  ctx.fillText("Welcome to Vault of Echoes, " + username, 100, 200);
  requestAnimationFrame(gameLoop);
}
