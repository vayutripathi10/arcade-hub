/* ==========================================================================
   NEON WORD LEAPER - CYBERPARKOUR TYPING GAME ENGINE (V5 - REALISTIC RUNNER & CINEMATIC JUMP)
   ========================================================================== */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. STAGE CONFIGURATIONS & THEMES
    // -------------------------------------------------------------------------
    const STAGE_CONFIGS = {
        1: {
            name: "Cyber Rooftops",
            targetWords: 10,
            pool: [
                "NEON", "CYBER", "GRID", "SYNC", "JUMP", "RUN", "DASH", "LEAP", "WALL",
                "DATA", "CHIP", "CORE", "FAST", "FLOW", "CODE", "GLOW", "BEAM", "VOLT",
                "BYTE", "PIXEL", "NODE", "HACK", "LASER", "PULSE", "SHIFT", "POWER", "SPARK",
                "CITY", "WAVE", "SURGE", "BLADE", "LINK", "EDGE", "WARP", "LOCK", "PATH", "WATER"
            ],
            theme: {
                primary: "#00ffcc",
                secondary: "#10b981",
                scarf: "#00ffcc",
                skyTop: "#06070a",
                skyMid: "#0d1b2a",
                skyBot: "#020617"
            }
        },
        2: {
            name: "Neon Megacity",
            targetWords: 15,
            pool: [
                "MATRIX", "SIGNAL", "VECTOR", "RUNNER", "CHROME", "CIRCUIT", "SHADOW", "CYBORG",
                "ROUTER", "SYNTH", "ENERGY", "THRUST", "SYSTEM", "VELOCITY", "ENGINE", "FLIGHT",
                "SHIELD", "BINARY", "PROTOCOL", "ORBIT", "DYNAMIC", "NEURON", "SOCKET", "TERMINAL",
                "HORIZON", "NETWORK", "VORTEX", "STATION", "REFLEX", "PLASMA", "STREAM", "BOOSTER"
            ],
            theme: {
                primary: "#ff00ea",
                secondary: "#a855f7",
                scarf: "#ff00ea",
                skyTop: "#0d0614",
                skyMid: "#1a0b2e",
                skyBot: "#070210"
            }
        },
        3: {
            name: "Quantum Orbit",
            targetWords: 20,
            pool: [
                "QUANTUM", "OVERDRIVE", "MAINFRAME", "CYBERSPACE", "HYPERDRIVE", "ACCELERATE",
                "ALGORITHM", "ENCRYPTION", "BANDWIDTH", "MICROPROCESSOR", "SUPERCONDUCTOR",
                "NANOTECHNOLOGY", "ELECTROMAGNETIC", "TELECOMMUNICATION", "PARALLELISM",
                "NEUROMANCER", "CYBERPUNK", "HOLOGRAPHIC", "VIRTUALIZATION", "MEGACITY", "TRANSCEND"
            ],
            theme: {
                primary: "#f59e0b",
                secondary: "#ef4444",
                scarf: "#f59e0b",
                skyTop: "#120703",
                skyMid: "#2b0f06",
                skyBot: "#0a0301"
            }
        }
    };

    // -------------------------------------------------------------------------
    // 2. AUDIO SYNTHESIZER
    // -------------------------------------------------------------------------
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playKeyClick() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(650 + Math.random() * 150, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            } catch (e) {}
        }

        playJump() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } catch (e) {}
        }

        playLand() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } catch (e) {}
        }

        playMistake() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.25);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } catch (e) {}
        }

        playRespawn() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(550, now + 0.18);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } catch (e) {}
        }

        playVictory() {
            if (this.muted || !this.ctx) return;
            try {
                const notes = [261.63, 329.63, 392.00, 523.25];
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        if (!this.ctx) return;
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now);
                        gain.gain.setValueAtTime(0.15, now);
                        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now);
                        osc.stop(now + 0.35);
                    }, idx * 90);
                });
            } catch (e) {}
        }

        playGameOver() {
            if (this.muted || !this.ctx) return;
            try {
                const notes = [300, 260, 220, 160];
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        if (!this.ctx || gameState !== 'GAME_OVER') return;
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, now);
                        gain.gain.setValueAtTime(0.12, now);
                        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now);
                        osc.stop(now + 0.25);
                    }, idx * 100);
                });
            } catch (e) {}
        }
    }

    const sound = new SoundEngine();

    // -------------------------------------------------------------------------
    // 3. GAME STATE & VARIABLES
    // -------------------------------------------------------------------------
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;

    let gameState = 'START';
    let currentStage = 1;

    let score = 0;
    let highScore = parseInt(localStorage.getItem('neon_leaper_highscore') || '0', 10);
    let combo = 1;
    let maxCombo = 1;
    let lives = 3;
    let stageWordsCompleted = 0;

    let totalKeystrokes = 0;
    let correctKeystrokes = 0;
    let startTime = 0;
    let currentWpm = 0;

    let targetWord = "";
    let typedIndex = 0;
    let wordTimer = 1.0;
    let wordTimeLimit = 20.0;

    let cameraX = 0;
    let targetCameraX = 0;
    let cameraY = 0;
    let targetCameraY = 0;

    let walls = [];
    let currentWallIndex = 0;

    // High-Resolution Character Model
    const runner = {
        x: 150,
        y: 0,
        width: 44,
        height: 64,
        vx: 0,
        vy: 0,
        angle: 0,
        state: 'IDLE', // IDLE, JUMPING, FALLING, LANDING, RESPAWNING, DEAD
        jumpProgress: 0,
        startX: 0,
        startY: 0,
        targetX: 0,
        targetY: 0,
        respawnTimer: 0,
        landingTimer: 0,
        breathTime: 0,
        trail: [],
        scarfPoints: []
    };

    let shockwaves = [];
    let particles = [];
    let screenShake = 0;

    // Hover-Cars for Background
    let hoverCars = [];
    function initHoverCars() {
        hoverCars = [];
        for (let i = 0; i < 8; i++) {
            hoverCars.push({
                x: Math.random() * width * 2,
                y: height * 0.12 + Math.random() * (height * 0.38),
                speed: (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 100),
                length: 35 + Math.random() * 25,
                color: Math.random() > 0.5 ? '#00ffcc' : '#ff00ea',
                layer: Math.random() > 0.5 ? 1 : 2
            });
        }
    }

    let embers = [];
    function initEmbers() {
        embers = [];
        for (let i = 0; i < 30; i++) {
            embers.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 20,
                vy: -(18 + Math.random() * 35),
                size: 1.5 + Math.random() * 2.5,
                alpha: 0.2 + Math.random() * 0.6
            });
        }
    }

    // -------------------------------------------------------------------------
    // 4. WALL & LEVEL GENERATION
    // -------------------------------------------------------------------------
    class Wall {
        constructor(index, x, width, topY, stageTheme) {
            this.index = index;
            this.x = x;
            this.width = width;
            this.topY = topY;
            this.color = index % 2 === 0 ? stageTheme.primary : stageTheme.secondary;
            this.height = height;
        }

        draw(ctx, camX, camY) {
            const screenX = this.x - camX;
            const screenY = this.topY - camY;
            if (screenX + this.width < -120 || screenX > width + 120) return;

            ctx.save();

            // Skyscraper Wall Base Gradient
            const grad = ctx.createLinearGradient(screenX, screenY, screenX + this.width, height);
            grad.addColorStop(0, 'rgba(15, 23, 42, 0.96)');
            grad.addColorStop(1, 'rgba(6, 9, 16, 0.98)');
            ctx.fillStyle = grad;
            ctx.fillRect(screenX, screenY, this.width, height - screenY + 200);

            // Glowing Neon Top Platform Surface
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 18;
            ctx.fillRect(screenX, screenY, this.width, 10);

            // Wall Neon Edge Borders
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(screenX, screenY, this.width, height - screenY + 200);

            // Tech Circuit Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1;
            for (let cy = screenY + 30; cy < height; cy += 32) {
                ctx.beginPath();
                ctx.moveTo(screenX + 8, cy);
                ctx.lineTo(screenX + this.width - 8, cy);
                ctx.stroke();
            }

            // Wall Level Plate
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '14px "Share Tech Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`WALL ${this.index + 1}`, screenX + this.width / 2, screenY + 32);

            ctx.restore();
        }
    }

    function initWalls() {
        walls = [];
        let currentX = 120;
        const groundY = height * 0.65;
        const stageTheme = STAGE_CONFIGS[currentStage].theme;

        for (let i = 0; i < 20; i++) {
            const wallW = 150 + Math.random() * 40;
            const wallTopY = groundY + (Math.sin(i * 0.8) * 35);
            walls.push(new Wall(i, currentX, wallW, wallTopY, stageTheme));
            const gap = 200 + Math.random() * 80;
            currentX += wallW + gap;
        }

        currentWallIndex = 0;
        runner.x = walls[0].x + walls[0].width / 2;
        runner.y = walls[0].topY;
        cameraX = runner.x - width * 0.3;
        targetCameraX = cameraX;
        cameraY = 0;
        targetCameraY = 0;
    }

    function spawnNextWallIfNeeded() {
        if (currentWallIndex >= walls.length - 6) {
            const lastWall = walls[walls.length - 1];
            const i = lastWall.index + 1;
            const gap = 200 + Math.random() * 90;
            const nextX = lastWall.x + lastWall.width + gap;
            const wallW = 150 + Math.random() * 40;
            const groundY = height * 0.65;
            const wallTopY = groundY + (Math.sin(i * 0.8) * 45);
            const stageTheme = STAGE_CONFIGS[currentStage].theme;
            walls.push(new Wall(i, nextX, wallW, wallTopY, stageTheme));
        }
    }

    // -------------------------------------------------------------------------
    // 5. WORD GENERATOR & TYPING HANDLER
    // -------------------------------------------------------------------------
    function getRandomWord() {
        const pool = STAGE_CONFIGS[currentStage].pool;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function setNextWord(isRetry = false) {
        if (!isRetry) {
            targetWord = getRandomWord();
        }
        typedIndex = 0;
        wordTimer = 1.0;
        wordTimeLimit = 20.0;

        updateWordDisplay();
        updateStageProgressHUD();
    }

    function updateWordDisplay() {
        const typedSpan = document.querySelector('#targetWordDisplay .typed');
        const currSpan = document.querySelector('#targetWordDisplay .current-letter');
        const remSpan = document.querySelector('#targetWordDisplay .remaining');

        const typed = targetWord.substring(0, typedIndex);
        const current = targetWord.charAt(typedIndex);
        const remaining = targetWord.substring(typedIndex + 1);

        typedSpan.innerText = typed;
        currSpan.innerText = current;
        remSpan.innerText = remaining;

        const timerFill = document.getElementById('timerFill');
        timerFill.style.width = `${Math.max(0, wordTimer * 100)}%`;
        if (wordTimer < 0.25) {
            timerFill.style.background = '#ef4444';
        } else {
            timerFill.style.background = 'linear-gradient(90deg, #00ffcc, #10b981)';
        }
    }

    function updateStageProgressHUD() {
        const cfg = STAGE_CONFIGS[currentStage];
        document.getElementById('stageLabel').innerText = `STAGE ${currentStage}`;
        document.getElementById('stageWordCount').innerText = `${stageWordsCompleted}/${cfg.targetWords} Words`;
        const pct = Math.min(100, (stageWordsCompleted / cfg.targetWords) * 100);
        document.getElementById('stageFill').style.width = `${pct}%`;
    }

    function handleTypingInput(char) {
        if (gameState !== 'PLAYING') return;

        totalKeystrokes++;
        const expectedChar = targetWord.charAt(typedIndex);

        if (char.toUpperCase() === expectedChar.toUpperCase()) {
            correctKeystrokes++;
            typedIndex++;
            sound.playKeyClick();
            createSparks(runner.x, runner.y - 35, STAGE_CONFIGS[currentStage].theme.primary, 8);

            if (typedIndex >= targetWord.length) {
                onWordCompleted();
            } else {
                updateWordDisplay();
            }
        } else {
            onTypingMistake();
        }
    }

    function onWordCompleted() {
        score += targetWord.length * 10 * combo;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        stageWordsCompleted++;

        document.getElementById('scoreVal').innerText = score;
        document.getElementById('comboVal').innerText = `${combo}x`;
        updateStageProgressHUD();

        const currentWall = walls[currentWallIndex];
        const nextWall = walls[currentWallIndex + 1];

        // Launch spectacular acrobatic jump!
        gameState = 'JUMPING';
        sound.playJump();

        runner.state = 'JUMPING';
        runner.jumpProgress = 0;
        runner.startX = currentWall.x + currentWall.width - 25;
        runner.startY = currentWall.topY;
        runner.targetX = nextWall.x + 40;
        runner.targetY = nextWall.topY;

        // Blast thruster fire on takeoff
        createThrusterBurst(runner.startX, runner.startY, STAGE_CONFIGS[currentStage].theme.primary, 25);

        // Check if stage goal is completed
        const targetReq = STAGE_CONFIGS[currentStage].targetWords;
        if (stageWordsCompleted >= targetReq) {
            gameState = 'STAGE_COMPLETE';
            setTimeout(() => {
                triggerStageComplete();
            }, 800);
        }
    }

    function onTypingMistake() {
        if (gameState !== 'PLAYING') return;

        sound.playMistake();
        combo = 1;
        document.getElementById('comboVal').innerText = '1x';

        const wordCard = document.getElementById('wordCard');
        wordCard.classList.add('glitch-shake');
        setTimeout(() => wordCard.classList.remove('glitch-shake'), 400);

        screenShake = 12;
        createSparks(runner.x, runner.y - 25, '#ef4444', 22);

        lives--;
        updateLivesHUD();

        gameState = 'FALLING';
        runner.state = 'FALLING';
        runner.vx = 2.2;
        runner.vy = -3.0;
    }

    function updateLivesHUD() {
        const hearts = document.querySelectorAll('#hudLives .heart');
        hearts.forEach((h, idx) => {
            if (idx >= lives) {
                h.classList.add('lost');
            } else {
                h.classList.remove('lost');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 6. RUNNER PHYSICS, SHOCKWAVES & PARTICLES
    // -------------------------------------------------------------------------
    function createThrusterBurst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI * 0.7 + Math.random() * Math.PI * 0.6;
            const speed = 4 + Math.random() * 7;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 2,
                color: color,
                size: 3 + Math.random() * 3.5,
                life: 1.0,
                decay: 2.0 + Math.random() * 2
            });
        }
    }

    function createShockwave(x, y, color) {
        shockwaves.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 65,
            color: color,
            alpha: 1.0
        });
    }

    function updateRunner(dt) {
        runner.breathTime += dt * 4;

        if (runner.state === 'JUMPING' || runner.state === 'FALLING') {
            runner.trail.push({
                x: runner.x,
                y: runner.y,
                alpha: 1.0,
                angle: runner.angle,
                color: runner.state === 'JUMPING' ? STAGE_CONFIGS[currentStage].theme.primary : '#ef4444'
            });

            // Emit thruster flame particles while in mid-air
            if (runner.state === 'JUMPING' && Math.random() > 0.3) {
                particles.push({
                    x: runner.x - Math.cos(runner.angle) * 20,
                    y: runner.y - Math.sin(runner.angle) * 20,
                    vx: (Math.random() - 0.5) * 2 - 2,
                    vy: (Math.random() - 0.5) * 2 + 3,
                    color: STAGE_CONFIGS[currentStage].theme.primary,
                    size: 2.5 + Math.random() * 2,
                    life: 0.8,
                    decay: 3.5
                });
            }
        }

        for (let i = runner.trail.length - 1; i >= 0; i--) {
            runner.trail[i].alpha -= dt * 3.0;
            if (runner.trail[i].alpha <= 0) {
                runner.trail.splice(i, 1);
            }
        }

        if (runner.state === 'JUMPING') {
            // Generous 0.82s jump duration so the acrobatic dive is prominent and cinematic!
            runner.jumpProgress += dt * 1.22;

            if (runner.jumpProgress >= 1.0) {
                runner.jumpProgress = 1.0;
                runner.state = 'LANDING';
                runner.landingTimer = 0.18;
                currentWallIndex++;
                spawnNextWallIfNeeded();

                const landWall = walls[currentWallIndex];
                runner.x = landWall.x + 40;
                runner.y = landWall.topY;
                runner.angle = 0;

                sound.playLand();
                screenShake = 8;
                createShockwave(runner.x, runner.y, STAGE_CONFIGS[currentStage].theme.primary);
                createSparks(runner.x, runner.y, STAGE_CONFIGS[currentStage].theme.primary, 24);

                targetCameraX = runner.x - width * 0.3;
                targetCameraY = 0;

                if (gameState !== 'STAGE_COMPLETE') {
                    gameState = 'PLAYING';
                    setNextWord(false);
                }
            } else {
                const p = runner.jumpProgress;
                runner.x = runner.startX + (runner.targetX - runner.startX) * p;

                // Cinematic Parabolic Jump Arc with dynamic peak
                const arcH = 155;
                const heightOffset = 4 * arcH * p * (1 - p);
                const linearY = runner.startY + (runner.targetY - runner.startY) * p;
                runner.y = linearY - heightOffset;

                // Smooth full 360° parkour acrobatic roll
                runner.angle = p * Math.PI * 2;

                // Dynamic camera tracking height during leap
                targetCameraY = -heightOffset * 0.35;
            }
        } else if (runner.state === 'LANDING') {
            runner.landingTimer -= dt;
            if (runner.landingTimer <= 0) {
                runner.state = 'IDLE';
            }
        } else if (runner.state === 'FALLING') {
            runner.x += runner.vx;
            runner.y += runner.vy;
            runner.vy += 24 * dt;
            runner.angle += 7 * dt;

            if (runner.y > height + 80) {
                if (lives > 0) {
                    respawnRunnerOnSameWall();
                } else {
                    runner.state = 'DEAD';
                    triggerGameOver();
                }
            }
        } else if (runner.state === 'RESPAWNING') {
            runner.respawnTimer -= dt;
            if (runner.respawnTimer <= 0) {
                runner.state = 'IDLE';
                gameState = 'PLAYING';
            }
        }
    }

    function respawnRunnerOnSameWall() {
        sound.playRespawn();
        const currentWall = walls[currentWallIndex];
        runner.x = currentWall.x + currentWall.width / 2;
        runner.y = currentWall.topY;
        runner.vx = 0;
        runner.vy = 0;
        runner.angle = 0;
        runner.state = 'RESPAWNING';
        runner.respawnTimer = 0.45;

        createSparks(runner.x, runner.y - 25, STAGE_CONFIGS[currentStage].theme.primary, 30);
        screenShake = 8;
        targetCameraY = 0;

        setNextWord(true);
    }

    function createSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 6;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.8,
                color: color,
                size: 2.5 + Math.random() * 3,
                life: 1.0,
                decay: 1.8 + Math.random() * 2
            });
        }
    }

    function updateParticles(dt) {
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const s = shockwaves[i];
            s.radius += dt * 140;
            s.alpha -= dt * 2.5;
            if (s.alpha <= 0 || s.radius >= s.maxRadius) {
                shockwaves.splice(i, 1);
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 8 * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        for (const car of hoverCars) {
            car.x += car.speed * dt;
            if (car.speed > 0 && car.x > width + 200) {
                car.x = -200;
                car.y = height * 0.12 + Math.random() * (height * 0.38);
            } else if (car.speed < 0 && car.x < -200) {
                car.x = width + 200;
                car.y = height * 0.12 + Math.random() * (height * 0.38);
            }
        }

        for (const e of embers) {
            e.y += e.vy * dt;
            e.x += e.vx * dt;
            if (e.y < -20) {
                e.y = height + 20;
                e.x = Math.random() * width;
            }
        }
    }

    function drawParticles(ctx, camX, camY) {
        ctx.save();
        // Draw expanding shockwaves on landing
        for (const s of shockwaves) {
            ctx.save();
            ctx.strokeStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 15;
            ctx.lineWidth = 3;
            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.beginPath();
            ctx.ellipse(s.x - camX, s.y - camY, s.radius, s.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw sparks
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 7. HIGH-RESOLUTION REALISTIC CYBER RUNNER DRAWING
    // -------------------------------------------------------------------------
    function drawRunner(ctx, camX, camY) {
        if (runner.state === 'DEAD') return;

        ctx.save();
        const drawX = runner.x - camX;
        const drawY = runner.y - camY;

        // Draw Motion Trails
        for (let i = 0; i < runner.trail.length; i++) {
            const t = runner.trail[i];
            ctx.save();
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = t.alpha * 0.35;
            ctx.beginPath();
            ctx.arc(t.x - camX, t.y - camY - 28, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.translate(drawX, drawY);

        if (runner.state === 'RESPAWNING') {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
        }

        const stageTheme = STAGE_CONFIGS[currentStage].theme;

        // Dynamic crouch / bounce offsets
        let crouchY = 0;
        let legSpread = 0;
        let breathOffset = Math.sin(runner.breathTime) * 1.5;

        if (runner.state === 'LANDING') {
            crouchY = 8;
            legSpread = 6;
        }

        ctx.rotate(runner.angle);

        // --- CYBER SCARF / ENERGY CAPE (Dynamic Flowing Wave) ---
        ctx.save();
        ctx.strokeStyle = stageTheme.scarf;
        ctx.shadowColor = stageTheme.scarf;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const scarfWave = Math.sin(runner.breathTime * 1.5) * 6;
        ctx.moveTo(-10, -42 + crouchY);
        ctx.quadraticCurveTo(-24, -36 + scarfWave + crouchY, -40 - Math.abs(runner.vx * 3), -30 + scarfWave * 1.5 + crouchY);
        ctx.stroke();
        ctx.restore();

        // --- JET THRUSTER PACK ---
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = stageTheme.primary;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-16, -42 + crouchY, 8, 22);
        ctx.strokeRect(-16, -42 + crouchY, 8, 22);

        // Thruster Core Light
        ctx.fillStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 10;
        ctx.fillRect(-15, -34 + crouchY, 6, 6);
        ctx.restore();

        // --- LEGS & JET BOOTS ---
        ctx.save();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Left Leg
        ctx.beginPath();
        ctx.moveTo(-6, -18 + crouchY);
        ctx.lineTo(-8 - legSpread, -6 + crouchY * 0.5);
        ctx.lineTo(-10 - legSpread, 0);
        ctx.stroke();

        // Right Leg
        ctx.beginPath();
        ctx.moveTo(6, -18 + crouchY);
        ctx.lineTo(8 + legSpread, -6 + crouchY * 0.5);
        ctx.lineTo(10 + legSpread, 0);
        ctx.stroke();

        // Glowing Armor Trim on Shins & Boots
        ctx.strokeStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(-12 - legSpread, -2);
        ctx.lineTo(-4 - legSpread, 0);
        ctx.moveTo(4 + legSpread, 0);
        ctx.lineTo(12 + legSpread, -2);
        ctx.stroke();
        ctx.restore();

        // --- TORSO & CYBER ARMOR ---
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;

        // Chest Armor
        ctx.beginPath();
        ctx.roundRect(-10, -44 + crouchY + breathOffset, 20, 26, 4);
        ctx.fill();
        ctx.stroke();

        // Glowing Arc Reactor Core in Chest
        ctx.fillStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, -32 + crouchY + breathOffset, 4, 0, Math.PI * 2);
        ctx.fill();

        // Armor Accent Lines
        ctx.strokeStyle = stageTheme.secondary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, -40 + crouchY + breathOffset);
        ctx.lineTo(6, -40 + crouchY + breathOffset);
        ctx.moveTo(-7, -24 + crouchY + breathOffset);
        ctx.lineTo(7, -24 + crouchY + breathOffset);
        ctx.stroke();
        ctx.restore();

        // --- ARMS ---
        ctx.save();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        if (runner.state === 'JUMPING') {
            // Forward diving arms pose
            ctx.beginPath();
            ctx.moveTo(-8, -38 + crouchY);
            ctx.lineTo(-18, -26);
            ctx.moveTo(8, -38 + crouchY);
            ctx.lineTo(18, -48);
            ctx.stroke();
        } else {
            // Ready stance
            ctx.beginPath();
            ctx.moveTo(-8, -38 + crouchY + breathOffset);
            ctx.lineTo(-14, -28 + crouchY);
            ctx.moveTo(8, -38 + crouchY + breathOffset);
            ctx.lineTo(14, -28 + crouchY);
            ctx.stroke();
        }
        ctx.restore();

        // --- HELMET & CYBER VISOR ---
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, -52 + crouchY + breathOffset, 10, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Neon Visor
        ctx.fillStyle = stageTheme.secondary;
        ctx.shadowColor = stageTheme.secondary;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(-2, -54 + crouchY + breathOffset, 12, 5, 2);
        ctx.fill();

        // Antenna Ear Piece
        ctx.strokeStyle = stageTheme.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -55 + crouchY + breathOffset);
        ctx.lineTo(-10, -62 + crouchY + breathOffset);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 8. HIGH-JUICE CYBERPUNK SKYLINE WALLPAPER
    // -------------------------------------------------------------------------
    function drawBackground(ctx, camX, camY) {
        const stageTheme = STAGE_CONFIGS[currentStage].theme;

        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, stageTheme.skyTop);
        bgGrad.addColorStop(0.55, stageTheme.skyMid);
        bgGrad.addColorStop(1, stageTheme.skyBot);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Distant Flying Hover-Cars (Layer 1)
        for (const car of hoverCars.filter(c => c.layer === 1)) {
            ctx.fillStyle = car.color;
            ctx.shadowColor = car.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(car.x, car.y - camY * 0.1, car.length, 3);
        }

        // Distant Mega-Skyscrapers (Parallax Layer 1)
        ctx.fillStyle = 'rgba(20, 30, 50, 0.45)';
        const p1 = camX * 0.08;
        for (let x = -200; x < width + 200; x += 85) {
            const h = 200 + Math.sin(x * 0.04) * 70;
            ctx.fillRect(x - (p1 % 85), height * 0.65 - h - camY * 0.1, 65, h);
        }

        // Midground Cyber Skyline with Holographic Billboards (Parallax Layer 2)
        ctx.fillStyle = 'rgba(12, 18, 35, 0.75)';
        const p2 = camX * 0.25;
        for (let x = -200; x < width + 200; x += 150) {
            const h = 260 + Math.cos(x * 0.035) * 90;
            const drawX = x - (p2 % 150);
            ctx.fillRect(drawX, height * 0.65 - h - camY * 0.2, 120, h);

            // Windows Matrix
            ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
            for (let wy = height * 0.65 - h + 25; wy < height * 0.65 - 20; wy += 28) {
                ctx.fillRect(drawX + 15, wy - camY * 0.2, 8, 14);
                ctx.fillRect(drawX + 50, wy - camY * 0.2, 8, 14);
                ctx.fillRect(drawX + 85, wy - camY * 0.2, 8, 14);
            }
            ctx.fillStyle = 'rgba(12, 18, 35, 0.75)';
        }

        // Midground Hover-Cars (Layer 2)
        for (const car of hoverCars.filter(c => c.layer === 2)) {
            ctx.fillStyle = car.color;
            ctx.shadowColor = car.color;
            ctx.shadowBlur = 14;
            ctx.fillRect(car.x, car.y - camY * 0.2, car.length + 12, 4);
        }

        // Floating Cyber Grid Horizon
        ctx.strokeStyle = `${stageTheme.primary}25`;
        ctx.lineWidth = 1;
        const gridY = height * 0.72 - camY * 0.3;
        for (let x = 0; x < width; x += 36) {
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo((x - width / 2) * 2.4 + width / 2, height);
            ctx.stroke();
        }

        // Ambient Rising Digital Embers
        ctx.fillStyle = stageTheme.primary;
        for (const e of embers) {
            ctx.globalAlpha = e.alpha;
            ctx.fillRect(e.x, e.y, e.size, e.size);
        }
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------------------
    // 9. GAME LOOP & TIMERS
    // -------------------------------------------------------------------------
    let lastTime = 0;

    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        if (screenShake > 0) {
            screenShake = Math.max(0, screenShake - dt * 25);
        }

        cameraX += (targetCameraX - cameraX) * (1 - Math.pow(0.001, dt));
        cameraY += (targetCameraY - cameraY) * (1 - Math.pow(0.001, dt));

        if (gameState === 'PLAYING') {
            wordTimer -= dt / wordTimeLimit;
            updateWordDisplay();

            if (wordTimer <= 0) {
                onTypingMistake();
            }

            const elapsedMins = Math.max((Date.now() - startTime) / 60000, 0.05);
            currentWpm = Math.round((correctKeystrokes / 5) / elapsedMins);
            document.getElementById('wpmVal').innerText = currentWpm;
        }

        updateRunner(dt);
        updateParticles(dt);

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            ctx.translate(shakeX, shakeY);
        }

        drawBackground(ctx, cameraX, cameraY);

        for (const wall of walls) {
            wall.draw(ctx, cameraX, cameraY);
        }

        drawRunner(ctx, cameraX, cameraY);
        drawParticles(ctx, cameraX, cameraY);

        ctx.restore();

        requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------------------------
    // 10. STAGE COMPLETION, GAME OVER & MENU TRANSITIONS
    // -------------------------------------------------------------------------
    function triggerStageComplete() {
        gameState = 'STAGE_COMPLETE';
        sound.playVictory();

        const elapsedMins = Math.max((Date.now() - startTime) / 60000, 0.05);
        const stageWpm = Math.round((correctKeystrokes / 5) / elapsedMins);
        const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

        let stars = "⭐⭐⭐";
        if (accuracy < 80 || lives < 2) stars = "⭐⭐";
        if (accuracy < 60 || lives < 1) stars = "⭐";

        document.getElementById('stageClearedTitle').innerText = `STAGE ${currentStage} CLEARED!`;
        document.getElementById('starRating').innerText = stars;
        document.getElementById('stageScoreVal').innerText = score;
        document.getElementById('stageWpmVal').innerText = stageWpm;
        document.getElementById('stageAccVal').innerText = `${accuracy}%`;

        const nextBtn = document.getElementById('nextStageBtn');
        if (currentStage >= 3) {
            nextBtn.innerText = "PLAY AGAIN [ STAGE 1 ]";
        } else {
            nextBtn.innerText = `NEXT STAGE (STAGE ${currentStage + 1}) ▶`;
        }

        document.getElementById('stageCompleteScreen').classList.add('active');
        document.getElementById('word-hud-container').style.display = 'none';
    }

    function triggerGameOver() {
        if (gameState === 'GAME_OVER') return;
        gameState = 'GAME_OVER';
        sound.playGameOver();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('neon_leaper_highscore', highScore);
        }

        const elapsedMins = Math.max((Date.now() - startTime) / 60000, 0.05);
        const finalWpm = Math.round((correctKeystrokes / 5) / elapsedMins);
        const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

        document.getElementById('finalScoreVal').innerText = score;
        document.getElementById('highScoreVal').innerText = highScore;
        document.getElementById('finalWpmVal').innerText = finalWpm;
        document.getElementById('finalAccVal').innerText = `${accuracy}%`;
        document.getElementById('finalWallsVal').innerText = stageWordsCompleted;
        document.getElementById('finalComboVal').innerText = `${maxCombo}x`;

        document.getElementById('gameOverScreen').classList.add('active');
        document.getElementById('word-hud-container').style.display = 'none';
    }

    function returnToStageSelect() {
        gameState = 'START';
        document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
        document.getElementById('startScreen').classList.add('active');
        document.getElementById('word-hud-container').style.display = 'none';

        document.querySelectorAll('.stage-card').forEach(card => {
            if (parseInt(card.dataset.stage, 10) === currentStage) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        document.getElementById('startBtn').innerHTML = `<span>START STAGE ${currentStage} [ SPACE ]</span>`;
    }

    function startGame(stageNum = currentStage) {
        sound.init();
        currentStage = stageNum;
        gameState = 'PLAYING';

        score = 0;
        combo = 1;
        maxCombo = 1;
        lives = 3;
        stageWordsCompleted = 0;
        totalKeystrokes = 0;
        correctKeystrokes = 0;
        startTime = Date.now();

        document.getElementById('scoreVal').innerText = '0';
        document.getElementById('comboVal').innerText = '1x';
        document.getElementById('wpmVal').innerText = '0';
        updateLivesHUD();
        updateStageProgressHUD();

        document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
        document.getElementById('word-hud-container').style.display = 'flex';

        initWalls();
        setNextWord(false);
    }

    // -------------------------------------------------------------------------
    // 11. INPUT & EVENT LISTENERS
    // -------------------------------------------------------------------------
    function initListeners() {
        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        });
        canvas.width = width;
        canvas.height = height;

        document.getElementById('game-container').addEventListener('click', () => {
            window.focus();
        });

        // Single-Point Keyboard Handler
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') e.preventDefault();

            if (gameState === 'START' || gameState === 'GAME_OVER') {
                if (e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    startGame(currentStage);
                }
                return;
            }

            if (gameState === 'STAGE_COMPLETE') {
                if (e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    const nextStage = currentStage >= 3 ? 1 : currentStage + 1;
                    startGame(nextStage);
                }
                return;
            }

            if (gameState === 'PLAYING') {
                if (e.key === 'Escape') {
                    togglePause();
                    return;
                }

                if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    e.preventDefault();
                    handleTypingInput(e.key);
                }
            } else if (gameState === 'PAUSED') {
                if (e.key === 'Escape' || e.code === 'Space') {
                    togglePause();
                }
            }
        });

        // Stage Card Selection
        document.querySelectorAll('.stage-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                currentStage = parseInt(card.dataset.stage, 10);
                document.getElementById('startBtn').innerHTML = `<span>START STAGE ${currentStage} [ SPACE ]</span>`;
            });
        });

        // UI Buttons
        document.getElementById('startBtn').addEventListener('click', () => startGame(currentStage));
        document.getElementById('restartBtn').addEventListener('click', () => startGame(currentStage));
        document.getElementById('resumeBtn').addEventListener('click', togglePause);
        document.getElementById('restartFromPauseBtn').addEventListener('click', () => {
            document.getElementById('pauseScreen').classList.remove('active');
            startGame(currentStage);
        });

        document.getElementById('pauseBtn').addEventListener('click', togglePause);

        document.getElementById('stageSelectFromPauseBtn').addEventListener('click', returnToStageSelect);
        document.getElementById('stageSelectFromVictoryBtn').addEventListener('click', returnToStageSelect);
        document.getElementById('stageSelectFromGameOverBtn').addEventListener('click', returnToStageSelect);

        document.getElementById('nextStageBtn').addEventListener('click', () => {
            const nextStage = currentStage >= 3 ? 1 : currentStage + 1;
            startGame(nextStage);
        });

        const soundBtn = document.getElementById('soundBtn');
        soundBtn.addEventListener('click', () => {
            sound.init();
            sound.muted = !sound.muted;
            soundBtn.innerText = sound.muted ? '🔇' : '🔊';
        });

        const mobileInput = document.getElementById('mobileInput');
        const mobileKbBtn = document.getElementById('mobileKbBtn');

        if (mobileKbBtn && mobileInput) {
            mobileKbBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileInput.focus();
            });

            mobileInput.addEventListener('beforeinput', (e) => {
                if (e.data && /[a-zA-Z]/.test(e.data)) {
                    e.preventDefault();
                    handleTypingInput(e.data);
                }
            });
        }
    }

    function togglePause() {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            document.getElementById('pauseScreen').classList.add('active');
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            document.getElementById('pauseScreen').classList.remove('active');
        }
    }

    // -------------------------------------------------------------------------
    // 12. INITIALIZATION
    // -------------------------------------------------------------------------
    initHoverCars();
    initEmbers();
    initListeners();
    initWalls();
    requestAnimationFrame(gameLoop);

})();
