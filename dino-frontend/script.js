const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const pauseIcon = pauseBtn?.querySelector('.pause-icon');

// Game Constants
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
let GROUND_Y = 230; // Dino feet position
const INITIAL_SPEED = 8;
const SPEED_INCREMENT = 0.002;
let distanceSinceLastObstacle = 0;
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
let isPaused = false;
let gameSpeed = INITIAL_SPEED;
let animationFrameId;
let dayPhase = 0;

// Stars generation
const stars = Array.from({length: 35}, () => ({
    x: Math.random() * 800, // Fixed width for star positions
    y: Math.random() * 150,
    size: Math.random() * 2 + 0.5,
    twinkleSpeed: Math.random() * 0.05 + 0.02,
    twinkleOffset: Math.random() * Math.PI * 2,
    opacity: Math.random() * 0.5 + 0.5
}));

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
let touchHandled = false;
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
        if (touchHandled) return;
        if (!gameRunning) startGame();
        else jump();
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchHandled = true;
        if (!gameRunning) startGame();
        else if (!isPaused) jump();
        setTimeout(() => touchHandled = false, 300);
    }, { passive: false });

    pauseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePause();
    });

    // Lifecycle stability
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameRunning && !isPaused) {
            togglePause(true);
        }
    });

    window.addEventListener('blur', () => {
        if (gameRunning && !isPaused) {
            togglePause(true);
        }
    });

    window.addEventListener('focus', () => {
        if (gameRunning && isPaused) {
            // Keep it paused but ensure UI is clear
            draw();
        }
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
    distanceSinceLastObstacle = 0;
    scoreElement.textContent = score;
    if (isPaused) togglePause(false); // Ensure unpaused on start
    overlay.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = performance.now();
    animate(lastTime);
}

function togglePause(forcePause) {
    if (!gameRunning) return;
    
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        overlayTitle.textContent = "Paused";
        overlayMessage.textContent = "Game is paused. Click Play or Resume to continue.";
        overlay.classList.remove('hidden');
        if (pauseIcon) pauseIcon.textContent = "▶";
    } else {
        overlay.classList.add('hidden');
        if (pauseIcon) pauseIcon.textContent = "||";
        lastTime = performance.now(); // Reset time to prevent jump
        animate(lastTime);
    }
}

