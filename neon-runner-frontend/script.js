// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;

// --- DOM Elements ---
const hudScore = document.getElementById('hudScore');
const hudBest = document.getElementById('hudBest');
const hudBoosts = document.getElementById('hudBoosts');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const goScore = document.getElementById('goScore');

// --- Game State ---
let highScore = parseInt(localStorage.getItem('neonRunnerBest') || '0');
let totalCoins = parseInt(localStorage.getItem('neonRunnerTotalCoins') || '0');
hudBest.textContent = highScore;

let isRunning = false;
let score = 0;
let baseSpeed = 8;
let speedMult = 1;
let frameCount = 0;
let lastTime = 0;
const fps = 1000 / 60;
let animationId;

// Game Arrays
let lanes = [];
let obstacles = [];
let coins = [];
let particles = [];
let bgStars = [];
let bgBuildings = [];

// --- Player Object ---
let player = {
    laneIndex: 1,
    x: cw * 0.2,
    y: 0,
    w: 30, h: 50,
    targetY: 0,
    invincible: false,
    invincTimer: 0,
    boosts: 3,
    coinCounter: 0 
};

// --- Initialization ---
function calculateLanes() {
    const center = ch / 2;
    const spacing = Math.min(100, ch / 4);
    lanes = [center - spacing, center, center + spacing];
}

function initEnvironment() {
    calculateLanes();
    player.y = lanes[player.laneIndex];
    player.targetY = lanes[player.laneIndex];
    
    bgStars = [];
    for(let i=0; i<50; i++) {
        bgStars.push({ x: Math.random()*cw, y: Math.random()*(ch*0.6), r: Math.random()*1.5, alpha: Math.random() });
    }
    
    bgBuildings = [];
    for(let i=0; i<15; i++) {
        let w = 40 + Math.random()*80;
        let h = 50 + Math.random()*150;
        bgBuildings.push({ x: Math.random()*cw, w: w, h: h, color: `rgba(0, 255, 204, ${0.05 + Math.random()*0.1})` });
    }
}

window.addEventListener('resize', () => {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
    calculateLanes();
    if (!isRunning) initEnvironment();
});

// --- Game Logic ---
function resetGame() {
    score = 0;
    baseSpeed = 7;
    speedMult = 1;
    frameCount = 0;
    obstacles = [];
    coins = [];
    particles = [];
    player.laneIndex = 1;
    player.y = lanes[1];
    player.targetY = lanes[1];
    player.invincible = false;
    player.invincTimer = 0;
    player.boosts = 3;
    player.coinCounter = 0;
    
    updateHUD();
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    isRunning = true;
    
    if (window.audioFX) window.audioFX.init();
    
    lastTime = performance.now();
    unlockAchievement('achievement_neon_runner_first_run');
    loop(lastTime);
}

function updateHUD() {
    hudScore.textContent = Math.floor(score);
    hudBoosts.textContent = player.boosts;
}

function gameOver() {
    isRunning = false;
    cancelAnimationFrame(animationId);
    
    if (window.audioFX) window.audioFX.playGameOver();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    if (Math.floor(score) > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('neonRunnerBest', highScore);
        hudBest.textContent = highScore;
    }
    
    goScore.textContent = Math.floor(score);
    gameOverOverlay.classList.remove('hidden');
    
    spawnParticles(player.x, player.y, '--pink', 30);
    drawBase(); 
}

// --- Inputs ---
let lastTap = 0;

function handleMove(dir) {
    if (!isRunning) return;
    let moved = false;
    if (dir === 'up' && player.laneIndex > 0) { player.laneIndex--; moved = true; }
    if (dir === 'down' && player.laneIndex < 2) { player.laneIndex++; moved = true; }
    
    if (moved) {
        player.targetY = lanes[player.laneIndex];
        if (window.audioFX) window.audioFX.playJump();
    }
}

