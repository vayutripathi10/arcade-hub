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

let gameState = 'menu'; // menu, playing, paused, gameover, stage_clear
let animFrame;
let lastTime = 0;

// Game State
let score = 0;
let lives = 3;
let timer = 30; // 30 seconds
let timeAccumulator = 0;
let speed = 60; // Initial "speed"
let runDistance = 0;

// Stage System
let currentStage = 1;
let stageDistanceTarget = 2800; // Roughly 28 seconds of racing
let finishLineY = -1; // -1 means inactive
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
let imagesLoaded = 0;

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
            if (data[i] < 50 && data[i+1] > 200 && data[i+2] < 50) {
                data[i+3] = 0;
            }
        }
        tCtx.putImageData(imgData, 0, 0);
    } catch(e) { } 
    return tempCanvas;
}

const finalImages = {};

function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 3) {
        finalImages.player = makeTransparent(images.player);
        finalImages.enemy = makeTransparent(images.enemy);
        finalImages.petrol = makeTransparent(images.petrol);
        resize();
        animFrame = requestAnimationFrame(loop);
    }
}

images.player.src = 'player.png';
images.enemy.src = 'enemy.png';
images.petrol.src = 'petrol.png';
images.player.onload = onImageLoad;
images.enemy.onload = onImageLoad;
images.petrol.onload = onImageLoad;

// Screen bounds
let roadWidth = 300;
let grassWidth = 50;

function resize() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    roadWidth = canvas.width * 0.7;
    grassWidth = (canvas.width - roadWidth) / 2;
    
    if (gameState === 'menu') {
        player.x = canvas.width / 2;
        player.y = canvas.height - 150;
    }
}
window.addEventListener('resize', resize);

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

// Audio Helper
function playSound(type) {
    if (!window.audioFX) return;
    try {
        if (type === 'crash' && window.audioFX.playExplosion) window.audioFX.playExplosion();
        else if (type === 'crash' && window.audioFX.playGameOver) window.audioFX.playGameOver();
        
        if (type === 'fuel' && window.audioFX.playEat) window.audioFX.playEat();
        if (type === 'start' && window.audioFX.playJump) window.audioFX.playJump();
        if (type === 'victory' && window.audioFX.playVictory) window.audioFX.playVictory();
    } catch(e) {}
}

function initGame() {
    score = 0;
    lives = 3;
    timer = 30;
    timeAccumulator = 0;
    speed = 60;
    runDistance = 0;
    obstacles = [];
    particles = [];
    floatingTexts = [];
    roadOffset = 0;
    
    currentStage = 1;
    stageDistanceTarget = 2800;
    finishLineY = -1;
    finishedStage = false;
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 120;
    
    updateHUD();
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    document.getElementById('hud').classList.remove('hud-hidden');
    
    gameState = 'playing';
    playSound('start');
    if (window.audioFX && window.audioFX.startEngine) window.audioFX.startEngine();
    
    lastTime = performance.now();
}

function startNextStage() {
    stageDistanceTarget += 600; // Increase required distance each stage
    runDistance = 0;
    timer += 20; // Bonus time
    finishLineY = -1;
    finishedStage = false;
    obstacles = []; // clear cars
    
    gameState = 'playing';
    playSound('start');
    if (window.audioFX && window.audioFX.startEngine) window.audioFX.startEngine();
    lastTime = performance.now();
    updateHUD();
}

function createExplosion(x, y) {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: Math.random() > 0.5 ? '#ff6600' : '#ff0000',
            size: Math.random() * 6 + 4
        });
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1.0 });
}

