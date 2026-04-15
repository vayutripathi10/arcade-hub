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

let gameState = 'menu'; // menu, playing, paused, gameover
let animFrame;
let lastTime = 0;

// Game State
let score = 0;
let lives = 3;
let timer = 30; // 30 seconds
let timeAccumulator = 0;
let speed = 60; // Initial "speed"
let runDistance = 0;

// Entities
let player = { x: 0, y: 0, w: 40, h: 80, vx: 0 };
let obstacles = [];
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
        // The images are isolated on #00ff00 (0, 255, 0). Let's key it out.
        for (let i = 0; i < data.length; i += 4) {
            // High green, low red/blue
            if (data[i] < 50 && data[i+1] > 200 && data[i+2] < 50) {
                data[i+3] = 0; // Set alpha to 0
            }
        }
        tCtx.putImageData(imgData, 0, 0);
    } catch(e) { } // Ignore cross-origin issues if any
    
    return tempCanvas;
}

const finalImages = {};

function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 3) {
        finalImages.player = makeTransparent(images.player);
        finalImages.enemy = makeTransparent(images.enemy);
        finalImages.petrol = makeTransparent(images.petrol);
        // Start loop for menu background
        resize();
        animFrame = requestAnimationFrame(loop);
    }
}

images.player.onload = onImageLoad;
images.enemy.onload = onImageLoad;
images.petrol.onload = onImageLoad;

// Set sources
images.player.src = 'player.png';
images.enemy.src = 'enemy.png';
images.petrol.src = 'petrol.png';

// Screen bounds
let roadWidth = 300;
let grassWidth = 50;

function resize() {
    const wrapper = document.getElementById('gameWrapper');
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Scale road
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

// Touch controls
let touchX = null;
canvas.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
}, {passive:true});

canvas.addEventListener('touchmove', e => {
    if (gameState !== 'playing') return;
    e.preventDefault(); // Prevent scrolling
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchX;
    player.x += diff * 1.5; // Sensitivity
    touchX = currentX;
}, {passive:false});

canvas.addEventListener('touchend', () => { touchX = null; });

// Audio Helper
function playSound(type) {
    if (!window.audioFX) return;
    try {
        if (type === 'crash' && window.audioFX.playGameOver) window.audioFX.playGameOver();
        if (type === 'fuel' && window.audioFX.playLevelUp) window.audioFX.playLevelUp();
        if (type === 'start' && window.audioFX.playJump) window.audioFX.playJump();
    } catch(e) {}
}

function initGame() {
    score = 0;
    lives = 3;
    timer = 30; // Start with 30s
    timeAccumulator = 0;
    speed = 60;
    runDistance = 0;
    obstacles = [];
    roadOffset = 0;
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 120;
    player.vx = 0;
    
    updateHUD();
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    document.getElementById('hud').classList.remove('hud-hidden');
    
    gameState = 'playing';
    playSound('start');
    lastTime = performance.now();
}

function spawnObstacle() {
    // 10% chance for petrol, 90% for enemy car
    const isPetrol = Math.random() < 0.1;
    
    // Pick a lane
    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    const lane = Math.floor(Math.random() * lanes);
    const x = grassWidth + (lane * laneWidth) + (laneWidth / 2);
    
    // Add to list
    obstacles.push({
        type: isPetrol ? 'petrol' : 'enemy',
        x: x,
        y: -100, // spawn above screen
        w: 35,
        h: 70,
        speed: speed * 0.4 + (Math.random() * 20), // move slower than player so they come towards player
        active: true,
        crashed: false
    });
}

function updateHUD() {
    uiScore.textContent = Math.floor(score);
    uiLives.textContent = lives;
    uiTime.textContent = timer;
    uiSpeed.textContent = Math.floor(speed);
    
    if (timer <= 10) uiTime.style.color = '#ff0055';
    else uiTime.style.color = '#ffd700';
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('hud').classList.add('hud-hidden');
    
    const bestKey = 'retroRacerBest';
    let best = parseInt(localStorage.getItem(bestKey)) || 0;
    if (score > best) {
        best = Math.floor(score);
        localStorage.setItem(bestKey, best);
    }
    
    document.getElementById('go-score').textContent = Math.floor(score);
    document.getElementById('go-best').textContent = best;
    
    // Achievement check
    if (score > 5000 && window.achievements) window.achievements.unlock('racer', 'score_5000', 'Speed Demon');
    
    gameOverMenu.classList.remove('hidden');
    playSound('crash');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
    }
}

