/* ==========================================================================
   NEON SWING GAME ENGINE
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
        this.bassNotes = [55.0, 55.0, 65.41, 65.41, 73.42, 73.42, 82.41, 82.41]; // A1, C2, D2, E2 frequencies
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

    // Loop a simple retro neon/synthwave bass line
    startBackgroundMusic() {
        if (this.synthInterval) clearInterval(this.synthInterval);
        
        this.synthInterval = setInterval(() => {
            if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
            
            const now = this.ctx.currentTime;
            
            // Bass beat (1/8 notes)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(this.bassNotes[this.musicStep % this.bassNotes.length], now);
            
            // Neon accent note every 4 beats
            if (this.musicStep % 4 === 0) {
                const leadOsc = this.ctx.createOscillator();
                const leadGain = this.ctx.createGain();
                leadOsc.type = 'sawtooth';
                leadOsc.frequency.setValueAtTime(this.bassNotes[this.musicStep % this.bassNotes.length] * 4, now); // 2 octaves up
                
                leadGain.gain.setValueAtTime(0.04, now);
                leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                
                leadOsc.connect(leadGain);
                leadGain.connect(this.ctx.destination);
                leadOsc.start(now);
                leadOsc.stop(now + 0.3);
            }

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.3);
            
            this.musicStep++;
        }, 300);
    }

    // SFX: Rope Release & Attach click
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

    // SFX: Neon Chime Coin Collect
    playCoinSFX() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        
        // High-pitched crystal bell sound (harmonic sine waves)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5 note
        osc1.frequency.setValueAtTime(1318.51, now + 0.06); // E6 note
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1975.53, now); // B6 note (high overtone)
        
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

    // SFX: Collision Buzz
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
        this.radius = 12;
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += 5 * dt;
    }

    draw(ctx, isActive, isNext) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        let color = '#00a8a8';
        let glow = 8;
        if (isActive) {
            color = '#ff2d78';
            glow = 15 + Math.sin(this.pulse) * 4;
        } else if (isNext) {
            color = '#ffff00';
            glow = 12 + Math.sin(this.pulse) * 3;
        }

        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
        ctx.fillStyle = color;
        ctx.fill();
        
        // Outer halo
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
        // Draw rotating hexagon/circle shape
        const w = this.radius * Math.sin(this.angle);
        ctx.ellipse(this.x, this.y, Math.abs(w), this.radius, 0, 0, Math.PI * 2);
        
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
        this.type = type; // 'rotating_blade', 'moving_wall'
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
            
            // Draw a neat neon blade spinner
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
            ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            ctx.fill();
            ctx.stroke();
            
            // Glowing neon core stripes
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.height/2 + 5);
            ctx.lineTo(this.x, this.y + this.height/2 - 5);
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
        
        // Physics configurations
        this.gravity = 750; // pixels/s^2
        this.scrollSpeed = 160; // Pixels per second horizontal speed
        this.baseScrollSpeed = 160;
        
        // Game variables
        this.score = 0;
        this.coinScore = 0;
        this.bestScore = parseInt(localStorage.getItem('neonSwingBestScore')) || 0;
        this.gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
        this.timeElapsed = 0;
        this.lastTime = 0;
        this.worldDistance = 0;
        
        // Objects arrays
        this.anchors = [];
        this.coins = [];
        this.obstacles = [];
        this.particles = []; // Character trail
        
        // Player properties
        this.player = {
            x: 150,
            y: 350,
            radius: 12,
            vx: 250,
            vy: 0,
            angle: 0,
            angularVel: 0.0,
            ropeLength: 0,
            attached: false,
            activeAnchor: null
        };
        
        this.grabRadius = 50; // Character auto grab radius in px
        
        // Stars/Background particles
        this.stars = [];
        this.initStars();
        
        // Register inputs
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
        
        // Reset player in a comfortable starting position
        this.player.x = 150;
        this.player.y = 350;
        this.player.vx = 250;
        this.player.vy = -100;
        this.player.attached = true;
        
        // Create first active anchor
        const a0 = new Anchor(150, 180);
        this.anchors.push(a0);
        this.player.activeAnchor = a0;
        this.player.ropeLength = 170; // 350 - 180 = 170
        this.player.angle = 0;
        this.player.angularVel = 2.0; // Start with initial swing velocity

        // Generate next reachable anchor ensuring it is close and easily reachable
        const nextX = 400;
        const nextY = 170;
        this.anchors.push(new Anchor(nextX, nextY));
        
        // Generate subsequent anchors
        this.spawnNextAnchors(4);
    }

    // Procedural layout calculation guaranteeing winnable/reachable levels
    spawnNextAnchors(count = 1) {
        for (let k = 0; k < count; k++) {
            const lastAnchor = this.anchors[this.anchors.length - 1];
            
            // X-spacing scales slightly as game proceeds, capped to ensure reachability
            const minSpacing = 220;
            const maxSpacing = Math.min(360, 220 + (this.timeElapsed * 1.5));
            const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);
            
            const nextX = lastAnchor.x + spacing;
            
            // Kept within a very comfortable vertical safe range
            const minHeight = 150;
            const maxHeight = 280;
            const nextY = minHeight + Math.random() * (maxHeight - minHeight);
            
            const anchor = new Anchor(nextX, nextY);
            this.anchors.push(anchor);

            // Generate neon coins in the arc space between these anchors
            const midX = (lastAnchor.x + nextX) / 2;
            const midY = ((lastAnchor.y + nextY) / 2) + 60 + Math.random() * 40;
            this.coins.push(new Coin(midX, midY));
            if (Math.random() > 0.4) {
                this.coins.push(new Coin(midX - 30, midY - 15));
                this.coins.push(new Coin(midX + 30, midY - 15));
            }

            // Generate glowing obstacles at higher speeds in the interval zones
            if (this.timeElapsed > 30 && Math.random() > 0.3) {
                let obstacleType = 'rotating_blade';
                if (this.timeElapsed > 60 && Math.random() > 0.5) {
                    obstacleType = 'moving_wall';
                }
                
                // Position obstacles safely in the middle gap where player swings through
                const obsX = midX;
                const obsY = midY + 50; 
                this.obstacles.push(new Obstacle(obsX, obsY, obstacleType));
            }
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Space key triggers release
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handlePlayerAction();
            }
        });
        
        // Tap / Click overlay triggers release (ignores header HUD buttons clicks)
        const overlay = document.getElementById('interaction-overlay');
        overlay.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handlePlayerAction();
        });

        // UI Start button
        document.getElementById('start-play-btn').addEventListener('click', () => this.startGame());
        
        // UI Pause buttons
        document.getElementById('hud-pause-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePause();
        });
        document.getElementById('pause-resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('pause-restart-btn').addEventListener('click', () => this.restartGame());
        
        // Sound toggle button
        document.getElementById('hud-sound-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const muted = synth.toggleMute();
            document.getElementById('hud-sound-btn').textContent = muted ? '🔇' : '🔊';
        });

        // Game Over buttons
        document.getElementById('go-retry-btn').addEventListener('click', () => this.restartGame());
    }

    handlePlayerAction() {
        if (this.gameState !== 'PLAYING') return;

        // Player tap only controls release (as requested)
        if (this.player.attached) {
            // Calculate release velocities
            const angle = this.player.angle;
            const velocityMagnitude = this.player.angularVel * this.player.ropeLength;
            
            // Projectile velocities
            this.player.vx = velocityMagnitude * Math.cos(angle);
            this.player.vy = velocityMagnitude * -Math.sin(angle);
            
            // Detach rope
            this.player.attached = false;
            this.player.activeAnchor = null;
            
            synth.playAttachSFX();
        }
    }

    startGame() {
        synth.init();
        synth.resume();
        this.gameState = 'PLAYING';
        this.score = 0;
        this.timeElapsed = 0;
        this.scrollSpeed = this.baseScrollSpeed;
        
        // Hide Screens
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.remove('active');
        
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
            document.getElementById('pause-screen').classList.add('active');
        } else if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            document.getElementById('pause-screen').classList.remove('active');
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    triggerGameOver() {
        this.gameState = 'GAMEOVER';
        synth.playBuzzSFX();
        
        // Save Best Score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('neonSwingBestScore', this.bestScore);
        }
        
        this.updateHUD();
        
        // Update Game Over display
        document.getElementById('go-final-score').textContent = this.score;
        document.getElementById('go-best-score').textContent = this.bestScore;
        document.getElementById('game-over-screen').classList.add('active');
    }

    updateHUD() {
        document.getElementById('hud-score').textContent = this.score;
        document.getElementById('hud-best-score').textContent = this.bestScore;
        
        document.getElementById('start-best-score').textContent = this.bestScore;
    }

    // --------------------------------------------------------------------------
    // 4. MAIN INTERACTIVE RUNTIME LOOP
// --------------------------------------------------------------------------
    gameLoop(time) {
        if (this.gameState !== 'PLAYING') return;

        // Calculate robust delta-time
        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Cap dt to prevent massive lag jumps
        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        this.timeElapsed += dt;
        
        // Increment World Spacing Speed dynamically
        if (this.timeElapsed < 30) {
            this.scrollSpeed = this.baseScrollSpeed;
        } else if (this.timeElapsed < 60) {
            this.scrollSpeed = this.baseScrollSpeed * 1.35;
        } else if (this.timeElapsed < 120) {
            this.scrollSpeed = this.baseScrollSpeed * 1.7;
        } else {
            this.scrollSpeed = this.baseScrollSpeed * 2.1;
        }

        // Distance points (distance score + accumulated coin bonus)
        this.worldDistance += this.scrollSpeed * dt;
        this.score = Math.floor(this.worldDistance / 80) + this.coinScore;
        this.updateHUD();

        // 1. Update background star scroll speed
        this.stars.forEach(star => {
            star.x -= this.scrollSpeed * star.speedMultiplier * dt;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        });

        // 2. Character Physics Engine
        if (this.player.attached && this.player.activeAnchor) {
            // Scroll active anchor first (general loop will skip it)
            this.player.activeAnchor.x -= this.scrollSpeed * dt;

            // Real pendulum physics (gravity + angular momentum)
            const angleAccel = (-this.gravity / this.player.ropeLength) * Math.sin(this.player.angle);
            this.player.angularVel += angleAccel * dt;
            
            // Add custom visual centrifugal drag
            this.player.angularVel *= 0.999; 
            
            this.player.angle += this.player.angularVel * dt;

            // Character Position from (already-scrolled) Anchor
            this.player.x = this.player.activeAnchor.x + Math.sin(this.player.angle) * this.player.ropeLength;
            this.player.y = this.player.activeAnchor.y + Math.cos(this.player.angle) * this.player.ropeLength;
        } else {
            // Projectile flight physics
            this.player.vy += this.gravity * dt;
            
            // Scale player horizontal scroll delta
            this.player.x += (this.player.vx - this.scrollSpeed) * dt;
            this.player.y += this.player.vy * dt;
            
            // Trailing effect behind character while flying (Fading dots)
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                alpha: 1.0,
                radius: 4
            });

            // Auto grab mechanics: Auto-attach when within grab radius of 50px
            let nextAnchor = null;
            let minDist = Infinity;
            
            this.anchors.forEach(anchor => {
                // Focus only on anchors ahead of the player
                if (anchor.x > this.player.x - 20) {
                    const dx = anchor.x - this.player.x;
                    const dy = anchor.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nextAnchor = anchor;
                    }
                }
            });

            // Character grabs next anchor automatically when within radius of 50px (as requested)
            if (nextAnchor && minDist <= this.grabRadius) {
                this.player.attached = true;
                this.player.activeAnchor = nextAnchor;
                
                const dx = this.player.x - nextAnchor.x;
                const dy = this.player.y - nextAnchor.y;
                
                this.player.ropeLength = Math.sqrt(dx * dx + dy * dy);
                this.player.angle = Math.atan2(dx, dy);
                
                // Preserve angular momentum during conversion
                const linearVelocity = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
                this.player.angularVel = linearVelocity / this.player.ropeLength;
                
                // If velocity direction was backwards, invert momentum
                if (this.player.vx < 0) {
                    this.player.angularVel *= -1;
                }
                
                synth.playAttachSFX();
            }
        }

        // Fading trailing particles
        this.particles.forEach(p => {
            p.alpha -= 2.2 * dt;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);

        // 3. Spacing assets scroll & update (skip active anchor — already scrolled above)
        this.anchors.forEach(a => {
            if (a !== this.player.activeAnchor) {
                a.x -= this.scrollSpeed * dt;
            }
            a.update(dt);
        });
        
        this.coins.forEach(c => {
            c.x -= this.scrollSpeed * dt;
            c.update(dt);
            
            // Collision chime detection with gold coins
            if (!c.collected) {
                const dx = c.x - this.player.x;
                const dy = c.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < (c.radius + this.player.radius)) {
                    c.collected = true;
                    this.coinScore += 10;
                    synth.playCoinSFX();
                }
            }
        });

        this.obstacles.forEach(o => {
            o.x -= this.scrollSpeed * dt;
            o.update(dt);
            
            // Collision Buzz detection with Obstacles
            const dx = o.x - this.player.x;
            const dy = o.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let hasCollided = false;
            if (o.type === 'rotating_blade') {
                // Check against each blade line length
                if (dist < 65) {
                    // Check exact hit within blade segments
                    hasCollided = true;
                }
            } else if (o.type === 'moving_wall') {
                // Check standard box intersections
                const hHit = Math.abs(dx) < (o.width/2 + this.player.radius);
                const vHit = Math.abs(this.player.y - o.y) < (o.height/2 + this.player.radius);
                if (hHit && vHit) {
                    hasCollided = true;
                }
            }

            if (hasCollided) {
                this.triggerGameOver();
            }
        });

        // 4. Garbage collection & infinite procedural spawning
        this.anchors = this.anchors.filter(a => a.x > -150);
        this.coins = this.coins.filter(c => c.x > -150 && !c.collected);
        this.obstacles = this.obstacles.filter(o => o.x > -150);

        // Keep 6 anchors spawned ahead at all times
        if (this.anchors.length < 6) {
            this.spawnNextAnchors(3);
        }

        // 5. Game Over triggers: Fall off screen boundaries
        if (this.player.y > this.canvas.height + 40 || this.player.y < -300 || this.player.x < -40) {
            this.triggerGameOver();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Layered Background Star Particle flow
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 2. Neon Coins
        this.coins.forEach(c => c.draw(this.ctx));

        // 3. Glowing Anchors
        this.anchors.forEach((anchor) => {
            const isActive = (anchor === this.player.activeAnchor);
            
            // Find next active reachable anchor
            let isNext = false;
            if (!this.player.attached) {
                let closestNext = null;
                let minDist = Infinity;
                this.anchors.forEach(a => {
                    if (a.x > this.player.x) {
                        const dist = a.x - this.player.x;
                        if (dist < minDist) {
                            minDist = dist;
                            closestNext = a;
                        }
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

        // 4. Neon Obstacles
        this.obstacles.forEach(o => o.draw(this.ctx));

        // 5. Active Rope Rendering
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

        // 6. Character Trail particles
        this.ctx.save();
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
            this.ctx.fill();
        });
        this.ctx.restore();

        // 7. Glowing Character circle
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
    }
}

// --------------------------------------------------------------------------
// 5. ENGINE INITIATION ON LOAD
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