function spawnObstacle() {
    // Prevent overlapping spawns right at the top
    for (const obs of obstacles) {
        if (obs.active && obs.y < 50) return;
    }

    // Stage increases difficulty: enemies spawn faster
    const isPetrol = Math.random() < Math.max(0.04, 0.1 - (currentStage * 0.01)); // Petrol slightly rarer later
    
    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    const lane = Math.floor(Math.random() * lanes);
    
    // Create random variance so the white lines are NOT safe zones
    // Petrol cars stay generally centered, enemies can drift heavily
    const varianceMultiplier = isPetrol ? 0.3 : 0.85; 
    const variance = (Math.random() - 0.5) * (laneWidth * varianceMultiplier);
    
    const x = grassWidth + (lane * laneWidth) + (laneWidth / 2) + variance;
    
    // In Stage 2+, some enemy cars weave horizontally!
    let vx = 0;
    if (!isPetrol && currentStage >= 2 && Math.random() < 0.4) {
        vx = (Math.random() > 0.5 ? 1 : -1) * (30 + (currentStage * 15));
    }
    
    obstacles.push({
        type: isPetrol ? 'petrol' : 'enemy',
        x: x, y: -100,
        w: 35, h: 70,
        vx: vx,
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
    document.getElementById('hud').classList.add('hud-hidden');
    if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
    
    const bestKey = 'retroRacerBest';
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) { best = Math.floor(score); localStorage.setItem(bestKey, best); }
    
    document.getElementById('go-score').textContent = Math.floor(score);
    document.getElementById('go-best').textContent = best;
    document.getElementById('go-title').textContent = (lives <= 0) ? "CRASHED OUT!" : "OUT OF TIME!";
    
    if (score > 5000 && window.achievements) window.achievements.unlock('racer', 'score_5000', 'Speed Demon');
    
    gameOverMenu.classList.remove('hidden');
    playSound('crash');
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

// GLOBAL AUDIO WAKE-UP (Invisible)
const wakeUpAudio = () => {
    if (window.audioFX && typeof window.audioFX.init === 'function') {
        window.audioFX.init();
    }
};
window.addEventListener('mousedown', wakeUpAudio, { once: true });
window.addEventListener('touchstart', wakeUpAudio, { once: true });
window.addEventListener('keydown', wakeUpAudio, { once: true });

function update(dt) {
    if (gameState !== 'playing') return;
    
    // Speed logic
    const maxSpeed = Math.min(250, 150 + (currentStage * 20));
    speed = Math.min(maxSpeed, 60 + (score / 100));
    if (window.audioFX && window.audioFX.updateEngine) window.audioFX.updateEngine(speed);
    
    // Movement
    if (keys.ArrowLeft) player.x -= 300 * (dt/1000);
    if (keys.ArrowRight) player.x += 300 * (dt/1000);
    
    // Player bounds
    if (player.x < grassWidth + player.w/2) player.x = grassWidth + player.w/2;
    if (player.x > canvas.width - grassWidth - player.w/2) player.x = canvas.width - grassWidth - player.w/2;
    
    // Scrolling
    const scrollAmount = speed * (dt/100);
    roadOffset = (roadOffset + scrollAmount) % 100;
    runDistance += speed * (dt/1000);
    
    // Stage logic & Finish Line
    if (runDistance >= stageDistanceTarget && !finishedStage) {
        if (finishLineY === -1) {
            finishLineY = -200; // spawn finish line above
        }
        finishLineY += scrollAmount * 5; // scrolls down faster based on speed
        
        // Did player cross finish?
        if (finishLineY > player.y && !finishedStage) {
            finishedStage = true;
            gameState = 'stage_clear';
            if (window.audioFX && window.audioFX.stopEngine) window.audioFX.stopEngine();
            playSound('victory');
            score += 1000 * currentStage;
            
            // Show CLEAR for 2 seconds, then STARTING for 2 seconds
            setTimeout(() => {
                gameState = 'stage_starting';
                currentStage++;
                setTimeout(startNextStage, 2000);
            }, 2000);
            return;
        }
    } else {
        // Only spawn obstacles if NOT near finish
        if (Math.random() < (0.02 + (speed / 10000))) spawnObstacle();
    }
    
    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        if (!obs.active) { obstacles.splice(i, 1); continue; }
        
        obs.y += speed * 3 * (dt/1000); // Relative approach
        if (obs.y > canvas.height + 100) obs.active = false;
        
        // Weaving mechanics for advanced enemies
        if (obs.vx) {
            obs.x += obs.vx * (dt/1000);
            // Bounce off the grass edges so they don't off-road
            if (obs.x < grassWidth + obs.w) { obs.x = grassWidth + obs.w; obs.vx *= -1; }
            if (obs.x > canvas.width - grassWidth - obs.w) { obs.x = canvas.width - grassWidth - obs.w; obs.vx *= -1; }
        }
        
        // Collision
        if (!obs.crashed) {
            const padding = 10;
            if (Math.abs(player.x - obs.x) < (player.w/2 + obs.w/2 - padding) &&
                Math.abs(player.y - obs.y) < (player.h/2 + obs.h/2 - padding)) {
                
                obs.crashed = true;
                if (obs.type === 'enemy') {
                    lives--;
                    playSound('crash');
                    createExplosion(player.x, player.y - player.h/2);
                    obs.active = false; // Destroy enemy car
                    
                    document.getElementById('gameWrapper').style.background = 'red';
                    setTimeout(() => document.getElementById('gameWrapper').style.background = '#222', 100);
                    
                    if (lives <= 0) { gameOver(); return; }
                } else if (obs.type === 'petrol') {
                    timer += 10; // Extra time
                    obs.active = false; 
                    playSound('fuel');
                    spawnFloatingText(player.x, player.y - 40, "+10 SEC!", "#00ff00");
                    
                    document.getElementById('gameWrapper').style.background = '#00ff00';
                    setTimeout(() => document.getElementById('gameWrapper').style.background = '#222', 100);
                    
                    if (window.achievements) window.achievements.unlock('racer', 'fuel_up', 'Gas Guzzler');
                }
            }
        }
    }
    
    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.y += speed * 0.5 * (dt/1000); // drift back with road
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let t = floatingTexts[i];
        t.y -= 1;
        t.life -= 0.02;
        if (t.life <= 0) floatingTexts.splice(i, 1);
    }
    
    // Timer
    timeAccumulator += dt;
    if (timeAccumulator > 1000) {
        timeAccumulator -= 1000;
        timer--;
        if (timer <= 0) gameOver();
    }
    
    score += speed * (dt/1000);
    updateHUD();
}

