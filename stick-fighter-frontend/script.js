const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiScore = document.getElementById('ui-score');
const uiKills = document.getElementById('ui-kills');
const uiCombo = document.getElementById('ui-combo');
const comboSpan = uiCombo?.querySelector('span');

// HP Elements
const playerHealthBar = document.getElementById('player-health-bar');
const playerHpVal = document.getElementById('player-hp-val');
const bossHealthContainer = document.getElementById('boss-health-bar-container');
const bossHealthBar = document.getElementById('boss-health-bar');
const bossHpVal = document.getElementById('boss-hp-val');

const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const howToPlayModal = document.getElementById('howToPlayModal');
const btnMute = document.getElementById('btn-mute');
const btnPauseHUD = document.getElementById('btn-pause-hud');

// Navigation
document.querySelectorAll('.btn-hub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log('arcade hub clicked');
    });
});

// Game State
let gameState = 'menu'; // menu, playing, paused, gameover
let lastTime = 0;
let score = 0;
let kills = 0;
let timeSinceLastInput = 0;

// Camera / World
const groundY = 450;
let shakeTime = 0;

// Combo System
let comboCount = 0;
let comboTimer = 0;
const COMBO_WINDOW = 600; // ms

// Audio Helper
function playSound(type) {
    if (!window.audioFX) return;
    try {
        if (type === 'hit' && window.audioFX.playEat) window.audioFX.playEat();
        if (type === 'heavy' && window.audioFX.playExplosion) window.audioFX.playExplosion();
        if (type === 'swing' && window.audioFX.playJump) window.audioFX.playJump();
        if (type === 'gameover' && window.audioFX.playGameOver) window.audioFX.playGameOver();
    } catch(e) {}
}

// Entities
class Entity {
    constructor(x, color, isBoss = false) {
        this.x = x;
        this.y = groundY;
        this.vx = 0;
        this.vy = 0;
        this.dir = 1; // 1 = right, -1 = left
        this.color = color;
        this.state = 'idle'; // idle, run, attack1, attack2, attack3, hit, dead
        this.stateFrame = 0;
        
        this.maxHp = isBoss ? 600 : (color === '#0ff' ? 100 : 30); 
        this.hp = this.maxHp;
        this.isBoss = isBoss;
        
        this.hitStun = 0;
        this.attackHitbox = null; 
    }
}

let player;
let enemies = [];
let particles = [];
let floatingTexts = [];

// Input
const keys = { right: false, left: false, down: false };
let attackQueued = false;

window.addEventListener('keydown', e => {
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowDown') {
        if (!keys.down) attackQueued = true;
        keys.down = true;
    }
    if (e.code === 'Escape' && gameState === 'playing') togglePause();
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowDown') keys.down = false;
});

// Mobile Controls
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; }, {passive:false});
document.getElementById('btn-left').addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; }, {passive:false});
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; }, {passive:false});
document.getElementById('btn-right').addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; }, {passive:false});
document.getElementById('btn-attack').addEventListener('touchstart', (e) => { e.preventDefault(); attackQueued = true; keys.down = true; }, {passive:false});
document.getElementById('btn-attack').addEventListener('touchend', (e) => { e.preventDefault(); keys.down = false; }, {passive:false});

function resize() {
    canvas.width = window.innerWidth;
    const headerH = document.querySelector('.header')?.offsetHeight || 0;
    const combatH = document.querySelector('.combat-row')?.offsetHeight || 0;
    canvas.height = window.innerHeight - headerH - combatH;
    
    if (window.innerWidth <= 600) {
        document.getElementById('mobile-controls').classList.remove('hidden');
    } else {
        document.getElementById('mobile-controls').classList.add('hidden');
    }
}
window.addEventListener('resize', resize);
resize();

function spawnEnemy() {
    const cap = Math.min(6, 1 + Math.floor(kills / 5));
    if (enemies.length >= cap) return;
    
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = canvas.width / 2 + (side * (canvas.width/2 + 50));
    
    if (kills > 0 && kills % 10 === 0 && !enemies.some(e => e.isBoss)) {
        enemies.push(new Entity(x, '#f00', true));
        spawnFloatingText(canvas.width/2, 200, "WARNING: BOSS INCOMING", "#f00");
        playSound('heavy');
    } else {
        enemies.push(new Entity(x, '#f0f', false));
    }
}

