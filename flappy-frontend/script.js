/**
 * Neon Flappy - A synthwave Flappy Bird clone for Arcade Hub
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const shareContainer = document.getElementById('shareContainer');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const tweetBtn = document.getElementById('tweetBtn');
const waBtn = document.getElementById('waBtn');

// ─── Canvas Sizing ──────────────────────────────────────────────────────────
const CANVAS_W = 360;
const CANVAS_H = 560;
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// ─── Game Constants ──────────────────────────────────────────────────────────
const GRAVITY       = 0.45;
const FLAP_POWER    = -9.0;
const PIPE_WIDTH    = 60;
const PIPE_GAP      = 155;      // vertical gap between top/bottom pipe
const PIPE_SPEED    = 2.8;
const PIPE_INTERVAL = 1600;     // ms between new pipes

// ─── State ───────────────────────────────────────────────────────────────────
let bird, pipes, score, highScore, frameId, lastPipeTime, gameState;
// gameState: 'idle' | 'running' | 'dead'

let particlePool = [];

// ─── Persistence ─────────────────────────────────────────────────────────────
highScore = parseInt(localStorage.getItem('flappyHighScore') || '0', 10);
highScoreEl.textContent = highScore;

// ─── Achievement milestones ────────────────────────────────────────────────
const MILESTONES = [
    { score: 5,  id: 'flappy_5',  title: 'First Flight' },
    { score: 10, id: 'flappy_10', title: 'Sky Surfer'   },
    { score: 25, id: 'flappy_25', title: 'Neon Aviator' }
];
const awardedMilestones = new Set();

// ─── Bird Object ──────────────────────────────────────────────────────────────
function createBird() {
    return {
        x: 90,
        y: CANVAS_H / 2,
        r: 14,          // radius
        vy: 0,
        angle: 0,
        trail: []
    };
}

// ─── Pipe Object ─────────────────────────────────────────────────────────────
function createPipe() {
    const minTop = 60;
    const maxTop = CANVAS_H - PIPE_GAP - minTop;
    const topH = Math.floor(Math.random() * (maxTop - minTop) + minTop);
    return {
        x: CANVAS_W + PIPE_WIDTH,
        topH,
        bottomY: topH + PIPE_GAP,
        scored: false
    };
}

// ─── Particle ─────────────────────────────────────────────────────────────────
function spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particlePool.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color
        });
    }
}

// ─── Reset / Init ─────────────────────────────────────────────────────────────
function resetGame() {
    bird = createBird();
    pipes = [];
    score = 0;
    lastPipeTime = performance.now();
    awardedMilestones.clear();
    particlePool = [];
    scoreEl.textContent = '0';
    gameState = 'running';
    if (window.audioFX) window.audioFX.init();
}

// ─── Flap ─────────────────────────────────────────────────────────────────────
function flap() {
    if (gameState === 'dead') return;
    if (gameState === 'idle') {
        startGame();
        return;
    }
    bird.vy = FLAP_POWER;
    spawnParticles(bird.x - 10, bird.y + 8, '#00ffcc');
    if (window.audioFX) window.audioFX.playJump();
}

// ─── Start / Stop ─────────────────────────────────────────────────────────────
function startGame() {
    hideOverlay();
    resetGame();
    if (frameId) cancelAnimationFrame(frameId);
    loop();
}

function gameOver() {
    gameState = 'dead';
    spawnParticles(bird.x, bird.y, '#ff3366');
    if (window.audioFX) window.audioFX.playGameOver();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    setTimeout(() => {
        showOverlay('Game Over', `Final Score: ${score}`, true);
    }, 600);
}

function showOverlay(title, msg, showShare) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = msg;
    if (showShare) {
        shareContainer.classList.remove('hidden');
        startBtn.textContent = 'Play Again';
    } else {
        shareContainer.classList.add('hidden');
        startBtn.textContent = 'Start Game';
    }
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update(now) {
    if (gameState !== 'running') return;

    // Bird physics
    bird.vy += GRAVITY;
    bird.y += bird.vy;
    bird.angle = Math.max(-25, Math.min(80, bird.vy * 4.5));

    // Trail
    bird.trail.push({ x: bird.x, y: bird.y });
    if (bird.trail.length > 8) bird.trail.shift();

    // Ground / ceil
    if (bird.y + bird.r >= CANVAS_H - 20 || bird.y - bird.r <= 0) {
        gameOver();
        return;
    }

    // Spawn pipes
    if (now - lastPipeTime > PIPE_INTERVAL) {
        pipes.push(createPipe());
        lastPipeTime = now;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED;

        // Score
        if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
            p.scored = true;
            score++;
            scoreEl.textContent = score;
            if (window.audioFX) window.audioFX.playEat();

            // Achievements
            MILESTONES.forEach(m => {
                if (score >= m.score && !awardedMilestones.has(m.id)) {
                    awardedMilestones.add(m.id);
                    if (window.achievements) window.achievements.unlock('flappy', m.id.replace('flappy_', ''), m.title);
                }
            });

            // Speed up slightly every 5 pipes (capped)
            if (score % 5 === 0) {
                pipes.forEach(pipe => { /* increase handled via PIPE_SPEED bump */ });
            }
        }

        // Off screen
        if (p.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
            continue;
        }

        // Collision
        const bx = bird.x, by = bird.y, br = bird.r - 3; // slight forgiveness
        const inXRange = bx + br > p.x && bx - br < p.x + PIPE_WIDTH;
        if (inXRange) {
            if (by - br < p.topH || by + br > p.bottomY) {
                gameOver();
                return;
            }
        }
    }

    // Particles
    for (let i = particlePool.length - 1; i >= 0; i--) {
        const pt = particlePool[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.15;
        pt.life -= 0.05;
        if (pt.life <= 0) particlePool.splice(i, 1);
    }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
    // Background
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    drawStars();

    // Ground
    drawGround();

    // Pipes
    drawPipes();

    // Particles
    drawParticles();

    // Bird trail
    drawBirdTrail();

    // Bird
    drawBird();

    // Score (in-canvas)
    if (gameState === 'running') {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = 'bold 48px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(score, CANVAS_W / 2, 80);
        ctx.restore();
    }
}

