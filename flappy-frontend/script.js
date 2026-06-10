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
const pauseBtn = document.getElementById('btn-pause');
const pauseIcon = pauseBtn?.querySelector('.pause-icon');
const pauseMenu = document.getElementById('pauseMenu');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnMute = document.getElementById('btn-mute');

// Navigation
document.querySelectorAll('.btn-hub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log('arcade hub clicked');
    });
});

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
let bird, pipes, score, highScore, frameId, lastPipeTime, lastTime, gameState;
// gameState: 'idle' | 'running' | 'dead'

let particlePool = [];

// Game Juice States
let shakeTime = 0;
let shakeIntensity = 0;
let shakeX = 0;
let shakeY = 0;
let flashAlpha = 0;
let gridOffset = 0;
let ripples = [];
let juiceParticles = [];

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
        trail: [],
        scaleX: 1.0,
        scaleY: 1.0
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
// Game Juice Helpers
function triggerShake(time, intensity) {
    shakeTime = time;
    shakeIntensity = intensity;
}

function spawnRipple(x, y, maxRadius, maxStrength, speed) {
    ripples.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: maxRadius,
        strength: maxStrength,
        speed: speed,
        life: 1.0
    });
}

function spawnJuiceParticle(p) {
    juiceParticles.push(p);
}

// Procedural Music Synth Object
const MusicSynth = {
    isPlaying: false,
    nextNoteTime: 0,
    stepIndex: 0,
    bpm: 110,
    schedulerId: null,
    
    start() {
        if (this.isPlaying) return;
        if (!window.audioFX || !window.audioFX.ctx) return;
        
        window.audioFX.init();
        this.isPlaying = true;
        this.nextNoteTime = window.audioFX.ctx.currentTime;
        this.stepIndex = 0;
        
        this.run();
    },
    
    stop() {
        this.isPlaying = false;
        if (this.schedulerId) {
            clearTimeout(this.schedulerId);
            this.schedulerId = null;
        }
    },
    
    run() {
        if (!this.isPlaying) return;
        
        const ctx = window.audioFX.ctx;
        while (this.nextNoteTime < ctx.currentTime + 0.15) {
            this.scheduleNote(this.stepIndex, this.nextNoteTime);
            
            const stepDuration = 60 / this.bpm / 4; // 16th note
            this.nextNoteTime += stepDuration;
            this.stepIndex = (this.stepIndex + 1) % 16;
        }
        
        // Scale BPM dynamically with score
        this.bpm = 110 + (score || 0) * 1.5;
        this.bpm = Math.min(this.bpm, 165);
        
        this.schedulerId = setTimeout(() => this.run(), 50);
    },
    
    scheduleNote(step, time) {
        if (!window.audioFX || window.audioFX.isMuted) return;
        const ctx = window.audioFX.ctx;
        const compressor = window.audioFX.compressor;
        if (!ctx || !compressor) return;
        
        // C minor progression: C (65Hz / 32Hz), Eb (77Hz / 38Hz), G (98Hz / 49Hz), Bb (116Hz / 58Hz)
        const notes = [
            [65.41, 32.70],  // C
            [77.78, 38.89],  // Eb
            [98.00, 49.00],  // G
            [116.54, 58.27]  // Bb
        ];
        
        const chordIdx = Math.floor(step / 4) % 4;
        const isOffbeat = step % 2 === 1;
        const freq = isOffbeat ? notes[chordIdx][1] : notes[chordIdx][0];
        
        this.playBass(freq, time, ctx, compressor);
        
        if (step % 4 === 0) {
            this.playKick(time, ctx, compressor);
        }
        
        if (step % 8 === 4) {
            this.playSnare(time, ctx, compressor);
        }
        
        if (step === 2 || step === 5 || step === 9 || step === 12) {
            const melodyNotes = [130.81, 155.56, 196.00, 233.08];
            const melFreq = melodyNotes[chordIdx] * 2;
            this.playMelody(melFreq, time, ctx, compressor);
        }
    },
    
    playBass(freq, time, ctx, dest) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, time);
        filter.frequency.exponentialRampToValueAtTime(80, time + 0.15);
        
        gainNode.gain.setValueAtTime(0.08, time);
        gainNode.gain.exponentialRampToValueAtTime(0.005, time + 0.18);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(dest);
        
        osc.start(time);
        osc.stop(time + 0.2);
    },
    
    playKick(time, ctx, dest) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
        
        gainNode.gain.setValueAtTime(0.18, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(dest);
        
        osc.start(time);
        osc.stop(time + 0.12);
    },
    
    playSnare(time, ctx, dest) {
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, time);
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.04, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(dest);
        
        noise.start(time);
        noise.stop(time + 0.1);
    },
    
    playMelody(freq, time, ctx, dest) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0.012, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        
        osc.connect(gainNode);
        gainNode.connect(dest);
        
        osc.start(time);
        osc.stop(time + 0.25);
    }
};

