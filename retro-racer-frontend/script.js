/**
 * AudioFX - Custom Retro Racer Synthesizer
 */
class AudioFX {
    constructor() {
        this.ctx = null; this.masterGain = null; this.compressor = null;
        this.enabled = true; this.isMuted = false;
        try { this.isMuted = localStorage.getItem('arcadeHubMuted') === 'true'; } catch (e) {}
        this.engineOsc = null; this.engineGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.compressor = this.ctx.createDynamicsCompressor();
                this.masterGain = this.ctx.createGain();
                this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.5, this.ctx.currentTime);
                this.compressor.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        try { localStorage.setItem('arcadeHubMuted', this.isMuted); } catch (e) {}
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1.5, this.ctx.currentTime, 0.05);
        }
    }

    createOscillator(freq, type = 'square') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.compressor || this.ctx.destination);
        return { osc, gain };
    }

    playJump() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const { osc, gain } = this.createOscillator(150, 'triangle');
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        osc.start(now); osc.stop(now + 0.25);
    }

    playEat() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const { osc, gain } = this.createOscillator(523.25, 'square');
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    }

    playGameOver() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const { osc, gain } = this.createOscillator(300, 'sawtooth');
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.frequency.linearRampToValueAtTime(50, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    }

    playVictory() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'square');
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.3);
        });
    }

    playExplosion() {
        if (!this.enabled) return; this.init(); if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        noise.start(); noise.stop(this.ctx.currentTime + 0.5);
    }

    startEngine() {
        if (!this.enabled) return; this.init(); if (!this.ctx || this.engineOsc) return;
        const { osc, gain } = this.createOscillator(80, 'triangle');
        this.engineOsc = osc; this.engineGain = gain;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.engineOsc.start();
    }

    updateEngine(speed) {
        if (!this.engineOsc || !this.ctx) return;
        const pitch = 80 + (speed * 0.8);
        this.engineOsc.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.05);
    }

    stopEngine() {
        if (this.engineOsc) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            const osc = this.engineOsc;
            setTimeout(() => { try { osc.stop(); } catch(e){} }, 200);
            this.engineOsc = null;
        }
    }
}
window.audioFX = new AudioFX();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const uiScore = document.getElementById('ui-score');
const uiLives = document.getElementById('ui-lives');
const uiTime = document.getElementById('ui-time');
const uiSpeed = document.getElementById('ui-speed');

const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const howToPlayModal = document.getElementById('howToPlayModal');

// Game State Guard
let gameState = 'loading'; // loading, menu, playing, paused, gameover, stage_clear
let animFrame;
let lastTime = 0;

// Game Logic State
let score = 0;
let lives = 3;
let timer = 30;
let timeAccumulator = 0;
let speed = 60;
let runDistance = 0;

// Stage System
let currentStage = 1;
let stageDistanceTarget = 2800;
let finishLineY = -1;
let finishedStage = false;

// Entities
let player = { x: 0, y: 0, w: 40, h: 80, vx: 0 };
let obstacles = [];
let particles = [];
let floatingTexts = [];
let roadOffset = 0;

// Assets
const images = {
    player: new Image(),
    enemy: new Image(),
    petrol: new Image()
};
const finalImages = {};

function startWhenReady() {
    const assetList = [images.player, images.enemy, images.petrol];
    let loadedCount = 0;
    const total = assetList.length;

    const onAssetLoad = () => {
        loadedCount++;
        if (loadedCount === total) {
            finalImages.player = makeTransparent(images.player);
            finalImages.enemy = makeTransparent(images.enemy);
            finalImages.petrol = makeTransparent(images.petrol);
            initUI();
            gameState = 'menu';
            resize();
            animFrame = requestAnimationFrame(loop);
        }
    };

    assetList.forEach(img => {
        if (img.complete) onAssetLoad();
        else {
            img.onload = onAssetLoad;
            img.onerror = onAssetLoad; // Don't block on error
        }
    });
}

function makeTransparent(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tCtx.drawImage(img, 0, 0);
    try {
        const imgData = tCtx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 50 && data[i+1] > 200 && data[i+2] < 50) data[i+3] = 0;
        }
        tCtx.putImageData(imgData, 0, 0);
    } catch(e) { } 
    return tempCanvas;
}

