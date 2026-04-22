const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const leftZone = document.getElementById('leftTouchZone');
const rightZone = document.getElementById('rightTouchZone');
const tweetBtn = document.getElementById('tweetBtn');
const waBtn = document.getElementById('waBtn');
const pauseBtn = document.getElementById('pauseBtnHUD');
const pauseIcon = pauseBtn?.querySelector('.pause-icon');
const pauseMenu = document.getElementById('pauseMenu');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnMute = document.getElementById('btn-mute');
const livesContainer = document.getElementById('livesContainer');

// Navigation
document.querySelectorAll('.btn-hub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log('hub clicked');
        // window.location.href = '../index.html';
    });
});

let CANVAS_W = 800;
let CANVAS_H = 400;

let score = 0;
let highScore = localStorage.getItem('brawlerHighScore') || 0;
highScoreEl.textContent = highScore;

let gameRunning = false;
let isPaused = false;
let frameId;
let lastTime = 0;
const fpsInterval = 1000 / 60;

// Game Entities
let player;
let enemies = [];
let particles = [];
let spawnTimer = 0;
let spawnInterval = 100;
let gameSpeedMultiplier = 1;
let screenShake = 0;

// Evolution State
let currentStage = 0; // 0: Cyan, 1: Purple, 2: Red
let comboGlow = 0;
let bossActive = false;
let boss = null;
let warningTimer = 0;

const STAGE_COLORS = ['#00ffcc', '#bc13fe', '#ff3366'];
const HIT_RANGE = 140; 
const KILL_RANGE = 35; 
const BOSS_THRESHOLD = 100;

function initGame() {
    score = 0;
    scoreEl.textContent = '0';
    spawnTimer = 0;
    spawnInterval = 90;
    gameSpeedMultiplier = 1;
    enemies = [];
    particles = [];
    player = {
        x: CANVAS_W / 2,
        y: CANVAS_H / 2 + 50,
        state: 'idle',
        timer: 0,
        lives: 3,
        invulnerable: false,
        invulnTimer: 0
    };
    currentStage = 0;
    bossActive = false;
    boss = null;
    warningTimer = 0;
    
    updateLivesUI();

    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    gameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    lastTime = performance.now();
    loop(lastTime);
}

function updateLivesUI() {
    if (!livesContainer) return;
    let heartsHTML = '';
    for (let i = 0; i < 3; i++) {
        if (i < player.lives) {
            heartsHTML += '<span class="heart">❤️</span>';
        } else {
            heartsHTML += '<span class="heart empty">❤️</span>';
        }
    }
    livesContainer.innerHTML = heartsHTML;
}