function update(dt) {
    if (gameState !== 'playing') return;
    
    // Speed increases over time
    speed = Math.min(180, 60 + (score / 100)); // Cap speed at 180
    
    // Keyboard movement
    if (keys.ArrowLeft) player.x -= 300 * (dt/1000);
    if (keys.ArrowRight) player.x += 300 * (dt/1000);
    
    // Boundary collision
    if (player.x < grassWidth + player.w/2) player.x = grassWidth + player.w/2;
    if (player.x > canvas.width - grassWidth - player.w/2) player.x = canvas.width - grassWidth - player.w/2;
    
    roadOffset = (roadOffset + speed * (dt/100)) % 100;
    
    // Spawning
    runDistance += speed * (dt/1000);
    if (Math.random() < 0.02 + (speed / 10000)) spawnObstacle();
    
    // Update active obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        if (!obs.active) {
            obstacles.splice(i, 1);
            continue;
        }
        
        obs.y += speed * 3 * (dt/1000); // Relative approach speed
        
        // Out of bounds
        if (obs.y > canvas.height + 100) {
            obs.active = false;
        }
        
        // Collision
        if (!obs.crashed) {
            // AABB with a small forgiveness margin
            const padding = 10;
            if (Math.abs(player.x - obs.x) < (player.w/2 + obs.w/2 - padding) &&
                Math.abs(player.y - obs.y) < (player.h/2 + obs.h/2 - padding)) {
                
                obs.crashed = true;
                if (obs.type === 'enemy') {
                    lives--;
                    playSound('crash');
                    // Flash effect
                    document.getElementById('gameWrapper').style.background = 'red';
                    setTimeout(() => document.getElementById('gameWrapper').style.background = '#222', 100);
                    
                    if (lives <= 0) {
                        gameOver();
                        return;
                    }
                } else if (obs.type === 'petrol') {
                    timer += 10; // +10 Seconds
                    obs.active = false; // Disappear
                    playSound('fuel');
                    
                    // Flash effect
                    document.getElementById('gameWrapper').style.background = '#00ff00';
                    setTimeout(() => document.getElementById('gameWrapper').style.background = '#222', 100);
                    
                    if (window.achievements) window.achievements.unlock('racer', 'fuel_up', 'Gas Guzzler');
                }
            }
        }
    }
    
    // Timer
    timeAccumulator += dt;
    if (timeAccumulator > 1000) {
        timeAccumulator -= 1000;
        timer--;
        if (timer <= 0) {
            gameOver();
        }
    }
    
    // Score
    score += speed * (dt/1000);
    updateHUD();
}

function draw() {
    // Grass
    ctx.fillStyle = '#005500';
    ctx.fillRect(0, 0, grassWidth, canvas.height);
    ctx.fillRect(canvas.width - grassWidth, 0, grassWidth, canvas.height);
    
    // Road
    ctx.fillStyle = '#333333';
    ctx.fillRect(grassWidth, 0, roadWidth, canvas.height);
    
    // Road Lines (Dashed)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -roadOffset;
    
    const lanes = 3;
    const laneWidth = roadWidth / lanes;
    for (let i = 1; i < lanes; i++) {
        ctx.beginPath();
        ctx.moveTo(grassWidth + i * laneWidth, 0);
        ctx.lineTo(grassWidth + i * laneWidth, canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]); // reset
    
    // Draw Textures
    const pImg = finalImages.player;
    if (pImg) ctx.drawImage(pImg, player.x - player.w/2, player.y - player.h/2, player.w, player.h);
    
    for (const obs of obstacles) {
        const img = obs.type === 'enemy' ? finalImages.enemy : finalImages.petrol;
        if (img) {
            if (obs.crashed) ctx.globalAlpha = 0.5;
            ctx.drawImage(img, obs.x - obs.w/2, obs.y - obs.h/2, obs.w, obs.h);
            ctx.globalAlpha = 1.0;
        }
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

// UI Listeners
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

// Mute toggle (Assume audio.js supports mute button like other games)
const btnMute = document.getElementById('btn-mute');
if (window.audioFX && window.audioFX.toggleMute) {
    btnMute.addEventListener('click', () => {
        window.audioFX.toggleMute(btnMute);
    });
} else {
    btnMute.style.display = 'none'; // Fallback
}

// How to Play Model
document.getElementById('btn-howtoplay').addEventListener('click', () => {
    howToPlayModal.classList.remove('hidden');
});
document.getElementById('btn-close-htp').addEventListener('click', () => {
    howToPlayModal.classList.add('hidden');
});
