'use strict';
// ============================================================
//  NEON DRAW BRIDGE  —  script.js
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── Constants ───────────────────────────────────────────────
const GRAVITY   = 0.42;
const R         = 13;       // ball radius
const SUBSTEPS  = 3;        // physics sub-steps per frame
const TRAIL_LEN = 22;
const MAX_SPEED = 18;

// ─── State ───────────────────────────────────────────────────
let CW = 800, CH = 480;
let mode      = 'menu';     // menu | draw | play | dead | won
let levelIdx  = 0;
let retries   = 0;
let inkUsed   = 0;
let playTime  = 0;
let ball = null, particles = [], userSegs = [], curSeg = null, undoGroups = [];

const savedProgress = (() => {
    try { return JSON.parse(localStorage.getItem('ndbProg') || '{}'); }
    catch { return {}; }
})();

// ─── Level Definitions ───────────────────────────────────────
const LEVELS = [
{
    name:'The First Gap', inkBudget:340,
    hint:'Draw a bridge across the gap to guide the ball to the portal.',
    ball:{x:100,y:355}, goal:{x:700,y:355},
    segs:[
        {x1:0,y1:400,x2:230,y2:400},
        {x1:570,y1:400,x2:800,y2:400},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
    ],
    spikes:[],platforms:[],fans:[],hammers:[],keys:[],gates:[]
},
{
    name:'Spike Valley', inkBudget:290,
    hint:'Draw a ramp that launches the ball OVER the spike bed.',
    ball:{x:80,y:355}, goal:{x:720,y:355},
    segs:[
        {x1:0,y1:400,x2:800,y2:400},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
    ],
    spikes:[{x:210,y:400,w:380}],
    platforms:[],fans:[],hammers:[],keys:[],gates:[]
},
{
    name:'The Staircase', inkBudget:580,
    hint:'Connect the steps with short ramps to climb upward.',
    ball:{x:70,y:370}, goal:{x:740,y:100},
    segs:[
        {x1:0,y1:420,x2:160,y2:420},
        {x1:230,y1:320,x2:380,y2:320},
        {x1:450,y1:220,x2:600,y2:220},
        {x1:660,y1:130,x2:800,y2:130},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
        {x1:0,y1:480,x2:800,y2:480},
    ],
    spikes:[{x:160,y:420,w:70},{x:380,y:320,w:70}],
    platforms:[],fans:[],hammers:[],keys:[],gates:[]
},
{
    name:'Moving Platform', inkBudget:200,
    hint:'The platform moves. Draw a short ramp onto it and let it carry you.',
    ball:{x:80,y:345}, goal:{x:720,y:345},
    segs:[
        {x1:0,y1:400,x2:190,y2:400},
        {x1:610,y1:400,x2:800,y2:400},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
        {x1:0,y1:480,x2:800,y2:480},
    ],
    spikes:[],
    platforms:[{x:205,y:375,w:150,h:20,axis:'x',min:200,max:460,speed:2.2,_dir:1}],
    fans:[],hammers:[],keys:[],gates:[]
},
{
    name:'Fan Force', inkBudget:260,
    hint:'The fan blows upward. Draw a funnel to redirect the ball to the shelf.',
    ball:{x:80,y:385}, goal:{x:700,y:120},
    segs:[
        {x1:0,y1:430,x2:800,y2:430},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
        {x1:400,y1:170,x2:800,y2:170},
    ],
    spikes:[{x:340,y:430,w:120}],
    platforms:[],
    fans:[{x:380,y:200,w:60,h:230,angle:-Math.PI/2,force:0.55}],
    hammers:[],keys:[],gates:[]
},
{
    name:'Key Hunt', inkBudget:420,
    hint:'Collect the golden key to open the gate, then reach the portal.',
    ball:{x:80,y:360}, goal:{x:720,y:360},
    segs:[
        {x1:0,y1:410,x2:800,y2:410},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
        {x1:310,y1:260,x2:310,y2:410},
    ],
    spikes:[{x:110,y:410,w:80},{x:530,y:410,w:80}],
    platforms:[],fans:[],hammers:[],
    keys:[{x:200,y:220,id:'k1',r:14,collected:false}],
    gates:[{x1:310,y1:260,x2:310,y2:410,keyId:'k1',open:false}]
},
{
    name:'Hammer Zone', inkBudget:310,
    hint:'The hammer swings. Draw your path and wait for the right moment.',
    ball:{x:80,y:360}, goal:{x:720,y:360},
    segs:[
        {x1:0,y1:410,x2:800,y2:410},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
        {x1:250,y1:230,x2:380,y2:230},
        {x1:420,y1:230,x2:550,y2:230},
    ],
    spikes:[],platforms:[],fans:[],
    hammers:[{cx:400,cy:230,len:130,speed:0.032,angle:0}],
    keys:[],gates:[]
},
{
    name:'The Gauntlet', inkBudget:450,
    hint:'Everything you learned comes together. Stay calm and draw wisely.',
    ball:{x:60,y:375}, goal:{x:745,y:110},
    segs:[
        {x1:0,y1:420,x2:170,y2:420},
        {x1:230,y1:330,x2:370,y2:330},
        {x1:450,y1:240,x2:580,y2:240},
        {x1:630,y1:150,x2:800,y2:150},
        {x1:0,y1:0,x2:0,y2:480},
        {x1:800,y1:0,x2:800,y2:480},
        {x1:0,y1:0,x2:800,y2:0},
        {x1:0,y1:480,x2:800,y2:480},
    ],
    spikes:[{x:170,y:420,w:60},{x:370,y:330,w:80}],
    platforms:[{x:460,y:220,w:130,h:18,axis:'x',min:450,max:580,speed:1.8,_dir:1}],
    fans:[{x:220,y:330,w:50,h:90,angle:-Math.PI/2,force:0.48}],
    hammers:[{cx:460,cy:240,len:110,speed:0.028,angle:0}],
    keys:[],gates:[]
},
];

