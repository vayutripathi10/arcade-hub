// Game Constants
const PLAYER_SIZE = 40;
const INVADER_SIZE = 30;
const BULLET_SPEED = 7;
const INVADER_SPEED_BASE = 1;
const INVADER_DROP_DIST = 20;

const COLORS = {
    primary: '#00f3ff',
    secondary: '#ff00ea',
    danger: '#ff3c00',
    bg: '#050505',
    bullets: '#fff',
    powerup: '#39ff14'
};

// Web Audio API Sound Engine
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    setMuted(muted) { this.muted = muted; }

    play(type) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch(type) {
            case 'shoot':
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'explode':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.linearRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'hit':
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
        }
    }
}

const soundManager = new SoundManager();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const levelTag = document.getElementById('level-tag');
const livesEl = document.getElementById('lives-display');

// Game State
let gameState = 'START';
let isPaused = false;
let isMuted = false;
let score = 0;
let bestScore = localStorage.getItem('neonInvadersBest') || 0;
let wave = 1;
let invaderDirection = 1;
let invaderMoveInterval = 1000; // ms
let invaderMoveTimer = 0;
let lastTimestamp = 0;

class Player {
    constructor() {
        this.w = PLAYER_SIZE;
        this.h = PLAYER_SIZE * 0.6;
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - this.h - 20;
        this.targetX = this.x;
        this.lives = 3;
        this.invincible = 0;
        this.powerups = {
            triple: 0,
            rapid: 0,
            shield: false
        };
    }

    update(deltaTime) {
        if (isDragging) {
            this.x += (this.targetX - (this.x + this.w/2)) * 0.2 * deltaTime;
        } else {
            const moveSpeed = 7 * deltaTime;
            if (keys.ArrowLeft || keys.a) this.x -= moveSpeed;
            if (keys.ArrowRight || keys.d) this.x += moveSpeed;
        }

        // Clamp
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));

        if (this.invincible > 0) this.invincible -= deltaTime;
        
        // Decay powerups
        if (this.powerups.triple > 0) this.powerups.triple -= deltaTime;
        if (this.powerups.rapid > 0) this.powerups.rapid -= deltaTime;
    }

    hit() {
        if (this.invincible > 0) return;
        
        if (this.powerups.shield) {
            this.powerups.shield = false;
            this.invincible = 60;
            soundManager.play('explode');
            return;
        }

        this.lives--;
        this.invincible = 120;
        updateHUD();
        soundManager.play('hit');
        
        if (this.lives <= 0) gameOver();
    }

    draw() {
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Shield Effect
        if (this.powerups.shield) {
            ctx.beginPath();
            ctx.arc(this.w/2, this.h/2, this.w, 0, Math.PI*2);
            ctx.strokeStyle = COLORS.primary;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.primary;
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        
        // Ship Body
        ctx.beginPath();
        ctx.moveTo(this.w / 2, 0);
        ctx.lineTo(this.w, this.h);
        ctx.lineTo(0, this.h);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
}

class Invader {
    constructor(x, y, type, hp = 1) {
        this.x = x;
        this.y = y;
        this.w = INVADER_SIZE;
        this.h = INVADER_SIZE;
        this.type = type; // 1, 2, 3
        this.hp = hp;
        this.maxHp = hp;
        this.color = (type === 1) ? COLORS.primary : (type === 2) ? COLORS.secondary : COLORS.danger;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = (this.hp > 1) ? 4 : 2;

        const pad = 5;
        if (this.type === 1) {
            ctx.strokeRect(pad, pad, this.w - pad*2, this.h - pad*2);
            if (this.hp > 1) ctx.strokeRect(pad+4, pad+4, this.w - (pad+4)*2, this.h - (pad+4)*2);
        } else if (this.type === 2) {
            ctx.beginPath();
            ctx.moveTo(this.w/2, pad);
            ctx.lineTo(this.w-pad, this.h-pad);
            ctx.lineTo(pad, this.h-pad);
            ctx.closePath();
            ctx.stroke();
            if (this.hp > 1) {
                ctx.beginPath();
                ctx.moveTo(this.w/2, pad+6);
                ctx.lineTo(this.w-(pad+6), this.h-(pad+4));
                ctx.lineTo(pad+6, this.h-(pad+4));
                ctx.closePath();
                ctx.stroke();
            }
        } else {
            ctx.beginPath();
            ctx.arc(this.w/2, this.h/2, this.w/2 - pad, 0, Math.PI * 2);
            ctx.stroke();
            if (this.hp > 1) {
                ctx.beginPath();
                ctx.arc(this.w/2, this.h/2, this.w/2 - pad - 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, dy, color) {
        this.x = x;
        this.y = y;
        this.w = 3;
        this.h = 10;
        this.dy = dy;
        this.color = color;
    }

    update(deltaTime) {
        this.y += this.dy * deltaTime;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.w/2, this.y, this.w, this.h);
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 25;
        this.h = 25;
        this.type = type; // triple, rapid, shield
        this.dy = 2;
        this.label = type === 'triple' ? '🔱' : type === 'rapid' ? '⚡' : '🛡️';
    }

    update(deltaTime) {
        this.y += this.dy * deltaTime;
    }

    draw() {
        ctx.save();
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.powerup;
        ctx.fillStyle = COLORS.powerup;
        ctx.fillText(this.label, this.x, this.y);
        
        ctx.strokeStyle = COLORS.powerup;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.color = color;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= 0.03 * deltaTime;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.globalAlpha = 1;
    }
}

// Global Entities
let player = new Player();
let invaders = [];
let bullets = [];
let particles = [];
let powerups = [];
let keys = {};
let isDragging = false;

function spawnWave() {
    invaders = [];
    const rows = 5;
    const cols = 8;
    const spacingX = 50;
    const spacingY = 40;
    const startX = (canvas.width - (cols * spacingX)) / 2;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const type = (r === 0) ? 3 : (r < 3) ? 2 : 1;
            // Shielded invaders start appearing at wave 2
            let hp = 1;
            if (wave >= 2 && Math.random() < 0.2) hp = 2;
            invaders.push(new Invader(startX + c * spacingX, 50 + r * spacingY, type, hp));
        }
    }
    
    invaderMoveInterval = Math.max(200, 1000 - (wave * 100));
    levelTag.textContent = `WAVE ${wave}`;
}

function updateHUD() {
    scoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    livesEl.textContent = '❤️'.repeat(player.lives);
}

function updateScore(val) {
    score += val;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('neonInvadersBest', bestScore);
    }
    updateHUD();
}

