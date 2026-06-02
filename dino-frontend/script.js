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
const pauseMenu = document.getElementById('pauseMenu');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnMute = document.getElementById('btn-mute');
const hintText = document.getElementById('hint-text');
const gameWrapper = document.querySelector('.game-wrapper');
let gameWidth = 800;
let gameHeight = 400;

// Game Constants
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
let GROUND_Y = 230; 
const INITIAL_SPEED = 8;
const SPEED_INCREMENT = 0.002;
let distanceSinceLastObstacle = 0;

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

const stars = Array.from({length: 35}, () => ({
    x: Math.random() * 800,
    y: Math.random() * 150,
    size: Math.random() * 2 + 0.5,
    twinkleSpeed: Math.random() * 0.05 + 0.02,
    twinkleOffset: Math.random() * Math.PI * 2,
    opacity: Math.random() * 0.5 + 0.5
}));

highScoreElement.textContent = highScore;

function resizeCanvas() {
    const root = document.querySelector('.game-root');
    const header = document.querySelector('.header');
    
    if (!root || !header) return;
    
    const isMobileLandscape = window.innerHeight <= 600 && window.innerWidth > window.innerHeight;
    
    let layoutW, layoutH;
    
    if (isMobileLandscape) {
        layoutW = window.innerWidth;
        layoutH = window.innerHeight;
        gameWidth = layoutW;
        gameHeight = layoutH;
    } else {
        layoutW = root.clientWidth;
        // Cap the width and height for a beautiful centered gameplay area
        layoutW = Math.min(layoutW, 800);
        layoutH = Math.min(root.clientHeight - header.offsetHeight, 400);
        
        // Lock aspect ratio to 2:1 (800x400 coordinate space)
        if (layoutW > layoutH * 2) {
            layoutW = layoutH * 2;
        } else {
            layoutH = layoutW / 2;
        }
        
        gameWidth = 800;
        gameHeight = 400;
    }
    
    // Set CSS dimensions on the canvas element
    canvas.style.width = `${layoutW}px`;
    canvas.style.height = `${layoutH}px`;
    
    // Set backing store dimensions scaled by the screen's Device Pixel Ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = layoutW * dpr;
    canvas.height = layoutH * dpr;
    
    GROUND_Y = gameHeight - 70;
    
    if (!dino.isJumping) {
        dino.y = GROUND_Y;
    }
    
    if (!gameRunning) {
        draw();
    }
}

window.addEventListener('resize', resizeCanvas);

let touchHandled = false;
function init() {
    resizeCanvas();
    
    // Hub Button Fix
    document.getElementById('hub-btn')?.addEventListener('click', () => {
        console.log('hub clicked');
        window.top.location.href = '../index.html';
    });

    startBtn?.addEventListener('click', (e) => {
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

    // Dismiss Force Landscape Prompt
    const dismissBtn = document.getElementById('dismissLandscapeBtn');
    const landscapePrompt = document.getElementById('landscapePrompt');
    dismissBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        landscapePrompt?.classList.add('dismissed');
        window.dispatchEvent(new Event('resize'));
    });

    // Reset dismissed state if screen is rotated back to landscape
    window.addEventListener('resize', () => {
        if (window.innerWidth > window.innerHeight) {
            landscapePrompt?.classList.remove('dismissed');
        }
    });

    gameWrapper?.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('.overlay-content') || e.target.closest('.htp-card')) return;
        if (touchHandled) return;
        if (!gameRunning) startGame();
        else jump();
    });

    gameWrapper?.addEventListener('touchstart', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('.overlay-content') || e.target.closest('.htp-card')) return;
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

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameRunning && !isPaused) {
            togglePause(true);
        }
    });

    btnResume?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePause(false);
    });

    btnMute?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.audioFX) {
            window.audioFX.toggleMute();
            btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
        }
    });

    btnQuit?.addEventListener('click', (e) => {
        e.stopPropagation();
        gameRunning = false;
        isPaused = false;
        pauseMenu.classList.add('hidden');
        overlayTitle.textContent = "Zen Dino";
        overlayMessage.innerHTML = "Run, jump, and survive the neon desert.";
        startBtn.textContent = "Start Game";
        document.getElementById('shareContainer')?.classList.add('hidden');
        overlay.classList.remove('hidden');
        pauseBtn?.classList.add('hidden');
        hintText?.classList.remove('hidden');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        dino.y = GROUND_Y;
        dino.dy = 0;
        obstacles = [];
        clouds = [];
        score = 0;
        scoreElement.textContent = score;
        draw();
    });

    // How to Play
    document.getElementById('htp-btn')?.addEventListener('click', () => {
        document.getElementById('htpOverlay')?.classList.add('active');
    });
    document.getElementById('htp-close')?.addEventListener('click', () => {
        document.getElementById('htpOverlay')?.classList.remove('active');
    });
}