function resetGame() {
    bird = createBird();
    bird.scaleX = 1.0;
    bird.scaleY = 1.0;
    pipes = [];
    score = 0;
    lastPipeTime = performance.now();
    awardedMilestones.clear();
    particlePool = [];
    ripples = [];
    juiceParticles = [];
    scoreEl.textContent = '0';
    gameState = 'running';
    pauseBtn?.classList.remove('hidden');
    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
}

// ─── Flap ─────────────────────────────────────────────────────────────────────
function flap() {
    if (gameState === 'dead' || gameState === 'paused') return;
    if (gameState === 'idle') {
        startGame();
        return;
    }
    bird.vy = FLAP_POWER;
    spawnParticles(bird.x - 10, bird.y + 8, '#00ffcc');
    if (window.audioFX) window.audioFX.playJump();
    
    // Juice: flap stretch
    bird.scaleY = 1.3;
    bird.scaleX = 0.75;
    triggerShake(3, 1.8);
    spawnRipple(bird.x, CANVAS_H - 70, 50, 3, 3.0);
}

// ─── Start / Stop ─────────────────────────────────────────────────────────────
function startGame() {
    hideOverlay();
    resetGame();
    if (frameId) cancelAnimationFrame(frameId);
    
    // Start procedural music
    MusicSynth.start();
    
    lastTime = performance.now();
    loop(lastTime);
}