function gameOver() {
    gameState = 'GAMEOVER';
    soundManager.play('explode');
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-level').textContent = wave;
    document.getElementById('final-score').textContent = score;
}

function restartGame() {
    score = 0;
    wave = 1;
    bullets = [];
    particles = [];
    powerups = [];
    player = new Player();
    spawnWave();
    updateHUD();
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

function togglePause() {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶️' : '⏸';
    soundManager.play('click');
}

function toggleSound() {
    isMuted = !isMuted;
    document.getElementById('btn-sound').textContent = isMuted ? '🔇' : '🔊';
    soundManager.setMuted(isMuted);
}

function toggleHelp(show) {
    const helpOverlay = document.getElementById('how-to-play');
    if (show) {
        helpOverlay.classList.remove('hidden');
        if (gameState === 'PLAYING' && !isPaused) togglePause();
    } else {
        helpOverlay.classList.add('hidden');
    }
}

function firePlayer() {
    if (gameState !== 'PLAYING' || isPaused) return;
    
    const limit = player.powerups.rapid > 0 ? 8 : 3;
    if (bullets.filter(b => b.dy < 0).length < limit) {
        if (player.powerups.triple > 0) {
            bullets.push(new Bullet(player.x + player.w/2, player.y, -BULLET_SPEED, COLORS.primary));
            bullets.push(new Bullet(player.x, player.y + 10, -BULLET_SPEED, COLORS.primary));
            bullets.push(new Bullet(player.x + player.w, player.y + 10, -BULLET_SPEED, COLORS.primary));
        } else {
            bullets.push(new Bullet(player.x + player.w/2, player.y, -BULLET_SPEED, COLORS.primary));
        }
        soundManager.play('shoot');
    }
}

// Input
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.code === 'Space') firePlayer();
});
window.addEventListener('keyup', e => keys[e.key] = false);

canvas.addEventListener('mousedown', e => {
    if (gameState === 'PLAYING') {
        isDragging = true;
        player.targetX = e.clientX;
    }
});
canvas.addEventListener('mousemove', e => {
    if (isDragging) player.targetX = e.clientX;
});
window.addEventListener('mouseup', () => isDragging = false);

canvas.addEventListener('touchstart', e => {
    if (gameState === 'PLAYING') {
        isDragging = true;
        player.targetX = e.touches[0].clientX;
    }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    if (isDragging) player.targetX = e.touches[0].clientX;
}, { passive: false });
window.addEventListener('touchend', () => isDragging = false);

