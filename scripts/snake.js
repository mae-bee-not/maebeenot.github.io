// /scripts/snake.js
document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('snake-game');
    var context = canvas.getContext('2d');
    var grid = 10; 
    var count = 0;
    var snake = {
    x: 120, 
    y: 120, 
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4
    };
    var apple = {
    x: 200, 
    y: 200  
    };
    function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
    }
    function loop() {
    requestAnimationFrame(loop);
    // slow game loop to 15 fps instead of 60 (60/15 = 4)
    if (++count < 6) {
    return;
    }
    count = 0;
    context.clearRect(0,0,canvas.width,canvas.height);
    // move snake by it's velocity
    snake.x += snake.dx;
    snake.y += snake.dy;
    // wrap snake position horizontally on edge of screen
    if (snake.x < 0) {
    snake.x = canvas.width - grid;
    }
    else if (snake.x >= canvas.width) {
    snake.x = 0;
    }
    // wrap snake position vertically on edge of screen
    if (snake.y < 0) {
    snake.y = canvas.height - grid;
    }
    else if (snake.y >= canvas.height) {
    snake.y = 0;
    }
    // keep track of where snake has been. front of the array is always the head
    snake.cells.unshift({x: snake.x, y: snake.y});
    // remove cells as we move away from them
    if (snake.cells.length > snake.maxCells) {
    snake.cells.pop();
    }
    // draw apple
    context.fillStyle = 'magenta';
    context.fillRect(apple.x, apple.y, grid-1, grid-1);
    // draw snake one cell at a time
    context.fillStyle = 'purple';
    snake.cells.forEach(function(cell, index) {
    // drawing 1 px smaller than the grid creates a grid effect in the snake body
    context.fillRect(cell.x, cell.y, grid-1, grid-1);
    // snake ate apple
    if (cell.x === apple.x && cell.y === apple.y) {
    snake.maxCells++;
    // Canvas is now 250x250 - adjust grid calculation
    apple.x = getRandomInt(0, 25) * grid; 
    apple.y = getRandomInt(0, 25) * grid;
    }
    // check collision with all cells after this one
    for (var i = index + 1; i < snake.cells.length; i++) {
    // snake occupies same space as a body part. reset game
    if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
    snake.x = 120; 
    snake.y = 120; 
    snake.cells = [];
    snake.maxCells = 4;
    snake.dx = grid;
    snake.dy = 0;
    apple.x = getRandomInt(0, 25) * grid;
    apple.y = getRandomInt(0, 25) * grid;
    }
    }
    });
    }
    // WASD controls
    document.addEventListener('keydown', function(e) {
    // A key (left)
    if (e.which === 65 && snake.dx === 0) {
    snake.dx = -grid;
    snake.dy = 0;
    }
    // W key (up)
    else if (e.which === 87 && snake.dy === 0) {
    snake.dy = -grid;
    snake.dx = 0;
    }
    // D key (right)
    else if (e.which === 68 && snake.dx === 0) {
    snake.dx = grid;
    snake.dy = 0;
    }
    // S key (down)
    else if (e.which === 83 && snake.dy === 0) {
    snake.dy = grid;
    snake.dx = 0;
    }
    });
    // start the game
    requestAnimationFrame(loop);
    });