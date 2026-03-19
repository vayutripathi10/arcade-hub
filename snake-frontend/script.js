const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

// Game Constants
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Game State
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoopInterval;
let speed = 150; // Slower initial speed
let survivalTimer = 0;
const minSpeed = 50;

highScoreElement.textContent = highScore;

// Initialize
function init() {
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });
    window.addEventListener('keydown', handleKeyPress);
}

function startGame() {
    if (gameRunning) return;
    
    // Reset state
    snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }]; // Start with 3 segments
    generateFood();
    dx = 1;
    dy = 0;
    nextDx = 1;
    nextDy = 0;
    score = 0;
    speed = 150; // Reset to slow
    survivalTimer = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    overlay.classList.add('hidden');
    
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, speed);
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    const gameKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '];
    
    if (gameKeys.includes(key)) {
        e.preventDefault(); // Prevent scrolling
    }

    if (!gameRunning) {
        if (key === ' ' || key === 'enter' || gameKeys.includes(key)) {
            startGame();
        }
        return;
    }
    
    if ((key === 'arrowup' || key === 'w') && dy === 0) {
        nextDx = 0;
        nextDy = -1;
    } else if ((key === 'arrowdown' || key === 's') && dy === 0) {
        nextDx = 0;
        nextDy = 1;
    } else if ((key === 'arrowleft' || key === 'a') && dx === 0) {
        nextDx = -1;
        nextDy = 0;
    } else if ((key === 'arrowright' || key === 'd') && dx === 0) {
        nextDx = 1;
        nextDy = 0;
    }
}

function gameLoop() {
    update();
    draw();
}

function update() {
    // Apply buffered direction
    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision check
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        console.log("Wall collision", head);
        gameOver();
        return;
    }

    // Self collision check (only if moving)
    if (dx !== 0 || dy !== 0) {
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                console.log("Self collision", head, snake[i]);
                gameOver();
                return;
            }
        }
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        generateFood();
        
        // Noticeable speed increase per food
        increaseSpeed(5);
    } else {
        snake.pop();
    }

    // Survival speed increase (every 100 frames ~ 10-15 seconds)
    survivalTimer++;
    if (survivalTimer % 100 === 0) {
        increaseSpeed(2);
    }
}

function increaseSpeed(amount) {
    if (speed > minSpeed) {
        clearInterval(gameLoopInterval);
        speed -= amount;
        if (speed < minSpeed) speed = minSpeed;
        gameLoopInterval = setInterval(gameLoop, speed);
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3366';
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 4,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.fillStyle = '#00ffcc';
    
    snake.forEach((part, index) => {
        const isHead = index === 0;
        const opacity = 1 - (index / snake.length) * 0.6;
        ctx.fillStyle = isHead ? '#00ffcc' : `rgba(0, 255, 204, ${opacity})`;
        
        const size = isHead ? gridSize - 2 : gridSize - 4;
        const offset = (gridSize - size) / 2;
        
        const x = part.x * gridSize + offset;
        const y = part.y * gridSize + offset;
        const radius = isHead ? 8 : 4;

        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, radius);
            ctx.fill();
        } else {
            // Fallback for very old browsers
            ctx.fillRect(x, y, size, size);
        }
    });
    
    ctx.shadowBlur = 0;
}

// polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Ensure food doesn't teleport onto snake
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            generateFood();
            break;
        }
    }
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopInterval);
    overlayTitle.textContent = "Game Over";
    overlayMessage.textContent = `Final Score: ${score}`;
    startBtn.textContent = "Try Again";
    overlay.classList.remove('hidden');
}

init();
