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
let GROUND_Y = 230; // Dino feet position
const INITIAL_SPEED = 8;
const SPEED_INCREMENT = 0.002;
const MIN_OBSTACLE_DISTANCE = 300; 
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
let clouds = [];
let frameCount = 0;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameRunning = false;
let gameSpeed = INITIAL_SPEED;
let animationFrameId;
let dayPhase = 0; // 0 to Math.PI * 2 for day/night interpolation

highScoreElement.textContent = highScore;

function resizeCanvas() {
    const isMobileLandscape = window.innerHeight <= 600 && window.innerWidth > window.innerHeight;
    
    if (isMobileLandscape) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        GROUND_Y = canvas.height - 70; // 70px from bottom
    } else {
        canvas.width = 800;
        canvas.height = 300;
        GROUND_Y = 230;
    }
    
    if (!dino.isJumping) {
        dino.y = GROUND_Y;
    }
    
    if (!gameRunning) {
        draw();
    }
}

window.addEventListener('resize', resizeCanvas);

// Initialize
function init() {
    resizeCanvas();
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
    
    // Initialize AudioFX on user gesture
    if (window.audioFX) window.audioFX.init();
    
    // Reset state
    dino.y = GROUND_Y;
    dino.dy = 0;
    dino.isJumping = false;
    dino.canDoubleJump = false;
    obstacles = [];
    clouds = [];
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
        if (window.audioFX) window.audioFX.playJump();
        dino.dy = JUMP_FORCE;
        dino.isJumping = true;
        dino.canDoubleJump = true; // Enable double jump after first jump
    } else if (dino.canDoubleJump) {
        if (window.audioFX) window.audioFX.playJump();
        dino.dy = JUMP_FORCE * 0.8; // Second jump is slightly less powerful
        dino.canDoubleJump = false; // Disable double jump until next landing
        if (window.achievements) window.achievements.unlock('dino', 'double_jump', 'Acrobat');
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
        
        // Achievement Checks
        if (window.achievements) {
            if (score === 100) window.achievements.unlock('dino', '100', 'Survivor I');
            if (score === 500) window.achievements.unlock('dino', '500', 'Survivor II');
            if (score === 1000) window.achievements.unlock('dino', '1000', 'Jurassic Master');
        }

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('dinoHighScore', highScore);
        }
    }
    
    // Spawning Obstacles
    if (frameCount % 40 === 0) { // Check more frequently
        const lastObstacle = obstacles[obstacles.length - 1];
        if (!lastObstacle || (canvas.width - lastObstacle.x) > MIN_OBSTACLE_DISTANCE) {
            if (Math.random() > 0.4) {
                spawnObstacle();
            }
        }
    }

    // Spawning Clouds
    if (frameCount % 120 === 0 && Math.random() > 0.6) {
        spawnCloud();
    }
    
    // Updating Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Perfect Collision Detection (Circle vs Rect)
        // Dino hit circle
        const dinoCx = dino.x + dino.width / 2;
        const dinoCy = dino.y + dino.height / 2;
        const dinoR = 20; // Forgiving radius

        let collision = false;
        
        if (obstacles[i].type === 'bird') {
            // Circle vs Circle for bird
            const birdCx = obstacles[i].x + obstacles[i].width / 2;
            const birdCy = obstacles[i].y + obstacles[i].height / 2;
            const birdR = 12;
            const dx = dinoCx - birdCx;
            const dy = dinoCy - birdCy;
            collision = Math.sqrt(dx*dx + dy*dy) < (dinoR + birdR);
        } else {
            // Circle vs Rect for cacti
            let testX = dinoCx;
            let testY = dinoCy;
            
            if (dinoCx < obstacles[i].x) testX = obstacles[i].x;
            else if (dinoCx > obstacles[i].x + obstacles[i].width) testX = obstacles[i].x + obstacles[i].width;
            
            if (dinoCy < obstacles[i].y) testY = obstacles[i].y;
            else if (dinoCy > obstacles[i].y + obstacles[i].height) testY = obstacles[i].y + obstacles[i].height;
            
            const dx = dinoCx - testX;
            const dy = dinoCy - testY;
            collision = Math.sqrt(dx*dx + dy*dy) <= dinoR;
        }

        if (collision) {
            gameOver();
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // Updating Clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= gameSpeed * 0.3; // Parallax effect
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
        }
    }
}