function resizeCanvas() {
    const wrapper = document.querySelector('.game-wrapper');
    if (!wrapper) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    CANVAS_W = canvas.width;
    CANVAS_H = canvas.height;
    if (player) {
        player.x = CANVAS_W / 2;
        player.y = CANVAS_H / 2 + 50;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function attack(direction) {
    if (!gameRunning || isPaused || player.state === 'dead') return;
    
    player.state = direction === 'left' ? 'attackLeft' : 'attackRight';
    player.timer = 8; 
    
    // Boss projectile reflection check
    if (bossActive && boss) {
        boss.projectiles.forEach(p => {
            if (!p.reflected && ((direction === 'left' && p.x < player.x) || (direction === 'right' && p.x > player.x))) {
                let dist = Math.abs(p.x - player.x);
                if (dist < HIT_RANGE) {
                    p.reflected = true;
                    p.vx = -p.vx * 1.5;
                    screenShake = 5;
                    if (window.audioFX) window.audioFX.playJump();
                }
            }
        });
    }

    let closestEnemy = null;
    let closestDist = Infinity;
    
    for (let e of enemies) {
        if (e.dead) continue;
        if ((direction === 'left' && e.side === 'left') || (direction === 'right' && e.side === 'right')) {
            let dist = Math.abs(e.x - player.x);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = e;
            }
        }
    }
    
    if (closestEnemy && closestDist < HIT_RANGE) {
        closestEnemy.hp--;
        if (closestEnemy.hp <= 0) {
            closestEnemy.dead = true;
            closestEnemy.vx = (direction === 'left' ? -18 : 18);
            closestEnemy.vy = -12;
            score++;
            scoreEl.textContent = score;
            spawnParticles(closestEnemy.x, closestEnemy.y, STAGE_COLORS[currentStage]);
            if (window.audioFX) window.audioFX.playEat(); 
            screenShake = closestEnemy.type === 'elite' ? 8 : 3;

            // Evolution / Stage Logic
            if (score > 0 && score % 50 === 0) {
                currentStage = Math.min(2, Math.floor(score / 50));
                comboGlow = 30;
                if (navigator.vibrate) navigator.vibrate(100);
            }

            if (score === BOSS_THRESHOLD && !bossActive) {
                triggerBoss();
            }
        } else {
            // Shield hit
            spawnParticles(closestEnemy.x, closestEnemy.y, '#ffffff');
            if (window.audioFX) window.audioFX.playJump();
            screenShake = 4;
        }
    } else {
        if (window.audioFX) window.audioFX.playJump(); 
    }
}

function takeDamage() {
    if (player.invulnerable || !gameRunning) return;
    
    player.lives--;
    updateLivesUI();
    player.invulnerable = true;
    player.invulnTimer = 90; // 1.5s invulerability
    screenShake = 20;
    
    if (navigator.vibrate) navigator.vibrate(100);
    spawnParticles(player.x, player.y - 20, '#ff0000');
    
    if (player.lives <= 0) {
        gameOver();
    }
}

function triggerBoss() {
    bossActive = true;
    warningTimer = 180; // 3 seconds
    boss = new Wyrm();
    if (window.audioFX) window.audioFX.playGameOver(); // Reuse for alert
}

class Wyrm {
    constructor() {
        this.x = -200;
        this.y = player.y - 120;
        this.health = 5;
        this.maxHealth = 5;
        this.projectiles = [];
        this.lastShot = 0;
        this.sinOffset = 0;
        this.active = false;
        this.color = '#ff00ff';
        this.segments = [];
        for(let i=0; i<10; i++) this.segments.push({x: -200, y: this.y});
    }

    update() {
        if (warningTimer > 0) return;
        this.active = true;
        this.sinOffset += 0.04;
        this.x = (CANVAS_W/2) + Math.sin(this.sinOffset) * (CANVAS_W/2.5);
        this.y = (CANVAS_H/2 - 100) + Math.cos(this.sinOffset * 0.5) * 50;

        // Follow logic
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
        for(let i=this.segments.length-1; i>0; i--) {
            this.segments[i].x += (this.segments[i-1].x - this.segments[i].x) * 0.2;
            this.segments[i].y += (this.segments[i-1].y - this.segments[i].y) * 0.2;
        }

        // Shooting
        if (Date.now() - this.lastShot > 2500) {
            this.lastShot = Date.now();
            this.fire();
        }

        // Projectiles
        for(let i=this.projectiles.length-1; i>=0; i--) {
            let p = this.projectiles[i];
            p.x += p.vx;
            
            // Reflected hit boss
            if (p.reflected) {
                let dx = p.x - this.x;
                let dy = p.y - this.y;
                if (Math.sqrt(dx*dx + dy*dy) < 60) {
                    this.health--;
                    this.projectiles.splice(i, 1);
                    screenShake = 15;
                    if (this.health <= 0) this.die();
                    continue;
                }
            }

            // Hit player
            if (!p.reflected && Math.abs(p.x - player.x) < 30) {
                takeDamage();
            }

            if (p.x < -100 || p.x > CANVAS_W + 100) this.projectiles.splice(i, 1);
        }
    }

    fire() {
        let side = this.x < player.x ? -1 : 1;
        this.projectiles.push({
            x: this.x,
            y: player.y,
            vx: side === -1 ? 8 : -8,
            reflected: false,
            color: '#00ffff'
        });
    }

    die() {
        bossActive = false;
        score += 500;
        scoreEl.textContent = score;
        spawnParticles(this.x, this.y, '#ffffff');
        boss = null;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 10;
        
        ctx.beginPath();
        this.segments.forEach((s, i) => {
            if (i === 0) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
        });
        ctx.stroke();

        this.projectiles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 15, 0, Math.PI*2);
            ctx.fill();
        });

        // Health bar
        const bw = 300;
        const bx = (CANVAS_W - bw)/2;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(bx, 50, bw, 8);
        ctx.fillStyle = this.color;
        ctx.fillRect(bx, 50, bw * (this.health/this.maxHealth), 8);
        ctx.restore();
    }
}

function createEnemy() {
    if (bossActive) return; // Stop enemies during boss
    let side = Math.random() > 0.5 ? 'left' : 'right';
    let type = score > 30 && Math.random() > 0.7 ? 'elite' : 'basic';
    enemies.push({
        x: side === 'left' ? -30 : CANVAS_W + 30,
        y: player.y,
        vx: (side === 'left' ? 3.5 : -3.5) * gameSpeedMultiplier,
        vy: 0,
        side: side,
        dead: false,
        hp: type === 'elite' ? 2 : 1,
        type: type
    });
}