function gameOver() {
    gameState = 'dead';
    pauseBtn?.classList.add('hidden');
    spawnParticles(bird.x, bird.y, '#ff3366');
    if (window.audioFX) window.audioFX.playGameOver();
    
    // Stop procedural music
    MusicSynth.stop();
    
    // Juice: crash squash, heavy screenshake, orange flash, large ground ripple
    bird.scaleY = 0.4;
    bird.scaleX = 1.6;
    triggerShake(20, 10.0);
    flashAlpha = 0.8;
    spawnRipple(bird.x, CANVAS_H - 70, 180, 12, 4.5);

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
function update(deltaTime) {
    if (gameState !== 'running') return;

    // Bird scale decay
    bird.scaleX += (1.0 - bird.scaleX) * 0.14 * deltaTime;
    bird.scaleY += (1.0 - bird.scaleY) * 0.14 * deltaTime;
    
    // Grid scrolling offset
    gridOffset += PIPE_SPEED * deltaTime;
    
    // Camera shake update
    if (shakeTime > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeTime -= deltaTime;
    } else {
        shakeX = 0;
        shakeY = 0;
    }
    
    // Flash overlay update
    if (flashAlpha > 0) {
        flashAlpha -= 0.04 * deltaTime;
    }

    // Bird physics
    bird.vy += GRAVITY * deltaTime;
    bird.y += bird.vy * deltaTime;
    bird.angle = Math.max(-25, Math.min(80, bird.vy * 4.5));

    // Trail
    bird.trail.push({ x: bird.x, y: bird.y });
    if (bird.trail.length > 8) bird.trail.shift();

    // Raised Ground (Y = CANVAS_H - 70) / Ceiling collision bounds
    if (bird.y + bird.r >= CANVAS_H - 70 || bird.y - bird.r <= 0) {
        gameOver();
        return;
    }

    // Spawn pipes
    const now = performance.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        pipes.push(createPipe());
        lastPipeTime = now;
    }

    // Spawn wind lines
    if (Math.random() < 0.1) {
        spawnJuiceParticle({
            type: 'wind',
            x: CANVAS_W,
            y: Math.random() * 400 + 40,
            vx: -PIPE_SPEED * 1.6 - Math.random() * 2,
            vy: 0,
            length: 15 + Math.random() * 25,
            alpha: 0.1 + Math.random() * 0.15
        });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED * deltaTime;

        // Score
        if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
            p.scored = true;
            score++;
            scoreEl.textContent = score;
            if (window.audioFX) window.audioFX.playEat();
            
            // Juice: pipe pass camera shake and ground ripple
            triggerShake(4, 2.0);
            spawnRipple(p.x + PIPE_WIDTH / 2, CANVAS_H - 70, 75, 4, 3.5);

            // Achievements
            MILESTONES.forEach(m => {
                if (score >= m.score && !awardedMilestones.has(m.id)) {
                    awardedMilestones.add(m.id);
                    if (window.achievements) window.achievements.unlock('flappy', m.id.replace('flappy_', ''), m.title);
                }
            });
        }

        // Off screen
        if (p.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
            continue;
        }

        // Collision
        const bx = bird.x, by = bird.y, br = bird.r - 3;
        const inXRange = bx + br > p.x && bx - br < p.x + PIPE_WIDTH;
        if (inXRange) {
            // Collision with top pipe or bottom pipe (taking ground boundary at CANVAS_H - 70 into account)
            if (by - br < p.topH || by + br > p.bottomY) {
                gameOver();
                return;
            }
        }
    }

    // Update particles
    for (let i = particlePool.length - 1; i >= 0; i--) {
        const pt = particlePool[i];
        pt.x += pt.vx * deltaTime;
        pt.y += pt.vy * deltaTime;
        pt.vy += 0.15 * deltaTime;
        pt.life -= 0.05 * deltaTime;
        if (pt.life <= 0) particlePool.splice(i, 1);
    }
    
    // Update grid ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed * deltaTime;
        r.life -= 0.02 * deltaTime;
        if (r.life <= 0 || r.radius >= r.maxRadius) {
            ripples.splice(i, 1);
        }
    }
    
    // Update wind lines
    for (let i = juiceParticles.length - 1; i >= 0; i--) {
        const p = juiceParticles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        if (p.x + p.length < 0) juiceParticles.splice(i, 1);
    }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
    ctx.save();
    // Apply screenshake translation
    ctx.translate(shakeX, shakeY);

    // Background
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    drawStars();

    // Ground
    drawGround();

    // Pipes
    drawPipes();

    // Wind speed lines
    drawJuiceParticles();

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

    ctx.restore();

    // Neon orange screen flash overlay (drawn outside shake to stay static)
    if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 110, 0, ${flashAlpha})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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

function getRippleDeformation(x, y) {
    let dy = 0;
    let dx = 0;
    ripples.forEach(r => {
        const rx = r.x;
        const ry = r.y;
        const dist = Math.sqrt((x - rx) * (x - rx) + (y - ry) * (y - ry));
        if (dist > 0) {
            const diff = dist - r.radius;
            const width = 40;
            if (Math.abs(diff) < width) {
                const factor = 1 - Math.abs(diff) / width;
                const amp = r.strength * factor * Math.sin(diff * 0.1) * r.life;
                dy += amp;
                dx += (x - rx) / dist * amp * 0.5;
            }
        }
    });
    return { dx, dy };
}

