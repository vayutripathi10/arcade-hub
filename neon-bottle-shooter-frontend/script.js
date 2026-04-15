// ---- Game State & DOM ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiScore = document.getElementById('ui-score');
const uiTime = document.getElementById('ui-time');
const uiAccuracy = document.getElementById('ui-accuracy');
const uiAmmo = document.getElementById('ui-ammo');
const uiComboText = document.getElementById('ui-combo-text');
const uiComboContainer = document.getElementById('ui-combo-container');
const btnReload = document.getElementById('btn-reload');
const btnPause = document.getElementById('btn-pause');

// Menus
const mainMenu = document.getElementById('mainMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const pauseMenu = document.getElementById('pauseMenu');
const modeBtns = document.querySelectorAll('.mode-btn');

// --- Globals ---
let animationFrameId;
let lastTime = 0;
let gameState = 'menu'; // menu, playing, paused, gameover
let gameMode = 'classic'; // classic, survival, precision

// Stats
let score = 0;
let timer = 60;
let timeAccumulator = 0;
let shotsFired = 0;
let shotsHit = 0;
let currentCombo = 0;
let maxCombo = 0;
let bottlesDestroyed = 0;
let goldDestroyed = 0;
let iceDestroyed = 0;
let giantDestroyed = 0;
let perfectReloads = 0;
let noBombsShot = true;
let comboMultiplier = 1;

// Ammo & Weapons
const MAX_AMMO = 6;
let ammo = MAX_AMMO;
let isReloading = false;
let reloadTimer = 0;

// Entities
let bottles = [];
let particles = [];
let floatingTexts = [];

// Effects
let screenShake = 0;
let freezeTimer = 0;
let bossWave = false;
let currentWave = 1;
let waveTimer = 0;

// Palettes
const colors = {
    normal: '#00ffff', // Cyan
    red: '#ff0055',    // Pink/Red bonus
    gold: '#ffd700',   // Gold
    ice: '#aaddff',    // Pale blue
    bomb: '#ff3300',   // Dark Red/Orange
    giant: '#ff00ff'   // Magenta
};

// Canvas Sizing
function resizeCanvas() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    // Fixed logical resolution based on aspect ratio
    const aspect = rect.height / rect.width;
    canvas.width = 1000;
    canvas.height = 1000 * aspect;
}
window.addEventListener('resize', () => {
    try { resizeCanvas(); } catch(e){}
});
resizeCanvas();

// --- Input Handling (Crosshair) ---
const crosshair = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    active: false
};

let rawMouseX = -100;
let rawMouseY = -100;

function mapCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousemove', (e) => {
    const p = mapCoords(e);
    rawMouseX = p.x;
    rawMouseY = p.y;
    crosshair.x = p.x;
    crosshair.y = p.y;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const p = mapCoords(e);
    crosshair.x = p.x;
    crosshair.y = p.y;
}, {passive: false});

canvas.addEventListener('mousedown', shoot);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const p = mapCoords(e);
    crosshair.x = p.x;
    crosshair.y = p.y;
    shoot();
}, {passive: false});

// --- Sound Utility ---
function playSound(type) {
    if (!window.audioFX) return;
    try {
        switch(type) {
            case 'shoot': if(window.audioFX.playJump) window.audioFX.playJump(); break; 
            case 'shatter': if(window.audioFX.playEat) window.audioFX.playEat(); break;
            case 'reload': if(window.audioFX.playJump) window.audioFX.playJump(); break;
            case 'empty': if(window.audioFX.playGameOver) window.audioFX.playGameOver(); break;
            case 'combo': if(window.audioFX.playLevelUp) window.audioFX.playLevelUp(); break;
            case 'bomb': if(window.audioFX.playGameOver) window.audioFX.playGameOver(); break;
        }
    } catch(e) {
        console.warn("Audio error:", e);
    }
}