// Screen bounds
let roadWidth = 300;
let grassWidth = 50;

function resize() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    
    // Internal logical resolution (Fixed)
    canvas.width = 400;
    canvas.height = 700;
    
    // Display scaling (Maintain Aspect Ratio)
    const containerRatio = rect.width / rect.height;
    const gameRatio = canvas.width / canvas.height;
    
    if (containerRatio > gameRatio) {
        // Container is wider than game
        canvas.style.height = rect.height + "px";
        canvas.style.width = (rect.height * gameRatio) + "px";
    } else {
        // Container is taller than game
        canvas.style.width = rect.width + "px";
        canvas.style.height = (rect.width / gameRatio) + "px";
    }
    
    roadWidth = canvas.width * 0.85; 
    grassWidth = (canvas.width - roadWidth) / 2;
    
    if (gameState === 'menu' || gameState === 'loading') {
        player.x = canvas.width / 2;
        player.y = canvas.height - 150;
    }
}
window.addEventListener('resize', resize);

function initUI() {
    // Hub Button
    document.getElementById('hub-btn')?.addEventListener('click', () => {
        console.log('hub clicked');
        window.location.href = '../index.html';
    });

    document.getElementById('btn-start').addEventListener('click', initGame);
    document.getElementById('btn-restart').addEventListener('click', initGame);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    
    document.getElementById('btn-menu').addEventListener('click', () => {
        gameOverMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        gameState = 'menu';
    });
    
    document.getElementById('btn-quit').addEventListener('click', () => {
        pauseMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        gameState = 'menu';
        document.getElementById('btn-pause').classList.add('hidden');
    });

    const btnMute = document.getElementById('btn-mute');
    if (btnMute && window.audioFX) {
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.audioFX) {
            window.audioFX.init();
            window.audioFX.toggleMute();
            btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
            console.log('sound toggled, muted:', window.audioFX.isMuted);
        } else {
            console.warn('audioFX not found');
        }
    });

    document.getElementById('btn-howtoplay').addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
    document.getElementById('btn-close-htp').addEventListener('click', () => howToPlayModal.classList.add('hidden'));

    // Ad Observer
    const adBox = document.getElementById('ad-box');
    if (adBox) {
        const observer = new MutationObserver(() => {
            if (adBox.innerHTML.trim() !== '') adBox.classList.add('ad-loaded');
        });
        observer.observe(adBox, { childList: true, subtree: true });
    }
}

// Input handling
const keys = { ArrowLeft: false, ArrowRight: false };
window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
    if (e.code === 'Escape' && gameState === 'playing') togglePause();
});
window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

let touchX = null;
canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive:true});
canvas.addEventListener('touchmove', e => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const currentX = e.touches[0].clientX;
    player.x += (currentX - touchX) * 1.5;
    touchX = currentX;
}, {passive:false});
canvas.addEventListener('touchend', () => { touchX = null; });

function initGame() {
    score = 0; lives = 3; timer = 30; timeAccumulator = 0; speed = 60; runDistance = 0;
    obstacles = []; particles = []; floatingTexts = []; roadOffset = 0;
    currentStage = 1; stageDistanceTarget = 2800; finishLineY = -1; finishedStage = false;
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 120;
    
    updateHUD();
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    document.getElementById('btn-pause').classList.remove('hidden');
    
    gameState = 'playing';
    if (window.audioFX) {
        window.audioFX.init();
        window.audioFX.playJump(); // Start sound
        if (window.audioFX.startEngine) window.audioFX.startEngine();
    }
    lastTime = performance.now();
}

function startNextStage() {
    stageDistanceTarget += 600;
    runDistance = 0;
    timer += 20;
    finishLineY = -1;
    finishedStage = false;
    obstacles = [];
    gameState = 'playing';
    if (window.audioFX && window.audioFX.startEngine) window.audioFX.startEngine();
    lastTime = performance.now();
    updateHUD();
}