// ─── Physics ─────────────────────────────────────────────────
function circleSegCollide(bx, by, vx, vy, x1, y1, x2, y2, rest) {
    const dx = x2-x1, dy = y2-y1;
    const len2 = dx*dx + dy*dy;
    if (len2 < 0.001) return null;
    let t = ((bx-x1)*dx + (by-y1)*dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1+t*dx, cy = y1+t*dy;
    const px = bx-cx, py = by-cy;
    const dist = Math.sqrt(px*px+py*py);
    if (dist >= R-0.5 || dist < 0.001) return null;
    const nx = px/dist, ny = py/dist;
    const newBx = bx + nx*(R-dist);
    const newBy = by + ny*(R-dist);
    const dot = vx*nx + vy*ny;
    if (dot >= 0) return {x:newBx, y:newBy, vx, vy};
    const r = (rest !== undefined) ? rest : 0.48;
    let nvx = vx - (1+r)*dot*nx;
    let nvy = vy - (1+r)*dot*ny;
    const tx = -ny, ty = nx;
    const td = nvx*tx + nvy*ty;
    nvx -= 0.18 * td * tx;
    nvy -= 0.18 * td * ty;
    return {x:newBx, y:newBy, vx:nvx, vy:nvy};
}

function doPhysicsStep(lvl) {
    ball.vy += GRAVITY / SUBSTEPS;
    
    // Auto-roll forward motor so the ball doesn't sit stuck on flat platforms
    if (ball.alive) {
        ball.vx += 0.6 / SUBSTEPS;
    }

    const spd = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
    if (spd > MAX_SPEED) { ball.vx *= MAX_SPEED/spd; ball.vy *= MAX_SPEED/spd; }
    ball.x += ball.vx / SUBSTEPS;
    ball.y += ball.vy / SUBSTEPS;

    const segs = [];
    for (const s of lvl.segs)    segs.push({...s, rest:0.42, kill:false});
    for (const s of userSegs)    segs.push({x1:s.x1,y1:s.y1,x2:s.x2,y2:s.y2,rest:0.45,kill:false});
    for (const p of lvl.platforms) {
        segs.push({x1:p.x,y1:p.y,x2:p.x+p.w,y2:p.y,rest:0.3,kill:false});
        segs.push({x1:p.x,y1:p.y+p.h,x2:p.x+p.w,y2:p.y+p.h,rest:0.3,kill:false});
        segs.push({x1:p.x,y1:p.y,x2:p.x,y2:p.y+p.h,rest:0.3,kill:false});
        segs.push({x1:p.x+p.w,y1:p.y,x2:p.x+p.w,y2:p.y+p.h,rest:0.3,kill:false});
    }
    for (const h of lvl.hammers) {
        const hx1=h.cx+Math.cos(h.angle)*h.len, hy1=h.cy+Math.sin(h.angle)*h.len;
        const hx2=h.cx-Math.cos(h.angle)*h.len, hy2=h.cy-Math.sin(h.angle)*h.len;
        segs.push({x1:hx1,y1:hy1,x2:hx2,y2:hy2,rest:0.6,kill:false});
    }
    for (const sp of lvl.spikes) {
        segs.push({x1:sp.x,y1:sp.y,x2:sp.x+sp.w,y2:sp.y,rest:0,kill:true});
    }
    for (const g of lvl.gates) {
        if (!g.open) segs.push({x1:g.x1,y1:g.y1,x2:g.x2,y2:g.y2,rest:0.3,kill:false});
    }
    for (const seg of segs) {
        const res = circleSegCollide(ball.x,ball.y,ball.vx,ball.vy,
            seg.x1,seg.y1,seg.x2,seg.y2,seg.rest);
        if (res) {
            if (seg.kill) { die(); return; }
            ball.x=res.x; ball.y=res.y; ball.vx=res.vx; ball.vy=res.vy;
        }
    }
}

function initBall(lvl) {
    ball = { x:lvl.ball.x, y:lvl.ball.y, vx:0, vy:0, trail:[], alive:true };
}

function spawnParticles(x, y, color, count) {
    count = count || 18;
    for (var i=0; i<count; i++) {
        var a = Math.random()*Math.PI*2, s = Math.random()*5+1;
        particles.push({ x:x, y:y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:1, color:color });
    }
}

function ptOnCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    var cl   = e.touches ? e.touches[0] : e;
    return {
        x: (cl.clientX - rect.left) * (800 / rect.width),
        y: (cl.clientY - rect.top)  * (480 / rect.height)
    };
}