// --- Classes ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 15;
        this.vy = (Math.random() - 0.5) * 15;
        this.size = Math.random() * 5 + 2;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5; // gravity
        this.life -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color, size = 24) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.size = size;
    }
    update() {
        this.y -= 2;
        this.life -= 0.03;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Outfit`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Bottle {
    constructor(type) {
        this.type = type;
        this.color = colors[type] || colors.normal;
        this.w = type === 'giant' ? 60 : 30;
        this.h = type === 'giant' ? 120 : 60;
        
        // Starting pos and movement logic
        const side = Math.random() > 0.5 ? 1 : -1;
        this.x = side === 1 ? -100 : canvas.width + 100;
        
        // Pick one of the 3 visual shelves (25%, 50%, 75% of screen height)
        const shelfLevel = Math.floor(Math.random() * 3) + 1;
        const shelfY = (canvas.height / 4) * shelfLevel;
        this.y = shelfY - (this.h / 2);
        
        let speedMult = 1 + (currentWave * 0.2);
        this.vx = side * (Math.random() * 3 + 2) * speedMult;
        
        // sine wave pattern
        this.isZigZag = Math.random() > 0.7;
        this.startY = this.y;
        this.angle = 0;
        
        this.hp = type === 'giant' ? 3 : 1;
        this.active = true;
    }

    update() {
        if (freezeTimer > 0) return; // Ice effect
        
        this.x += this.vx;
        if (this.isZigZag) {
            this.angle += 0.1;
            this.y = this.startY + Math.sin(this.angle) * 50;
        }

        // Conveyor bounce logic (if hits edge, rarely bounce, usually disappear)
        if (this.x > canvas.width + 150 || this.x < -150) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw bottle shape
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.h/2); // top lip
        ctx.lineTo(this.x + this.w, this.y - this.h/2);
        ctx.lineTo(this.x + this.w*0.8, this.y - this.h/4); // neck down
        ctx.lineTo(this.x + this.w, this.y + this.h/2); // body top to bottom
        ctx.lineTo(this.x, this.y + this.h/2); // bottom left
        ctx.lineTo(this.x + this.w*0.2, this.y - this.h/4); // left body up to neck
        ctx.closePath();
        ctx.stroke();

        // Inner fill for giant/bomb
        if (this.type === 'bomb') {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = '20px Outfit';
            ctx.fillText('💣', this.x + this.w/2, this.y + 10);
        } else if (this.type === 'giant') {
            ctx.fillStyle = `rgba(255,0,255,${this.hp/3 * 0.5})`;
            ctx.fill();
        }
        ctx.restore();
    }
}

// --- Mechanics ---

function spawnBottle() {
    let type = 'normal';
    const r = Math.random();
    if (r < 0.05) type = 'bomb';
    else if (r < 0.1) type = 'ice';
    else if (r < 0.15) type = 'gold';
    else if (r < 0.25) type = 'red';
    else if (r < 0.3 && currentWave > 2) type = 'giant';
    
    bottles.push(new Bottle(type));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function reload() {
    if (isReloading || ammo === MAX_AMMO) return;
    isReloading = true;
    reloadTimer = 30; // 0.5 seconds at 60fps
    playSound('reload');
    uiAmmo.classList.add('ammo-empty');
}

function finishReload() {
    isReloading = false;
    ammo = MAX_AMMO;
    uiAmmo.classList.remove('ammo-empty');
    updateHUD();
    perfectReloads++;
    if (perfectReloads >= 20 && window.achievements) window.achievements.unlock('bottle', 'reload_20', 'Reload Master');
}

function triggerCombo(amount) {
    currentCombo += amount;
    if (currentCombo > maxCombo) maxCombo = currentCombo;
    
    comboMultiplier = 1 + Math.floor(currentCombo / 5);
    
    uiComboText.textContent = `COMBO x${comboMultiplier} (${currentCombo})`;
    uiComboContainer.classList.add('active');
    
    // Remove active class to replay animation later
    clearTimeout(uiComboContainer.timeout);
    uiComboContainer.timeout = setTimeout(() => {
        uiComboContainer.classList.remove('active');
    }, 2000);

    if (currentCombo === 10 && window.achievements) {
        window.achievements.unlock('bottle', 'combo_10', 'Combo King');
    }
}

function resetCombo() {
    currentCombo = 0;
    comboMultiplier = 1;
    uiComboContainer.classList.remove('active');
}

function shoot() {
    if (gameState !== 'playing') return;
    
    if (isReloading) return;

    if (ammo <= 0) {
        playSound('empty');
        reload();
        return;
    }

    ammo--;
    shotsFired++;
    playSound('shoot');
    updateHUD();
    
    // Recoil / Shake
    screenShake = 5;

    let hit = false;
    // Check collisions in reverse to hit front-most bottles
    for (let i = bottles.length - 1; i >= 0; i--) {
        const b = bottles[i];
        // simple AABB hit box expanded slightly
        const padx = 10;
        const pady = 10;
        if (crosshair.x > b.x - padx && crosshair.x < b.x + b.w + padx &&
            crosshair.y > b.y - b.h/2 - pady && crosshair.y < b.y + b.h/2 + pady) {
            
            b.hp--;
            if (b.hp <= 0) {
                hitBottle(b, i);
            } else {
                // Not destroyed yet (giant)
                createExplosion(crosshair.x, crosshair.y, '#fff');
            }
            hit = true;
            break; // hit one bullet per shot
        }
    }

    if (!hit) {
        resetCombo();
        if (gameMode === 'survival') {
            score -= 50; // penalty
            if (score < 0) score = 0;
            // Survival ends if they miss 3 shots in a row? 
            // Or survival ends if accuracy drops too low? Let's end if they run out of time (which doesn't exist)
            // Actually let's track consecutive misses
        }
    }
}

function hitBottle(b, index) {
    bottles.splice(index, 1);
    shotsHit++;
    bottlesDestroyed++;
    createExplosion(b.x + b.w/2, b.y, b.color);
    playSound('shatter');
    
    if (bottlesDestroyed === 1 && window.achievements) window.achievements.unlock('bottle', '1st', 'First Smash');
    if (bottlesDestroyed === 500 && window.achievements) window.achievements.unlock('bottle', 'destroy_500', 'Bottle Hunter');
    if (bottlesDestroyed === 1000 && window.achievements) window.achievements.unlock('bottle', 'destroy_1000', 'Demolition Expert');

    let pts = 0;
    switch(b.type) {
        case 'normal': pts = 10; break;
        case 'red': pts = 50; break;
        case 'gold': 
            pts = 100; triggerCombo(2); 
            goldDestroyed++;
            if(goldDestroyed>=50 && window.achievements) window.achievements.unlock('bottle', 'gold_50', 'Gold Rush');
            break;
        case 'ice': 
            freezeTimer = 120; // 2 seconds
            iceDestroyed++;
            if(iceDestroyed>=25 && window.achievements) window.achievements.unlock('bottle', 'ice_25', 'Ice Breaker');
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 3, '❄️ TIME FROZEN! ❄️', colors.ice, 48));
            break;
        case 'giant': 
            pts = 200; screenShake = 15; 
            giantDestroyed++;
            break;
        case 'bomb': 
            pts = -100; resetCombo(); screenShake = 20; playSound('bomb'); noBombsShot = false; break;
    }

    if (b.type !== 'bomb') {
        triggerCombo(1);
    }

    const finalPts = pts * comboMultiplier;
    score += finalPts;
    
    // Protect score from going below 0
    if (score < 0) score = 0;

    let sign = finalPts > 0 ? '+' : '';
    floatingTexts.push(new FloatingText(b.x, b.y - 20, `${sign}${finalPts}`, b.color));
    
    updateHUD();
}

// --- Main Loop ---

function update() {
    if (isReloading) {
        reloadTimer--;
        if (reloadTimer <= 0) finishReload();
    }

    if (freezeTimer > 0) freezeTimer--;

    // Bottle generation
    waveTimer++;
    let spawnRate = Math.max(30, 90 - (currentWave * 10)); 
    if (gameMode === 'precision') spawnRate = 120; // Slower for precision
    
    if (waveTimer % spawnRate === 0 && freezeTimer === 0) {
        spawnBottle();
    }

    // Wave Progression
    if (waveTimer > 600) { // Every 10 seconds advance difficulty
        waveTimer = 0;
        currentWave++;
        if (currentWave === 3 && window.achievements) {
            window.achievements.unlock('bottle', 'boss_1', 'Boss Breaker'); // Simulate surviving waves as boss breaker
        }
    }

    // Update Entities
    bottles.forEach(b => b.update());
    bottles = bottles.filter(b => b.active);

    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    floatingTexts.forEach(t => t.update());
    floatingTexts = floatingTexts.filter(t => t.life > 0);

    // Timer & Modes
    if (gameMode === 'classic') {
        timeAccumulator++;
        if (timeAccumulator >= 60) {
            timeAccumulator = 0;
            timer--;
            if (timer <= 10) uiTime.classList.add('time-warning');
            updateHUD();
            if (timer <= 0) gameOver();
        }
    } else if (gameMode === 'survival') {
        // Endless, but if you miss a bottle (it goes off screen), you lose a "life" or accuracy drops
        let missedCount = bottlesDestroyed === 0 ? 0 : shotsFired - shotsHit;
        if (missedCount > 10) { // Limit to 10 total misses
            gameOver();
        }
    } else if (gameMode === 'precision') {
        // Ends when out of ammo and no target hit recently
        if (ammo <= 0 && isReloading === false) {
             // In precision mode they can't reload freely? Actually precision mode restricts reloading.
             // But simpler: just track if shots fired reaches high count and accuracy is low
             if (shotsFired > 30 && (shotsHit / shotsFired) < 0.5) gameOver();
        }
    }
    
    // Hide crosshair if idle
    const dx = Math.abs(rawMouseX - crosshair.x);
    const dy = Math.abs(rawMouseY - crosshair.y);
    // Smooth crosshair follow (for touch bounds)
    // Here we explicitly set it on move, so it stays responsive
}

function drawCrosshair() {
    ctx.save();
    ctx.translate(crosshair.x, crosshair.y);
    
    ctx.strokeStyle = isReloading ? varWarn() : varAccent();
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    
    const r = crosshair.radius;
    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.stroke();

    // Ticks
    const off = isReloading ? (reloadTimer % 10) : 0;
    ctx.beginPath();
    ctx.moveTo(-r-10 + off, 0); ctx.lineTo(-r + off, 0);
    ctx.moveTo(r - off, 0); ctx.lineTo(r+10 - off, 0);
    ctx.moveTo(0, -r-10 + off); ctx.lineTo(0, -r + off);
    ctx.moveTo(0, r - off); ctx.lineTo(0, r+10 - off);
    ctx.stroke();

    if (isReloading) {
        ctx.font = '12px Outfit';
        ctx.fillStyle = varWarn();
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING', 0, r + 25);
    }
    
    ctx.restore();
}

function drawShelves() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    
    // Draw 3 distant lines
    for(let i=1; i<4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (canvas.height/4) * i);
        ctx.lineTo(canvas.width, (canvas.height/4) * i);
        ctx.stroke();
    }
    ctx.restore();
}

function draw() {
    ctx.save();
    
    if (screenShake > 0) {
        ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
        screenShake--;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Use CSS background

    if (freezeTimer > 0) {
        ctx.fillStyle = 'rgba(170, 221, 255, 0.1)';
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }

    drawShelves();

    bottles.forEach(b => b.draw());
    particles.forEach(p => p.draw());
    floatingTexts.forEach(t => t.draw());

    // Only draw crosshair if playing
    if (gameState === 'playing') {
        drawCrosshair();
    }

    ctx.restore();
}

function loop(timestamp) {
    if (gameState === 'playing') {
        const elapsed = timestamp - lastTime;
        if (elapsed > 16) {
            lastTime = timestamp;
            update();
            draw();
        }
    }
    animationFrameId = requestAnimationFrame(loop);
}

// --- Game Flow ---

function initGame(mode) {
    gameMode = mode;
    score = 0;
    timer = gameMode === 'classic' ? 60 : 0;
    timeAccumulator = 0;
    shotsFired = 0;
    shotsHit = 0;
    currentCombo = 0;
    maxCombo = 0;
    bottlesDestroyed = 0;
    goldDestroyed = 0;
    iceDestroyed = 0;
    giantDestroyed = 0;
    perfectReloads = 0;
    noBombsShot = true;
    comboMultiplier = 1;
    ammo = MAX_AMMO;
    isReloading = false;
    currentWave = 1;
    waveTimer = 0;
    bottles = [];
    particles = [];
    floatingTexts = [];
    freezeTimer = 0;

    uiTime.classList.remove('time-warning');
    if (gameMode === 'classic') {
        uiTime.style.display = 'block';
    } else {
        uiTime.style.display = 'none'; // hide timer for survival
    }

    updateHUD();
    document.getElementById('hud').classList.remove('hud-hidden');
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    
    canvas.classList.add('playing');
    gameState = 'playing';
    lastTime = performance.now();
    
    if (!animationFrameId) loop(lastTime);
}

function updateHUD() {
    uiScore.textContent = score;
    uiTime.textContent = timer;
    uiAmmo.textContent = `🔫 ${ammo} / ${MAX_AMMO}`;
    
    let acc = 100;
    if (shotsFired > 0) acc = Math.round((shotsHit / shotsFired) * 100);
    uiAccuracy.textContent = `${acc}%`;

    // Achievement Checks
    if (acc >= 90 && shotsFired >= 20 && window.achievements) {
        window.achievements.unlock('bottle', 'sharp_90', 'Sharp Shooter');
    }
    if (score >= 10000 && window.achievements) {
        window.achievements.unlock('bottle', 'score_legend', 'Neon Legend');
    }
}

function gameOver() {
    gameState = 'gameover';
    canvas.classList.remove('playing');
    document.getElementById('hud').classList.add('hud-hidden');
    
    // Save high score
    const bestKey = `bottleBest_${gameMode}`;
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) {
        best = score;
        localStorage.setItem(bestKey, best);
    }

    if (noBombsShot && bottlesDestroyed > 10 && window.achievements) {
        window.achievements.unlock('bottle', 'no_bombs', 'Untouchable');
    }

    document.getElementById('go-score').textContent = score;
    document.getElementById('go-best').textContent = best;
    
    let acc = 100;
    if (shotsFired > 0) acc = Math.round((shotsHit / shotsFired) * 100);
    document.getElementById('go-accuracy').textContent = `${acc}%`;
    document.getElementById('go-combo').textContent = maxCombo;
    document.getElementById('go-bottles').textContent = bottlesDestroyed;

    setTimeout(() => {
        gameOverMenu.classList.remove('hidden');
    }, 500); // short delay
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        canvas.classList.remove('playing');
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        canvas.classList.add('playing');
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
    }
}

// --- Utils ---
function varAccent() { return getComputedStyle(document.body).getPropertyValue('--accent').trim(); }
function varWarn() { return getComputedStyle(document.body).getPropertyValue('--warn').trim(); }

// --- Event Listeners ---

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        initGame(btn.getAttribute('data-mode'));
    });
});

btnReload.addEventListener('click', () => {
    if (gameState === 'playing') reload();
});

btnPause.addEventListener('click', togglePause);
document.getElementById('btn-resume').addEventListener('click', togglePause);

document.getElementById('btn-restart').addEventListener('click', () => initGame(gameMode));
document.getElementById('btn-menu').addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'menu';
});
document.getElementById('btn-quit').addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hud-hidden');
    gameState = 'menu';
});

// Start loop empty for background menu drawing
animationFrameId = requestAnimationFrame(loop);