function startGame() {
    if (gameRunning) return;
    
    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    
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
    gameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    hintText?.classList.add('hidden');
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = performance.now();
    animate(lastTime);
}

function togglePause(forcePause) {
    if (!gameRunning) return;
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        pauseMenu.classList.remove('hidden');
    } else {
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        animate(lastTime);
    }
}

function jump() {
    if (isPaused) return;
    if (!dino.isJumping) {
        if (window.audioFX) window.audioFX.playJump();
        dino.dy = JUMP_FORCE;
        dino.isJumping = true;
        dino.canDoubleJump = true;
    } else if (dino.canDoubleJump) {
        if (window.audioFX) window.audioFX.playJump();
        dino.dy = JUMP_FORCE * 0.8;
        dino.canDoubleJump = false;
        if (window.achievements) window.achievements.unlock('dino', 'double_jump', 'Acrobat');
    }
}

function update(deltaTime) {
    frameCount++;
    gameSpeed = Math.min(gameSpeed + SPEED_INCREMENT * deltaTime, 25);
    
    dino.dy += GRAVITY * deltaTime;
    dino.y += dino.dy * deltaTime;
    
    if (dino.y > GROUND_Y) {
        dino.y = GROUND_Y;
        dino.dy = 0;
        dino.isJumping = false;
    }
    
    if (gameRunning) {
        score += (gameSpeed * deltaTime) / 50;
        const roundedScore = Math.floor(score);
        scoreElement.textContent = roundedScore;
        
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
    
    distanceSinceLastObstacle += gameSpeed * deltaTime;
    const spawnThreshold = Math.max(250, 450 - score * 0.1);
    if (distanceSinceLastObstacle > spawnThreshold) {
        spawnObstacle();
        distanceSinceLastObstacle = 0;
    }

    if (frameCount % 120 === 0 && Math.random() > 0.6) {
        spawnCloud();
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed * deltaTime;
        
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

    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= gameSpeed * 0.3 * deltaTime;
        if (clouds[i].x + clouds[i].width < -100) clouds.splice(i, 1);
    }
}

function spawnCloud() {
    const w = 70 + Math.random() * 30;
    clouds.push({ x: gameWidth, y: 20 + Math.random() * 80, width: w, height: w * (14 / 46) });
}

function spawnObstacle() {
    const isBird = score > 50 && Math.random() > 0.7;
    if (isBird) {
        const birdY = Math.random() > 0.5 ? GROUND_Y - 40 : GROUND_Y + 10;
        obstacles.push({ x: gameWidth, y: birdY, width: 40, height: 30, color: '#ff4d4d', type: 'bird' });
    } else {
        const rand = Math.random();
        if (rand > 0.6) {
            obstacles.push({ x: gameWidth, y: GROUND_Y, width: 25, height: 60, color: '#00ffcc', type: 'cactus_tall' });
        } else if (rand > 0.3) {
            obstacles.push({ x: gameWidth, y: GROUND_Y + 20, width: 50, height: 40, color: '#00ffcc', type: 'cactus_wide' });
        } else {
            obstacles.push({ x: gameWidth, y: GROUND_Y + 30, width: 35, height: 30, color: '#00ffcc', type: 'cactus_small' });
        }
    }
}

function getStageConfigs(score) {
    const cycleScore = score % 600;
    if (cycleScore < 150) {
        return { bg: '#ffffff', stars: 0, celestial: 'sun', celestialOpacity: 1, ground: '#e0e0e0', cloudColor: '#000000', dinoColor: '#1a1a1a', obstacleColor: '#2d5a27' };
    } else if (cycleScore < 300) {
        const t = (cycleScore - 150) / 150;
        return { bg: interpolateColors('#ffffff', '#050508', t), stars: lerp(0, 1, t), celestial: 'sun', celestialOpacity: lerp(1, 0, t), ground: interpolateColors('#e0e0e0', 'rgba(138, 43, 226, 0.3)', t), cloudColor: interpolateColors('#000000', '#ffffff', t), dinoColor: interpolateColors('#1a1a1a', '#bc13fe', t), obstacleColor: interpolateColors('#2d5a27', '#00ffcc', t) };
    } else if (cycleScore < 450) {
        return { bg: '#050508', stars: 1, celestial: 'moon', celestialOpacity: 1, ground: 'rgba(138, 43, 226, 0.3)', cloudColor: '#ffffff', dinoColor: '#bc13fe', obstacleColor: '#00ffcc' };
    } else {
        const t = (cycleScore - 450) / 150;
        return { bg: interpolateColors('#050508', '#ffffff', t), stars: lerp(1, 0, t), celestial: 'moon', celestialOpacity: lerp(1, 0, t), ground: interpolateColors('rgba(138, 43, 226, 0.3)', '#e0e0e0', t), cloudColor: interpolateColors('#ffffff', '#000000', t), dinoColor: interpolateColors('#bc13fe', '#1a1a1a', t), obstacleColor: interpolateColors('#00ffcc', '#2d5a27', t) };
    }
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function interpolateColors(c1, c2, t) {
    const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    return `rgb(${Math.floor(lerp(r1, r2, t))}, ${Math.floor(lerp(g1, g2, t))}, ${Math.floor(lerp(b1, b2, t))})`;
}

const DINO_RUN_1 = [
    "0000001111110000",
    "0000011111111000",
    "0000011011111000",
    "0000011111110000",
    "0000011111000000",
    "0010111111000000",
    "0111111111100000",
    "1111111111110000",
    "1111111111000000",
    "1111111111000000",
    "0111111110000000",
    "0011111100000000",
    "0001100100000000",
    "0001000110000000",
    "0011000000000000"
];

const DINO_RUN_2 = [
    "0000001111110000",
    "0000011111111000",
    "0000011011111000",
    "0000011111110000",
    "0000011111000000",
    "0010111111000000",
    "0111111111100000",
    "1111111111110000",
    "1111111111000000",
    "1111111111000000",
    "0111111110000000",
    "0011111100000000",
    "0000100110000000",
    "0001100100000000",
    "0000001100000000"
];

const DINO_JUMP = [
    "0000001111110000",
    "0000011111111000",
    "0000011011111000",
    "0000011111110000",
    "0000011111000000",
    "0010111111000000",
    "0111111111100000",
    "1111111111110000",
    "1111111111000000",
    "1111111111000000",
    "0111111110000000",
    "0011111100000000",
    "0001100110000000",
    "0011001100000000",
    "0000000000000000"
];

function drawPixelDino(ctx, x, y, width, height, color, eyeColor, isJumping, frameCount) {
    let frame = DINO_JUMP;
    if (!isJumping && gameRunning) {
        frame = (Math.floor(frameCount / 6) % 2 === 0) ? DINO_RUN_1 : DINO_RUN_2;
    } else if (!gameRunning) {
        frame = DINO_RUN_1;
    }

    const rows = frame.length;
    const cols = frame[0].length;
    const pxW = width / cols;
    const pxH = height / rows;

    ctx.save();
    ctx.fillStyle = color;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = frame[r][c];
            if (val === '1') {
                ctx.fillRect(x + c * pxW, y + r * pxH, pxW + 0.5, pxH + 0.5);
            }
        }
    }

    // Draw eye
    ctx.fillStyle = eyeColor;
    ctx.fillRect(x + 7 * pxW, y + 2 * pxH, pxW, pxH);

    ctx.restore();
}