canvas.addEventListener('pointerdown', function(e) {
    if (mode !== 'draw') return;
    e.preventDefault();
    var p = ptOnCanvas(e);
    curSeg = { points:[p], lastX:p.x, lastY:p.y };
}, {passive:false});

canvas.addEventListener('pointermove', function(e) {
    if (!curSeg || mode !== 'draw') return;
    e.preventDefault();
    var p = ptOnCanvas(e);
    var dx = p.x-curSeg.lastX, dy = p.y-curSeg.lastY;
    var d  = Math.sqrt(dx*dx+dy*dy);
    if (d < 4) return;
    var budget = LEVELS[levelIdx].inkBudget;
    if (inkUsed + d > budget) return;
    inkUsed += d;
    curSeg.points.push(p);
    curSeg.lastX = p.x; curSeg.lastY = p.y;
    updateInkBar();
}, {passive:false});

canvas.addEventListener('pointerup', function(e) {
    if (!curSeg || mode !== 'draw') return;
    e.preventDefault();
    if (curSeg.points.length > 1) {
        var added = 0;
        for (var i=0; i<curSeg.points.length-1; i++) {
            userSegs.push({
                x1:curSeg.points[i].x,   y1:curSeg.points[i].y,
                x2:curSeg.points[i+1].x, y2:curSeg.points[i+1].y
            });
            added++;
        }
        undoGroups.push(added);
    }
    curSeg = null;
}, {passive:false});

