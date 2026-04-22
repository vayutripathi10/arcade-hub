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

// Game Constants
const gridSize = 20;
let tileCount = 20;

// Game State
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let isPaused = false;
let gameLoopInterval;
let speed = 200;
let survivalTimer = 0;
const minSpeed = 50;

highScoreElement.textContent = highScore;

// Initialize
function init() {
    resize();
    
    // Hub Button Fix
    document.getElementById('hub-btn')?.addEventListener('click', () => {
        console.log('hub clicked');
        window.location.href = '../index.html';
    });

    startBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Mobile controls (using touchstart for instant response)
    const setControl = (id, dir) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleDirection(dir); }, {passive: false});
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); handleDirection(dir); });
        }
    };
    setControl('upBtn', 'arrowup');
    setControl('downBtn', 'arrowdown');
    setControl('leftBtn', 'arrowleft');
    setControl('rightBtn', 'arrowright');

    pauseBtn?.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
    btnResume?.addEventListener('click', (e) => { e.stopPropagation(); togglePause(false); });
    
    btnQuit?.addEventListener('click', (e) => {
        e.stopPropagation();
        quitToMenu();
    });

    btnMute?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.audioFX) {
            window.audioFX.toggleMute();
            btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
        }
    });

    // How to Play
    document.getElementById('htp-btn')?.addEventListener('click', () => {
        document.getElementById('htpOverlay')?.classList.add('active');
    });
    document.getElementById('htp-close')?.addEventListener('click', () => {
        document.getElementById('htpOverlay')?.classList.remove('active');
    });

    // Ad Observer
    const adBox = document.getElementById('ad-box');
    if (adBox) {
        const observer = new MutationObserver(() => {
            if (adBox.innerHTML.trim() !== '') {
                adBox.classList.add('ad-loaded');
                resize(); // Recalculate canvas space if ad appears
            }
        });
        observer.observe(adBox, { childList: true, subtree: true });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameRunning && !isPaused) togglePause(true);
    });
}

function resize() {
    const root = document.querySelector('.game-root');
    const header = document.querySelector('.header');
    const adBox = document.getElementById('ad-box');
    
    if (!root || !header) return;
    
    const availableW = root.clientWidth - 40;
    const availableH = root.clientHeight - header.offsetHeight - (adBox?.classList.contains('ad-loaded') ? adBox.offsetHeight : 0) - 40;
    
    const side = Math.min(availableW, availableH, 400);
    canvas.width = side;
    canvas.height = side;
    tileCount = Math.floor(side / gridSize);
}
window.addEventListener('resize', resize);

function startGame() {
    if (gameRunning) return;
    
    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    
    snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
    generateFood();
    dx = 1; dy = 0; nextDx = 1; nextDy = 0;
    score = 0; speed = 200; survivalTimer = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, speed);
}

function quitToMenu() {
    gameRunning = false;
    isPaused = false;
    clearInterval(gameLoopInterval);
    pauseMenu.classList.add('hidden');
    overlayTitle.textContent = "Zen Snake";
    overlayMessage.textContent = "Press any key or Tap to start";
    startBtn.textContent = "Start Game";
    document.getElementById('shareContainer')?.classList.add('hidden');
    overlay.classList.remove('hidden');
    pauseBtn?.classList.add('hidden');
    snake = [{ x: 10, y: 10 }];
    score = 0;
    scoreElement.textContent = score;
    draw();
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    const gameKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '];
    
    if (gameKeys.includes(key)) e.preventDefault();

    if (!gameRunning) {
        if (key === ' ' || key === 'enter' || gameKeys.includes(key)) startGame();
        return;
    }
    if (isPaused) return;
    
    handleDirection(key);
}

function handleDirection(key) {
    if (!gameRunning || isPaused) return;

    if ((key === 'arrowup' || key === 'w') && dy === 0) { nextDx = 0; nextDy = -1; }
    else if ((key === 'arrowdown' || key === 's') && dy === 0) { nextDx = 0; nextDy = 1; }
    else if ((key === 'arrowleft' || key === 'a') && dx === 0) { nextDx = -1; nextDy = 0; }
    else if ((key === 'arrowright' || key === 'd') && dx === 0) { nextDx = 1; nextDy = 0; }
}

function togglePause(forcePause) {
    if (!gameRunning) return;
    isPaused = forcePause !== undefined ? forcePause : !isPaused;
    
    if (isPaused) {
        clearInterval(gameLoopInterval);
        pauseMenu.classList.remove('hidden');
    } else {
        pauseMenu.classList.add('hidden');
        gameLoopInterval = setInterval(gameLoop, speed);
    }
}

function gameLoop() {
    update();
    draw();
}

function update() {
    dx = nextDx; dy = nextDy;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    if (dx !== 0 || dy !== 0) {
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver();
                return;
            }
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (window.achievements) {
            if (score === 10) window.achievements.unlock('snake', '10', 'Hungry Snake');
            if (score === 100) window.achievements.unlock('snake', '25', 'Neon Predator');
            if (score === 200) window.achievements.unlock('snake', '50', 'Zen Dragon');
        }
        if (window.audioFX) window.audioFX.playEat();
        if (navigator.vibrate) navigator.vibrate(20);
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        generateFood();
        increaseSpeed(5);
    } else {
        snake.pop();
    }

    survivalTimer++;
    if (survivalTimer % 100 === 0) increaseSpeed(2);
}

function increaseSpeed(amount) {
    if (speed > minSpeed) {
        clearInterval(gameLoopInterval);
        speed -= amount;
        if (speed < minSpeed) speed = minSpeed;
        gameLoopInterval = setInterval(gameLoop, speed);
    }
}

function draw() {
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
    }

    ctx.shadowBlur = 15; ctx.shadowColor = '#ff3366'; ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 10; ctx.shadowColor = '#00ffcc';
    snake.forEach((part, index) => {
        const isHead = index === 0;
        const opacity = 1 - (index / snake.length) * 0.6;
        ctx.fillStyle = isHead ? '#00ffcc' : `rgba(0, 255, 204, ${opacity})`;
        const size = isHead ? gridSize - 2 : gridSize - 4;
        const offset = (gridSize - size) / 2;
        const x = part.x * gridSize + offset;
        const y = part.y * gridSize + offset;
        const radius = isHead ? 8 : 4;

        if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(x, y, size, size, radius); ctx.fill();
        } else {
            ctx.fillRect(x, y, size, size);
        }
    });
    ctx.shadowBlur = 0;
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
        this.beginPath(); this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r);
        this.closePath(); return this;
    };
}

function generateFood() {
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    for (let part of snake) { if (part.x === food.x && part.y === food.y) { generateFood(); break; } }
}

function gameOver() {
    gameRunning = false; isPaused = false;
    pauseBtn?.classList.add('hidden');
    clearInterval(gameLoopInterval);
    if (window.audioFX) window.audioFX.playGameOver();
    if (navigator.vibrate) navigator.vibrate(50);
    overlayTitle.textContent = "Game Over";
    overlayMessage.textContent = `Final Score: ${score}`;
    const shareContainer = document.getElementById('shareContainer');
    if (shareContainer) shareContainer.classList.remove('hidden');
    startBtn.textContent = "Try Again";
    overlay.classList.remove('hidden');
}

function shareScore(platform) {
    const text = `I just scored ${score} points in Zen Snake 🐍 at Arcade Hub! Can you beat me?`;
    const url = 'https://arcadehubplay.com';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

document.getElementById('tweetBtn')?.addEventListener('click', () => shareScore('twitter'));
document.getElementById('waBtn')?.addEventListener('click', () => shareScore('whatsapp'));

init();
draw();