function drawStars(alpha) {
    if (alpha <= 0) return;
    stars.forEach(star => {
        star.twinkleOffset += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinkleOffset) + 1) / 2;
        ctx.globalAlpha = alpha * (0.5 + twinkle * 0.5) * star.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x * (gameWidth/800), star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawMoon(opacity) {
    if (opacity <= 0) return;
    ctx.save(); ctx.globalAlpha = opacity; ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(150, 60, 30, 0.5, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(135, 50, 30, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawSun(opacity) {
    if (opacity <= 0) return;
    ctx.save(); ctx.globalAlpha = opacity; ctx.shadowBlur = 40; ctx.shadowColor = '#ffcc00'; ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(150, 60, 35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function draw() {
    // Reset transform to identity, then clear backing store
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale drawings to fit layout coordinate grid
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / gameWidth;
    const scaleY = (canvas.height / dpr) / gameHeight;
    ctx.scale(dpr * scaleX, dpr * scaleY);
    
    const config = getStageConfigs(score);
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    drawStars(config.stars);
    if (config.celestial === 'moon') drawMoon(config.celestialOpacity || 1); else drawSun(config.celestialOpacity || 1);
    
    ctx.strokeStyle = config.ground; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 60); ctx.lineTo(gameWidth, GROUND_Y + 60); ctx.stroke();
    
    ctx.fillStyle = config.cloudColor; clouds.forEach(cloud => drawPixelCloud(ctx, cloud.x, cloud.y, cloud.width, cloud.height));
    
    const isDark = config.bg === '#050508';
    
    if (isDark) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            ctx.shadowBlur = 0;
            
            // Draw larger transparent dino as glow
            ctx.globalAlpha = 0.25;
            drawPixelDino(ctx, dino.x - 2, dino.y - 2, dino.width + 4, dino.height + 4, config.dinoColor, 'rgba(0,0,0,0)', dino.isJumping, frameCount);
            ctx.globalAlpha = 1.0;
            
            // Draw actual dino
            drawPixelDino(ctx, dino.x, dino.y, dino.width, dino.height, config.dinoColor, '#000', dino.isJumping, frameCount);
            
            // Draw obstacles glow
            obstacles.forEach(obs => {
                ctx.fillStyle = obs.color || config.obstacleColor;
                if (obs.type === 'bird') {
                    ctx.globalAlpha = 0.25;
                    ctx.beginPath(); ctx.moveTo(obs.x - 1, obs.y + obs.height + 1); ctx.lineTo(obs.x + obs.width + 1, obs.y + obs.height / 2); ctx.lineTo(obs.x - 1, obs.y - 1); ctx.fill();
                    ctx.globalAlpha = 1.0;
                    
                    ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2); ctx.lineTo(obs.x, obs.y); ctx.fill();
                } else {
                    ctx.globalAlpha = 0.25;
                    drawRoundedRect(ctx, obs.x - 2, obs.y - 2, obs.width + 4, obs.height + 4, 6);
                    ctx.globalAlpha = 1.0;
                    
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
        } else {
            // Desktop: use native shadowBlur
            ctx.shadowBlur = 15;
            ctx.shadowColor = config.dinoColor;
            
            drawPixelDino(ctx, dino.x, dino.y, dino.width, dino.height, config.dinoColor, '#000', dino.isJumping, frameCount);
            
            obstacles.forEach(obs => {
                ctx.shadowBlur = 15; ctx.shadowColor = obs.color || config.obstacleColor; ctx.fillStyle = obs.color || config.obstacleColor;
                if (obs.type === 'bird') { 
                    ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2); ctx.lineTo(obs.x, obs.y); ctx.fill(); 
                } else {
                    drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
                    if (obs.type === 'cactus_tall') { drawRoundedRect(ctx, obs.x - 10, obs.y + 20, 15, 8, 3); drawRoundedRect(ctx, obs.x + obs.width - 5, obs.y + 10, 15, 8, 3); }
                    else if (obs.type === 'cactus_wide') { drawRoundedRect(ctx, obs.x + 5, obs.y - 10, 12, 15, 3); drawRoundedRect(ctx, obs.x + 30, obs.y - 5, 12, 10, 3); }
                }
            });
        }
    } else {
        // Day mode
        ctx.shadowBlur = 0;
        
        drawPixelDino(ctx, dino.x, dino.y, dino.width, dino.height, config.dinoColor, '#fff', dino.isJumping, frameCount);
        
        obstacles.forEach(obs => {
            ctx.fillStyle = obs.color || config.obstacleColor;
            if (obs.type === 'bird') { 
                ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2); ctx.lineTo(obs.x, obs.y); ctx.fill(); 
            } else {
                drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
                if (obs.type === 'cactus_tall') { drawRoundedRect(ctx, obs.x - 10, obs.y + 20, 15, 8, 3); drawRoundedRect(ctx, obs.x + obs.width - 5, obs.y + 10, 15, 8, 3); }
                else if (obs.type === 'cactus_wide') { drawRoundedRect(ctx, obs.x + 5, obs.y - 10, 12, 15, 3); drawRoundedRect(ctx, obs.x + 30, obs.y - 5, 12, 10, 3); }
            }
        });
    }
    ctx.shadowBlur = 0;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, width, height, radius);
    else ctx.rect(x, y, width, height);
    ctx.fill();
}

function drawPixelCloud(ctx, x, y, width, height) {
    const w = width / 46, h = height / 14;
    const pts = [[0,11], [2,11], [2,9], [4,9], [4,8], [7,8], [7,6], [10,6], [10,5], [14,5], [14,3], [19,3], [19,1], [22,1], [22,0], [30,0], [30,1], [33,1], [33,3], [35,3], [35,4], [42,4], [42,5], [44,5], [44,6], [46,6], [46,12], [44,12], [44,13], [42,13], [42,14], [4,14], [4,13], [0,13]];
    ctx.beginPath(); ctx.moveTo(x + pts[0][0]*w, y + pts[0][1]*h);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i][0]*w, y + pts[i][1]*h);
    ctx.closePath(); ctx.fill();
}

let lastTime = 0;
function animate(timestamp) {
    if (!gameRunning || isPaused) { lastTime = 0; return; }
    animationFrameId = requestAnimationFrame(animate);
    if (!lastTime) lastTime = timestamp;
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
    overlayTitle.textContent = "Game Over";
    overlayMessage.textContent = `Final Score: ${Math.floor(score)}`;
    const shareContainer = document.getElementById('shareContainer');
    if (shareContainer) shareContainer.classList.remove('hidden');
    startBtn.textContent = "Restart Game";
    overlay.classList.remove('hidden');
    hintText?.classList.remove('hidden');
}

function shareScore(platform) {
    const text = `I just scored ${Math.floor(score)} points in Zen Dino 🦖 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

document.getElementById('tweetBtn')?.addEventListener('click', () => shareScore('twitter'));
document.getElementById('waBtn')?.addEventListener('click', () => shareScore('whatsapp'));

init();
draw();