function undoLine() {
    if (!undoGroups.length || mode !== 'draw') return;
    var n = undoGroups.pop();
    userSegs.splice(userSegs.length - n, n);
    inkUsed = userSegs.reduce(function(sum,s) {
        var dx=s.x2-s.x1, dy=s.y2-s.y1; return sum+Math.sqrt(dx*dx+dy*dy);
    }, 0);
    updateInkBar();
}

function updateInkBar() {
    var budget = LEVELS[levelIdx].inkBudget;
    var pct    = Math.max(0, 1 - inkUsed/budget);
    var bar    = document.getElementById('inkBar');
    bar.style.width = (pct*100) + '%';
    if (pct < 0.25) bar.classList.add('low'); else bar.classList.remove('low');
}

function loadLevel(idx) {
    levelIdx = idx; retries = 0; inkUsed = 0; mode = 'draw';
    userSegs = []; undoGroups = []; particles = []; curSeg = null;
    var lvl  = LEVELS[idx];
    resizeCanvas();
    lvl.keys.forEach(function(k) { k.collected = false; });
    lvl.gates.forEach(function(g) { g.open = false; });
    lvl.platforms.forEach(function(p) { if(p._dir===undefined) p._dir=1; });
    lvl.hammers.forEach(function(h) { h.angle = 0; });
    initBall(lvl);
    document.getElementById('levelName').textContent = 'Level '+(idx+1)+': '+lvl.name;
    updateInkBar();
    document.getElementById('overlayDead').classList.add('hidden');
    document.getElementById('overlayWin').classList.add('hidden');
    document.getElementById('overlayHint').classList.add('hidden');
    setDrawMode();
    showScreen('game');
}

function setDrawMode() {
    mode = 'draw';
    document.getElementById('btnDraw').classList.add('active');
    document.getElementById('btnPlay').classList.remove('active','play-active');
    initBall(LEVELS[levelIdx]);
    particles = [];
}

function startPlay() {
    if (mode !== 'draw') return;
    mode = 'play'; playTime = Date.now();
    document.getElementById('btnPlay').classList.add('play-active');
    document.getElementById('btnDraw').classList.remove('active');
}

function die() {
    if (mode !== 'play') return;
    mode = 'dead'; retries++;
    spawnParticles(ball.x, ball.y, '#ff4444', 25);
    ball.alive = false;
    setTimeout(function(){ document.getElementById('overlayDead').classList.remove('hidden'); }, 700);
}

function win() {
    if (mode !== 'play') return;
    mode = 'won';
    var lvl     = LEVELS[levelIdx];
    var elapsed = (Date.now() - playTime) / 1000;
    var pct     = Math.max(0, 1 - inkUsed / lvl.inkBudget);
    var stars = 1;
    if (pct >= 0.45 && retries <= 2) stars = 2;
    if (pct >= 0.70 && retries === 0) stars = 3;
    var prev = savedProgress[levelIdx] || 0;
    if (stars > prev) {
        savedProgress[levelIdx] = stars;
        try { localStorage.setItem('ndbProg', JSON.stringify(savedProgress)); } catch(e){}
    }
    spawnParticles(lvl.goal.x, lvl.goal.y, '#00ffcc', 40);
    setTimeout(function() {
        document.getElementById('winStars').textContent  = ('⭐'.repeat(stars))+'☆'.repeat(3-stars);
        document.getElementById('winTime').textContent   = '⏱ '+elapsed.toFixed(1)+'s';
        document.getElementById('winInk').textContent   = '🖊 Ink saved: '+Math.round(pct*100)+'%';
        var nextBtn = document.getElementById('btnNext');
        nextBtn.style.display = (levelIdx < LEVELS.length-1) ? '' : 'none';
        document.getElementById('overlayWin').classList.remove('hidden');
    }, 900);
}

