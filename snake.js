document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("snake");
  const context = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");
  const bestScoreElement = document.getElementById("bestScore");
  const statusElement = document.getElementById("status");
  const leaderboardList = document.getElementById("leaderboard-list");
  const boardSizeSelect = document.getElementById("boardSize");
  const speedSelect = document.getElementById("speed");
  const edgeModeSelect = document.getElementById("edgeMode");
  const startButton = document.getElementById("startGame");
  const pauseButton = document.getElementById("pauseGame");
  const resetButton = document.getElementById("resetGame");
  const modal = document.getElementById("nameModal");
  const playerNameInput = document.getElementById("playerName");
  const finalScoreElement = document.getElementById("finalScore");
  const submitScoreButton = document.getElementById("submitScore");

  const API_URL = "https://snake-leaderboard.coolbugs.win";
  const CANVAS_SIZE = 480;
  const LOCAL_BEST_KEY = "snake-best-points";

  const edgeLabels = {
    wrap: "Wrap",
    random: "Random wall",
    walls: "Walls",
  };
  const directionVectors = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const keyDirections = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
  };
  const themeColors = {
    dark: {
      background: "#0d1117",
      grid: "#323c4d",
      snake: "#ff79c6",
      head: "#fde3f2",
      food: "#ffffff",
    },
    matrix: {
      background: "#000000",
      grid: "#005a18",
      snake: "#00ff41",
      head: "#b5ffca",
      food: "#44ff73",
    },
    ocean: {
      background: "#0a192f",
      grid: "#233554",
      snake: "#64ffda",
      head: "#e6fff9",
      food: "#cdc7f1",
    },
    scary: {
      background: "#0a0a0a",
      grid: "#5a0000",
      snake: "#ff0000",
      head: "#ffb3b3",
      food: "#ffffff",
    },
    light: {
      background: "#e6e6e6",
      grid: "#cccccc",
      snake: "#0055ff",
      head: "#0dd7ff",
      food: "#ff4b4b",
    },
    "gruvbox-rainbow": {
      background: "#282828",
      grid: "#665c54",
      snake: "#b8bb26",
      head: "#fabd2f",
      food: "#fb4934",
    },
  };

  let settings = readSettings();
  let cellSize = CANVAS_SIZE / settings.size;
  let snake = [];
  let food = null;
  let direction = "right";
  let nextDirection = "right";
  let score = 0;
  let tickTimer = null;
  let gameState = "ready";
  let bestScore = Number(localStorage.getItem(LOCAL_BEST_KEY) || 0);
  let touchStart = null;

  bestScoreElement.textContent = bestScore;

  function getThemeName() {
    const themeClass = Array.from(document.body.classList).find((className) => className.startsWith("theme-"));
    return themeClass ? themeClass.replace("theme-", "") : "dark";
  }

  function getThemeColors() {
    return themeColors[getThemeName()] || themeColors.dark;
  }

  function readSettings() {
    const size = Number(boardSizeSelect.value);
    const tilesPerSecond = Number(speedSelect.value);
    const speed = Number.isFinite(tilesPerSecond) && tilesPerSecond > 0 ? tilesPerSecond : 9;
    const edgeMode = edgeLabels[edgeModeSelect.value] ? edgeModeSelect.value : "wrap";
    return {
      size,
      speed,
      delay: 1000 / speed,
      edgeMode,
    };
  }

  function settingsSummary() {
    return `${settings.size}x${settings.size}, ${settings.speed} tiles/sec, ${edgeLabels[settings.edgeMode]}`;
  }

  function isSameCell(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  function isSnakeCell(cell) {
    return snake.some((segment) => isSameCell(segment, cell));
  }

  function randomCell() {
    return {
      x: Math.floor(Math.random() * settings.size),
      y: Math.floor(Math.random() * settings.size),
    };
  }

  function availableCellCount() {
    return settings.size * settings.size - snake.length;
  }

  function placeFood() {
    if (availableCellCount() <= 0) {
      showGameOver();
      return;
    }

    let candidate = randomCell();
    while (isSnakeCell(candidate)) {
      candidate = randomCell();
    }
    food = candidate;
  }

  function resetGame() {
    stopTicking();
    settings = readSettings();
    cellSize = CANVAS_SIZE / settings.size;
    const center = Math.floor(settings.size / 2);
    snake = [
      { x: center + 1, y: center },
      { x: center, y: center },
      { x: center - 1, y: center },
    ];
    direction = "right";
    nextDirection = "right";
    score = 0;
    gameState = "ready";
    scoreElement.textContent = score;
    statusElement.textContent = "Ready";
    modal.style.display = "none";
    placeFood();
    draw();
  }

  function startGame() {
    if (gameState === "over") {
      resetGame();
    }
    if (gameState === "running") {
      return;
    }
    gameState = "running";
    statusElement.textContent = settingsSummary();
    scheduleTick();
  }

  function togglePause() {
    if (gameState === "ready") {
      startGame();
      return;
    }
    if (gameState === "over") {
      return;
    }
    if (gameState === "paused") {
      gameState = "running";
      statusElement.textContent = settingsSummary();
      scheduleTick();
      return;
    }
    gameState = "paused";
    statusElement.textContent = "Paused";
    stopTicking();
    draw();
  }

  function stopTicking() {
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  }

  function scheduleTick() {
    stopTicking();
    tickTimer = setTimeout(tick, settings.delay);
  }

  function isOppositeDirection(a, b) {
    const first = directionVectors[a];
    const second = directionVectors[b];
    return first.x + second.x === 0 && first.y + second.y === 0;
  }

  function setDirection(newDirection) {
    if (!directionVectors[newDirection]) {
      return;
    }
    if (!isOppositeDirection(newDirection, direction) && !isOppositeDirection(newDirection, nextDirection)) {
      nextDirection = newDirection;
    }
    if (gameState === "ready") {
      startGame();
    }
  }

  function nextHeadPosition() {
    const vector = directionVectors[nextDirection];
    const head = snake[0];
    const next = {
      x: head.x + vector.x,
      y: head.y + vector.y,
    };

    if (settings.edgeMode === "wrap") {
      next.x = (next.x + settings.size) % settings.size;
      next.y = (next.y + settings.size) % settings.size;
    }

    if (settings.edgeMode === "random") {
      if (next.x < 0) {
        next.x = settings.size - 1;
        next.y = Math.floor(Math.random() * settings.size);
      } else if (next.x >= settings.size) {
        next.x = 0;
        next.y = Math.floor(Math.random() * settings.size);
      } else if (next.y < 0) {
        next.x = Math.floor(Math.random() * settings.size);
        next.y = settings.size - 1;
      } else if (next.y >= settings.size) {
        next.x = Math.floor(Math.random() * settings.size);
        next.y = 0;
      }
    }

    return next;
  }

  function tick() {
    if (gameState !== "running") {
      return;
    }

    direction = nextDirection;
    const newHead = nextHeadPosition();
    const ateFood = isSameCell(newHead, food);

    if (newHead.x < 0 || newHead.x >= settings.size || newHead.y < 0 || newHead.y >= settings.size) {
      showGameOver();
      return;
    }

    const collisionBody = ateFood ? snake : snake.slice(0, -1);
    if (collisionBody.some((segment) => isSameCell(segment, newHead))) {
      showGameOver();
      return;
    }

    snake.unshift(newHead);
    if (ateFood) {
      score += 1;
      scoreElement.textContent = score;
      placeFood();
      if (gameState === "over") {
        return;
      }
    } else {
      snake.pop();
    }

    draw();
    scheduleTick();
  }

  function drawCell(cell, color, inset) {
    const padding = inset || Math.max(1, Math.floor(cellSize * 0.05));
    context.fillStyle = color;
    context.fillRect(Math.floor(cell.x * cellSize + padding), Math.floor(cell.y * cellSize + padding), Math.ceil(cellSize - padding * 2), Math.ceil(cellSize - padding * 2));
  }

  function drawGrid(colors) {
    context.strokeStyle = colors.grid;
    context.lineWidth = 1;
    context.globalAlpha = 0.35;
    for (let i = 1; i < settings.size; i++) {
      const position = Math.floor(i * cellSize) + 0.5;
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, CANVAS_SIZE);
      context.stroke();
      context.beginPath();
      context.moveTo(0, position);
      context.lineTo(CANVAS_SIZE, position);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  function draw() {
    const colors = getThemeColors();
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = colors.background;
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid(colors);

    if (food) {
      drawCell(food, colors.food, Math.max(2, Math.floor(cellSize * 0.2)));
    }

    snake.forEach((segment, index) => {
      drawCell(segment, index === 0 ? colors.head : colors.snake);
    });

    if (gameState === "paused") {
      drawOverlay("PAUSED", colors);
    }
    if (gameState === "over") {
      drawOverlay("GAME OVER", colors);
    }
  }

  function drawOverlay(text, colors) {
    context.fillStyle = "rgba(13, 17, 23, 0.75)";
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = colors.head;
    context.font = '44px "VT323", monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  }

  function showGameOver() {
    stopTicking();
    gameState = "over";
    statusElement.textContent = "Game Over";
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(LOCAL_BEST_KEY, String(bestScore));
      bestScoreElement.textContent = bestScore;
    }
    finalScoreElement.textContent = score;
    modal.style.display = "block";
    draw();
    playerNameInput.focus();
  }

  async function fetchLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      if (!response.ok) {
        throw new Error(`Leaderboard request failed: ${response.status}`);
      }
      const scores = await response.json();
      if (!Array.isArray(scores)) {
        throw new Error("Leaderboard response was not an array");
      }
      leaderboardList.innerHTML = "";
      scores.forEach((scoreRecord) => {
        const li = document.createElement("li");
        const settingsText = scoreRecord.settings ? ` (${scoreRecord.settings})` : "";
        li.textContent = `${scoreRecord.name}: ${scoreRecord.score}${settingsText}`;
        leaderboardList.appendChild(li);
      });
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      leaderboardList.innerHTML = "<li>Could not load scores</li>";
    }
  }

  async function submitScore(name, finalScore) {
    try {
      const response = await fetch(`${API_URL}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          score: finalScore,
          settings: settingsSummary(),
        }),
      });
      if (!response.ok) {
        throw new Error(`Score submit failed: ${response.status}`);
      }
      fetchLeaderboard();
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  }

  document.addEventListener("keydown", function (e) {
    const tagName = e.target.tagName.toLowerCase();
    const isFormControl = tagName === "input" || tagName === "select" || tagName === "button";
    if (isFormControl) {
      return;
    }

    const key = e.key.toLowerCase();
    const newDirection = keyDirections[key];
    if (newDirection) {
      e.preventDefault();
      setDirection(newDirection);
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      togglePause();
    }
    if (e.key === "Enter") {
      startGame();
    }
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true },
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) {
        return;
      }
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      touchStart = null;

      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setDirection(deltaX > 0 ? "right" : "left");
        return;
      }
      setDirection(deltaY > 0 ? "down" : "up");
    },
    { passive: true },
  );

  [boardSizeSelect, speedSelect, edgeModeSelect].forEach((select) => {
    select.addEventListener("change", resetGame);
  });

  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  resetButton.addEventListener("click", resetGame);
  submitScoreButton.addEventListener("click", () => {
    const name = playerNameInput.value.trim() || "Anonymous";
    submitScore(name, score);
    modal.style.display = "none";
  });
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitScoreButton.click();
    }
  });

  new MutationObserver(draw).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  fetchLeaderboard();
  resetGame();
});