function jump() {
    if (isPaused) return;
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

function update(deltaTime) {
    frameCount++;
    gameSpeed = Math.min(gameSpeed + SPEED_INCREMENT * deltaTime, 25);
    
    // Dino Physics
    dino.dy += GRAVITY * deltaTime;
    dino.y += dino.dy * deltaTime;
    
    if (dino.y > GROUND_Y) {
        dino.y = GROUND_Y;
        dino.dy = 0;
        dino.isJumping = false;
    }
    
    // Distance-based Score
    if (gameRunning) {
        score += (gameSpeed * deltaTime) / 50;
        const roundedScore = Math.floor(score);
        scoreElement.textContent = roundedScore;
        
        // Achievement Checks
        if (window.achievements) {
            if (roundedScore === 100) window.achievements.unlock('dino', '100', 'Survivor I');
            if (roundedScore === 500) window.achievements.unlock('dino', '500', 'Survivor II');
            if (roundedScore === 1000) window.achievements.unlock('dino', '1000', 'Jurassic Master');
        }

        if (roundedScore > highScore) {
            highScore = roundedScore;
            highScoreElement.textContent = highScore;
            localStorage.setItem('dinoHighScore', highScore);
        }
    }
    
    // Spawning Obstacles based on distance
    distanceSinceLastObstacle += gameSpeed * deltaTime;
    const spawnThreshold = Math.max(250, 450 - score * 0.1);
    if (distanceSinceLastObstacle > spawnThreshold) {
        spawnObstacle();
        distanceSinceLastObstacle = 0;
    }

    // Spawning Clouds
    if (frameCount % 120 === 0 && Math.random() > 0.6) {
        spawnCloud();
    }
    
    // Updating Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed * deltaTime;
        
        // Perfect Collision Detection (Circle vs Rect)
        const dinoCx = dino.x + dino.width / 2;
        const dinoCy = dino.y + dino.height / 2;
        const dinoR = 20;

        let collision = false;
        
        if (obstacles[i].type === 'bird') {
            const birdCx = obstacles[i].x + obstacles[i].width / 2;
            const birdCy = obstacles[i].y + obstacles[i].height / 2;
            const birdR = 12;
            const dx = dinoCx - birdCx;
            const dy = dinoCy - birdCy;
            collision = Math.sqrt(dx*dx + dy*dy) < (dinoR + birdR);
        } else {
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

        if (collision) gameOver();
        if (obstacles[i].x + obstacles[i].width < -100) obstacles.splice(i, 1);
    }

    // Updating Clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= gameSpeed * 0.3 * deltaTime;
        if (clouds[i].x + clouds[i].width < -100) clouds.splice(i, 1);
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

function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
}

function getStageConfigs(score) {
    if (score < 400) {
        // Stage 1: Day (Full Light) - Score 0 to 400
        return {
            bg: '#ffffff',
            stars: 0,
            celestial: 'sun',
            celestialOpacity: 1,
            ground: '#e0e0e0',
            cloudOpacity: 0.5,
            dinoColor: '#1a1a1a',
            obstacleColor: '#2d5a27'
        };
    } else if (score < 800) {
        // Stage 2: Dusk Transition - Score 400 to 800
        const t = (score - 400) / 400;
        return {
            bg: interpolateColors('#ffffff', '#050508', t),
            stars: lerp(0, 1, t),
            celestial: 'sun',
            celestialOpacity: lerp(1, 0, t),
            ground: interpolateColors('#e0e0e0', 'rgba(138, 43, 226, 0.3)', t),
            cloudOpacity: lerp(0.5, 0.1, t),
            dinoColor: interpolateColors('#1a1a1a', '#bc13fe', t),
            obstacleColor: interpolateColors('#2d5a27', '#00ffcc', t)
        };
    } else if (score < 1200) {
        // Stage 3: Night (Full Dark) - Score 800 to 1200
        return {
            bg: '#050508',
            stars: 1,
            celestial: 'moon',
            celestialOpacity: 1,
            ground: 'rgba(138, 43, 226, 0.3)',
            cloudOpacity: 0.1,
            dinoColor: '#bc13fe',
            obstacleColor: '#00ffcc'
        };
    } else {
        // Stage 4: Dawn Transition - Score 1200+
        const t = Math.min(1, (score - 1200) / 400);
        return {
            bg: interpolateColors('#050508', '#ffffff', t),
            stars: lerp(1, 0, t),
            celestial: 'moon',
            celestialOpacity: lerp(1, 0, t),
            ground: interpolateColors('rgba(138, 43, 226, 0.3)', '#e0e0e0', t),
            cloudOpacity: lerp(0.1, 0.5, t),
            dinoColor: interpolateColors('#bc13fe', '#1a1a1a', t),
            obstacleColor: interpolateColors('#00ffcc', '#2d5a27', t)
        };
    }
}

function interpolateColors(c1, c2, t) {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.floor(lerp(r1, r2, t));
    const g = Math.floor(lerp(g1, g2, t));
    const b = Math.floor(lerp(b1, b2, t));
    return `rgb(${r}, ${g}, ${b})`;
}

function drawStars(alpha) {
    if (alpha <= 0) return;
    stars.forEach(star => {
        star.twinkleOffset += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinkleOffset) + 1) / 2;
        ctx.globalAlpha = alpha * (0.5 + twinkle * 0.5) * star.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const xScale = canvas.width / 800;
        ctx.arc(star.x * xScale, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawMoon(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 60, 30, 0.5, Math.PI * 2);
    ctx.fill();
    // Inner cutout for crescent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvas.width - 115, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSun(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ffcc00';
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 60, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function draw() {
    const config = getStageConfigs(score);
    
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawStars(config.stars);
    if (config.celestial === 'moon') drawMoon(config.celestialOpacity || 1);
    else drawSun(config.celestialOpacity || 1);
    
    // Draw Ground Line
    ctx.strokeStyle = config.ground;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 60);
    ctx.lineTo(canvas.width, GROUND_Y + 60);
    ctx.stroke();

    // Draw Clouds
    ctx.fillStyle = `rgba(255, 255, 255, ${config.cloudOpacity})`;
    clouds.forEach(cloud => {
        drawRoundedRect(ctx, cloud.x, cloud.y, cloud.width, cloud.height, 10);
    });

    // Draw Dino
    ctx.shadowBlur = config.bg === '#050508' ? 15 : 0;
    ctx.shadowColor = config.dinoColor;
    ctx.fillStyle = config.dinoColor;
    drawRoundedRect(ctx, dino.x, dino.y, dino.width, dino.height, 12);
    
    // Draw Eyes
    ctx.fillStyle = config.bg === '#050508' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)';
    ctx.fillRect(dino.x + 40, dino.y + 15, 8, 8);

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.shadowBlur = config.bg === '#050508' ? 15 : 0;
        ctx.shadowColor = config.obstacleColor;
        ctx.fillStyle = config.obstacleColor;
        if (obs.type === 'bird') {
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
            ctx.lineTo(obs.x, obs.y);
            ctx.fill();
        } else {
            drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
            if (obs.type === 'cactus_tall') {
                drawRoundedRect(ctx, obs.x - 10, obs.y + 20, 15, 8, 3);
                drawRoundedRect(ctx, obs.x + obs.width - 5, obs.y + 10, 15, 8, 3);
            } else if (obs.type === 'cactus_wide') {
                drawRoundedRect(ctx, obs.x + 5, obs.y - 10, 12, 15, 3);
                drawRoundedRect(ctx, obs.x + 30, obs.y - 5, 12, 10, 3);
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

function animate(timestamp) {
    if (!gameRunning || isPaused) return;
    animationFrameId = requestAnimationFrame(animate);
    
    const deltaTime = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
}

function gameOver() {
    gameRunning = false;
    isPaused = false;
    pauseBtn?.classList.add('hidden');
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
