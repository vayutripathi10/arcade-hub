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

let CANVAS_W = 800;
let CANVAS_H = 400;

let score = 0;
let highScore = localStorage.getItem('brawlerHighScore') || 0;
highScoreEl.textContent = highScore;

let gameRunning = false;
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

const HIT_RANGE = 130; 
const KILL_RANGE = 35; 

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
        timer: 0
    };
    if (window.audioFX) window.audioFX.init();
    gameRunning = true;
    overlay.classList.add('hidden');
    lastTime = performance.now();
    loop(lastTime);
}

function resizeCanvas() {
    canvas.width = document.querySelector('.game-wrapper').clientWidth;
    canvas.height = document.querySelector('.game-wrapper').clientHeight;
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
    if (!gameRunning || player.state === 'dead') return;
    
    player.state = direction === 'left' ? 'attackLeft' : 'attackRight';
    player.timer = 8; 
    
    let hit = false;
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
        closestEnemy.dead = true;
        closestEnemy.vx = (direction === 'left' ? -18 : 18);
        closestEnemy.vy = -12;
        score++;
        scoreEl.textContent = score;
        spawnParticles(closestEnemy.x, closestEnemy.y, '#ff3366');
        if (window.audioFX) window.audioFX.playEat(); 
        
        if (window.achievements) {
            if (score === 10) window.achievements.unlock('brawler', '10', 'Street Fighter');
            if (score === 50) window.achievements.unlock('brawler', '50', 'Combo Master');
            if (score === 100) window.achievements.unlock('brawler', '100', 'Neon Ninja');
        }
        
        if (score % 10 === 0) {
            gameSpeedMultiplier += 0.2;
            spawnInterval = Math.max(30, spawnInterval - 8);
        }
        
    } else {
        if (window.audioFX) window.audioFX.playJump(); 
    }
}

function createEnemy() {
    let side = Math.random() > 0.5 ? 'left' : 'right';
    enemies.push({
        x: side === 'left' ? -30 : CANVAS_W + 30,
        y: player.y,
        vx: (side === 'left' ? 3.5 : -3.5) * gameSpeedMultiplier,
        vy: 0,
        side: side,
        dead: false
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
    
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        createEnemy();
        spawnTimer = 0;
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
                gameOver();
                return;
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
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    // Grid background
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_W; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_H); ctx.stroke(); }
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, player.y + 20);
    ctx.lineTo(CANVAS_W, player.y + 20);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(0, 255, 204, 0.03)';
    ctx.fillRect(player.x - HIT_RANGE, player.y - 40, HIT_RANGE*2, 60);

    const pColor = player.state === 'dead' ? '#555' : '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.shadowColor = pColor;
    ctx.strokeStyle = pColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    let px = player.x;
    let py = player.y;
    
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
        ctx.shadowColor = e.dead ? 'transparent' : '#ff3366';
        ctx.strokeStyle = e.dead ? '#333' : '#ff3366';
        
        ctx.save();
        ctx.translate(e.x, e.y - 10);
        if (e.dead) ctx.rotate(e.vx * 0.1); 
        
        let time = performance.now() / 100;
        let stride = e.dead ? 5 : Math.sin(time + e.x) * 15;
        let armSwing = e.dead ? -5 : Math.sin(time + e.x + Math.PI) * 15;
        
        ctx.beginPath();
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
}

function loop(timestamp = 0) {
    if (gameRunning) {
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
    if (e.key === 'ArrowLeft') attack('left');
    if (e.key === 'ArrowRight') attack('right');
});
leftZone.addEventListener('mousedown', () => attack('left'));
rightZone.addEventListener('mousedown', () => attack('right'));
leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('left'); }, {passive: false});
rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); attack('right'); }, {passive: false});

function shareScore(platform) {
    const text = `I just reached a streak of ${score} in Neon Brawler 🥊 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}
tweetBtn.addEventListener('click', () => shareScore('twitter'));
waBtn.addEventListener('click', () => shareScore('whatsapp'));

// Idle screen initialization
player = { x: CANVAS_W / 2, y: CANVAS_H / 2 + 50, state: 'idle' };
draw();