function spawnObstacle() {
    for (const obs of obstacles) { if (obs.active && obs.y < 50) return; }
    const isPetrol = Math.random() < Math.max(0.04, 0.1 - (currentStage * 0.01));
    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    const lane = Math.floor(Math.random() * lanes);
    const varianceMultiplier = isPetrol ? 0.3 : 0.85; 
    const variance = (Math.random() - 0.5) * (laneWidth * varianceMultiplier);
    const x = grassWidth + (lane * laneWidth) + (laneWidth / 2) + variance;
    
    let vx = 0;
    if (!isPetrol && currentStage >= 2 && Math.random() < 0.4) {
        vx = (Math.random() > 0.5 ? 1 : -1) * (30 + (currentStage * 15));
    }
    
    obstacles.push({
        type: isPetrol ? 'petrol' : 'enemy',
        x: x, y: -100, w: 35, h: 70, vx: vx,
        speed: speed * 0.4 + (Math.random() * 20) + (currentStage * 5),
        active: true, crashed: false
    });
}

function updateHUD() {
    uiScore.textContent = Math.floor(score);
    uiLives.textContent = lives;
    uiTime.textContent = timer;
    uiSpeed.textContent = Math.floor(speed);
    
    if (timer <= 10) uiTime.style.color = '#ff0055';
    else uiTime.style.color = '#ffd700';
    
    const pFill = document.getElementById('ui-progress-fill');
    if (pFill) {
        let pct = Math.min(100, Math.max(0, (runDistance / stageDistanceTarget) * 100));
        pFill.style.width = pct + "%";
    }
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('btn-pause').classList.add('hidden');
    if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
    
    const bestKey = 'retroRacerBest';
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) { best = Math.floor(score); localStorage.setItem(bestKey, best); }
    
    document.getElementById('go-score').textContent = Math.floor(score);
    document.getElementById('go-best').textContent = best;
    document.getElementById('go-title').textContent = (lives <= 0) ? "CRASHED OUT!" : "OUT OF TIME!";
    
    if (score > 5000 && window.achievements) window.achievements.unlock('racer', 'score_5000', 'Speed Demon');
    
    gameOverMenu.classList.remove('hidden');
    if (window.audioFX && window.audioFX.playExplosion) window.audioFX.playExplosion();
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
        if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        if (window.audioFX && window.audioFX.startEngine) window.audioFX.startEngine();
    }
}

function update(dt) {
    if (gameState !== 'playing') return;
    
    const maxSpeed = Math.min(250, 150 + (currentStage * 20));
    speed = Math.min(maxSpeed, 60 + (score / 100));
    if (window.audioFX && window.audioFX.updateEngine) window.audioFX.updateEngine(speed);
    
    if (keys.ArrowLeft) player.x -= 300 * (dt/1000);
    if (keys.ArrowRight) player.x += 300 * (dt/1000);
    
    if (player.x < grassWidth + player.w/2) player.x = grassWidth + player.w/2;
    if (player.x > canvas.width - grassWidth - player.w/2) player.x = canvas.width - grassWidth - player.w/2;
    
    const scrollAmount = speed * (dt/100);
    roadOffset = (roadOffset + scrollAmount) % 100;
    runDistance += speed * (dt/1000);
    
    if (runDistance >= stageDistanceTarget && !finishedStage) {
        if (finishLineY === -1) finishLineY = -200;
        finishLineY += scrollAmount * 5;
        if (finishLineY > player.y && !finishedStage) {
            finishedStage = true;
            gameState = 'stage_clear';
            if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
            if (window.audioFX && window.audioFX.playVictory) window.audioFX.playVictory();
            score += 1000 * currentStage;
            setTimeout(() => {
                gameState = 'stage_starting';
                currentStage++;
                setTimeout(startNextStage, 2000);
            }, 2000);
            return;
        }
    } else {
        if (Math.random() < (0.02 + (speed / 10000))) spawnObstacle();
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        if (!obs.active) { obstacles.splice(i, 1); continue; }
        obs.y += speed * 3 * (dt/1000);
        if (obs.y > canvas.height + 100) obs.active = false;
        if (obs.vx) {
            obs.x += obs.vx * (dt/1000);
            if (obs.x < grassWidth + obs.w) { obs.x = grassWidth + obs.w; obs.vx *= -1; }
            if (obs.x > canvas.width - grassWidth - obs.w) { obs.x = canvas.width - grassWidth - obs.w; obs.vx *= -1; }
        }
        if (!obs.crashed) {
            const padding = 10;
            if (Math.abs(player.x - obs.x) < (player.w/2 + obs.w/2 - padding) &&
                Math.abs(player.y - obs.y) < (player.h/2 + obs.h/2 - padding)) {
                obs.crashed = true;
                if (obs.type === 'enemy') {
                    lives--;
                    if (window.audioFX && window.audioFX.playExplosion) window.audioFX.playExplosion();
                    createExplosion(player.x, player.y - player.h/2);
                    obs.active = false;
                    if (lives <= 0) { gameOver(); return; }
                } else if (obs.type === 'petrol') {
                    timer += 10; obs.active = false; 
                    if (window.audioFX && window.audioFX.playEat) window.audioFX.playEat();
                    spawnFloatingText(player.x, player.y - 40, "+10 SEC!", "#00ff00");
                    if (window.achievements) window.achievements.unlock('racer', 'fuel_up', 'Gas Guzzler');
                }
            }
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.y += speed * 0.5 * (dt/1000);
        p.life -= 0.02; if (p.life <= 0) particles.splice(i, 1);
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let t = floatingTexts[i]; t.y -= 1; t.life -= 0.02; if (t.life <= 0) floatingTexts.splice(i, 1);
    }
    
    timeAccumulator += dt;
    if (timeAccumulator > 1000) { timeAccumulator -= 1000; timer--; if (timer <= 0) gameOver(); }
    score += speed * (dt/1000);
    updateHUD();
}

function createExplosion(x, y) {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
            life: 1.0, color: Math.random() > 0.5 ? '#ff6600' : '#ff0000', size: Math.random() * 6 + 4
        });
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1.0 });
}

