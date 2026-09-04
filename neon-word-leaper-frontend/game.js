/* ==========================================================================
   NEON WORD LEAPER - CYBERPARKOUR TYPING GAME ENGINE (FIXED & POLISHED)
   ========================================================================== */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. DICTIONARIES & WORD POOLS
    // -------------------------------------------------------------------------
    const WORD_POOLS = {
        novice: [
            "NEON", "CYBER", "GRID", "SYNC", "JUMP", "RUN", "DASH", "LEAP", "WALL",
            "DATA", "CHIP", "CORE", "FAST", "FLOW", "CODE", "GLOW", "BEAM", "VOLT",
            "BYTE", "PIXEL", "NODE", "HACK", "LASER", "PULSE", "SHIFT", "POWER", "SPARK",
            "CITY", "WAVE", "SURGE", "BLADE", "LINK", "EDGE", "WARP", "LOCK", "PATH"
        ],
        cyber: [
            "MATRIX", "SIGNAL", "VECTOR", "RUNNER", "CHROME", "CIRCUIT", "SHADOW", "CYBORG",
            "ROUTER", "SYNTH", "ENERGY", "THRUST", "SYSTEM", "VELOCITY", "ENGINE", "FLIGHT",
            "SHIELD", "BINARY", "PROTOCOL", "ORBIT", "DYNAMIC", "NEURON", "SOCKET", "TERMINAL",
            "HORIZON", "NETWORK", "VORTEX", "STATION", "REFLEX", "PLASMA", "STREAM", "BOOSTER"
        ],
        overdrive: [
            "QUANTUM", "OVERDRIVE", "MAINFRAME", "CYBERSPACE", "HYPERDRIVE", "ACCELERATE",
            "ALGORITHM", "ENCRYPTION", "BANDWIDTH", "MICROPROCESSOR", "SUPERCONDUCTOR",
            "NANOTECHNOLOGY", "ELECTROMAGNETIC", "TELECOMMUNICATION", "PARALLELISM",
            "NEUROMANCER", "CYBERPUNK", "HOLOGRAPHIC", "VIRTUALIZATION", "MEGACITY"
        ]
    };

    // -------------------------------------------------------------------------
    // 2. AUDIO SYNTHESIZER (WEB AUDIO API - CLEAN & SAFE)
    // -------------------------------------------------------------------------
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.muted = false;
            this.activeOscillators = [];
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

        stopAll() {
            this.activeOscillators.forEach(osc => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {}
            });
            this.activeOscillators = [];
        }

        playKeyClick() {
            if (this.muted || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;
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
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(750, now + 0.22);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } catch (e) {}
        }

        playLand() {
            if (this.muted || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } catch (e) {}
        }

        playMistake() {
            if (this.muted || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;
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
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;
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

        playGameOver() {
            if (this.muted || !this.ctx) return;
            this.stopAll();
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

    let gameState = 'START'; // START, PLAYING, PAUSED, GAME_OVER, FALLING, JUMPING, RESPAWNING
    let difficulty = 'novice'; // novice, cyber, overdrive

    let score = 0;
    let highScore = parseInt(localStorage.getItem('neon_leaper_highscore') || '0', 10);
    let combo = 1;
    let maxCombo = 1;
    let lives = 3;
    let wallsCleared = 0;

    let totalKeystrokes = 0;
    let correctKeystrokes = 0;
    let startTime = 0;
    let currentWpm = 0;

    // Current word & typing state
    let targetWord = "";
    let typedIndex = 0;
    let wordTimer = 1.0; // 1.0 -> 0.0
    let wordTimeLimit = 16.0; // Generous 16 seconds per word so players can type comfortably

    // Camera & World Coordinates
    let cameraX = 0;
    let targetCameraX = 0;

    // Walls array
    let walls = [];
    let currentWallIndex = 0;

    // Runner character state
    const runner = {
        x: 150,
        y: 0,
        width: 32,
        height: 48,
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
        trail: []
    };

    let particles = [];
    let screenShake = 0;

    // -------------------------------------------------------------------------
    // 4. WALL & LEVEL GENERATION
    // -------------------------------------------------------------------------
    class Wall {
        constructor(index, x, width, topY) {
            this.index = index;
            this.x = x;
            this.width = width;
            this.topY = topY;
            this.color = index % 2 === 0 ? '#00ffcc' : '#ff00ea';
            this.height = height;
        }

        draw(ctx, camX) {
            const screenX = this.x - camX;
            if (screenX + this.width < -100 || screenX > width + 100) return;

            ctx.save();

            // Skyscraper Wall Base Gradient
            const grad = ctx.createLinearGradient(screenX, this.topY, screenX + this.width, height);
            grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
            grad.addColorStop(1, 'rgba(6, 9, 16, 0.98)');
            ctx.fillStyle = grad;
            ctx.fillRect(screenX, this.topY, this.width, height - this.topY);

            // Glowing Neon Top Platform Surface
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.fillRect(screenX, this.topY, this.width, 8);

            // Wall Neon Edge Borders
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, this.topY, this.width, height - this.topY);

            // Tech Circuit Grid on Wall
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let cy = this.topY + 25; cy < height; cy += 30) {
                ctx.beginPath();
                ctx.moveTo(screenX + 5, cy);
                ctx.lineTo(screenX + this.width - 5, cy);
                ctx.stroke();
            }

            // Wall Number / Level Indicator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.font = '14px "Share Tech Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`WALL ${this.index + 1}`, screenX + this.width / 2, this.topY + 30);

            ctx.restore();
        }
    }

    function initWalls() {
        walls = [];
        let currentX = 100;
        const groundY = height * 0.65;

        for (let i = 0; i < 15; i++) {
            const wallW = 140 + Math.random() * 40;
            const wallTopY = groundY + (Math.sin(i * 0.8) * 35);
            walls.push(new Wall(i, currentX, wallW, wallTopY));
            const gap = 180 + Math.random() * 80;
            currentX += wallW + gap;
        }

        currentWallIndex = 0;
        runner.x = walls[0].x + walls[0].width / 2;
        runner.y = walls[0].topY;
        cameraX = runner.x - width * 0.3;
        targetCameraX = cameraX;
    }

    function spawnNextWallIfNeeded() {
        if (currentWallIndex >= walls.length - 6) {
            const lastWall = walls[walls.length - 1];
            const i = lastWall.index + 1;
            const gap = 190 + Math.random() * 90;
            const nextX = lastWall.x + lastWall.width + gap;
            const wallW = 140 + Math.random() * 40;
            const groundY = height * 0.65;
            const wallTopY = groundY + (Math.sin(i * 0.8) * 45);
            walls.push(new Wall(i, nextX, wallW, wallTopY));
        }
    }

    // -------------------------------------------------------------------------
    // 5. WORD GENERATOR & TYPING HANDLER
    // -------------------------------------------------------------------------
    function getRandomWord() {
        let pool = WORD_POOLS[difficulty] || WORD_POOLS.novice;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function setNextWord(isRetry = false) {
        if (!isRetry) {
            targetWord = getRandomWord();
        }
        typedIndex = 0;
        wordTimer = 1.0;
        
        // Generous time limit (16+ seconds per word) so typing feels fun, not punishing
        const baseSeconds = Math.max(16, targetWord.length * 2.5);
        wordTimeLimit = baseSeconds;

        updateWordDisplay();
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

    function handleTypingInput(char) {
        if (gameState !== 'PLAYING') return;

        totalKeystrokes++;
        const expectedChar = targetWord.charAt(typedIndex);

        if (char.toUpperCase() === expectedChar.toUpperCase()) {
            // Correct Letter!
            correctKeystrokes++;
            typedIndex++;
            sound.playKeyClick();
            createSparks(runner.x, runner.y - 30, '#00ffcc', 6);

            // Check if entire word is completed
            if (typedIndex >= targetWord.length) {
                onWordCompleted();
            } else {
                updateWordDisplay();
            }
        } else {
            // Typo / Wrong Letter -> Trigger Fall & Lose 1 Life on Same Word!
            onTypingMistake();
        }
    }

    function onWordCompleted() {
        score += targetWord.length * 10 * combo;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        wallsCleared++;

        document.getElementById('scoreVal').innerText = score;
        document.getElementById('comboVal').innerText = `${combo}x`;

        // Launch Acrobatic Leap across the gap!
        gameState = 'JUMPING';
        sound.playJump();

        const currentWall = walls[currentWallIndex];
        const nextWall = walls[currentWallIndex + 1];

        runner.state = 'JUMPING';
        runner.jumpProgress = 0;
        runner.startX = currentWall.x + currentWall.width - 20;
        runner.startY = currentWall.topY;
        runner.targetX = nextWall.x + 35;
        runner.targetY = nextWall.topY;

        createSparks(runner.startX, runner.startY, '#00ffcc', 15);
    }

    function onTypingMistake() {
        if (gameState !== 'PLAYING') return;

        sound.playMistake();
        combo = 1;
        document.getElementById('comboVal').innerText = '1x';

        // Glitch UI animation
        const wordCard = document.getElementById('wordCard');
        wordCard.classList.add('glitch-shake');
        setTimeout(() => wordCard.classList.remove('glitch-shake'), 400);

        screenShake = 12;
        createSparks(runner.x, runner.y - 20, '#ef4444', 20);

        // Deduct 1 Life
        lives--;
        updateLivesHUD();

        // Trigger Fall into Gap
        gameState = 'FALLING';
        runner.state = 'FALLING';
        runner.vx = 2.0;
        runner.vy = -2.5;
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
    // 6. RUNNER PHYSICS & PARTICLES
    // -------------------------------------------------------------------------
    function updateRunner(dt) {
        // Particle trails
        if (runner.state === 'JUMPING' || runner.state === 'FALLING') {
            runner.trail.push({ x: runner.x, y: runner.y, alpha: 1.0, color: runner.state === 'JUMPING' ? '#00ffcc' : '#ef4444' });
        }
        for (let i = runner.trail.length - 1; i >= 0; i--) {
            runner.trail[i].alpha -= dt * 3.5;
            if (runner.trail[i].alpha <= 0) {
                runner.trail.splice(i, 1);
            }
        }

        if (runner.state === 'JUMPING') {
            runner.jumpProgress += dt * 1.8; // Leap duration ~0.55s
            if (runner.jumpProgress >= 1.0) {
                // Land on next wall!
                runner.jumpProgress = 1.0;
                runner.state = 'IDLE';
                currentWallIndex++;
                spawnNextWallIfNeeded();

                const landWall = walls[currentWallIndex];
                runner.x = landWall.x + 35;
                runner.y = landWall.topY;
                runner.angle = 0;

                sound.playLand();
                screenShake = 6;
                createSparks(runner.x, runner.y, '#00ffcc', 18);

                targetCameraX = runner.x - width * 0.3;
                gameState = 'PLAYING';
                setNextWord(false);
            } else {
                // Parabolic Arc Leap
                const p = runner.jumpProgress;
                runner.x = runner.startX + (runner.targetX - runner.startX) * p;
                const arcH = 120;
                const heightOffset = 4 * arcH * p * (1 - p);
                const linearY = runner.startY + (runner.targetY - runner.startY) * p;
                runner.y = linearY - heightOffset;
                runner.angle = p * Math.PI * 2; // Acrobatic 360 backflip!
            }
        } else if (runner.state === 'FALLING') {
            runner.x += runner.vx;
            runner.y += runner.vy;
            runner.vy += 22 * dt; // Gravity
            runner.angle += 6 * dt;

            // Check if fallen below screen
            if (runner.y > height + 80) {
                if (lives > 0) {
                    // Respawn on current wall with the SAME WORD!
                    respawnRunnerOnSameWall();
                } else {
                    // Game Over - only trigger ONCE
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
        runner.respawnTimer = 0.4;

        createSparks(runner.x, runner.y - 20, '#00ffcc', 25);
        screenShake = 8;

        // Reset progress on SAME word so user tries again!
        setNextWord(true);
    }

    function createSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                color: color,
                size: 2 + Math.random() * 3,
                life: 1.0,
                decay: 1.8 + Math.random() * 2
            });
        }
    }

    function updateParticles(dt) {
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
    }

    function drawParticles(ctx, camX) {
        ctx.save();
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawRunner(ctx, camX) {
        if (runner.state === 'DEAD') return;

        ctx.save();
        const drawX = runner.x - camX;
        const drawY = runner.y;

        // Draw Trail
        for (const t of runner.trail) {
            ctx.fillStyle = t.color;
            ctx.globalAlpha = t.alpha * 0.4;
            ctx.beginPath();
            ctx.arc(t.x - camX, t.y - 24, 12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(drawX, drawY - 24);
        ctx.rotate(runner.angle);

        // Cyberpunk Ninja / Runner Sprite Drawing
        if (runner.state === 'RESPAWNING') {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
        }

        // Glowing Thruster Pack / Scarf
        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.fillRect(-12, -8, 6, 16);

        // Body Armor
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -14, 16, 28);

        // Neon Visor / Helmet
        ctx.fillStyle = '#ff00ea';
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 10;
        ctx.fillRect(-4, -22, 12, 6);

        // Limbs
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-4, 14);
        ctx.lineTo(-6, 24);
        ctx.moveTo(4, 14);
        ctx.lineTo(6, 24);
        ctx.stroke();

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 7. BACKGROUND & PARALLAX CITYSCAPE
    // -------------------------------------------------------------------------
    function drawBackground(ctx, camX) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#06070a');
        bgGrad.addColorStop(0.6, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Distant Cyberpunk Skyline (Parallax Layer 1)
        ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
        const p1 = camX * 0.1;
        for (let x = -200; x < width + 200; x += 90) {
            const h = 180 + Math.sin(x * 0.05) * 60;
            ctx.fillRect(x - (p1 % 90), height * 0.65 - h, 70, h);
        }

        // Midground Cyber Skyline with Glowing Windows (Parallax Layer 2)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        const p2 = camX * 0.3;
        for (let x = -200; x < width + 200; x += 140) {
            const h = 240 + Math.cos(x * 0.04) * 80;
            const drawX = x - (p2 % 140);
            ctx.fillRect(drawX, height * 0.65 - h, 110, h);

            // Windows
            ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
            for (let wy = height * 0.65 - h + 20; wy < height * 0.65 - 20; wy += 25) {
                ctx.fillRect(drawX + 15, wy, 8, 12);
                ctx.fillRect(drawX + 45, wy, 8, 12);
                ctx.fillRect(drawX + 75, wy, 8, 12);
            }
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        }

        // Floating Cyber Grid Horizon
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.08)';
        ctx.lineWidth = 1;
        const gridY = height * 0.75;
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo((x - width / 2) * 2 + width / 2, height);
            ctx.stroke();
        }
    }

    // -------------------------------------------------------------------------
    // 8. GAME LOOP & TIMERS
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

        drawBackground(ctx, cameraX);

        for (const wall of walls) {
            wall.draw(ctx, cameraX);
        }

        drawRunner(ctx, cameraX);
        drawParticles(ctx, cameraX);

        ctx.restore();

        requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------------------------
    // 9. GAME OVER & RESTART
    // -------------------------------------------------------------------------
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
        document.getElementById('finalWallsVal').innerText = wallsCleared;
        document.getElementById('finalComboVal').innerText = `${maxCombo}x`;

        document.getElementById('gameOverScreen').classList.add('active');
        document.getElementById('word-hud-container').style.display = 'none';
    }

    function startGame() {
        sound.init();
        gameState = 'PLAYING';

        score = 0;
        combo = 1;
        maxCombo = 1;
        lives = 3;
        wallsCleared = 0;
        totalKeystrokes = 0;
        correctKeystrokes = 0;
        startTime = Date.now();

        document.getElementById('scoreVal').innerText = '0';
        document.getElementById('comboVal').innerText = '1x';
        document.getElementById('wpmVal').innerText = '0';
        updateLivesHUD();

        document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
        document.getElementById('word-hud-container').style.display = 'flex';

        initWalls();
        setNextWord(false);

        const mobileInput = document.getElementById('mobileInput');
        if (mobileInput) {
            mobileInput.focus();
        }
    }

    // -------------------------------------------------------------------------
    // 10. INPUT & EVENT LISTENERS
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

        // Auto-focus window & mobile input on game click
        document.getElementById('game-container').addEventListener('click', () => {
            window.focus();
            const mobileInput = document.getElementById('mobileInput');
            if (mobileInput) mobileInput.focus();
        });

        // Physical Keyboard Listener
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') e.preventDefault();

            if (gameState === 'START' || gameState === 'GAME_OVER') {
                if (e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    startGame();
                }
                return;
            }

            if (gameState === 'PLAYING') {
                if (e.key === 'Escape') {
                    togglePause();
                    return;
                }

                // Handle alphabet keys (A-Z)
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

        // Mobile Soft Input Support
        const mobileInput = document.getElementById('mobileInput');
        const mobileKbBtn = document.getElementById('mobileKbBtn');

        if (mobileKbBtn && mobileInput) {
            mobileKbBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileInput.focus();
            });

            mobileInput.addEventListener('input', (e) => {
                if (e.data && e.data.length > 0) {
                    const lastChar = e.data.charAt(e.data.length - 1);
                    if (/[a-zA-Z]/.test(lastChar)) {
                        handleTypingInput(lastChar);
                    }
                }
                mobileInput.value = '';
            });
        }

        // UI Buttons
        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('restartBtn').addEventListener('click', startGame);
        document.getElementById('resumeBtn').addEventListener('click', togglePause);
        document.getElementById('restartFromPauseBtn').addEventListener('click', () => {
            document.getElementById('pauseScreen').classList.remove('active');
            startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', togglePause);

        const soundBtn = document.getElementById('soundBtn');
        soundBtn.addEventListener('click', () => {
            sound.init();
            sound.muted = !sound.muted;
            soundBtn.innerText = sound.muted ? '🔇' : '🔊';
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                difficulty = btn.dataset.diff;
            });
        });
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
    // 11. INITIALIZATION
    // -------------------------------------------------------------------------
    initListeners();
    initWalls();
    requestAnimationFrame(gameLoop);

})();
