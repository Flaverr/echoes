document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");
  const startBtn = document.getElementById("start-btn");
  const usernameInput = document.getElementById("username");
  const introScreen = document.getElementById("intro-screen");
  const gameContainer = document.getElementById("game-container");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  startBtn.addEventListener("click", () => {
    console.log("🟢 Start button clicked");
    const username = usernameInput.value.trim();
    if (username === "") return;
    introScreen.style.display = "none";
    gameContainer.style.display = "block";
    console.log("🚀 startGame() called");
    startGame();
  });

  function startGame() {
    requestAnimationFrame(gameLoop);
  }

  function gameLoop() {
    try {
      console.log("🌀 Frame running");
      requestAnimationFrame(gameLoop);
    } catch (e) {
      console.error("🔥 Crash in gameLoop:", e);
    }
  }

  function endGame() {
    console.log("💀 endGame() triggered");
  }
});