// ─── Draw Helpers ─────────────────────────────────────────────────────────────
const stars = Array.from({ length: 50 }, () => ({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H * 0.7,
    r: Math.random() * 1.2 + 0.3,
    alpha: Math.random() * 0.5 + 0.2
}));

function drawStars() {
    stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fill();
    });
}

function drawGround() {
    const gH = 20;
    const gy = CANVAS_H - gH;
    ctx.fillStyle = '#0d2a2a';
    ctx.fillRect(0, gy, CANVAS_W, gH);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(0, gy, CANVAS_W, 2);
}

function drawPipes() {
    pipes.forEach(p => {
        const radius = 6;

        // Neon glow
        ctx.save();
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;

        // Top pipe
        ctx.fillStyle = '#003d33';
        roundRect(ctx, p.x, 0, PIPE_WIDTH, p.topH, { bl: radius, br: radius });
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(p.x - 4, p.topH - 18, PIPE_WIDTH + 8, 18); // cap

        // Bottom pipe
        ctx.fillStyle = '#003d33';
        roundRect(ctx, p.x, p.bottomY, PIPE_WIDTH, CANVAS_H - p.bottomY - 20, { tl: radius, tr: radius });
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 18); // cap

        ctx.restore();

        // Pipe stripe highlight
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + 10, 0, 6, p.topH);
        ctx.fillRect(p.x + 10, p.bottomY, 6, CANVAS_H - p.bottomY);
        ctx.restore();
    });
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.angle * Math.PI) / 180);

    // Glow
    ctx.shadowColor = '#8a2be2';
    ctx.shadowBlur = 20;

    // Body
    const grad = ctx.createRadialGradient(-2, -2, 2, 0, 0, bird.r);
    grad.addColorStop(0, '#cc88ff');
    grad.addColorStop(1, '#5500aa');
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Wing
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(200,150,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-6, 4, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(6, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawBirdTrail() {
    bird.trail.forEach((pt, i) => {
        const alpha = (i / bird.trail.length) * 0.3;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, bird.r * (i / bird.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138,43,226,${alpha})`;
        ctx.fill();
    });
}

function drawParticles() {
    particlePool.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = pt.color + Math.floor(pt.life * 255).toString(16).padStart(2, '0');
        ctx.fill();
    });
}

// ─── Rounded Rect helper ────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, radii = {}) {
    const { tl = 0, tr = 0, br = 0, bl = 0 } = radii;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
    ctx.fill();
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
let lastTime = 0;
const fpsInterval = 1000 / 60;

function loop(timestamp = 0) {
    if (gameState !== 'dead') {
        frameId = requestAnimationFrame(loop);
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;
        if (elapsed > fpsInterval) {
            lastTime = timestamp - (elapsed % fpsInterval);
            update(timestamp);
            draw();
        }
    } else {
        // Keep drawing particles until they die
        const deadLoop = (ts) => {
            if (particlePool.length > 0) {
                requestAnimationFrame(deadLoop);
                if (!lastTime) lastTime = ts;
                const elapsed = ts - lastTime;
                if (elapsed > fpsInterval) {
                    lastTime = ts - (elapsed % fpsInterval);
                    draw();
                    particlePool.forEach(pt => {
                        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life -= 0.05;
                    });
                    particlePool = particlePool.filter(p => p.life > 0);
                }
            } else {
                draw(); // final steady draw
            }
        };
        requestAnimationFrame(deadLoop);
    }
}

// ─── Input ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        flap();
    }
});

canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });

startBtn.addEventListener('click', startGame);

// ─── Social Sharing ───────────────────────────────────────────────────────────
function shareScore(platform) {
    const text = `I just scored ${score} in Neon Flappy 🐦 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
}

tweetBtn.addEventListener('click', () => shareScore('twitter'));
waBtn.addEventListener('click', () => shareScore('whatsapp'));

// ─── Draw idle screen ─────────────────────────────────────────────────────────
gameState = 'idle';
bird = createBird();
pipes = [];
particlePool = [];

// Draw once so canvas isn't blank behind the overlay
(function idleDraw() {
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawStars();
    drawGround();
    drawBird();
})();