function drawGround() {
    const gH = 70;
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
        if (ctx.roundRect) roundRect(ctx, p.x, 0, PIPE_WIDTH, p.topH, { bl: radius, br: radius });
        else ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);
        
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(p.x - 4, p.topH - 18, PIPE_WIDTH + 8, 18); // cap

        // Bottom pipe (ends at Y = CANVAS_H - 70)
        ctx.fillStyle = '#003d33';
        if (ctx.roundRect) roundRect(ctx, p.x, p.bottomY, PIPE_WIDTH, CANVAS_H - p.bottomY - 70, { tl: radius, tr: radius });
        else ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, CANVAS_H - p.bottomY - 70);
        
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 18); // cap

        ctx.restore();

        // Pipe stripe highlight
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + 10, 0, 6, p.topH);
        ctx.fillRect(p.x + 10, p.bottomY, 6, CANVAS_H - p.bottomY - 70);
        ctx.restore();
    });
}

function drawJuiceParticles() {
    juiceParticles.forEach(p => {
        if (p.type === 'wind') {
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 204, ${p.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.length, p.y);
            ctx.stroke();
            ctx.restore();
        }
    });
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.angle * Math.PI) / 180);
    ctx.scale(bird.scaleX, bird.scaleY); // Squash and stretch scale!

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
    if (!ctx.roundRect && !ctx.quadraticCurveTo) return;
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
function loop(timestamp = 0) {
    if (gameState === 'paused') return;
    
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    const deltaTime = Math.min(dt / 16.67, 3);

    if (gameState !== 'dead') {
        frameId = requestAnimationFrame(loop);
        update(deltaTime);
        draw();
    } else {
        // Keep drawing particles until they die
        const deadLoop = (ts) => {
            if (particlePool.length > 0) {
                requestAnimationFrame(deadLoop);
                const dts = ts - (lastTime || ts);
                lastTime = ts;
                const dTime = Math.min(dts / 16.67, 3);
                
                updateParticlesOnly(dTime);
                draw();
            } else {
                draw(); // final steady draw
            }
        };
        requestAnimationFrame(deadLoop);
    }
}

function updateParticlesOnly(deltaTime) {
    for (let i = particlePool.length - 1; i >= 0; i--) {
        const pt = particlePool[i];
        pt.x += pt.vx * deltaTime;
        pt.y += pt.vy * deltaTime;
        pt.vy += 0.15 * deltaTime;
        pt.life -= 0.05 * deltaTime;
        if (pt.life <= 0) particlePool.splice(i, 1);
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

btnMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioFX) {
        window.audioFX.toggleMute();
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
});

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
    MusicSynth.stop();
    gameState = 'idle';
    pauseMenu.classList.add('hidden');
    overlayTitle.textContent = "Neon Flappy";
    overlayMessage.textContent = "Tap or press Space to flap your wings!";
    startBtn.textContent = "Start Game";
    shareContainer.classList.add('hidden');
    overlay.classList.remove('hidden');
    pauseBtn?.classList.add('hidden');
    
    bird = createBird();
    pipes = [];
    score = 0;
    scoreEl.textContent = '0';
    
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawStars();
    drawGround();
    drawBird();
});

const hubGameOverBtn = document.getElementById('hub-gameover-btn');
hubGameOverBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    MusicSynth.stop();
    window.top.location.href = '../index.html';
});


document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === 'running') togglePause(true);
});
window.addEventListener('blur', () => {
    if (gameState === 'running') togglePause(true);
});

function togglePause(forcePause) {
    if (gameState !== 'running' && gameState !== 'paused') return;
    
    if (forcePause !== undefined) {
        if (forcePause && gameState === 'paused') return;
        if (!forcePause && gameState === 'running') return;
    }
    
    if (gameState === 'running') {
        gameState = 'paused';
        cancelAnimationFrame(frameId);
        pauseMenu.classList.remove('hidden');
        if (pauseIcon) pauseIcon.textContent = "▶";
    } else if (gameState === 'paused') {
        gameState = 'running';
        pauseMenu.classList.add('hidden');
        if (pauseIcon) pauseIcon.textContent = "||";
        lastTime = performance.now();
        loop(lastTime);
    }
}

// ─── Social Sharing ───────────────────────────────────────────────────────────
function shareScore(platform) {
    const text = `I just scored ${score} in Neon Flappy 🐦 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
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
