const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = 180;
const INITIAL_SPEED = 6;
const SPEED_INCREMENT = 0.001;

// Game State
let dino = {
    x: 50,
    y: GROUND_Y,
    width: 40,
    height: 40,
    dy: 0,
    isJumping: false,
    color: '#8a2be2'
};

let obstacles = [];
let frameCount = 0;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameRunning = false;
let gameSpeed = INITIAL_SPEED;
let animationFrameId;

highScoreElement.textContent = highScore;

// Initialize
function init() {
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (!gameRunning) startGame();
            else jump();
        }
    });

    canvas.addEventListener('mousedown', () => {
        if (!gameRunning) startGame();
        else jump();
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameRunning) startGame();
        else jump();
    });
}

function startGame() {
    if (gameRunning) return;
    
    // Reset state
    dino.y = GROUND_Y;
    dino.dy = 0;
    dino.isJumping = false;
    obstacles = [];
    score = 0;
    gameSpeed = INITIAL_SPEED;
    frameCount = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    overlay.classList.add('hidden');
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animate();
}

function jump() {
    if (!dino.isJumping) {
        dino.dy = JUMP_FORCE;
        dino.isJumping = true;
    }
}

function update() {
    frameCount++;
    gameSpeed += SPEED_INCREMENT;
    
    // Dino Physics
    dino.dy += GRAVITY;
    dino.y += dino.dy;
    
    if (dino.y > GROUND_Y) {
        dino.y = GROUND_Y;
        dino.dy = 0;
        dino.isJumping = false;
    }
    
    // Score
    if (frameCount % 10 === 0) {
        score++;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('dinoHighScore', highScore);
        }
    }
    
    // Spawning Obstacles
    if (frameCount % 100 === 0 || (frameCount % 75 === 0 && Math.random() > 0.7)) {
        spawnObstacle();
    }
    
    // Updating Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Collision Detection
        if (
            dino.x < obstacles[i].x + obstacles[i].width &&
            dino.x + dino.width > obstacles[i].x &&
            dino.y < obstacles[i].y + obstacles[i].height &&
            dino.y + dino.height > obstacles[i].y
        ) {
            gameOver();
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function spawnObstacle() {
    const height = 20 + Math.random() * 30;
    const width = 15 + Math.random() * 20;
    obstacles.push({
        x: canvas.width,
        y: GROUND_Y + 40 - height, // Align to bottom
        width: width,
        height: height,
        color: '#00ffcc'
    });
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Ground Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 40);
    ctx.lineTo(canvas.width, GROUND_Y + 40);
    ctx.stroke();

    // Draw Dino
    ctx.shadowBlur = 15;
    ctx.shadowColor = dino.color;
    ctx.fillStyle = dino.color;
    drawRoundedRect(ctx, dino.x, dino.y, dino.width, dino.height, 10);
    
    // Draw Eyes (to make it look like a dino/cube)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(dino.x + 25, dino.y + 10, 5, 5);

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;
        drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
    });
    
    ctx.shadowBlur = 0;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, radius);
    } else {
        // Fallback
        ctx.rect(x, y, width, height);
    }
    ctx.fill();
}

function animate() {
    if (!gameRunning) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(animate);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    overlayTitle.textContent = "Game Over";
    overlayMessage.textContent = `Final Score: ${score}`;
    startBtn.textContent = "Restart Game";
    overlay.classList.remove('hidden');
}

init();
// Initial draw when page loads
draw();