function spawnCloud() {
    clouds.push({
        x: canvas.width,
        y: 20 + Math.random() * 80,
        width: 60 + Math.random() * 40,
        height: 20 + Math.random() * 20
    });
}

function spawnObstacle() {
    const isBird = score > 50 && Math.random() > 0.7; // Birds start earlier (score 50)
    
    if (isBird) {
        // Flying bird
        const birdY = Math.random() > 0.5 ? GROUND_Y - 40 : GROUND_Y + 10;
        obstacles.push({
            x: canvas.width,
            y: birdY,
            width: 40,
            height: 30,
            color: '#ff4d4d', // Red for danger
            type: 'bird'
        });
    } else {
        // Ground cactus variations
        const rand = Math.random();
        if (rand > 0.6) {
            // Tall cactus
            obstacles.push({ x: canvas.width, y: GROUND_Y, width: 25, height: 60, color: '#00ffcc', type: 'cactus_tall' });
        } else if (rand > 0.3) {
            // Wide cluster
            obstacles.push({ x: canvas.width, y: GROUND_Y + 20, width: 50, height: 40, color: '#00ffcc', type: 'cactus_wide' });
        } else {
            // Small stub
            obstacles.push({ x: canvas.width, y: GROUND_Y + 30, width: 35, height: 30, color: '#00ffcc', type: 'cactus_small' });
        }
    }
}

function draw() {
    // Day/Night Cycle Background
    dayPhase += 0.001;
    const cycle = (Math.sin(dayPhase) + 1) / 2; // 0 to 1
    
    // Interpolate from deep dark (#0c0e14) to twilight purple (#2d1b4e)
    const r = Math.floor(12 + (45 - 12) * cycle);
    const g = Math.floor(14 + (27 - 14) * cycle);
    const b = Math.floor(20 + (78 - 20) * cycle);
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Ground Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 60);
    ctx.lineTo(canvas.width, GROUND_Y + 60);
    ctx.stroke();

    // Draw Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    clouds.forEach(cloud => {
        drawRoundedRect(ctx, cloud.x, cloud.y, cloud.width, cloud.height, 10);
    });

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
            // Draw matching cactus shape
            drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
            // Draw arms if tall or wide
            if (obs.type === 'cactus_tall') {
                drawRoundedRect(ctx, obs.x - 10, obs.y + 20, 15, 8, 3); // Left arm
                drawRoundedRect(ctx, obs.x + obs.width - 5, obs.y + 10, 15, 8, 3); // Right arm
            } else if (obs.type === 'cactus_wide') {
                drawRoundedRect(ctx, obs.x + 5, obs.y - 10, 12, 15, 3); // Top branch
                drawRoundedRect(ctx, obs.x + 30, obs.y - 5, 12, 10, 3); // Top branch 2
            }
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

let lastTime = 0;
const fpsInterval = 1000 / 60;

function animate(timestamp) {
    if (!gameRunning) return;
    animationFrameId = requestAnimationFrame(animate);
    
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    
    if (elapsed > fpsInterval) {
        lastTime = timestamp - (elapsed % fpsInterval);
        update();
        draw();
    }
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    
    if (window.audioFX) window.audioFX.playGameOver();
    if (navigator.vibrate) navigator.vibrate(50);

    overlayTitle.textContent = "Game Over";
    overlayMessage.textContent = `Final Score: ${score}`;
    
    // Show sharing options
    const shareContainer = document.getElementById('shareContainer');
    if (shareContainer) shareContainer.classList.remove('hidden');
    
    startBtn.textContent = "Restart Game";
    overlay.classList.remove('hidden');
}

// Share Logic
function shareScore(platform) {
    const text = `I just scored ${score} points in Zen Dino 🦖 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
}

// Add share listeners
document.getElementById('tweetBtn')?.addEventListener('click', () => shareScore('twitter'));
document.getElementById('waBtn')?.addEventListener('click', () => shareScore('whatsapp'));

init();
// Initial draw when page loads
draw();