function update() {
    if (mode !== 'play') return;
    var lvl = LEVELS[levelIdx];
    lvl.platforms.forEach(function(p) {
        if (p.axis === 'x') {
            p.x += p.speed * p._dir;
            if (p.x > p.max) { p.x = p.max; p._dir = -1; }
            if (p.x < p.min) { p.x = p.min; p._dir = 1; }
        } else {
            p.y += p.speed * p._dir;
            if (p.y > p.max) { p.y = p.max; p._dir = -1; }
            if (p.y < p.min) { p.y = p.min; p._dir = 1; }
        }
    });
    lvl.hammers.forEach(function(h) { h.angle += h.speed; });
    lvl.fans.forEach(function(f) {
        if (ball.x>=f.x && ball.x<=f.x+f.w && ball.y>=f.y && ball.y<=f.y+f.h) {
            ball.vx += Math.cos(f.angle)*f.force;
            ball.vy += Math.sin(f.angle)*f.force;
        }
    });
    lvl.keys.forEach(function(k) {
        if (!k.collected) {
            var dx=ball.x-k.x, dy=ball.y-k.y;
            if (Math.sqrt(dx*dx+dy*dy) < R+k.r) {
                k.collected = true;
                lvl.gates.forEach(function(g) { if(g.keyId===k.id) g.open=true; });
                spawnParticles(k.x, k.y, '#ffd700', 20);
            }
        }
    });
    for (var s=0; s<SUBSTEPS; s++) doPhysicsStep(lvl);
    if (ball.alive) {
        ball.trail.push({x:ball.x, y:ball.y});
        if (ball.trail.length > TRAIL_LEN) ball.trail.shift();
    }
    if (ball.y > 540 || ball.x < -60 || ball.x > 860) { die(); return; }
    var gx=lvl.goal.x, gy=lvl.goal.y, dx=ball.x-gx, dy2=ball.y-gy;
    
    // Forgiving hitbox for goal triggers
    if (Math.sqrt(dx*dx+dy2*dy2) < 40) win();
    for (var i=particles.length-1; i>=0; i--) {
        var p=particles[i];
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=0.022;
        if(p.life<=0) particles.splice(i,1);
    }
}