function initGame() {
    player = new Entity(canvas.width/2, '#0ff', false);
    
    enemies = [];
    particles = [];
    floatingTexts = [];
    score = 0;
    kills = 0;
    comboCount = 0;
    comboTimer = 0;
    shakeTime = 0;
    
    updateHUD();
    bossHealthContainer?.classList.add('hidden');
    
    gameState = 'playing';
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    
    spawnEnemy();
    lastTime = performance.now();
    if (window.audioFX) {
        window.audioFX.init();
        if (btnMute) btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
    requestAnimationFrame(loop);
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-kills').textContent = kills;
    gameOverMenu.classList.remove('hidden');
    playSound('gameover');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }
}

function drawStickman(ctx, ent) {
    const scale = ent.isBoss ? 1.5 : 1;
    const x = ent.x;
    const y = ent.y;
    const dir = ent.dir; 
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir * scale, scale); 
    
    ctx.strokeStyle = ent.hitStun > 0 ? '#fff' : ent.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let headOffset = {x:0,y:-80};
    let l_arm = {x:0, y:-50}, l_hand = {x:0, y:0};
    let r_arm = {x:0, y:-50}, r_hand = {x:0, y:0};
    let l_leg = {x:0, y:-30}, l_foot = {x:-10, y:0};
    let r_leg = {x:0, y:-30}, r_foot = {x:10, y:0};
    
    const t = performance.now() / 150;
    
    if (ent.state === 'idle') {
        l_hand = {x:-15, y:-20}; r_hand = {x:15, y:-20};
        headOffset.y += Math.sin(t)*2;
    } 
    else if (ent.state === 'run') {
        const str = Math.sin(t*2) * 20;
        l_foot = {x: -str, y: Math.min(0, str)};
        r_foot = {x: str, y: Math.min(0, -str)};
        l_hand = {x: str, y: -40};
        r_hand = {x: -str, y: -40};
        headOffset.x = 10;
        headOffset.y += Math.abs(str)*0.2;
    }
    else if (ent.state === 'attack1') { 
        l_hand = {x: 40, y: -50}; 
        r_hand = {x: -10, y: -30};
        headOffset.x = 15;
    }
    else if (ent.state === 'attack2') { 
        r_hand = {x: 50, y: -50}; 
        l_hand = {x: -20, y: -30};
        headOffset.x = 20;
        l_foot.x = 20;
        r_foot.x = -20;
    }
    else if (ent.state === 'attack3') { 
        ctx.translate(0, -20); 
        ctx.rotate(-1.4); 
        l_hand = {x: 0, y: -20};
        r_hand = {x: -20, y: -40};
        r_foot = {x: -10, y: 20}; 
        l_foot = {x: 10, y: 60}; 
        headOffset = {x: 0, y: -60}; 
    }
    else if (ent.state === 'hit') {
        headOffset = {x: -20, y: -70};
        l_hand = {x: -30, y: -80};
        r_hand = {x: -10, y: -90};
        l_foot = {x: -20, y: -10};
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = ent.color;
    
    ctx.beginPath();
    ctx.moveTo(0, headOffset.y + 10);
    ctx.lineTo(0, -30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(headOffset.x, headOffset.y, 12, 0, Math.PI*2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -50); ctx.lineTo(l_arm.x, l_arm.y); ctx.lineTo(l_hand.x, l_hand.y); 
    ctx.moveTo(0, -50); ctx.lineTo(r_arm.x, r_arm.y); ctx.lineTo(r_hand.x, r_hand.y); 
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(l_leg.x, l_leg.y); ctx.lineTo(l_foot.x, l_foot.y); 
    ctx.moveTo(0, -30); ctx.lineTo(r_leg.x, r_leg.y); ctx.lineTo(r_foot.x, r_foot.y); 
    ctx.stroke();
    
    ctx.restore();
    
    if (ent !== player && ent.hp > 0 && !ent.isBoss) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(ent.x - 20, ent.y - (100 * scale), 40, 5);
        ctx.fillStyle = ent.color;
        ctx.fillRect(ent.x - 20, ent.y - (100 * scale), (ent.hp/ent.maxHp)*40, 5);
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x+(Math.random()*20-10), y: y+(Math.random()*20-10), text, color, life: 1.0 });
}
function createHitSparks(x, y, color) {
    for (let i=0; i<10; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*15, 
            vy: (Math.random()-0.5)*15 - 5,
            life: 1.0, color
        });
    }
}

