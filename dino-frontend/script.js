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
const SPEED_INCREMENT = 0.0005;
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
    color: '#8a2be2',
    scaleX: 1.0,
    scaleY: 1.0,
    wasJumping: false
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

// Game Juice States
let shakeTime = 0;
let shakeIntensity = 0;
let shakeX = 0;
let shakeY = 0;
let flashAlpha = 0;
let gridOffset = 0;
let ripples = [];
let juiceParticles = [];

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
    
    GROUND_Y = gameHeight - 110;
    
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
        
        // Stop music
        MusicSynth.stop();
        
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
    
    // Return to Hub Game Over Button
    document.getElementById('hub-gameover-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Hub button clicked from game over screen');
        window.top.location.href = '../index.html';
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
    dino.scaleX = 1.0;
    dino.scaleY = 1.0;
    obstacles = [];
    clouds = [];
    ripples = [];
    juiceParticles = [];
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
    
    // Start procedural music
    MusicSynth.start();
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = performance.now();
    animate(lastTime);
}

function togglePause(forcePause) {
    if (!gameRunning) return;
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        pauseMenu.classList.remove('hidden');
        MusicSynth.stop();
    } else {
        pauseMenu.classList.add('hidden');
        MusicSynth.start();
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
        
        // Juice: jump stretch
        dino.scaleY = 1.35;
        dino.scaleX = 0.75;
        triggerShake(4, 2.5);
        spawnRipple(dino.x + dino.width / 2, GROUND_Y + 60, 60, 4, 3.5);
    } else if (dino.canDoubleJump) {
        if (window.audioFX) window.audioFX.playJump();
        dino.dy = JUMP_FORCE * 0.8;
        dino.canDoubleJump = false;
        if (window.achievements) window.achievements.unlock('dino', 'double_jump', 'Acrobat');
        
        // Juice: double jump stretch
        dino.scaleY = 1.45;
        dino.scaleX = 0.7;
        triggerShake(6, 3.5);
        
        // Juice: spawn double jump ring particle
        spawnParticle({
            type: 'ring',
            x: dino.x + dino.width / 2,
            y: dino.y + dino.height / 2,
            vx: 0,
            vy: 0,
            radius: 5,
            maxRadius: 60,
            expand: 4.0,
            alpha: 1.0,
            decay: 0.04
        });
    }
}

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

function spawnParticle(p) {
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
        
        // Scale BPM dynamically with speed
        this.bpm = 110 + (gameSpeed - INITIAL_SPEED) * 5;
        this.bpm = Math.min(this.bpm, 180);
        
        this.schedulerId = setTimeout(() => this.run(), 50);
    },
    
    scheduleNote(step, time) {
        if (!window.audioFX || window.audioFX.isMuted) return;
        const ctx = window.audioFX.ctx;
        const compressor = window.audioFX.compressor;
        if (!ctx || !compressor) return;
        
        // Galloping bassline notes: E (82Hz / 41Hz), G (98Hz / 49Hz), A (110Hz / 55Hz), C (65Hz / 32Hz)
        const notes = [
            [82.41, 41.20], // E
            [98.00, 49.00], // G
            [110.00, 55.00], // A
            [65.41, 32.70]  // C
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
        
        if (step === 0 || step === 3 || step === 7 || step === 10) {
            const melodyNotes = [164.81, 196.00, 220.00, 261.63];
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
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);
        
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
        osc.frequency.setValueAtTime(130, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(dest);
        
        osc.start(time);
        osc.stop(time + 0.15);
    },
    
    playSnare(time, ctx, dest) {
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, time);
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.05, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(dest);
        
        noise.start(time);
        noise.stop(time + 0.12);
    },
    
    playMelody(freq, time, ctx, dest) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0.02, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(dest);
        
        osc.start(time);
        osc.stop(time + 0.3);
    }
};