function draw() {
    // Grass
    ctx.fillStyle = '#00a800'; // brighter retro green
    ctx.fillRect(0, 0, grassWidth, canvas.height);
    ctx.fillRect(canvas.width - grassWidth, 0, grassWidth, canvas.height);
    
    // Road
    ctx.fillStyle = '#444444';
    ctx.fillRect(grassWidth, 0, roadWidth, canvas.height);
    
    // Road Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -roadOffset;
    
    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    for (let i = 1; i < lanes; i++) {
        ctx.beginPath(); ctx.moveTo(grassWidth + i * laneWidth, 0); ctx.lineTo(grassWidth + i * laneWidth, canvas.height); ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Finish Line
    if (finishLineY > -1) {
        // Draw checkered box
        const sqSize = 25;
        let toggle = false;
        for (let x = grassWidth; x < canvas.width - grassWidth; x += sqSize) {
            for (let y = finishLineY; y < finishLineY + sqSize*3; y += sqSize) {
                ctx.fillStyle = toggle ? '#ffffff' : '#000000';
                ctx.fillRect(x, y, Math.min(sqSize, canvas.width - grassWidth - x), sqSize);
                toggle = !toggle;
            }
            toggle = !toggle; // stagger row
        }
    }
    
    // Cars
    for (const obs of obstacles) {
        const img = obs.type === 'enemy' ? finalImages.enemy : finalImages.petrol;
        if (img) ctx.drawImage(img, obs.x - obs.w/2, obs.y - obs.h/2, obs.w, obs.h);
    }
    
    const pImg = finalImages.player;
    if (pImg) ctx.drawImage(pImg, player.x - player.w/2, player.y - player.h/2, player.w, player.h);
    
    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
    
    // Texts
    ctx.font = 'bold 20px "Press Start 2P", Courier';
    ctx.textAlign = 'center';
    for (const t of floatingTexts) {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life;
        ctx.shadowBlur = 5; ctx.shadowColor = '#000';
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;
    
    // Stage Overlays
    if (gameState === 'stage_clear' || gameState === 'stage_starting') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.font = '24px "Press Start 2P"';
        ctx.shadowBlur = 10; ctx.shadowColor = '#000';
        
        if (gameState === 'stage_clear') {
            ctx.fillText("STAGE " + currentStage + " CLEAR!", canvas.width/2, canvas.height/2);
        } else if (gameState === 'stage_starting') {
            ctx.fillText("STAGE " + currentStage + " STARTING...", canvas.width/2, canvas.height/2);
        }
        ctx.shadowBlur = 0;
    }
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    update(dt);
    draw();
    
    animFrame = requestAnimationFrame(loop);
}

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
    document.getElementById('hud').classList.add('hud-hidden');
    gameState = 'menu';
});

const btnMute = document.getElementById('btn-mute');
if (window.audioFX && window.audioFX.toggleMute) {
    btnMute.addEventListener('click', () => {
        window.audioFX.init();
        window.audioFX.toggleMute();
    });
} else btnMute.style.display = 'none';

document.getElementById('btn-howtoplay').addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
document.getElementById('btn-close-htp').addEventListener('click', () => howToPlayModal.classList.add('hidden'));