function executeAttack(ent) {
    if (ent.state.startsWith('attack') || ent.hitStun > 0) return;
    
    let attackType = 'attack1';
    let damage = 5;
    let knockback = 5;
    let atkTime = 200;
    
    if (ent === player) {
        comboTimer = COMBO_WINDOW;
        comboCount++;
        playSound('swing');
        
        if (comboCount === 2) {
            attackType = 'attack2'; damage = 10; knockback = 10; atkTime = 300;
        } else if (comboCount >= 3) {
            attackType = 'attack3'; damage = 25; knockback = 30; atkTime = 500;
            comboCount = 0; 
            ent.vy = -5; 
            ent.vx = ent.dir * 18; 
        }
    } else {
        if (ent.isBoss) { attackType = Math.random()>0.5?'attack2':'attack1'; damage = 15; knockback = 20; atkTime = 400; }
        else { damage = 5; knockback = 5; }
        playSound('swing');
    }
    
    ent.state = attackType;
    ent.stateFrame = atkTime;
    
    ent.attackHitbox = {
        offsetX: 40,
        offsetY: -45,
        w: attackType === 'attack3' ? 80 : 50,
        h: attackType === 'attack3' ? 60 : 50,
        type: attackType,
        damage, knockback,
        active: true
    };
    
    if (attackType === 'attack3' && ent === player) shakeTime = 150;
}

function checkHitbox(attacker, defender) {
    if (!attacker.attackHitbox || !attacker.attackHitbox.active) return false;
    if (defender.hitStun > 0) return false; 
    
    const h = attacker.attackHitbox;
    const hx = attacker.x + (attacker.dir * h.offsetX);
    const hy = attacker.y + h.offsetY;

    const defW = defender.isBoss ? 40 : 20;
    if (Math.abs(hx - defender.x) < (h.w/2 + defW) && 
        Math.abs(hy - (defender.y - 40)) < (h.h/2 + 40)) {
        
        if (h.type !== 'attack3') attacker.attackHitbox.active = false; 
        
        if (h.type === 'attack3' && attacker === player && !defender.isBoss) {
            defender.hp = 0; 
        } else {
            defender.hp -= h.damage;
        }
        defender.hitStun = 300; 
        defender.vx = attacker.dir * h.knockback; 
        defender.state = 'hit';
        
        createHitSparks(defender.x, defender.y - 40, attacker.color);
        playSound(h.knockback > 10 ? 'heavy' : 'hit');
        
        if (defender === player) {
            shakeTime = 200;
            comboCount = 0; 
        } else {
            score += h.damage * 10;
            spawnFloatingText(defender.x, defender.y - 80, h.damage, "#ff0");
            
            if (comboCount > 1 && uiCombo) {
                uiCombo.classList.remove('hidden');
                if (comboSpan) comboSpan.textContent = comboCount;
            }
        }
        updateHUD();
        return true;
    }
    return false;
}

