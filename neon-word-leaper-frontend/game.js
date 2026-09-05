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
            caseSensitive: false,
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
            caseSensitive: false,
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
            caseSensitive: false,
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
        },
        4: {
            name: "Title Case Protocol",
            targetWords: 15,
            caseSensitive: true,
            pool: [
                "Apple", "Matrix", "Cyber", "Quantum", "Neon", "Voltage", "Galaxy", "Shadow",
                "Laser", "Pulse", "Runner", "Titan", "Beacon", "Circuit", "Shield", "Rocket",
                "Plasma", "Velocity", "Cosmos", "Engine", "Future", "System", "Network", "Vector",
                "Digital", "Gravity", "Stream", "Horizon", "Dynamic", "Reflex", "Orbital", "Vortex"
            ],
            theme: {
                primary: "#8b5cf6",
                secondary: "#ec4899",
                scarf: "#a78bfa",
                skyTop: "#0f051d",
                skyMid: "#1e0b38",
                skyBot: "#090214"
            }
        },
        5: {
            name: "Sentence Overdrive",
            targetWords: 10,
            caseSensitive: true,
            pool: [
                "This is a boy",
                "The cyber runner leaps",
                "Code powers the future",
                "Master the neon skyline",
                "Type fast to survive",
                "Speed and precision win",
                "A quick leap saves you",
                "Jump through neon rain",
                "Run across skyscrapers",
                "Defy gravity with speed",
                "Never miss a single step",
                "Keep your focus sharp",
                "Sprint towards victory",
                "The future is now"
            ],
            theme: {
                primary: "#ef4444",
                secondary: "#f97316",
                scarf: "#fb923c",
                skyTop: "#1a0505",
                skyMid: "#2e0b0b",
                skyBot: "#0d0202"
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
                // Layer 1: Sub-bass takeoff thump
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(160, now);
                subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.3);
                subGain.gain.setValueAtTime(0.25, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.3);

                // Layer 2: High-energy cyber thruster whoosh
                const thrusterOsc = this.ctx.createOscillator();
                const thrusterGain = this.ctx.createGain();
                thrusterOsc.type = 'sawtooth';
                thrusterOsc.frequency.setValueAtTime(260, now);
                thrusterOsc.frequency.exponentialRampToValueAtTime(850, now + 0.45);
                thrusterGain.gain.setValueAtTime(0.12, now);
                thrusterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
                thrusterOsc.connect(thrusterGain);
                thrusterGain.connect(this.ctx.destination);
                thrusterOsc.start(now);
                thrusterOsc.stop(now + 0.45);
            } catch (e) {}
        }

        playLand() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                // Heavy metallic/cyber impact
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } catch (e) {}
        }

        playMistake() {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.28);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
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
    let cameraZoom = 1.0;
    let targetCameraZoom = 1.0;
    let cameraRoll = 0;
    let targetCameraRoll = 0;

    let walls = [];
    let currentWallIndex = 0;

    // Ultra-Realistic Articulated Cyber Hero Model
    const runner = {
        x: 150,
        y: 0,
        width: 48,
        height: 72,
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
        visorPulse: 0,
        trail: [],
        scarf: [
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 }
        ]
    };

    let shockwaves = [];
    let sonicRings = [];
    let speedLines = [];
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

        draw(ctx) {
            const screenX = this.x;
            const screenY = this.topY;

            ctx.save();

            // Skyscraper Wall Base Gradient with 3D Depth
            const grad = ctx.createLinearGradient(screenX, screenY, screenX + this.width, screenY);
            grad.addColorStop(0, '#0a0f1d');
            grad.addColorStop(0.5, '#131d33');
            grad.addColorStop(1, '#080c17');
            ctx.fillStyle = grad;
            ctx.fillRect(screenX, screenY, this.width, height * 2);

            // Wall Edge Shading
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(screenX, screenY, 8, height * 2);
            ctx.fillRect(screenX + this.width - 8, screenY, 8, height * 2);

            // Glowing Neon Top Platform Surface
            const topGrad = ctx.createLinearGradient(screenX, screenY, screenX + this.width, screenY);
            topGrad.addColorStop(0, '#ffffff');
            topGrad.addColorStop(0.3, this.color);
            topGrad.addColorStop(0.7, this.color);
            topGrad.addColorStop(1, '#ffffff');
            ctx.fillStyle = topGrad;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
            ctx.fillRect(screenX, screenY, this.width, 10);

            // High-Tech Platform Grip Pads
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            for (let px = screenX + 16; px < screenX + this.width - 16; px += 24) {
                ctx.fillRect(px, screenY + 2, 14, 6);
            }

            // Wall Neon Edge Borders
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(screenX, screenY, this.width, height * 2);

            // Tech Circuit Grid & Hazard Warning Marks
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let cy = screenY + 32; cy < screenY + 450; cy += 36) {
                ctx.beginPath();
                ctx.moveTo(screenX + 8, cy);
                ctx.lineTo(screenX + this.width - 8, cy);
                ctx.stroke();
            }

            // Platform Number Hologram Plate
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = 'bold 13px "Share Tech Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`ZONE // 0${this.index + 1}`, screenX + this.width / 2, screenY + 34);

            ctx.restore();
        }
    }

    function isMobileDevice() {
        return width <= 768 || window.innerHeight < 600 || ('ontouchstart' in window);
    }

    function getIdealRunnerScreenY() {
        // On mobile devices, position runner in upper-middle (36% of viewport height) so it stays completely above virtual keyboards
        return isMobileDevice() ? height * 0.36 : height * 0.52;
    }

    function getIdealJumpArcHeight() {
        return isMobileDevice() ? 105 : 170;
    }

    function initWalls() {
        walls = [];
        let currentX = 120;
        const groundY = height * 0.65;
        const stageTheme = STAGE_CONFIGS[currentStage].theme;

        for (let i = 0; i < 20; i++) {
            const wallW = 160 + Math.random() * 40;
            const wallTopY = groundY + (Math.sin(i * 0.8) * 35);
            walls.push(new Wall(i, currentX, wallW, wallTopY, stageTheme));
            const gap = 220 + Math.random() * 80;
            currentX += wallW + gap;
        }

        currentWallIndex = 0;
        runner.x = walls[0].x + walls[0].width / 2;
        runner.y = walls[0].topY;
        cameraX = runner.x - width * 0.35;
        targetCameraX = cameraX;
        cameraY = runner.y - getIdealRunnerScreenY();
        targetCameraY = cameraY;
        cameraZoom = 1.0;
        targetCameraZoom = 1.0;
        cameraRoll = 0;
        targetCameraRoll = 0;

        // Initialize scarf nodes
        for (let i = 0; i < runner.scarf.length; i++) {
            runner.scarf[i].x = runner.x - i * 8;
            runner.scarf[i].y = runner.y - 45;
            runner.scarf[i].vx = 0;
            runner.scarf[i].vy = 0;
        }
    }

    function spawnNextWallIfNeeded() {
        if (currentWallIndex >= walls.length - 6) {
            const lastWall = walls[walls.length - 1];
            const i = lastWall.index + 1;
            const gap = 220 + Math.random() * 90;
            const nextX = lastWall.x + lastWall.width + gap;
            const wallW = 160 + Math.random() * 40;
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
        wordTimeLimit = currentStage >= 5 ? 30.0 : 20.0;

        updateWordDisplay();
        updateStageProgressHUD();
    }

    function updateWordDisplay() {
        const wordDisplay = document.getElementById('targetWordDisplay');
        const typedSpan = document.querySelector('#targetWordDisplay .typed');
        const currSpan = document.querySelector('#targetWordDisplay .current-letter');
        const remSpan = document.querySelector('#targetWordDisplay .remaining');

        const typed = targetWord.substring(0, typedIndex);
        const current = targetWord.charAt(typedIndex);
        const remaining = targetWord.substring(typedIndex + 1);

        typedSpan.innerText = typed;

        if (current === ' ') {
            currSpan.className = 'current-letter is-space';
            currSpan.innerText = '␣';
        } else {
            currSpan.className = 'current-letter';
            currSpan.innerText = current;
        }

        remSpan.innerText = remaining;

        // Dynamic font sizing for long phrases/sentences
        if (targetWord.length > 22) {
            wordDisplay.style.fontSize = '1.45rem';
            wordDisplay.style.letterSpacing = '1px';
        } else if (targetWord.length > 13) {
            wordDisplay.style.fontSize = '1.75rem';
            wordDisplay.style.letterSpacing = '2px';
        } else {
            wordDisplay.style.fontSize = '2.1rem';
            wordDisplay.style.letterSpacing = '3px';
        }

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
        const unit = currentStage >= 5 ? 'Lines' : 'Words';
        document.getElementById('stageWordCount').innerText = `${stageWordsCompleted}/${cfg.targetWords} ${unit}`;
        const pct = Math.min(100, (stageWordsCompleted / cfg.targetWords) * 100);
        document.getElementById('stageFill').style.width = `${pct}%`;
    }

    function handleTypingInput(char) {
        if (gameState !== 'PLAYING') return;

        totalKeystrokes++;
        const expectedChar = targetWord.charAt(typedIndex);
        const cfg = STAGE_CONFIGS[currentStage];
        const isCaseSensitive = !!cfg.caseSensitive;

        const isMatch = isCaseSensitive ? (char === expectedChar) : (char.toUpperCase() === expectedChar.toUpperCase());

        if (isMatch) {
            correctKeystrokes++;
            typedIndex++;
            sound.playKeyClick();
            createSparks(runner.x, runner.y - 35, cfg.theme.primary, 8);

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

        // Launch cinematic blockbuster acrobatic leap!
        gameState = 'JUMPING';
        sound.playJump();

        runner.state = 'JUMPING';
        runner.jumpProgress = 0;
        runner.startX = currentWall.x + currentWall.width - 25;
        runner.startY = currentWall.topY;
        runner.targetX = nextWall.x + 45;
        runner.targetY = nextWall.topY;

        // Takeoff supersonic sonic ring + thruster burst
        createSonicRing(runner.startX, runner.startY, STAGE_CONFIGS[currentStage].theme.primary);
        createThrusterBurst(runner.startX, runner.startY - 10, STAGE_CONFIGS[currentStage].theme.primary, 35);
        screenShake = 6;

        // Spawn cinematic speed lines
        spawnSpeedLines();

        // Check if stage goal is completed
        const targetReq = STAGE_CONFIGS[currentStage].targetWords;
        if (stageWordsCompleted >= targetReq) {
            gameState = 'STAGE_COMPLETE';
            setTimeout(() => {
                triggerStageComplete();
            }, 900);
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

        screenShake = 14;
        createSparks(runner.x, runner.y - 30, '#ef4444', 26);

        lives--;
        updateLivesHUD();

        gameState = 'FALLING';
        runner.state = 'FALLING';
        runner.vx = 2.4;
        runner.vy = -3.8;
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
    // 6. RUNNER PHYSICS, CINEMATIC CAMERA, SONIC RINGS & PARTICLES
    // -------------------------------------------------------------------------
    function createThrusterBurst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI * 0.75 + Math.random() * Math.PI * 0.5;
            const speed = 5 + Math.random() * 9;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 2,
                color: color,
                size: 3.5 + Math.random() * 4,
                life: 1.0,
                decay: 2.2 + Math.random() * 2
            });
        }
    }

    function createSonicRing(x, y, color) {
        sonicRings.push({
            x: x,
            y: y,
            radius: 8,
            maxRadius: 85,
            color: color,
            alpha: 1.0,
            lineWidth: 4
        });
    }

    function createShockwave(x, y, color) {
        shockwaves.push({
            x: x,
            y: y,
            radius: 6,
            maxRadius: 80,
            color: color,
            alpha: 1.0
        });
    }

    function spawnSpeedLines() {
        speedLines = [];
        for (let i = 0; i < 18; i++) {
            speedLines.push({
                x: Math.random() * width,
                y: Math.random() * height,
                length: 120 + Math.random() * 200,
                speed: 800 + Math.random() * 600,
                alpha: 0.15 + Math.random() * 0.35
            });
        }
    }

    function updateRunner(dt) {
        runner.breathTime += dt * 3.5;
        runner.visorPulse += dt * 5;

        // Scarf / Cape Multi-Node Cloth Simulation
        const neckX = runner.x - Math.cos(runner.angle) * 12;
        const neckY = runner.y - 48 - Math.sin(runner.angle) * 12;
        runner.scarf[0].x = neckX;
        runner.scarf[0].y = neckY;

        for (let i = 1; i < runner.scarf.length; i++) {
            const node = runner.scarf[i];
            const prev = runner.scarf[i - 1];

            // Wind & gravity forces
            let windX = -25 - Math.abs(runner.vx) * 8;
            let windY = 12 + Math.sin(runner.breathTime * 2 + i * 0.8) * 8;
            if (runner.state === 'JUMPING') {
                windX = -Math.cos(runner.angle) * 60 - 40;
                windY = -Math.sin(runner.angle) * 40 - 20;
            }

            node.vx += (windX - node.vx) * dt * 8;
            node.vy += (windY - node.vy) * dt * 8;
            node.x += node.vx * dt;
            node.y += node.vy * dt;

            // Distance constraint to previous node
            const dx = node.x - prev.x;
            const dy = node.y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetDist = 9;
            if (dist > targetDist) {
                const angle = Math.atan2(dy, dx);
                node.x = prev.x + Math.cos(angle) * targetDist;
                node.y = prev.y + Math.sin(angle) * targetDist;
            }
        }

        // Motion Trails (Holographic Echo Clones)
        if (runner.state === 'JUMPING' || runner.state === 'FALLING') {
            runner.trail.push({
                x: runner.x,
                y: runner.y,
                alpha: 0.7,
                angle: runner.angle,
                color: runner.state === 'JUMPING' ? STAGE_CONFIGS[currentStage].theme.primary : '#ef4444'
            });

            // Mid-air dual thruster exhaust particles
            if (runner.state === 'JUMPING') {
                const bootBackAngle = runner.angle + Math.PI * 0.9;
                const bx = runner.x + Math.cos(bootBackAngle) * 22;
                const by = runner.y + Math.sin(bootBackAngle) * 22;
                particles.push({
                    x: bx + (Math.random() - 0.5) * 6,
                    y: by + (Math.random() - 0.5) * 6,
                    vx: -Math.cos(runner.angle) * (5 + Math.random() * 4) + (Math.random() - 0.5) * 2,
                    vy: -Math.sin(runner.angle) * (5 + Math.random() * 4) + (Math.random() - 0.5) * 2,
                    color: STAGE_CONFIGS[currentStage].theme.primary,
                    size: 3.5 + Math.random() * 3,
                    life: 0.7,
                    decay: 3.2
                });
            }
        }

        for (let i = runner.trail.length - 1; i >= 0; i--) {
            runner.trail[i].alpha -= dt * 3.2;
            if (runner.trail[i].alpha <= 0) {
                runner.trail.splice(i, 1);
            }
        }

        // --- JUMPING STATE ---
        if (runner.state === 'JUMPING') {
            // Apex Bullet-Time / Time-Dilation
            let stepRate = 1.25;
            if (runner.jumpProgress >= 0.35 && runner.jumpProgress <= 0.65) {
                stepRate = 0.82; // Cinematic slow-mo at peak
            }
            runner.jumpProgress += dt * stepRate;

            if (runner.jumpProgress >= 1.0) {
                runner.jumpProgress = 1.0;
                runner.state = 'LANDING';
                runner.landingTimer = 0.22;
                currentWallIndex++;
                spawnNextWallIfNeeded();

                const landWall = walls[currentWallIndex];
                runner.x = landWall.x + 45;
                runner.y = landWall.topY;
                runner.angle = 0;

                sound.playLand();
                screenShake = 11;
                createSonicRing(runner.x, runner.y, STAGE_CONFIGS[currentStage].theme.primary);
                createShockwave(runner.x, runner.y, STAGE_CONFIGS[currentStage].theme.primary);
                createSparks(runner.x, runner.y, STAGE_CONFIGS[currentStage].theme.primary, 32);

                targetCameraX = runner.x - width * 0.35;
                targetCameraY = runner.y - getIdealRunnerScreenY();
                targetCameraZoom = 1.0;
                targetCameraRoll = 0;
                speedLines = [];

                if (gameState !== 'STAGE_COMPLETE') {
                    gameState = 'PLAYING';
                    setNextWord(false);
                }
            } else {
                const p = runner.jumpProgress;
                runner.x = runner.startX + (runner.targetX - runner.startX) * p;

                // Parabolic Jump Arc with dynamic responsive height
                const arcH = getIdealJumpArcHeight();
                const heightOffset = 4 * arcH * p * (1 - p);
                const linearY = runner.startY + (runner.targetY - runner.startY) * p;
                runner.y = linearY - heightOffset;

                // 3-Phase Kinematic Acrobatic Rotation
                runner.angle = p * Math.PI * 2;

                // Cinematic Dynamic Camera: Follow runner and peak altitude cleanly
                targetCameraX = runner.x - width * 0.35;
                targetCameraY = runner.y - getIdealRunnerScreenY() - heightOffset * 0.22;
                targetCameraZoom = 1.0 + Math.sin(p * Math.PI) * (isMobileDevice() ? 0.08 : 0.14);
                targetCameraRoll = Math.sin(p * Math.PI * 2) * 0.03;
            }
        } else if (runner.state === 'LANDING') {
            runner.landingTimer -= dt;
            targetCameraZoom = 1.0;
            targetCameraRoll = 0;
            targetCameraY = runner.y - getIdealRunnerScreenY();
            if (runner.landingTimer <= 0) {
                runner.state = 'IDLE';
            }
        } else if (runner.state === 'FALLING') {
            runner.x += runner.vx;
            runner.y += runner.vy;
            runner.vy += 26 * dt;
            runner.angle += 8 * dt;
            targetCameraZoom = 0.95;

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
            targetCameraY = runner.y - getIdealRunnerScreenY();
            if (runner.respawnTimer <= 0) {
                runner.state = 'IDLE';
                gameState = 'PLAYING';
            }
        } else if (runner.state === 'IDLE') {
            targetCameraZoom = 1.0;
            targetCameraRoll = 0;
            targetCameraX = runner.x - width * 0.35;
            targetCameraY = runner.y - getIdealRunnerScreenY();
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

        createSonicRing(runner.x, runner.y - 20, STAGE_CONFIGS[currentStage].theme.primary);
        createSparks(runner.x, runner.y - 25, STAGE_CONFIGS[currentStage].theme.primary, 30);
        screenShake = 8;
        targetCameraY = runner.y - getIdealRunnerScreenY();
        targetCameraZoom = 1.0;
        targetCameraRoll = 0;

        // Reset scarf
        for (let i = 0; i < runner.scarf.length; i++) {
            runner.scarf[i].x = runner.x - i * 8;
            runner.scarf[i].y = runner.y - 45;
        }

        setNextWord(true);
    }

    function createSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 7;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: color,
                size: 2.5 + Math.random() * 3.5,
                life: 1.0,
                decay: 2.0 + Math.random() * 2
            });
        }
    }

    function updateParticles(dt) {
        // Sonic rings
        for (let i = sonicRings.length - 1; i >= 0; i--) {
            const r = sonicRings[i];
            r.radius += dt * 180;
            r.alpha -= dt * 2.6;
            if (r.alpha <= 0 || r.radius >= r.maxRadius) {
                sonicRings.splice(i, 1);
            }
        }

        // Shockwaves
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const s = shockwaves[i];
            s.radius += dt * 150;
            s.alpha -= dt * 2.8;
            if (s.alpha <= 0 || s.radius >= s.maxRadius) {
                shockwaves.splice(i, 1);
            }
        }

        // Speed lines
        for (const line of speedLines) {
            line.x -= line.speed * dt;
            if (line.x < -line.length) {
                line.x = width + 50;
                line.y = Math.random() * height;
            }
        }

        // Sparks
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

        // Hover cars
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

        // Embers
        for (const e of embers) {
            e.y += e.vy * dt;
            e.x += e.vx * dt;
            if (e.y < -20) {
                e.y = height + 20;
                e.x = Math.random() * width;
            }
        }
    }

    function drawParticles(ctx) {
        ctx.save();

        // Draw Sonic Rings
        for (const r of sonicRings) {
            ctx.save();
            ctx.strokeStyle = r.color;
            ctx.shadowColor = r.color;
            ctx.shadowBlur = 18;
            ctx.lineWidth = r.lineWidth;
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.38, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Shockwaves
        for (const s of shockwaves) {
            ctx.save();
            ctx.strokeStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 15;
            ctx.lineWidth = 3;
            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Sparks
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawSpeedLines(ctx) {
        if (speedLines.length === 0) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        for (const l of speedLines) {
            ctx.globalAlpha = l.alpha;
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.x + l.length, l.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 7. ULTRA-REALISTIC ARTICULATED CYBERPARKOUR HERO DRAWING
    // -------------------------------------------------------------------------
    function drawRunner(ctx) {
        if (runner.state === 'DEAD') return;

        const stageTheme = STAGE_CONFIGS[currentStage].theme;

        // 1. Motion Trail Holographic Silhouettes
        for (let i = 0; i < runner.trail.length; i++) {
            const t = runner.trail[i];
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.angle);
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 16;
            ctx.globalAlpha = t.alpha * 0.35;
            // Ghost body silhouette
            ctx.beginPath();
            ctx.roundRect(-14, -62, 28, 54, 8);
            ctx.fill();
            ctx.restore();
        }

        // 2. Multi-Node Cloth Simulation Scarf (Dynamic Flowing Wave Ribbon)
        ctx.save();
        ctx.strokeStyle = stageTheme.scarf;
        ctx.shadowColor = stageTheme.scarf;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(runner.scarf[0].x, runner.scarf[0].y);
        for (let i = 1; i < runner.scarf.length; i++) {
            const xc = (runner.scarf[i].x + runner.scarf[i - 1].x) / 2;
            const yc = (runner.scarf[i].y + runner.scarf[i - 1].y) / 2;
            ctx.quadraticCurveTo(runner.scarf[i - 1].x, runner.scarf[i - 1].y, xc, yc);
        }
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(runner.x, runner.y);

        if (runner.state === 'RESPAWNING') {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
        }

        // Kinematic Stance Offsets
        let crouchY = 0;
        let legSpread = 0;
        let breathOffset = Math.sin(runner.breathTime) * 1.8;

        if (runner.state === 'LANDING') {
            // Superhero 3-point impact crouch
            crouchY = 16;
            legSpread = 12;
            breathOffset = 0;
        } else if (runner.state === 'IDLE') {
            // Tactical ready crouch
            crouchY = 2;
            legSpread = 3;
        }

        ctx.rotate(runner.angle);

        // --- CYBER-KATANA / ENERGY BLADE ON BACK ---
        ctx.save();
        ctx.rotate(-0.45);
        // Scabbard / Blade Spine
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -65 + crouchY, 5, 46);
        // Glowing Plasma Edge
        ctx.fillStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 12;
        ctx.fillRect(-7, -65 + crouchY, 2, 46);
        // Katana Hilt
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, -75 + crouchY, 8, 10);
        ctx.restore();

        // --- JETPACK & DUAL ION THRUSTERS ---
        ctx.save();
        const packGrad = ctx.createLinearGradient(-18, -50, 0, -20);
        packGrad.addColorStop(0, '#334155');
        packGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = packGrad;
        ctx.strokeStyle = stageTheme.primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-20, -52 + crouchY, 12, 26, 3);
        ctx.fill();
        ctx.stroke();

        // Thruster Exhaust Plumes in Mid-Air or Takeoff
        if (runner.state === 'JUMPING' || runner.state === 'FALLING') {
            // Dual rocket plasma flames
            const flameLen = 22 + Math.random() * 14;
            const flameGrad = ctx.createLinearGradient(-14, -26 + crouchY, -14, -26 + crouchY + flameLen);
            flameGrad.addColorStop(0, '#ffffff');
            flameGrad.addColorStop(0.3, stageTheme.primary);
            flameGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = flameGrad;
            ctx.shadowColor = stageTheme.primary;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.moveTo(-18, -26 + crouchY);
            ctx.lineTo(-14, -26 + crouchY + flameLen);
            ctx.lineTo(-10, -26 + crouchY);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // --- ARTICULATED LEGS & HIGH-TECH MAGNETIC BOOTS ---
        ctx.save();
        // Left Leg (Back Leg)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, -22 + crouchY);
        ctx.lineTo(-10 - legSpread, -10 + crouchY * 0.6);
        ctx.lineTo(-12 - legSpread, 0);
        ctx.stroke();

        // Right Leg (Front Leg)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.moveTo(6, -22 + crouchY);
        ctx.lineTo(10 + legSpread, -10 + crouchY * 0.6);
        ctx.lineTo(12 + legSpread, 0);
        ctx.stroke();

        // Metallic Armor Knee-Pads with Specular Bevel
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = stageTheme.secondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-10 - legSpread, -10 + crouchY * 0.6, 5, 0, Math.PI * 2);
        ctx.arc(10 + legSpread, -10 + crouchY * 0.6, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Magnetic Power Boots with Glowing Soles
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-18 - legSpread, -4, 12, 6);
        ctx.fillRect(6 + legSpread, -4, 14, 6);

        // Glowing Boot Sole Lights
        ctx.fillStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 10;
        ctx.fillRect(-17 - legSpread, 0, 10, 2.5);
        ctx.fillRect(7 + legSpread, 0, 12, 2.5);
        ctx.restore();

        // --- TORSO & 3D LAYERED CYBER ARMOR ---
        ctx.save();
        // Base suit
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-12, -52 + crouchY + breathOffset, 24, 32, 6);
        ctx.fill();

        // Metallic Chest Armor Plates with Gradient
        const chestGrad = ctx.createLinearGradient(-12, -52, 12, -26);
        chestGrad.addColorStop(0, '#334155');
        chestGrad.addColorStop(0.5, '#1e293b');
        chestGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = chestGrad;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-11, -50 + crouchY + breathOffset, 22, 18, 4);
        ctx.fill();
        ctx.stroke();

        // Glowing Arc Reactor Core with Rotating Holographic Ring
        ctx.save();
        ctx.fillStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, -38 + crouchY + breathOffset, 5, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Core Energy Aperture
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -38 + crouchY + breathOffset, 2.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Segmented Abdominal Armor Plates
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -30 + crouchY + breathOffset, 16, 3);
        ctx.fillRect(-7, -25 + crouchY + breathOffset, 14, 3);

        // Utility Belt with Glowing Energy Cells
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-11, -21 + crouchY + breathOffset, 22, 4);
        ctx.fillStyle = stageTheme.secondary;
        ctx.shadowColor = stageTheme.secondary;
        ctx.shadowBlur = 8;
        ctx.fillRect(-7, -20.5 + crouchY + breathOffset, 3, 3);
        ctx.fillRect(4, -20.5 + crouchY + breathOffset, 3, 3);
        ctx.restore();

        // --- ARTICULATED ARMS & CYBER GAUNTLETS ---
        ctx.save();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (runner.state === 'JUMPING') {
            // Aerodynamic forward dive Superman/Ninja pose
            // Left Arm
            ctx.beginPath();
            ctx.moveTo(-10, -46 + crouchY);
            ctx.lineTo(-24, -32);
            ctx.lineTo(-30, -22);
            ctx.stroke();
            // Right Arm
            ctx.beginPath();
            ctx.moveTo(10, -46 + crouchY);
            ctx.lineTo(24, -58);
            ctx.lineTo(34, -68);
            ctx.stroke();
        } else if (runner.state === 'LANDING') {
            // Superhero 3-point landing: Right fist touching ground
            ctx.beginPath();
            ctx.moveTo(-10, -46 + crouchY);
            ctx.lineTo(-20, -30 + crouchY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, -46 + crouchY);
            ctx.lineTo(16, -20 + crouchY);
            ctx.lineTo(14, 0);
            ctx.stroke();
        } else {
            // Tactical ready stance
            ctx.beginPath();
            ctx.moveTo(-10, -46 + crouchY + breathOffset);
            ctx.lineTo(-18, -34 + crouchY);
            ctx.lineTo(-14, -22 + crouchY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, -46 + crouchY + breathOffset);
            ctx.lineTo(18, -34 + crouchY);
            ctx.lineTo(14, -22 + crouchY);
            ctx.stroke();
        }

        // Gauntlet Holographic Wrist Displays
        ctx.fillStyle = stageTheme.primary;
        ctx.shadowColor = stageTheme.primary;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-14, -24 + crouchY, 2.5, 0, Math.PI * 2);
        ctx.arc(14, -24 + crouchY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- HELMET, CYBER VISOR & ANAMORPHIC LENS FLARE ---
        ctx.save();
        // Aerodynamic Helmet Outer Shell
        const helmGrad = ctx.createLinearGradient(-10, -70, 10, -50);
        helmGrad.addColorStop(0, '#475569');
        helmGrad.addColorStop(0.5, '#1e293b');
        helmGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = helmGrad;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -60 + crouchY + breathOffset, 12, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Curved Glowing Cyber Visor
        const visorGrad = ctx.createLinearGradient(-2, -62, 12, -58);
        visorGrad.addColorStop(0, '#ffffff');
        visorGrad.addColorStop(0.3, stageTheme.secondary);
        visorGrad.addColorStop(1, stageTheme.primary);
        ctx.fillStyle = visorGrad;
        ctx.shadowColor = stageTheme.secondary;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(-2, -63 + crouchY + breathOffset, 14, 7, 3);
        ctx.fill();

        // Anamorphic Visor Reflection Streak (Glass Sheen)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.roundRect(0, -62.5 + crouchY + breathOffset, 9, 2, 1);
        ctx.fill();

        // Tactical Ear Antenna
        ctx.strokeStyle = stageTheme.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -63 + crouchY + breathOffset);
        ctx.lineTo(-14, -72 + crouchY + breathOffset);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 8. HIGH-JUICE CYBERPUNK SKYLINE WALLPAPER
    // -------------------------------------------------------------------------
    function drawBackground(ctx) {
        const stageTheme = STAGE_CONFIGS[currentStage].theme;

        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, stageTheme.skyTop);
        bgGrad.addColorStop(0.55, stageTheme.skyMid);
        bgGrad.addColorStop(1, stageTheme.skyBot);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-width, -height, width * 3, height * 3);

        // Distant Flying Hover-Cars (Layer 1)
        for (const car of hoverCars.filter(c => c.layer === 1)) {
            ctx.fillStyle = car.color;
            ctx.shadowColor = car.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(car.x, car.y, car.length, 3);
        }

        // Distant Mega-Skyscrapers (Parallax Layer 1)
        ctx.fillStyle = 'rgba(20, 30, 50, 0.45)';
        for (let x = -400; x < width * 2; x += 90) {
            const h = 220 + Math.sin(x * 0.04) * 80;
            ctx.fillRect(x, height * 0.65 - h, 70, h);
        }

        // Midground Cyber Skyline with Holographic Billboards (Parallax Layer 2)
        ctx.fillStyle = 'rgba(12, 18, 35, 0.78)';
        for (let x = -400; x < width * 2; x += 160) {
            const h = 280 + Math.cos(x * 0.035) * 95;
            ctx.fillRect(x, height * 0.65 - h, 130, h);

            // Windows Matrix
            ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
            for (let wy = height * 0.65 - h + 25; wy < height * 0.65 - 20; wy += 28) {
                ctx.fillRect(x + 15, wy, 9, 14);
                ctx.fillRect(x + 55, wy, 9, 14);
                ctx.fillRect(x + 95, wy, 9, 14);
            }
            ctx.fillStyle = 'rgba(12, 18, 35, 0.78)';
        }

        // Midground Hover-Cars (Layer 2)
        for (const car of hoverCars.filter(c => c.layer === 2)) {
            ctx.fillStyle = car.color;
            ctx.shadowColor = car.color;
            ctx.shadowBlur = 14;
            ctx.fillRect(car.x, car.y, car.length + 14, 4.5);
        }

        // Floating Cyber Grid Horizon
        ctx.strokeStyle = `${stageTheme.primary}25`;
        ctx.lineWidth = 1;
        const gridY = height * 0.72;
        for (let x = -width; x < width * 2; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo((x - width / 2) * 2.4 + width / 2, height * 1.5);
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

        // Smooth Action Camera Tracking with Zoom & Roll
        cameraX += (targetCameraX - cameraX) * (1 - Math.pow(0.001, dt));
        cameraY += (targetCameraY - cameraY) * (1 - Math.pow(0.001, dt));
        cameraZoom += (targetCameraZoom - cameraZoom) * (1 - Math.pow(0.0005, dt));
        cameraRoll += (targetCameraRoll - cameraRoll) * (1 - Math.pow(0.001, dt));

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

        // --- RENDER PIPELINE WITH CINEMATIC ACTION CAMERA TRANSFORM ---
        ctx.save();

        // Screen Shake
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            ctx.translate(shakeX, shakeY);
        }

        // Background (Parallax space)
        ctx.save();
        ctx.translate(-cameraX * 0.1, -cameraY * 0.1);
        drawBackground(ctx);
        ctx.restore();

        // Speed Lines (Screen space)
        drawSpeedLines(ctx);

        // World-Space Camera View (Zoom & Roll Centered on Screen)
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(cameraRoll);
        ctx.scale(cameraZoom, cameraZoom);
        ctx.translate(-width / 2, -height / 2);
        ctx.translate(-cameraX, -cameraY);

        for (const wall of walls) {
            wall.draw(ctx);
        }

        drawRunner(ctx);
        drawParticles(ctx);

        ctx.restore();

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
        if (currentStage >= 5) {
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
        function focusMobileKeyboard() {
            if (mobileInput) {
                mobileInput.focus();
            }
        }

        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            targetCameraY = runner.y - getIdealRunnerScreenY();
            targetCameraX = runner.x - width * 0.35;
        });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                targetCameraY = runner.y - getIdealRunnerScreenY();
            });
        }

        document.getElementById('game-container').addEventListener('click', () => {
            window.focus();
            if (gameState === 'PLAYING') {
                focusMobileKeyboard();
            }
        });

        canvas.addEventListener('touchstart', () => {
            if (gameState === 'PLAYING') {
                focusMobileKeyboard();
            }
        }, { passive: true });

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
                    const nextStage = currentStage >= 5 ? 1 : currentStage + 1;
                    startGame(nextStage);
                }
                return;
            }

            if (gameState === 'PLAYING') {
                if (e.key === 'Escape') {
                    togglePause();
                    return;
                }

                // Handle all printable characters (letters, numbers, space, punctuation)
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
            const nextStage = currentStage >= 5 ? 1 : currentStage + 1;
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
                focusMobileKeyboard();
            });

            mobileInput.addEventListener('beforeinput', (e) => {
                if (e.data && e.data.length === 1) {
                    e.preventDefault();
                    handleTypingInput(e.data);
                }
            });

            mobileInput.addEventListener('input', (e) => {
                if (e.target.value) {
                    const char = e.target.value.slice(-1);
                    e.target.value = '';
                    handleTypingInput(char);
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