function triggerBoost() {
    if (!isRunning || player.boosts <= 0 || player.invincible) return;
    player.boosts--;
    player.invincible = true;
    player.invincTimer = 120; 
    updateHUD();
    spawnParticles(player.x, player.y, '--cyan', 20);
    if (window.audioFX) window.audioFX.playEat(); // Boost sound
}

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') handleMove('up');
    if (e.key === 'ArrowDown') handleMove('down');
    if (e.key === ' ') {
        let now = performance.now();
        if (now - lastTap < 300) triggerBoost();
        else lastTap = now;
    }
});

let touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
    let now = performance.now();
    if (now - lastTap < 300) triggerBoost();
    else lastTap = now;
}, {passive: true});

canvas.addEventListener('touchend', e => {
    let touchEndY = e.changedTouches[0].clientY;
    let dy = touchEndY - touchStartY;
    if (dy < -40) handleMove('up');
    else if (dy > 40) handleMove('down');
}, {passive: true});

startBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', resetGame);

// --- Entity Spawning ---
function spawnObstacle() {
    let lane = Math.floor(Math.random() * 3);
    obstacles.push({
        x: cw + 50,
        lane: lane,
        w: 30, h: 40,
        passed: false
    });
}

function spawnCoin() {
    let lane = Math.floor(Math.random() * 3);
    coins.push({
        x: cw + 50,
        lane: lane,
        r: 12
    });
}

function spawnParticles(x, y, colorVar, count=10) {
    let color = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
    for (let i=0; i<count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random()-0.5)*10 - 2, 
            vy: (Math.random()-0.5)*10,
            life: 1.0, color: color
        });
    }
}

// --- Main Loop Functions ---
function update() {
    frameCount++;
    score += (baseSpeed * speedMult) * 0.01;
    speedMult += 0.0005; 
    
    let currentSpeed = baseSpeed * speedMult;

    if (player.invincible) {
        player.invincTimer--;
        if (player.invincTimer <= 0) player.invincible = false;
        currentSpeed *= 1.5; 
    }

    if (frameCount % 10 === 0) updateHUD();

    player.y += (player.targetY - player.y) * 0.2;

    if (Math.random() < 0.015 * speedMult) spawnObstacle();
    if (Math.random() < 0.02 * speedMult) spawnCoin();

    bgStars.forEach(s => {
        s.x -= currentSpeed * 0.1;
        if (s.x < 0) { s.x = cw; s.y = Math.random()*(ch*0.6); }
    });
    bgBuildings.forEach(b => {
        b.x -= currentSpeed * 0.4;
        if (b.x + b.w < 0) { b.x = cw; b.w = 40+Math.random()*80; b.h = 50+Math.random()*150; }
    });

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= currentSpeed;
        
        let playerBot = player.y + player.h/2;
        let playerTop = player.y - player.h/2;
        let playerRight = player.x + player.w/2;
        let playerLeft = player.x - player.w/2;
        
        let obsY = lanes[obs.lane];
        let obsBot = obsY + obs.h/2;
        let obsTop = obsY - obs.h/2;
        let obsRight = obs.x + obs.w/2;
        let obsLeft = obs.x - obs.w/2;

        if (playerRight > obsLeft && playerLeft < obsRight && playerBot > obsTop && playerTop < obsBot) {
            if (player.invincible) {
                spawnParticles(obs.x, obsY, '--pink');
                if (window.audioFX) window.audioFX.playJump(); 
                obstacles.splice(i, 1);
                score += 5; 
                continue;
            } else {
                gameOver();
                return;
            }
        }
        
        if (obs.x < -100) obstacles.splice(i, 1);
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i];
        c.x -= currentSpeed;
        
        let cY = lanes[c.lane];
        let dist = Math.hypot(c.x - player.x, cY - player.y);
        
        if (dist < c.r + player.w/2) {
            score += 10;
            player.coinCounter++;
            totalCoins++;
            localStorage.setItem('neonRunnerTotalCoins', totalCoins);
            spawnParticles(c.x, cY, '--gold', 5);
            
            if (window.audioFX) window.audioFX.playEat();
            
            coins.splice(i, 1);
            
            if (player.coinCounter >= 10) {
                player.coinCounter = 0;
                player.boosts = Math.min(3, player.boosts + 1);
                spawnParticles(player.x, player.y, '--cyan', 10);
            }
            
            updateHUD();
            checkAchievements();
            continue;
        }
        
        if (c.x < -50) coins.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx - (currentSpeed*0.5); 
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    if (frameCount % 60 === 0) checkAchievements();
}