function update(deltaTime) {
    frameCount++;
    gameSpeed = Math.min(gameSpeed + SPEED_INCREMENT * deltaTime, 25);
    
    // Squash/stretch scale decay
    dino.scaleX += (1.0 - dino.scaleX) * 0.12 * deltaTime;
    dino.scaleY += (1.0 - dino.scaleY) * 0.12 * deltaTime;
    
    // Scroll grid offset
    gridOffset += gameSpeed * deltaTime;
    
    // Update camera shake
    if (shakeTime > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeTime -= deltaTime;
    } else {
        shakeX = 0;
        shakeY = 0;
    }
    
    // Update flash overlay
    if (flashAlpha > 0) {
        flashAlpha -= 0.04 * deltaTime;
    }
    
    // Track landing transition
    const wasJumping = dino.isJumping;
    
    dino.dy += GRAVITY * deltaTime;
    dino.y += dino.dy * deltaTime;
    
    if (dino.y > GROUND_Y) {
        dino.y = GROUND_Y;
        dino.dy = 0;
        dino.isJumping = false;
        
        if (wasJumping) {
            // Landing impact squash
            dino.scaleY = 0.65;
            dino.scaleX = 1.35;
            triggerShake(6, 3.5);
            spawnRipple(dino.x + dino.width / 2, GROUND_Y + 60, 90, 6, 4.0);
            
            // Landing puff dust particles
            for (let i = 0; i < 8; i++) {
                spawnParticle({
                    type: 'dust',
                    x: dino.x + dino.width / 2 + (Math.random() - 0.5) * 15,
                    y: GROUND_Y + 55,
                    vx: (Math.random() - 0.5) * 4 - 2,
                    vy: -Math.random() * 2 - 1,
                    size: Math.random() * 3 + 2,
                    alpha: 1.0,
                    decay: 0.04 + Math.random() * 0.02
                });
            }
        }
    }
    
    // Spawn running dust particles
    if (!dino.isJumping && gameRunning && frameCount % 5 === 0) {
        spawnParticle({
            type: 'dust',
            x: dino.x + 8,
            y: GROUND_Y + 55,
            vx: -gameSpeed * 0.45 - Math.random() * 2,
            vy: -Math.random() * 1.5,
            size: Math.random() * 2 + 2,
            alpha: 0.8,
            decay: 0.05
        });
    }
    
    // Spawn high-speed wind speed lines
    if (gameRunning && gameSpeed > 11 && Math.random() < 0.15) {
        spawnParticle({
            type: 'wind',
            x: gameWidth,
            y: 40 + Math.random() * 220,
            vx: -gameSpeed * 1.6 - Math.random() * 5,
            vy: 0,
            length: 25 + Math.random() * 35,
            alpha: 0.15 + Math.random() * 0.2,
            decay: 0
        });
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
    
    // Update particles
    for (let i = juiceParticles.length - 1; i >= 0; i--) {
        const p = juiceParticles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        if (p.decay > 0) {
            p.alpha -= p.decay * deltaTime;
        }
        if (p.expand > 0) {
            p.radius += p.expand * deltaTime;
        }
        if (p.alpha <= 0 || (p.expand > 0 && p.radius >= p.maxRadius) || p.x < -100) {
            juiceParticles.splice(i, 1);
        }
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
    
    // Apply camera screenshake translation
    ctx.translate(shakeX, shakeY);
    
    const config = getStageConfigs(score);
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    drawStars(config.stars);
    if (config.celestial === 'moon') drawMoon(config.celestialOpacity || 1); else drawSun(config.celestialOpacity || 1);
    
    // Draw 3D Perspective Ground Grid with Ripples
    const H = GROUND_Y + 60; // Horizon Y
    ctx.save();
    
    // Draw horizontal grid lines
    const numHorizontalLines = 9;
    const spacing = 15;
    const phase = (gridOffset / spacing) % 1;
    
    ctx.lineWidth = 2;
    for (let i = 0; i < numHorizontalLines; i++) {
        // Perspective mapping of horizontal lines
        const u = (i - phase) / numHorizontalLines;
        if (u < 0) continue;
        const v = Math.pow(u, 2.2); // stretch near bottom
        const gy = H + (gameHeight - H) * v;
        
        ctx.strokeStyle = config.ground;
        ctx.beginPath();
        
        // Draw the line as segments to apply ripples
        for (let x = 0; x <= gameWidth; x += 15) {
            let dy = 0;
            // Solve ripples at (x, gy)
            ripples.forEach(r => {
                const dx = x - r.x;
                const dy_origin = gy - r.y;
                const d = Math.sqrt(dx * dx + dy_origin * dy_origin);
                const waveWidth = 50;
                if (Math.abs(d - r.radius) < waveWidth) {
                    const factor = 1 - Math.abs(d - r.radius) / waveWidth;
                    dy += Math.sin((d - r.radius) / waveWidth * Math.PI) * r.strength * r.life * factor;
                }
            });
            
            if (x === 0) {
                ctx.moveTo(x, gy + dy);
            } else {
                ctx.lineTo(x, gy + dy);
            }
        }
        ctx.stroke();
    }
    
    // Draw perspective vertical lines converging to vanishing point
    const vanishingX = gameWidth / 2;
    const vanishingY = H - 40; // slightly above horizon
    const numPerspectiveLines = 14;
    const bottomSpacing = 70; // spacing at the bottom of the screen
    
    for (let col = -numPerspectiveLines/2; col <= numPerspectiveLines/2; col++) {
        const targetXBottom = vanishingX + col * bottomSpacing;
        
        ctx.beginPath();
        // Draw the vertical line as segments
        for (let step = 0; step <= 10; step++) {
            const t = step / 10;
            const gy = H + (gameHeight - H) * t;
            const gx = vanishingX + (targetXBottom - vanishingX) * t;
            
            let dy = 0;
            // Solve ripples at (gx, gy)
            ripples.forEach(r => {
                const dx = gx - r.x;
                const dy_origin = gy - r.y;
                const d = Math.sqrt(dx * dx + dy_origin * dy_origin);
                const waveWidth = 50;
                if (Math.abs(d - r.radius) < waveWidth) {
                    const factor = 1 - Math.abs(d - r.radius) / waveWidth;
                    dy += Math.sin((d - r.radius) / waveWidth * Math.PI) * r.strength * r.life * factor;
                }
            });
            
            if (step === 0) {
                ctx.moveTo(gx, gy + dy);
            } else {
                ctx.lineTo(gx, gy + dy);
            }
        }
        ctx.stroke();
    }
    ctx.restore();
    
    // Draw clouds
    ctx.fillStyle = config.cloudColor;
    clouds.forEach(cloud => drawPixelCloud(ctx, cloud.x, cloud.y, cloud.width, cloud.height));
    
    // Draw juice particles
    juiceParticles.forEach(p => {
        ctx.save();
        if (p.type === 'dust') {
            ctx.fillStyle = `rgba(255, 0, 180, ${p.alpha})`; // glowing pink dust
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'wind') {
            ctx.strokeStyle = `rgba(0, 255, 204, ${p.alpha})`; // cyan wind speed lines
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.length, p.y);
            ctx.stroke();
        } else if (p.type === 'ring') {
            ctx.strokeStyle = `rgba(0, 255, 204, ${p.alpha})`; // cyan shockwave ring
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    });
    
    const isDark = config.bg === '#050508';
    
    // Helper to draw dino centered at bottom-center with scale transformations
    const drawDinoScaled = (isGlow) => {
        ctx.save();
        const cx = dino.x + dino.width / 2;
        const cy = dino.y + dino.height;
        ctx.translate(cx, cy);
        ctx.scale(dino.scaleX, dino.scaleY);
        
        const eyeColor = isGlow ? 'rgba(0,0,0,0)' : (isDark ? '#000' : '#fff');
        const color = config.dinoColor;
        const drawX = -dino.width / 2;
        const drawY = -dino.height;
        
        if (isGlow) {
            ctx.globalAlpha = 0.25;
            drawPixelDino(ctx, drawX - 2, drawY - 2, dino.width + 4, dino.height + 4, color, eyeColor, dino.isJumping, frameCount);
            ctx.globalAlpha = 1.0;
        } else {
            drawPixelDino(ctx, drawX, drawY, dino.width, dino.height, color, eyeColor, dino.isJumping, frameCount);
        }
        ctx.restore();
    };
    
    if (isDark) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            ctx.shadowBlur = 0;
            
            // mobile glow pass
            drawDinoScaled(true);
            
            // actual dino
            drawDinoScaled(false);
            
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
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = config.dinoColor;
            drawDinoScaled(false);
            ctx.restore();
            
            obstacles.forEach(obs => {
                ctx.save();
                ctx.shadowBlur = 15; ctx.shadowColor = obs.color || config.obstacleColor; ctx.fillStyle = obs.color || config.obstacleColor;
                if (obs.type === 'bird') { 
                    ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2); ctx.lineTo(obs.x, obs.y); ctx.fill(); 
                } else {
                    drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
                    if (obs.type === 'cactus_tall') { drawRoundedRect(ctx, obs.x - 10, obs.y + 20, 15, 8, 3); drawRoundedRect(ctx, obs.x + obs.width - 5, obs.y + 10, 15, 8, 3); }
                    else if (obs.type === 'cactus_wide') { drawRoundedRect(ctx, obs.x + 5, obs.y - 10, 12, 15, 3); drawRoundedRect(ctx, obs.x + 30, obs.y - 5, 12, 10, 3); }
                }
                ctx.restore();
            });
        }
    } else {
        // Day mode
        ctx.shadowBlur = 0;
        
        drawDinoScaled(false);
        
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
    
    // Draw impact flash overlay
    if (flashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 0, 128, ${flashAlpha})`;
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        ctx.restore();
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
    
    // Stop procedural music
    MusicSynth.stop();
    
    // Crash visual effects
    triggerShake(20, 11);
    flashAlpha = 0.8;
    spawnRipple(dino.x + dino.width / 2, GROUND_Y + 30, 240, 12, 5.0);
    
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