function draw() {
    ctx.fillStyle = '#00a800'; 
    ctx.fillRect(0, 0, grassWidth, canvas.height);
    ctx.fillRect(canvas.width - grassWidth, 0, grassWidth, canvas.height);
    
    ctx.fillStyle = '#444444';
    ctx.fillRect(grassWidth, 0, roadWidth, canvas.height);
    
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -roadOffset;
    const lanes = 3; const laneWidth = roadWidth / lanes;
    for (let i = 1; i < lanes; i++) {
        ctx.beginPath(); ctx.moveTo(grassWidth + i * laneWidth, 0); ctx.lineTo(grassWidth + i * laneWidth, canvas.height); ctx.stroke();
    }
    ctx.setLineDash([]);
    
    if (finishLineY > -1) {
        const sqSize = 25; let toggle = false;
        for (let x = grassWidth; x < canvas.width - grassWidth; x += sqSize) {
            for (let y = finishLineY; y < finishLineY + sqSize*3; y += sqSize) {
                ctx.fillStyle = toggle ? '#ffffff' : '#000000';
                ctx.fillRect(x, y, Math.min(sqSize, canvas.width - grassWidth - x), sqSize);
                toggle = !toggle;
            }
            toggle = !toggle;
        }
    }
    
    for (const obs of obstacles) {
        const img = obs.type === 'enemy' ? finalImages.enemy : finalImages.petrol;
        if (img) ctx.drawImage(img, obs.x - obs.w/2, obs.y - obs.h/2, obs.w, obs.h);
    }
    
    if (finalImages.player) ctx.drawImage(finalImages.player, player.x - player.w/2, player.y - player.h/2, player.w, player.h);
    
    for (const p of particles) {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
    
    ctx.font = 'bold 20px "Press Start 2P", Courier'; ctx.textAlign = 'center';
    for (const t of floatingTexts) {
        ctx.fillStyle = t.color; ctx.globalAlpha = t.life; ctx.shadowBlur = 5; ctx.shadowColor = '#000';
        ctx.fillText(t.text, t.x, t.y); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;
    
    if (gameState === 'stage_clear' || gameState === 'stage_starting') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700'; ctx.font = '20px "Press Start 2P"';
        let msg = gameState === 'stage_clear' ? `STAGE ${currentStage} CLEAR!` : `STAGE ${currentStage} STARTING...`;
        ctx.fillText(msg, canvas.width/2, canvas.height/2);
    }
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameState !== 'loading') {
        update(dt);
        draw();
    }
    animFrame = requestAnimationFrame(loop);
}

// Asset pre-load
images.player.src = 'player.png';
images.enemy.src = 'enemy.png';
images.petrol.src = 'petrol.png';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
} else {
    startWhenReady();
}
