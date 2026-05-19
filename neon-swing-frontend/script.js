/* ==========================================================================
   NEON SWING GAME ENGINE - FIXED VERSION
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. WEB AUDIO SYNTHESIZER MANAGER
// --------------------------------------------------------------------------
class AudioSynthManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.synthInterval = null;
        this.musicStep = 0;
        this.bassNotes = [55.0, 55.0, 65.41, 65.41, 73.42, 73.42, 82.41, 82.41];
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
            this.startBackgroundMusic();
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            if (this.ctx) this.ctx.suspend();
        } else {
            this.init();
            if (this.ctx) this.ctx.resume();
        }
        return this.isMuted;
    }

    startBackgroundMusic() {
        this.stopBackgroundMusic();
        // NEW MUSIC: Softer ambient neon pulse — calmer feel
        this.musicStep = 0;
        // Pentatonic scale — more melodic and less harsh
        this.bassNotes = [130.81, 146.83, 164.81, 196.00, 220.00, 196.00, 164.81, 146.83];
        
        this.synthInterval = setInterval(() => {
            if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
            const now = this.ctx.currentTime;

            // Soft ambient pad — sine wave, very low volume
            const padOsc = this.ctx.createOscillator();
            const padGain = this.ctx.createGain();
            padOsc.type = 'sine';
            padOsc.frequency.setValueAtTime(this.bassNotes[this.musicStep % this.bassNotes.length], now);
            padGain.gain.setValueAtTime(0.06, now);
            padGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            padOsc.connect(padGain);
            padGain.connect(this.ctx.destination);
            padOsc.start(now);
            padOsc.stop(now + 0.5);

            // Subtle high note every 4 beats — sparkle effect
            if (this.musicStep % 4 === 0) {
                const sparkOsc = this.ctx.createOscillator();
                const sparkGain = this.ctx.createGain();
                sparkOsc.type = 'sine';
                sparkOsc.frequency.setValueAtTime(this.bassNotes[this.musicStep % this.bassNotes.length] * 3, now);
                sparkGain.gain.setValueAtTime(0.03, now);
                sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                sparkOsc.connect(sparkGain);
                sparkGain.connect(this.ctx.destination);
                sparkOsc.start(now);
                sparkOsc.stop(now + 0.35);
            }

            this.musicStep++;
        }, 400); // Slower tempo — more relaxed
    }

    stopBackgroundMusic() {
        if (this.synthInterval) {
            clearInterval(this.synthInterval);
            this.synthInterval = null;
        }
    }

    playAttachSFX() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playCoinSFX() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now);
        osc1.frequency.setValueAtTime(1318.51, now + 0.06);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1975.53, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
    }

    playBuzzSFX() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
    }
}

const synth = new AudioSynthManager();

// --------------------------------------------------------------------------
// 2. PROCEDURAL LEVEL ASSETS CLASSES
// --------------------------------------------------------------------------

class Anchor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 14; // slightly bigger for easier grab
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += 5 * dt;
    }

    draw(ctx, isActive, isNext) {
        ctx.save();
        let color = '#00a8a8';
        let glow = 8;
        if (isActive) {
            color = '#ff2d78';
            glow = 15 + Math.sin(this.pulse) * 4;
        } else if (isNext) {
            color = '#ffff00';
            glow = 12 + Math.sin(this.pulse) * 3;
        }

        // FIX: Draw grab radius indicator for next anchor so player can see the target zone
        if (isNext) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 80, 0, Math.PI * 2); // grab radius visual
            ctx.strokeStyle = `rgba(255, 255, 0, 0.15)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 6 + Math.sin(this.pulse) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.collected = false;
        this.angle = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.angle += 3 * dt;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        ctx.beginPath();
        const w = this.radius * Math.sin(this.angle);
        ctx.ellipse(this.x, this.y, Math.abs(w) + 1, this.radius, 0, 0, Math.PI * 2);
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 18;
        this.height = 100;
        this.angle = 0;
        this.speed = 1.5 + Math.random() * 1.5;
        this.direction = 1;
        this.startY = y;
    }

    update(dt) {
        if (this.type === 'rotating_blade') {
            this.angle += this.speed * dt;
        } else if (this.type === 'moving_wall') {
            this.y += this.speed * 60 * this.direction * dt;
            if (Math.abs(this.y - this.startY) > 100) {
                this.direction *= -1;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ff4444';
        ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        ctx.lineWidth = 3;

        if (this.type === 'rotating_blade') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -60);
                ctx.lineTo(8, -40);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        } else if (this.type === 'moving_wall') {
            ctx.beginPath();
            ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.height / 2 + 5);
            ctx.lineTo(this.x, this.y + this.height / 2 - 5);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// --------------------------------------------------------------------------
// 3. MAIN GAME CORE ENGINE
// --------------------------------------------------------------------------
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.gravity = 750;
        this.scrollSpeed = 0;

        this.score = 0;
        this.coinScore = 0;
        this.bestScore = parseInt(localStorage.getItem('neonSwingBestScore')) || 0;
        this.gameState = 'START';
        this.timeElapsed = 0;
        this.lastTime = 0;
        this.worldDistance = 0;
        this.hintTimer = 0;
        this.lastDetachedAnchor = null;

        this.anchors = [];
        this.coins = [];
        this.obstacles = [];
        this.particles = [];

        this.player = {
            x: 150,
            y: 350,
            radius: 12,
            vx: 0,
            vy: 0,
            angle: 0,          // angle from anchor (pendulum angle)
            angularVel: 0.0,
            ropeLength: 0,
            attached: false,
            activeAnchor: null
        };

        // FIX 1: grabRadius increased to 80px (was 50)
        this.grabRadius = 80;
        // FIX 2: tapGrabRadius increased to 400px (was 250) so player can reach any visible anchor
        this.tapGrabRadius = 400;
        this.targetScreenX = 200;

        this.stars = [];
        this.initStars();
        this.bindEvents();
        this.resizeCanvas();
        this.updateHUD();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 0.5,
                speedMultiplier: Math.random() * 0.4 + 0.1
            });
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initStars();
        if (this.gameState === 'START' || this.gameState === 'PLAYING') {
            this.generateInitialLevel();
        }
    }

    generateInitialLevel() {
        this.anchors = [];
        this.coins = [];
        this.obstacles = [];
        this.particles = [];
        this.worldDistance = 0;
        this.coinScore = 0;
        this.hintTimer = 4.0;
        this.lastDetachedAnchor = null;
        this.scrollSpeed = 0;

        // FIX 3: First anchor positioned so player starts at 35deg offset for natural swing
        const startX = this.canvas.width * 0.22;
        const anchorY = 180;
        const ropeLen = 160;
        const startAngle = 0.6; // ~35 degrees offset — gives immediate swing momentum

        const a0 = new Anchor(startX, anchorY);
        this.anchors.push(a0);

        // Player starts offset from anchor — NOT directly below
        this.player.x = a0.x + Math.sin(startAngle) * ropeLen;
        this.player.y = a0.y + Math.cos(startAngle) * ropeLen;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.attached = true;
        this.player.activeAnchor = a0;
        this.player.ropeLength = ropeLen;
        this.player.angle = startAngle;
        // FIX 4: Initial angular velocity positive (swings toward center then other side)
        this.player.angularVel = -1.5;

        // FIX 5: Anchor spacing reduced — max 180px (was 360px) so player can always reach
        // Generate close anchors first (tutorial feel)
        this.anchors.push(new Anchor(a0.x + 160, 160));
        this.anchors.push(new Anchor(a0.x + 310, 180));
        this.spawnNextAnchors(5);
    }

    // FIX 6: Anchor spacing capped at 180px max for first 30 sec, grows slowly after
    spawnNextAnchors(count = 1) {
        for (let k = 0; k < count; k++) {
            const lastAnchor = this.anchors[this.anchors.length - 1];

            // Spacing starts small, grows slowly — always reachable
            const minSpacing = 140;
            const maxSpacing = Math.min(200, 140 + (this.timeElapsed * 0.8));
            const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);

            const nextX = lastAnchor.x + spacing;
            const minHeight = 120;
            const maxHeight = 260;
            const nextY = minHeight + Math.random() * (maxHeight - minHeight);

            const anchor = new Anchor(nextX, nextY);
            this.anchors.push(anchor);

            // Coins between anchors
            const midX = (lastAnchor.x + nextX) / 2;
            const midY = ((lastAnchor.y + nextY) / 2) + 60 + Math.random() * 40;
            this.coins.push(new Coin(midX, midY));
            if (Math.random() > 0.4) {
                this.coins.push(new Coin(midX - 30, midY - 15));
                this.coins.push(new Coin(midX + 30, midY - 15));
            }

            // Obstacles only after 30 seconds
            if (this.timeElapsed > 30 && Math.random() > 0.4) {
                let obstacleType = 'rotating_blade';
                if (this.timeElapsed > 60 && Math.random() > 0.5) {
                    obstacleType = 'moving_wall';
                }
                this.obstacles.push(new Obstacle(midX, midY + 50, obstacleType));
            }
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handlePlayerAction();
            }
        });

        const overlay = document.getElementById('interaction-overlay');
        overlay.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handlePlayerAction();
        });

        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handlePlayerAction();
        });

        document.getElementById('start-play-btn').addEventListener('click', () => this.startGame());
        document.getElementById('hud-pause-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePause();
        });
        document.getElementById('pause-resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('pause-restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('hud-sound-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const muted = synth.toggleMute();
            document.getElementById('hud-sound-btn').textContent = muted ? '🔇' : '🔊';
        });
        document.getElementById('go-retry-btn').addEventListener('click', () => this.restartGame());
    }

    attachToAnchor(anchor) {
        this.player.attached = true;
        this.player.activeAnchor = anchor;

        const dx = this.player.x - anchor.x;
        const dy = this.player.y - anchor.y;

        this.player.ropeLength = Math.max(80, Math.sqrt(dx * dx + dy * dy));
        this.player.angle = Math.atan2(dx, dy);

        // FIX 7: Correct angular velocity calculation from flight velocity
        // Project velocity onto tangential direction at current angle
        const tangentX = Math.cos(this.player.angle);
        const tangentY = -Math.sin(this.player.angle);
        const tangentialSpeed = this.player.vx * tangentX + this.player.vy * tangentY;
        this.player.angularVel = tangentialSpeed / this.player.ropeLength;

        // Ensure minimum swing so rope doesn't go dead
        if (Math.abs(this.player.angularVel) < 0.5) {
            this.player.angularVel = this.player.angularVel >= 0 ? 1.2 : -1.2;
        }

        this.player.vx = 0;
        this.player.vy = 0;

        synth.playAttachSFX();
    }

    handlePlayerAction() {
        if (this.gameState !== 'PLAYING') return;

        if (this.player.attached) {
            // === RELEASE rope ===
            const angle = this.player.angle;
            const vm = this.player.angularVel * this.player.ropeLength;

            // FIX 8: Correct velocity components on release
            // Tangential velocity: perpendicular to rope direction
            this.player.vx = vm * Math.cos(angle);
            this.player.vy = vm * -Math.sin(angle);

            // Ensure minimum launch speed so player actually flies toward next anchor
            const speed = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
            if (speed < 150) {
                const scale = 150 / Math.max(speed, 1);
                this.player.vx *= scale;
                this.player.vy *= scale;
            }

            this.lastDetachedAnchor = this.player.activeAnchor;
            this.player.attached = false;
            this.player.activeAnchor = null;

            synth.playAttachSFX();

        } else {
            // === ATTACH to nearest anchor within tap range ===
            let nearest = null;
            let nearestDist = Infinity;

            this.anchors.forEach(anchor => {
                if (anchor === this.lastDetachedAnchor) return;
                // FIX: On manual tap also prefer forward anchors — skip anchors far behind
                if (anchor.x < this.player.x - 100) return;
                const dx = anchor.x - this.player.x;
                const dy = anchor.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // FIX 9: tapGrabRadius now 400px — any visible anchor is grabbable
                if (dist < nearestDist && dist <= this.tapGrabRadius) {
                    nearestDist = dist;
                    nearest = anchor;
                }
            });

            if (nearest) {
                this.attachToAnchor(nearest);
            }
            // No anchor found — player continues falling, which is correct gameplay
        }
    }

    startGame() {
        synth.init();
        // FIX: Always resume context and restart music fresh on new game
        if (synth.ctx) synth.ctx.resume();
        synth.stopBackgroundMusic();
        if (!synth.isMuted) synth.startBackgroundMusic();

        this.gameState = 'PLAYING';
        this.score = 0;
        this.timeElapsed = 0;
        this.scrollSpeed = 0;

        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.remove('active');
        document.querySelector('.hud-header').style.display = 'grid';

        this.generateInitialLevel();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    restartGame() {
        this.startGame();
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            // FIX: Stop music on pause
            synth.stopBackgroundMusic();
            if (synth.ctx) synth.ctx.suspend();
            document.getElementById('pause-screen').classList.add('active');
        } else if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            // FIX: Resume music on unpause
            if (synth.ctx) synth.ctx.resume();
            if (!synth.isMuted) synth.startBackgroundMusic();
            document.getElementById('pause-screen').classList.remove('active');
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    triggerGameOver() {
        if (this.gameState === 'GAMEOVER') return; // prevent double trigger
        this.gameState = 'GAMEOVER';
        // FIX: Stop background music immediately on game over
        synth.stopBackgroundMusic();
        if (synth.ctx) synth.ctx.suspend();
        // Brief resume just to play buzz SFX then suspend again
        if (synth.ctx) {
            synth.ctx.resume().then(() => {
                synth.playBuzzSFX();
                setTimeout(() => { if (synth.ctx) synth.ctx.suspend(); }, 500);
            });
        }

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('neonSwingBestScore', this.bestScore);
        }

        this.updateHUD();
        document.querySelector('.hud-header').style.display = 'none';
        document.getElementById('go-final-score').textContent = this.score;
        document.getElementById('go-best-score').textContent = this.bestScore;
        document.getElementById('game-over-screen').classList.add('active');
    }

    updateHUD() {
        document.getElementById('hud-score').textContent = this.score;
        document.getElementById('hud-best-score').textContent = this.bestScore;
        document.getElementById('start-best-score').textContent = this.bestScore;
    }

    gameLoop(time) {
        if (this.gameState !== 'PLAYING') return;
        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        if (dt > 0.1) dt = 0.1;
        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        this.timeElapsed += dt;
        if (this.hintTimer > 0) this.hintTimer -= dt;

        // Camera scroll — follows player horizontal position
        const diff = this.player.x - this.targetScreenX;
        const targetScroll = Math.max(0, diff * 3.0);
        this.scrollSpeed += (targetScroll - this.scrollSpeed) * 0.08;
        if (this.scrollSpeed < 0) this.scrollSpeed = 0;

        this.worldDistance += this.scrollSpeed * dt;
        this.score = Math.floor(this.worldDistance / 80) + this.coinScore;
        this.updateHUD();

        // Stars parallax
        this.stars.forEach(star => {
            star.x -= this.scrollSpeed * star.speedMultiplier * dt;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        });

        // Player physics
        if (this.player.attached && this.player.activeAnchor) {
            // Scroll the active anchor with the world
            this.player.activeAnchor.x -= this.scrollSpeed * dt;

            // Pendulum physics
            const angleAccel = (-this.gravity / this.player.ropeLength) * Math.sin(this.player.angle);
            this.player.angularVel += angleAccel * dt;
            this.player.angularVel *= 0.9995; // very subtle air drag
            this.player.angle += this.player.angularVel * dt;

            this.player.x = this.player.activeAnchor.x + Math.sin(this.player.angle) * this.player.ropeLength;
            this.player.y = this.player.activeAnchor.y + Math.cos(this.player.angle) * this.player.ropeLength;

        } else {
            // Projectile physics
            this.player.vy += this.gravity * dt;
            this.player.x += this.player.vx * dt - this.scrollSpeed * dt;
            this.player.y += this.player.vy * dt;

            this.particles.push({
                x: this.player.x, y: this.player.y, alpha: 1.0, radius: 4
            });

            // Auto-grab: attach ONLY to anchors that are:
            // 1. Not the last detached anchor
            // 2. AHEAD of player (x > player.x - 50) — never grab behind/left anchors
            // 3. Within grabRadius
            let autoAnchor = null;
            let minDist = Infinity;

            this.anchors.forEach(anchor => {
                if (anchor === this.lastDetachedAnchor) return;
                // FIX: Never auto-grab anchors that are behind the player
                if (anchor.x < this.player.x - 50) return;
                const dx = anchor.x - this.player.x;
                const dy = anchor.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    autoAnchor = anchor;
                }
            });

            // Auto attach on proximity
            if (autoAnchor && minDist <= this.grabRadius) {
                this.attachToAnchor(autoAnchor);
            }
        }

        // Fading trail particles
        this.particles.forEach(p => { p.alpha -= 2.2 * dt; });
        this.particles = this.particles.filter(p => p.alpha > 0);

        // Scroll all assets
        this.anchors.forEach(a => {
            if (a !== this.player.activeAnchor) {
                a.x -= this.scrollSpeed * dt;
            }
            a.update(dt);
        });

        this.coins.forEach(c => {
            c.x -= this.scrollSpeed * dt;
            c.update(dt);
            if (!c.collected) {
                const dx = c.x - this.player.x;
                const dy = c.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < (c.radius + this.player.radius)) {
                    c.collected = true;
                    this.coinScore += 10;
                    synth.playCoinSFX();
                }
            }
        });

        this.obstacles.forEach(o => {
            o.x -= this.scrollSpeed * dt;
            o.update(dt);
            const dx = o.x - this.player.x;
            const dy = o.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            let hit = false;
            if (o.type === 'rotating_blade' && dist < 55) hit = true;
            if (o.type === 'moving_wall') {
                if (Math.abs(dx) < (o.width / 2 + this.player.radius) &&
                    Math.abs(dy) < (o.height / 2 + this.player.radius)) hit = true;
            }
            if (hit) this.triggerGameOver();
        });

        // Garbage collection
        this.anchors = this.anchors.filter(a => a.x > -200);
        this.coins = this.coins.filter(c => c.x > -150 && !c.collected);
        this.obstacles = this.obstacles.filter(o => o.x > -150);
        if (this.anchors.length < 7) this.spawnNextAnchors(3);

        // ── GAME OVER CONDITIONS ─────────────────────────────────────
        // FIX 1: Never trigger game over while player is ATTACHED to a rope
        //         — swing can temporarily take player off screen edges, that's valid
        if (!this.player.attached) {
            // Only game over when player falls below screen bottom with generous buffer
            if (this.player.y > this.canvas.height + 120) {
                this.triggerGameOver();
            }
            // Left side game over — only when truly far behind AND falling (not swinging up)
            // Give extra buffer on mobile (small screen)
            const leftBuffer = Math.min(250, this.canvas.width * 0.25);
            if (this.player.x < -leftBuffer && this.player.vy > 0) {
                this.triggerGameOver();
            }
        } else {
            // While attached — only game over if anchor itself scrolled far off left
            // (means player is stuck on a dead anchor)
            if (this.player.activeAnchor && this.player.activeAnchor.x < -300) {
                this.triggerGameOver();
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Coins
        this.coins.forEach(c => c.draw(this.ctx));

        // Anchors
        this.anchors.forEach((anchor) => {
            const isActive = (anchor === this.player.activeAnchor);
            let isNext = false;

            if (!this.player.attached) {
                // Show next anchor as the closest one ahead of player
                let closestNext = null;
                let minDist = Infinity;
                this.anchors.forEach(a => {
                    if (a === this.lastDetachedAnchor) return;
                    const dx = a.x - this.player.x;
                    const dy = a.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        closestNext = a;
                    }
                });
                isNext = (anchor === closestNext);
            } else {
                const activeIdx = this.anchors.indexOf(this.player.activeAnchor);
                if (activeIdx !== -1 && activeIdx < this.anchors.length - 1) {
                    isNext = (anchor === this.anchors[activeIdx + 1]);
                }
            }

            anchor.draw(this.ctx, isActive, isNext);
        });

        // Obstacles
        this.obstacles.forEach(o => o.draw(this.ctx));

        // Rope
        if (this.player.attached && this.player.activeAnchor) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.activeAnchor.x, this.player.activeAnchor.y);
            this.ctx.lineTo(this.player.x, this.player.y);
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Trail particles
        this.ctx.save();
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
            this.ctx.fill();
        });
        this.ctx.restore();

        // Player character
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 18;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        this.ctx.restore();

        // Hint text
        if (this.hintTimer > 0) {
            const hintText = this.player.attached ? 'TAP TO RELEASE' : 'TAP TO GRAB ANCHOR';
            this.ctx.save();
            this.ctx.font = '700 20px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.min(1, this.hintTimer)})`;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText(hintText, this.player.x, this.player.y - 45);
            this.ctx.restore();
        }
    }
}

// --------------------------------------------------------------------------
// 5. ENGINE INITIATION ON LOAD
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    // Expose to window so help button in index.html can pause/resume
    window._game = game;
});