document.getElementById('btn-start').addEventListener('click', () => { soundManager.init(); restartGame(); });
document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-sound').addEventListener('click', toggleSound);
document.getElementById('btn-help').addEventListener('click', () => { soundManager.play('click'); toggleHelp(true); });
document.getElementById('btn-close-help').addEventListener('click', () => { soundManager.play('click'); toggleHelp(false); });

const btnFire = document.getElementById('btn-fire');
const handleFire = (e) => {
    e.preventDefault();
    firePlayer();
};
btnFire.addEventListener('touchstart', handleFire, { passive: false });
btnFire.addEventListener('mousedown', handleFire);

// Social
document.getElementById('share-wa').addEventListener('click', () => {
    const text = `I cleared ${wave} waves and scored ${score} in Neon Invaders! 👾 Defend the grid: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
});
document.getElementById('share-x').addEventListener('click', () => {
    const text = `I cleared ${wave} waves and scored ${score} in Neon Invaders! 👾 #NeonInvaders #ArcadeHub`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
});

function resize() {
    const hud = document.getElementById('hud');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - hud.clientHeight;
}
window.addEventListener('resize', resize);
resize();

function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function loop(timestamp) {
    const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.67, 3) : 1;
    lastTimestamp = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (gameState === 'PLAYING' && !isPaused) {
        player.update(deltaTime);
        
        // Move Invaders
        invaderMoveTimer += deltaTime * 16.67;
        
        if (invaderMoveTimer >= invaderMoveInterval) {
            invaderMoveTimer = 0;
            let shouldDrop = false;
            invaders.forEach(inv => {
                inv.x += 10 * invaderDirection;
                if (inv.x > canvas.width - inv.w || inv.x < 0) shouldDrop = true;
            });
            
            if (shouldDrop) {
                invaderDirection *= -1;
                invaders.forEach(inv => {
                    inv.y += INVADER_DROP_DIST;
                    if (inv.y + inv.h > player.y) gameOver();
                });
            }
        }
        
        // Invader Fire
        if (Math.random() < (0.01 + (wave * 0.005)) * deltaTime) {
            const shooter = invaders[Math.floor(Math.random() * invaders.length)];
            if (shooter) bullets.push(new Bullet(shooter.x + shooter.w/2, shooter.y + shooter.h, BULLET_SPEED * 0.6, COLORS.danger));
        }

        // Powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.update(deltaTime);
            if (p.y > canvas.height) { powerups.splice(i, 1); continue; }
            
            if (p.x > player.x && p.x < player.x + player.w && p.y > player.y && p.y < player.y + player.h) {
                if (p.type === 'triple') player.powerups.triple = 600;
                else if (p.type === 'rapid') player.powerups.rapid = 600;
                else if (p.type === 'shield') player.powerups.shield = true;
                
                soundManager.play('powerup');
                powerups.splice(i, 1);
            }
        }

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.update(deltaTime);
            if (b.y < 0 || b.y > canvas.height) { bullets.splice(i, 1); continue; }
            
            // Player bullet hits invader
            if (b.dy < 0) {
                for (let j = invaders.length - 1; j >= 0; j--) {
                    const inv = invaders[j];
                    if (b.x > inv.x && b.x < inv.x + inv.w && b.y > inv.y && b.y < inv.y + inv.h) {
                        inv.hp--;
                        bullets.splice(i, 1);
                        
                        if (inv.hp <= 0) {
                            for (let k = 0; k < 8; k++) particles.push(new Particle(inv.x + inv.w/2, inv.y + inv.h/2, inv.color));
                            
                            // Drop Powerup
                            if (Math.random() < 0.12) {
                                const types = ['triple', 'rapid', 'shield'];
                                powerups.push(new PowerUp(inv.x + inv.w/2, inv.y + inv.h/2, types[Math.floor(Math.random()*types.length)]));
                            }
                            
                            invaders.splice(j, 1);
                            updateScore(10 * wave);
                            soundManager.play('explode');
                        } else {
                            soundManager.play('shoot'); // metallic hit sound
                        }
                        break;
                    }
                }
            } else {
                // Invader bullet hits player
                if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
                    player.hit();
                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update(deltaTime);
            if (p.life <= 0) particles.splice(i, 1);
        }

        if (invaders.length === 0) {
            wave++;
            spawnWave();
        }
    }

    // Draw
    invaders.forEach(inv => inv.draw());
    bullets.forEach(b => b.draw());
    powerups.forEach(p => p.draw());
    particles.forEach(p => p.draw());
    player.draw();

    requestAnimationFrame(loop);
}

bestScoreEl.textContent = bestScore;
loop();