function spawnParticles(x, y, color) {
    for (let i=0; i<10; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random()-0.5)*12,
            vy: (Math.random()-0.5)*12,
            life: 1.0, color: color
        });
    }
}

function gameOver() {
    gameRunning = false;
    isPaused = false;
    pauseBtn?.classList.add('hidden');
    player.state = 'dead';
    if (window.audioFX) window.audioFX.playGameOver();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('brawlerHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    
    document.getElementById('overlayTitle').textContent = "Knockout!";
    document.getElementById('overlayMessage').innerHTML = `Final Streak: ${score}<br>You were overwhelmed!`;
    document.getElementById('shareContainer').classList.remove('hidden');
    startBtn.textContent = "Fight Again";
    overlay.classList.remove('hidden');
}

function update() {
    if (player.state === 'attackLeft' || player.state === 'attackRight') {
        player.timer--;
        if (player.timer <= 0) player.state = 'idle';
    }
    
    if (screenShake > 0) screenShake *= 0.9;
    if (comboGlow > 0) comboGlow--;
    
    if (player.invulnerable) {
        player.invulnTimer--;
        if (player.invulnTimer <= 0) player.invulnerable = false;
    }

    if (!bossActive) {
        spawnTimer++;
        if (spawnTimer >= spawnInterval) {
            createEnemy();
            spawnTimer = 0;
        }
    } else if (boss) {
        boss.update();
        if (warningTimer > 0) warningTimer--;
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.vx;
        e.y += e.vy;
        
        if (e.dead) {
            e.vy += 0.8; 
            if (e.y > CANVAS_H + 100) enemies.splice(i, 1);
        } else {
            let dist = Math.abs(e.x - player.x);
            if (dist < KILL_RANGE) {
                takeDamage();
                if (e.hp > 0) { // Push back slightly
                    e.x += e.side === 'left' ? -50 : 50; 
                }
            }
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.save();
    if (screenShake > 1) {
        ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
    }
    
    let baseColor = STAGE_COLORS[currentStage];
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    // Grid background
    ctx.strokeStyle = comboGlow > 0 ? baseColor : '#1a1a24';
    ctx.lineWidth = comboGlow > 0 ? 2 : 1;
    for(let i=0; i<CANVAS_W; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_H); ctx.stroke(); }
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, player.y + 20);
    ctx.lineTo(CANVAS_W, player.y + 20);
    ctx.stroke();
    
    ctx.fillStyle = currentStage > 0 ? `rgba(${currentStage === 1 ? '188, 19, 254' : '255, 51, 102'}, 0.05)` : 'rgba(0, 255, 204, 0.03)';
    ctx.fillRect(player.x - HIT_RANGE, player.y - 40, HIT_RANGE*2, 60);

    // Warning
    if (warningTimer > 0) {
        ctx.font = '700 40px Outfit, sans-serif';
        ctx.fillStyle = warningTimer % 20 < 10 ? '#ff0000' : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('WARNING: BOSS INCOMING', CANVAS_W/2, CANVAS_H/2);
    }

    const pColor = player.state === 'dead' ? '#555' : STAGE_COLORS[currentStage];
    ctx.shadowBlur = 15;
    ctx.shadowColor = pColor;
    ctx.strokeStyle = pColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    let px = player.x;
    let py = player.y;
    
    if (player.invulnerable && frameCount % 10 < 5) {
        ctx.globalAlpha = 0.4;
    }

    if (player.state === 'attackLeft') px -= 15;
    if (player.state === 'attackRight') px += 15;
    
    ctx.beginPath();
    ctx.arc(px, py - 40, 10, 0, Math.PI * 2); // Head
    ctx.moveTo(px, py - 30); ctx.lineTo(px, py - 10); // Spine
    ctx.moveTo(px, py - 10); ctx.lineTo(px - 15, py + 15); // L Leg
    ctx.moveTo(px, py - 10); ctx.lineTo(px + 15, py + 15); // R Leg
    
    if (player.state === 'attackLeft') {
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 35, py - 20); // punch L
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 15, py - 5);  // off arm
    } else if (player.state === 'attackRight') {
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 35, py - 20); // punch R
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 15, py - 5);  // off arm
    } else {
        ctx.moveTo(px, py - 20); ctx.lineTo(px - 20, py - 10); // idle arm L
        ctx.moveTo(px, py - 20); ctx.lineTo(px + 20, py - 10); // idle arm R
    }
    ctx.stroke();
    
    for (let e of enemies) {
        ctx.shadowBlur = e.dead ? 0 : 15;
        let eColor = e.dead ? '#333' : (e.type === 'elite' ? '#ffcc00' : '#ff3366');
        ctx.shadowColor = eColor;
        ctx.strokeStyle = eColor;
        
        ctx.save();
        ctx.translate(e.x, e.y - 10);
        if (e.dead) ctx.rotate(e.vx * 0.1); 
        
        let time = performance.now() / 100;
        let stride = e.dead ? 5 : Math.sin(time + e.x) * 15;
        let armSwing = e.dead ? -5 : Math.sin(time + e.x + Math.PI) * 15;
        
        ctx.beginPath();
        // Shield for elite
        if (e.type === 'elite' && e.hp > 1) {
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, -15, 45, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.arc(0, -30, 9, 0, Math.PI * 2); // Head
        ctx.moveTo(0, -21); ctx.lineTo(0, 0); // Spine
        ctx.moveTo(0, 0); ctx.lineTo(-stride, 25); // Leg 1
        ctx.moveTo(0, 0); ctx.lineTo(stride, 25); // Leg 2
        
        if (e.dead) {
            ctx.moveTo(0, -10); ctx.lineTo(-20, -20);
            ctx.moveTo(0, -10); ctx.lineTo(20, -20);
        } else {
            ctx.moveTo(0, -10); ctx.lineTo(-armSwing - 10, 0); // Arm L
            ctx.moveTo(0, -10); ctx.lineTo(armSwing + 10, 0); // Arm R
        }
        ctx.stroke();
        ctx.restore();
    }

    if (bossActive && boss) boss.draw();
    
    ctx.shadowBlur = 10;
    for (let p of particles) {
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.restore(); 
}

let frameCount = 0;
function loop(timestamp = 0) {
    if (isPaused) return;
    if (gameRunning) {
        frameCount++;
        frameId = requestAnimationFrame(loop);
        if (!lastTime) lastTime = timestamp;
        let elapsed = timestamp - lastTime;
        if (elapsed > fpsInterval) {
            lastTime = timestamp - (elapsed % fpsInterval);
            update();
            draw();
        }
    } else if (player && player.state === 'dead') {
        draw();
    }
}

startBtn.addEventListener('click', initGame);
window.addEventListener('keydown', (e) => {
    if (!gameRunning) {
        if(e.key === ' ' || e.key === 'Enter') initGame();
        return;
    }
    if (isPaused) return;
    if (e.key === 'ArrowLeft') attack('left');
    if (e.key === 'ArrowRight') attack('right');
});
leftZone.addEventListener('mousedown', () => attack('left'));
rightZone.addEventListener('mousedown', () => attack('right'));
leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('left'); }, {passive: false});
rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('right'); }, {passive: false});

pauseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
});
btnResume?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause(false);
});
btnQuit?.addEventListener('click', (e) => {
    e.stopPropagation();
    gameRunning = false;
    isPaused = false;
    cancelAnimationFrame(frameId);
    pauseMenu.classList.add('hidden');
    document.getElementById('overlayTitle').textContent = "Neon Brawler";
    document.getElementById('overlayMessage').innerHTML = "Enemies approach from both sides.<br>Tap Left/Right or use Arrow Keys to strike!";
    startBtn.textContent = "Start Fighting";
    document.getElementById('shareContainer')?.classList.add('hidden');
    overlay.classList.remove('hidden');
    pauseBtn?.classList.add('hidden');
    
    player = { x: CANVAS_W / 2, y: CANVAS_H / 2 + 50, state: 'idle', lives: 3 };
    updateLivesUI();
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.textContent = '0';
    draw();
});

btnMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioFX) {
        window.audioFX.toggleMute();
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameRunning && !isPaused) togglePause(true);
});
window.addEventListener('blur', () => {
    if (gameRunning && !isPaused) togglePause(true);
});

function togglePause(forcePause) {
    if (!gameRunning) return;
    
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        cancelAnimationFrame(frameId);
        pauseMenu.classList.remove('hidden');
        if (pauseIcon) pauseIcon.textContent = "▶";
    } else {
        pauseMenu.classList.add('hidden');
        if (pauseIcon) pauseIcon.textContent = "||";
        lastTime = performance.now();
        loop(lastTime);
    }
}

function shareScore(platform) {
    const text = `I just reached a streak of ${score} in Neon Brawler 🥊 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}
tweetBtn.addEventListener('click', () => shareScore('twitter'));
waBtn.addEventListener('click', () => shareScore('whatsapp'));

// Idle screen initialization
player = { x: CANVAS_W / 2, y: CANVAS_H / 2 + 50, state: 'idle', lives: 3 };
updateLivesUI();
draw();