function update(dt) {
    if (shakeTime > 0) shakeTime -= dt;
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            comboCount = 0;
            uiCombo?.classList.add('hidden');
        }
    }
    
    if (Math.random() < 0.01) spawnEnemy();
    
    if (player.hitStun <= 0 && !player.state.startsWith('attack')) {
        const speed = 250;
        if (keys.left) { player.x -= speed * (dt/1000); player.dir = -1; player.state = 'run'; }
        else if (keys.right) { player.x += speed * (dt/1000); player.dir = 1; player.state = 'run'; }
        else { player.state = 'idle'; }
        
        player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
    }
    
    if (attackQueued) {
        attackQueued = false;
        executeAttack(player);
    }
    
    if (player.hitStun > 0) {
        player.hitStun -= dt;
        if (player.hitStun <= 0) player.state = 'idle';
    }
    if (player.state.startsWith('attack')) {
        player.stateFrame -= dt;
        if (player.stateFrame <= 0) {
            player.state = 'idle';
            if (player.attackHitbox) player.attackHitbox.active = false;
        }
    }
    
    player.x += player.vx;
    player.vx *= 0.8; 
    player.y += player.vy;
    if (player.y < groundY) player.vy += 60 * (dt/1000); 
    else { player.y = groundY; player.vy = 0; }
    
    enemies.forEach(e => checkHitbox(player, e));
    
    let activeBoss = enemies.find(e => e.isBoss);
    if (activeBoss) {
        bossHealthContainer?.classList.remove('hidden');
        const bossPercent = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
        if (bossHealthBar) bossHealthBar.style.width = bossPercent + "%";
        if (bossHpVal) bossHpVal.textContent = `${Math.ceil(activeBoss.hp)}/${activeBoss.maxHp}`;
    } else {
        bossHealthContainer?.classList.add('hidden');
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        
        if (e.hp <= 0) {
            kills++;
            score += e.isBoss ? 5000 : 500;
            if (e.isBoss && window.achievements) window.achievements.unlock('stickfighter', 'boss_kill', 'Giant Slayer');
            createHitSparks(e.x, e.y-40, e.color);
            enemies.splice(i, 1);
            updateHUD();
            continue;
        }
        
        if (e.hitStun > 0) {
            e.hitStun -= dt;
            if (e.hitStun <= 0) e.state = 'idle';
        }
        else if (e.state.startsWith('attack')) {
            e.stateFrame -= dt;
            if (e.stateFrame <= 0) {
                e.state = 'idle';
                if (e.attackHitbox) e.attackHitbox.active = false;
            }
        }
        else {
            const dist = player.x - e.x;
            const reach = e.isBoss ? 70 : 50;
            if (Math.abs(dist) > reach) {
                const speed = e.isBoss ? 100 : 80;
                e.dir = dist > 0 ? 1 : -1;
                e.x += e.dir * speed * (dt/1000);
                e.state = 'run';
            } else {
                e.state = 'idle';
                e.dir = dist > 0 ? 1 : -1;
                if (Math.random() < (e.isBoss ? 0.18 : 0.12)) {
                    executeAttack(e);
                }
            }
        }
        
        e.x += e.vx;
        e.vx *= 0.8;
        e.y += e.vy;
        if (e.y < groundY) e.vy += 60 * (dt/1000);
        else { e.y = groundY; e.vy = 0; }
        
        checkHitbox(e, player);
    }
    
    if (player.hp <= 0 && gameState === 'playing') {
        gameOver();
    }
    
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life -= dt/1000; });
    particles = particles.filter(p => p.life > 0);
    
    floatingTexts.forEach(t => { t.y -= 1; t.life -= dt/1000; });
    floatingTexts = floatingTexts.filter(t => t.life > 0);
}

function updateHUD() {
    if (uiScore) uiScore.textContent = Math.floor(score);
    if (uiKills) uiKills.textContent = kills;
    if (playerHealthBar && player) {
        const playerPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        playerHealthBar.style.width = playerPercent + "%";
        if (playerHpVal) playerHpVal.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    if (shakeTime > 0) {
        ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
    }
    
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
    
    enemies.forEach(e => drawStickman(ctx, e));
    if (player) drawStickman(ctx, player);
    
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;
    
    ctx.font = 'bold 20px "Press Start 2P"';
    ctx.textAlign = 'center';
    floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.shadowBlur = 5; ctx.shadowColor = '#000';
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;
    
    ctx.restore();
}

function loop(timestamp) {
    if (gameState !== 'playing') {
        lastTime = timestamp;
        requestAnimationFrame(loop);
        return;
    }
    
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    update(dt);
    draw();
    
    requestAnimationFrame(loop);
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);

document.getElementById('btn-howtoplay').addEventListener('click', () => { howToPlayModal.classList.remove('hidden'); });
document.querySelector('.close-btn').addEventListener('click', () => { howToPlayModal.classList.add('hidden'); });

document.getElementById('btn-quit').addEventListener('click', () => { window.location.href = '../index.html'; });
document.getElementById('btn-quit-end').addEventListener('click', () => { window.location.href = '../index.html'; });
document.getElementById('btn-resume').addEventListener('click', togglePause);
btnPauseHUD?.addEventListener('click', togglePause);

btnMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.audioFX) {
        window.audioFX.toggleMute();
        btnMute.innerHTML = window.audioFX.isMuted ? '🔇' : '🔊';
    }
});

// Idle initialization
player = new Entity(window.innerWidth/2, '#0ff', false);
updateHUD();
resize();
draw();