function checkAchievements() {
    let s = Math.floor(score);
    if (s >= 100) unlockAchievement('achievement_neon_runner_score_100');
    if (s >= 500) unlockAchievement('achievement_neon_runner_score_500');
    if (s >= 1000) unlockAchievement('achievement_neon_runner_score_1000');
    if (totalCoins >= 50) unlockAchievement('achievement_neon_runner_collect_50_coins');
}

function unlockAchievement(id) {
    if (!localStorage.getItem(id)) {
        localStorage.setItem(id, 'true');
        if (window.achievements && window.achievements.unlock) {
            let titles = {
                'achievement_neon_runner_first_run': 'First Run',
                'achievement_neon_runner_score_100': 'Speedster',
                'achievement_neon_runner_score_500': 'Street Racer',
                'achievement_neon_runner_score_1000': 'Neon Legend',
                'achievement_neon_runner_collect_50_coins': 'Coin Hoarder'
            };
            window.achievements.unlock('runner', id.replace('achievement_', ''), titles[id] || 'Unlocked');
        }
    }
}

function drawBase() {
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, cw, ch);
    
    bgStars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    });
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    bgBuildings.forEach(b => {
        ctx.fillStyle = b.color;
        let groundY = lanes[2] + 60;
        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
    });
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    lanes.forEach(ly => {
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(cw, ly); ctx.stroke();
    });

    ctx.shadowBlur = player.invincible ? 25 : 15;
    ctx.shadowColor = player.invincible ? '#ffcc00' : '#00ffcc';
    ctx.fillStyle = player.invincible ? '#ffffff' : '#00ffcc';
    
    let px = player.x, py = player.y;
    ctx.beginPath();
    ctx.arc(px, py - 20, 8, 0, Math.PI*2); 
    ctx.fill();
    
    ctx.strokeStyle = player.invincible ? '#ffffff' : '#00ffcc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, py - 12); ctx.lineTo(px, py + 8); 
    
    let time = performance.now() / 150;
    let swing = Math.sin(time) * 12;
    
    ctx.moveTo(px, py + 8); ctx.lineTo(px - swing, py + 22); 
    ctx.moveTo(px, py + 8); ctx.lineTo(px + swing, py + 22); 
    ctx.moveTo(px, py - 8); ctx.lineTo(px + swing, py + 5);  
    ctx.moveTo(px, py - 8); ctx.lineTo(px - swing, py + 5);  
    ctx.stroke();

    if (player.invincible) {
        ctx.strokeStyle = 'rgba(255, 204, 0, 0.5)';
        ctx.beginPath(); ctx.arc(px, py, 35, 0, Math.PI*2); ctx.stroke();
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffcc00';
    ctx.fillStyle = '#ffcc00';
    coins.forEach(c => {
        let cy = lanes[c.lane];
        ctx.beginPath(); ctx.arc(c.x, cy, c.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(c.x, cy, c.r/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffcc00';
    });

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3366';
    ctx.fillStyle = '#ff3366';
    obstacles.forEach(o => {
        let oy = lanes[o.lane];
        ctx.fillRect(o.x - o.w/2, oy - o.h/2, o.w, o.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(o.x - 2, oy - o.h/2 + 5, 4, o.h - 10);
        ctx.fillStyle = '#ff3366';
    });

    ctx.shadowBlur = 8;
    particles.forEach(p => {
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

function loop(timestamp) {
    if (!isRunning) return;
    animationId = requestAnimationFrame(loop);
    
    if (!lastTime) lastTime = timestamp;
    let elapsed = timestamp - lastTime;
    
    if (elapsed > fps) {
        lastTime = timestamp - (elapsed % fps);
        update();
        drawBase();
    }
}

function share(platform) {
    const text = `I just scored ${Math.floor(score)} in Neon Runner at Arcade Hub! Think you can run further?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'wa') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

initEnvironment();
drawBase();