function render() {
    ctx.clearRect(0,0,800,480);
    ctx.fillStyle='#0a0a0f'; ctx.fillRect(0,0,800,480);

    var lvl = LEVELS[levelIdx];
    ctx.lineWidth=3; ctx.lineCap='round';
    ctx.strokeStyle='#3366ff'; ctx.shadowBlur=8; ctx.shadowColor='#3366ff';
    lvl.segs.forEach(function(s){ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();});
    ctx.shadowBlur=0;

    ctx.fillStyle='#ff2244'; ctx.shadowBlur=10; ctx.shadowColor='#ff2244';
    lvl.spikes.forEach(function(sp){
        var sw=18,sh=22;
        for(var sx=sp.x;sx<sp.x+sp.w-2;sx+=sw){
            ctx.beginPath();ctx.moveTo(sx,sp.y);ctx.lineTo(sx+sw/2,sp.y-sh);ctx.lineTo(sx+sw,sp.y);ctx.closePath();ctx.fill();
        }
    });
    ctx.shadowBlur=0;

    ctx.fillStyle='#bc13fe'; ctx.shadowBlur=14; ctx.shadowColor='#bc13fe';
    lvl.platforms.forEach(function(p){ctx.fillRect(p.x,p.y,p.w,p.h);});
    ctx.shadowBlur=0;

    ctx.lineWidth=8; ctx.lineCap='round';
    ctx.strokeStyle='#ff6600'; ctx.shadowBlur=14; ctx.shadowColor='#ff6600';
    lvl.hammers.forEach(function(h){
        var hx1=h.cx+Math.cos(h.angle)*h.len,hy1=h.cy+Math.sin(h.angle)*h.len;
        var hx2=h.cx-Math.cos(h.angle)*h.len,hy2=h.cy-Math.sin(h.angle)*h.len;
        ctx.beginPath();ctx.moveTo(hx1,hy1);ctx.lineTo(hx2,hy2);ctx.stroke();
        ctx.fillStyle='#fff';ctx.shadowBlur=0;
        ctx.beginPath();ctx.arc(h.cx,h.cy,6,0,Math.PI*2);ctx.fill();
    });
    ctx.shadowBlur=0;

    ctx.lineWidth=2;
    lvl.fans.forEach(function(f){
        ctx.fillStyle='rgba(0,200,255,0.1)';ctx.fillRect(f.x,f.y,f.w,f.h);
        ctx.strokeStyle='#00c8ff';ctx.shadowBlur=8;ctx.shadowColor='#00c8ff';
        ctx.strokeRect(f.x,f.y,f.w,f.h);
        var mx=f.x+f.w/2,my=f.y+f.h/2;
        ctx.fillStyle='#00c8ff';
        ctx.beginPath();ctx.moveTo(mx,my);
        ctx.lineTo(mx+Math.cos(f.angle)*35,my+Math.sin(f.angle)*35);ctx.stroke();
        ctx.shadowBlur=0;
    });

    lvl.keys.forEach(function(k){
        if(k.collected) return;
        ctx.fillStyle='#ffd700';ctx.shadowBlur=16;ctx.shadowColor='#ffd700';
        ctx.beginPath();ctx.arc(k.x,k.y,k.r,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0; ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle='#000';ctx.fillText('K',k.x,k.y);
    });

    ctx.lineWidth=5;ctx.setLineDash([10,6]);
    lvl.gates.forEach(function(g){
        if(g.open) return;
        ctx.strokeStyle='#ffd700';ctx.shadowBlur=12;ctx.shadowColor='#ffd700';
        ctx.beginPath();ctx.moveTo(g.x1,g.y1);ctx.lineTo(g.x2,g.y2);ctx.stroke();
    });
    ctx.setLineDash([]);ctx.shadowBlur=0;

    // User lines
    ctx.lineWidth=4;ctx.lineCap='round';
    ctx.strokeStyle='#00ffcc';ctx.shadowBlur=12;ctx.shadowColor='#00ffcc';
    userSegs.forEach(function(s){ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();});
    if(curSeg && curSeg.points.length>1){
        ctx.beginPath();ctx.moveTo(curSeg.points[0].x,curSeg.points[0].y);
        curSeg.points.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.stroke();
    }
    ctx.shadowBlur=0;

    var gp=lvl.goal, pulse=22+Math.sin(Date.now()/400)*5;
    ctx.strokeStyle='#00ffcc';ctx.lineWidth=3;ctx.shadowBlur=22;ctx.shadowColor='#00ffcc';
    ctx.beginPath();ctx.arc(gp.x,gp.y,pulse,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(0,255,204,0.18)';
    ctx.beginPath();ctx.arc(gp.x,gp.y,pulse-5,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;

    if(mode==='draw'){
        ctx.strokeStyle='rgba(0,255,204,0.3)';ctx.lineWidth=2;ctx.setLineDash([5,5]);
        ctx.beginPath();ctx.arc(lvl.ball.x,lvl.ball.y,R,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }

    // Trail
    for(var ti=0;ti<ball.trail.length;ti++){
        var tp=ball.trail[ti],ta=(ti/ball.trail.length)*0.55,tr=R*(ti/ball.trail.length)*0.75;
        ctx.globalAlpha=ta;ctx.fillStyle='#00ffcc';
        ctx.beginPath();ctx.arc(tp.x,tp.y,tr,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;

    // Ball
    if(ball && ball.alive){
        ctx.fillStyle='#00ffcc';ctx.shadowBlur=22;ctx.shadowColor='#00ffcc';
        ctx.beginPath();ctx.arc(ball.x,ball.y,R,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }

    particles.forEach(function(p){
        ctx.globalAlpha=p.life;ctx.fillStyle=p.color;
        ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;
}

var rafId;
function loop(){
    try {
        update();
        render();
    } catch(e) {
        console.error("NDB Loop Error:", e);
    }
    rafId=requestAnimationFrame(loop);
}

function resizeCanvas() {
    var wrapper = document.querySelector('.canvas-wrapper');
    if(!wrapper) return;
    var wr = wrapper.clientWidth, wh = wrapper.clientHeight;
    if (wr === 0 || wh === 0) {
        wr = window.innerWidth;
        wh = window.innerHeight * 0.7;
    }
    canvas.width=800; canvas.height=480;
    var scale = Math.min(wr/800, wh/480);
    canvas.style.width  = Math.round(800*scale)+'px';
    canvas.style.height = Math.round(480*scale)+'px';
}
window.addEventListener('resize', resizeCanvas);

function showScreen(id){
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    var el=document.getElementById('screen'+id.charAt(0).toUpperCase()+id.slice(1));
    if(el) {
        el.classList.add('active');
        resizeCanvas();
    }
}

function buildMenu(){
    var grid=document.getElementById('levelGrid');
    grid.innerHTML='';
    LEVELS.forEach(function(lvl,i){
        var stars=savedProgress[i]||0;
        var unlocked = (i === 0) || (savedProgress[i-1] !== undefined && savedProgress[i-1] > 0);
        var card=document.createElement('div');
        card.className='level-card' + (unlocked ? '' : ' locked');
        if (unlocked) {
            card.innerHTML='<div class="lc-num">'+(i+1)+'</div>'
                +'<div class="lc-name">'+lvl.name+'</div>'
                +'<div class="lc-stars">'+'⭐'.repeat(stars)+'☆'.repeat(3-stars)+'</div>';
            card.addEventListener('click',function(){loadLevel(i);});
        } else {
            card.innerHTML='<div class="lc-num">🔒</div>'
                +'<div class="lc-name">Locked</div>'
                +'<div class="lc-stars">☆☆☆</div>';
        }
        grid.appendChild(card);
    });
}

document.getElementById('btnDraw').addEventListener('click', setDrawMode);
document.getElementById('btnPlay').addEventListener('click', startPlay);
document.getElementById('btnUndo').addEventListener('click', undoLine);
document.getElementById('btnRestart').addEventListener('click', function(){ loadLevel(levelIdx); });
document.getElementById('btnHint').addEventListener('click', function(){
    document.getElementById('hintText').textContent=LEVELS[levelIdx].hint;
    document.getElementById('overlayHint').classList.remove('hidden');
});
document.getElementById('btnCloseHint').addEventListener('click', function(){
    document.getElementById('overlayHint').classList.add('hidden');
});
document.getElementById('btnRetry').addEventListener('click', function(){
    document.getElementById('overlayDead').classList.add('hidden'); setDrawMode();
});
document.getElementById('btnMenuFromDead').addEventListener('click', function(){
    document.getElementById('overlayDead').classList.add('hidden'); buildMenu(); showScreen('menu');
});
document.getElementById('btnNext').addEventListener('click', function(){
    document.getElementById('overlayWin').classList.add('hidden');
    if(levelIdx<LEVELS.length-1) loadLevel(levelIdx+1); else { buildMenu(); showScreen('menu'); }
});
document.getElementById('btnMenuFromWin').addEventListener('click', function(){
    document.getElementById('overlayWin').classList.add('hidden'); buildMenu(); showScreen('menu');
});

window.addEventListener('keydown', function(e){
    if(e.code==='Space'){e.preventDefault(); if(mode==='draw') startPlay(); else if(mode==='play') setDrawMode();}
    if(e.code==='KeyR') loadLevel(levelIdx);
    if(e.code==='KeyZ'&&(e.ctrlKey||e.metaKey)) undoLine();
});

buildMenu(); showScreen('menu'); resizeCanvas(); loop();
