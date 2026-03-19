const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

// Game Constants
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GROUND_Y = 230; // Dino feet position
const INITIAL_SPEED = 7;
const SPEED_INCREMENT = 0.002; // Faster speed increase
const MIN_OBSTACLE_DISTANCE = 350; 
const HITBOX_BUFFER = 10;

// Game State
let dino = {
    x: 50,
    y: GROUND_Y,
    width: 60,
    height: 60,
    dy: 0,
    isJumping: false,
    canDoubleJump: false,
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
        dino.canDoubleJump = true; // Enable double jump after first jump
    } else if (dino.canDoubleJump) {
        dino.dy = JUMP_FORCE * 0.8; // Second jump is slightly less powerful
        dino.canDoubleJump = false; // Disable double jump until next landing
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
    if (frameCount % 60 === 0) {
        const lastObstacle = obstacles[obstacles.length - 1];
        if (!lastObstacle || (canvas.width - lastObstacle.x) > MIN_OBSTACLE_DISTANCE) {
            if (Math.random() > 0.5) {
                spawnObstacle();
            }
        }
    }
    
    // Updating Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Collision Detection with Forgiving Hitbox
        if (
            dino.x + HITBOX_BUFFER < obstacles[i].x + obstacles[i].width - HITBOX_BUFFER &&
            dino.x + dino.width - HITBOX_BUFFER > obstacles[i].x + HITBOX_BUFFER &&
            dino.y + HITBOX_BUFFER < obstacles[i].y + obstacles[i].height - HITBOX_BUFFER &&
            dino.y + dino.height - HITBOX_BUFFER > obstacles[i].y + HITBOX_BUFFER
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
    const isBird = score > 100 && Math.random() > 0.7; // Birds start after score 100
    
    if (isBird) {
        // Flying bird
        const birdY = Math.random() > 0.5 ? GROUND_Y - 40 : GROUND_Y + 10; // High or Low bird
        obstacles.push({
            x: canvas.width,
            y: birdY,
            width: 40,
            height: 30,
            color: '#ff4d4d', // Red for danger
            type: 'bird'
        });
    } else {
        // Ground cactus
        const height = 40 + Math.random() * 40;
        const width = 30 + Math.random() * 30;
        obstacles.push({
            x: canvas.width,
            y: GROUND_Y + 60 - height,
            width: width,
            height: height,
            color: '#00ffcc',
            type: 'cactus'
        });
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Ground Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 60);
    ctx.lineTo(canvas.width, GROUND_Y + 60);
    ctx.stroke();

    // Draw Dino
    ctx.shadowBlur = 15;
    ctx.shadowColor = dino.color;
    ctx.fillStyle = dino.color;
    drawRoundedRect(ctx, dino.x, dino.y, dino.width, dino.height, 12);
    
    // Draw Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(dino.x + 40, dino.y + 15, 8, 8);

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;
        
        if (obs.type === 'bird') {
            // Draw a triangle for the bird
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
            ctx.lineTo(obs.x, obs.y);
            ctx.fill();
        } else {
            drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
        }
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
