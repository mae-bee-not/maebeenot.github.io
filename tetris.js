document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next');
    const nextContext = nextCanvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const leaderboardList = document.getElementById('leaderboard-list');

    // --- Backend API URL ---
    const API_URL = 'https://tetris-leaderboard.coolbugs.win';

    const grid = 24;
    const tetrominoSequence = [];

    // --- Theme Colors for Tetrominos ---
    const themeColors = {
      dark: ['#ff79c6', '#ff008cff', '#fde3f2ff', '#ff008cff', '#ff82c9ff', '#ffffffff', '#ff92d0ff'],
      matrix: ['#00ff41', '#049c2aff', '#145825ff', '#0aff16ff', '#44ff73ff', '#00771eff', '#00ff40ff'],
      ocean: ['#64ffda', '#0040ffff', '#00c496ff', '#8892b0', '#ffffffff', '#066affff', '#cdc7f1ff'],
      scary: ['#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000'],
      light: ['#0055ff', '#ff9679ff', '#0dd7ffff', '#73ff00ff', '#fffb00ff', '#ff4b4bff', '#ff9100ff']
    };

    function getThemeColors() {
        const theme = document.body.className.replace('theme-', '') || 'dark';
        return themeColors[theme] || themeColors.dark;
    }

    const colors = getThemeColors();
    const tetrominos = {
      'I': { shape: [[1,1,1,1]], color: colors[0] },
      'L': { shape: [[0,0,1],[1,1,1]], color: colors[1] },
      'J': { shape: [[1,0,0],[1,1,1]], color: colors[2] },
      'S': { shape: [[0,1,1],[1,1,0]], color: colors[3] },
      'Z': { shape: [[1,1,0],[0,1,1]], color: colors[4] },
      'O': { shape: [[1,1],[1,1]], color: colors[5] },
      'T': { shape: [[0,1,0],[1,1,1]], color: colors[6] }
    };


    let score = 0;
    let playfield = [];
    for (let row = -2; row < 20; row++) {
      playfield[row] = [];
      for (let col = 0; col < 10; col++) {
        playfield[row][col] = 0;
      }
    }

    let count = 0;
    let tetromino = getNextTetromino();
    let rAF = null;
    let gameOver = false;

    // --- Leaderboard Functions ---
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`${API_URL}/api/leaderboard`);
        const scores = await response.json();
        leaderboardList.innerHTML = '';
        scores.forEach(score => {
          const li = document.createElement('li');
          li.textContent = `${score.name}: ${score.score}`;
          leaderboardList.appendChild(li);
        });
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        leaderboardList.innerHTML = '<li>Could not load scores</li>';
      }
    }

    async function submitScore(name, score) {
      try {
        await fetch(`${API_URL}/api/scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, score }),
        });
        fetchLeaderboard();
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }


    function generateSequence() {
      const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
      while (sequence.length) {
        const rand = Math.floor(Math.random() * sequence.length);
        const name = sequence.splice(rand, 1)[0];
        tetrominoSequence.push(name);
      }
    }

    function getNextTetromino() {
      if (tetrominoSequence.length === 0) {
        generateSequence();
      }
      const name = tetrominoSequence.pop();
      const matrix = tetrominos[name].shape;
      const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
      const row = name === 'I' ? -1 : -2;

      return { name, matrix, row, col };
    }

    function rotate(matrix) {
      const rows = matrix.length;
      const cols = matrix[0].length;
      const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          newMatrix[c][rows - 1 - r] = matrix[r][c];
        }
      }
      return newMatrix;
    }

    function isValidMove(matrix, cellRow, cellCol) {
      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
          if (matrix[row][col] && (
              cellCol + col < 0 ||
              cellCol + col >= playfield[0].length ||
              cellRow + row >= playfield.length ||
              (playfield[cellRow + row] && playfield[cellRow + row][cellCol + col]))
            ) {
            return false;
          }
        }
      }
      return true;
    }

    function placeTetromino() {
      for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
          if (tetromino.matrix[row][col]) {
            if (tetromino.row + row < 0) {
              return showGameOver();
            }
            playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
          }
        }
      }

      let linesCleared = 0;
      for (let row = playfield.length - 1; row >= 0; ) {
        if (playfield[row].every(cell => !!cell)) {
          linesCleared++;
          for (let r = row; r >= 0; r--) {
            playfield[r] = playfield[r - 1] ? [...playfield[r-1]] : Array(10).fill(0);
          }
        } else {
          row--;
        }
      }

      if (linesCleared > 0) {
          score += linesCleared * 100 * linesCleared;
          scoreElement.textContent = score;
      }

      tetromino = getNextTetromino();
    }

    function showGameOver() {
      cancelAnimationFrame(rAF);
      gameOver = true;
      context.fillStyle = 'rgba(13, 17, 23, 0.75)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
      context.fillStyle = '#ff79c6';
      context.font = '36px "VT323", monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

      // Show the modal to enter name
      const modal = document.getElementById('nameModal');
      document.getElementById('finalScore').textContent = score;
      modal.style.display = 'block';
    }

    document.getElementById('submitScore').addEventListener('click', () => {
        const name = document.getElementById('playerName').value || 'Anonymous';
        submitScore(name, score);
        document.getElementById('nameModal').style.display = 'none';
    });

    function drawNextTetromino() {
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        if (!tetrominoSequence.length) return;
        const next = tetrominoSequence[tetrominoSequence.length - 1];
        const { shape, color } = tetrominos[next];
        nextContext.fillStyle = color;

        const boxSize = nextCanvas.width;
        const pieceWidth = shape[0].length * grid;
        const pieceHeight = shape.length * grid;
        const startX = (boxSize - pieceWidth) / 2;
        const startY = (boxSize - pieceHeight) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    nextContext.fillRect(startX + col * grid, startY + row * grid, grid - 1, grid - 1);
                }
            }
        }
    }

    function loop() {
      rAF = requestAnimationFrame(loop);
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          if (playfield[row][col]) {
            const name = playfield[row][col];
            context.fillStyle = tetrominos[name].color;
            context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
          }
        }
      }

      if (tetromino) {
        // Draw ghost piece
        const ghost = { ...tetromino };
        while (isValidMove(ghost.matrix, ghost.row + 1, ghost.col)) {
          ghost.row++;
        }
        context.globalAlpha = 0.3;
        context.fillStyle = tetrominos[tetromino.name].color;
        for (let row = 0; row < ghost.matrix.length; row++) {
          for (let col = 0; col < ghost.matrix[row].length; col++) {
            if (ghost.matrix[row][col]) {
              context.fillRect((ghost.col + col) * grid, (ghost.row + row) * grid, grid - 1, grid - 1);
            }
          }
        }
        context.globalAlpha = 1;


        if (++count > 35) {
          tetromino.row++;
          count = 0;
          if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
            tetromino.row--;
            placeTetromino();
          }
        }

        context.fillStyle = tetrominos[tetromino.name].color;
        for (let row = 0; row < tetromino.matrix.length; row++) {
          for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
              context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
            }
          }
        }
      }
      drawNextTetromino();
    }

    document.addEventListener('keydown', function(e) {
      if (gameOver) return;

      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'd') {
        const col = key === 'a' ? tetromino.col - 1 : tetromino.col + 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
          tetromino.col = col;
        }
      }

      if (key === 'q' || key === 'w') {
         let matrix = rotate(tetromino.matrix);
         if (key === 'q') {
             matrix = rotate(matrix);
             matrix = rotate(matrix);
         }

         const kicks = [0, 1, -1, 2, -2];
         for (const kick of kicks) {
             if (isValidMove(matrix, tetromino.row, tetromino.col + kick)) {
                 tetromino.col += kick;
                 tetromino.matrix = matrix;
                 return;
             }
         }
      }

      if (key === 's') {
        const row = tetromino.row + 1;
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
          placeTetromino();
          return;
        }
        tetromino.row = row;
        count = 0;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
          tetromino.row++;
        }
        placeTetromino();
      }
    });

    // --- Initialize ---
    fetchLeaderboard();
    generateSequence();
    rAF = requestAnimationFrame(loop);
});