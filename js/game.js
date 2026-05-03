/**
 * game.js — Gesture Commander
 * CV Pose Classification + Wave Survival
 *
 * Pose detection: rule-based landmark geometry
 *   · Each finger: extended if dist(tip, wrist) > dist(pip, wrist) × 1.05
 *   · Thumb: tip.y < palm centroid.y − threshold
 *   · 7 poses → 7 distinct battle commands
 *
 * Mechanic: hold a pose for HOLD_FRAMES (~0.5 s) → command fires
 *           visual arc around wrist shows hold progress
 */

'use strict';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const STATES = Object.freeze({
    INTRO:'intro', LOADING:'loading', PLAYING:'playing', GAMEOVER:'gameover',
});

/** MediaPipe hand skeleton pairs */
const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17],
];

/** Enemy types — procedurally drawn sprites (no external assets) */
const ENEMY_TYPES = [
    { name:'Slime',   hp:2, spd:1.8, color:'#00b894', r:26 },
    { name:'Phantom', hp:3, spd:1.4, color:'#a29bfe', r:30 },
    { name:'Golem',   hp:6, spd:0.8, color:'#b2bec3', r:40 },
    { name:'Imp',     hp:4, spd:1.6, color:'#e17055', r:34 },
    { name:'Specter', hp:3, spd:2.2, color:'#fd79a8', r:28 },
];

/**
 * Pose → command definition
 * cooldown: frames before same pose can fire again
 */
const COMMANDS = {
    FIST:      { name:'EXPLOSION', icon:'✊', color:'#e17055', cooldown:90  },
    OPEN:      { name:'SHIELD',    icon:'🖐️', color:'#74b9ff', cooldown:120 },
    POINT:     { name:'LASER',     icon:'☝️', color:'#23f5b2', cooldown:20  },
    PEACE:     { name:'SPREAD',    icon:'✌️', color:'#fd79a8', cooldown:35  },
    THREE:     { name:'BARRAGE',   icon:'🖖', color:'#fdcb6e', cooldown:50  },
    ROCK_ON:   { name:'CHAIN',     icon:'🤘', color:'#a29bfe', cooldown:70  },
    THUMBS_UP: { name:'FREEZE',    icon:'👍', color:'#55efc4', cooldown:100 },
};

const HOLD_FRAMES = 28;   // frames to hold before firing (~0.5 s at 60 fps)
const LANES       = 3;    // number of enemy lanes
const BASE_X      = 58;   // player base x-position (px)

// MONSTER_DRAW is loaded from js/monsters.js (must be included before this script)
if (typeof MONSTER_DRAW === 'undefined') {
    throw new Error('monsters.js must be loaded before game.js');
}

/* ═══════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════ */
const canvas          = document.getElementById('gameCanvas');
const ctx             = canvas.getContext('2d');
const introOverlay    = document.getElementById('introOverlay');
const loadingOverlay  = document.getElementById('loadingOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn        = document.getElementById('startBtn');
const restartBtn      = document.getElementById('restartBtn');
const scoreDisplay    = document.getElementById('scoreDisplay');
const waveDisplay     = document.getElementById('waveDisplay');
const livesDisplay    = document.getElementById('livesDisplay');
const finalScoreEl    = document.getElementById('finalScore');
const finalWaveEl     = document.getElementById('finalWave');
const poseNameEl      = document.getElementById('poseName');
const cmdNameEl       = document.getElementById('cmdName');
const holdBarEl       = document.getElementById('holdBar');
const cmdItems        = document.querySelectorAll('.cmdItem[data-pose]');

/* ═══════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════ */
let gameState      = STATES.INTRO;
let score          = 0;
let lives          = 5;
let wave           = 1;
let frameCount     = 0;

let enemies        = [];
let projectiles    = [];
let particles      = [];
let effects        = [];
let shields        = [];    // active shield walls [{x, duration, maxDur, color}]
let freezeFrames   = 0;     // remaining freeze duration

let waveEnemiesLeft = 0;
let betweenWaves    = false;
let waveDelay       = 0;
let spawnTimer      = null;

/* ═══════════════════════════════════════════════
   CV / HAND STATE
═══════════════════════════════════════════════ */
let handLandmarks  = null;  // raw MediaPipe landmarks
let fingerPos      = null;  // {x, y, landmarks[]} — index tip (canvas coords)
let currentPose    = null;  // pose string | null
let poseHoldFrames = 0;
let cmdCooldowns   = {};    // pose → remaining cooldown frames

/* ═══════════════════════════════════════════════
   CANVAS / VIDEO
═══════════════════════════════════════════════ */
let CW = 640, CH = 480;
let videoEl    = null;
let handsModel = null;
let frameId    = null;

function resizeCanvas() {
    const w = canvas.parentElement.clientWidth || 640;
    CW = Math.min(w, 900);
    CH = Math.round(CW * 0.75);
    canvas.width  = CW;
    canvas.height = CH;
}
window.addEventListener('resize', resizeCanvas);
requestAnimationFrame(resizeCanvas);

/** Lane y-positions: evenly distributed across canvas height */
const laneY = l => CH * (0.22 + l * 0.28);

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,   x+w,y+r);   ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h, x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,   x,y+h-r);   ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,     x+r,y);      ctx.closePath();
}

function floatText(x, y, text, color, size=20) {
    return {
        x,y,text,color,size,life:1,
        update(){ this.y-=1.6; this.life-=0.02; },
        draw(){
            ctx.save(); ctx.globalAlpha=Math.max(0,this.life);
            ctx.font=`bold ${this.size}px "SUIT",sans-serif`;
            ctx.textAlign='center'; ctx.fillStyle=this.color;
            ctx.shadowColor=this.color; ctx.shadowBlur=8;
            ctx.fillText(this.text,this.x,this.y); ctx.restore();
        },
        isDead(){ return this.life<=0; },
    };
}

/* ═══════════════════════════════════════════════
   RULE-BASED POSE DETECTION
   Finger extension: dist(tip,wrist) > dist(pip,wrist) × 1.05
   (rotation-invariant; works regardless of hand tilt)
═══════════════════════════════════════════════ */
function fingerUp(lms, tipIdx, pipIdx) {
    const w = lms[0], t = lms[tipIdx], q = lms[pipIdx];
    const dTip = Math.hypot(t.x-w.x, t.y-w.y);
    const dPip = Math.hypot(q.x-w.x, q.y-w.y);
    return dTip > dPip * 1.05;
}

function classifyPose(lms) {
    if (!lms) return null;

    const idx = fingerUp(lms, 8,  6);
    const mid = fingerUp(lms, 12, 10);
    const rng = fingerUp(lms, 16, 14);
    const pky = fingerUp(lms, 20, 18);

    // Thumb: tip.y < palm centroid.y means pointing upward
    const palmY = (lms[5].y + lms[9].y + lms[13].y + lms[17].y) / 4;
    const thm   = lms[4].y < palmY - 0.05;

    const count = [idx,mid,rng,pky].filter(Boolean).length;

    if (count===4)                            return 'OPEN';
    if (!idx && !mid && !rng && !pky && !thm) return 'FIST';
    if (!idx && !mid && !rng && !pky &&  thm) return 'THUMBS_UP';
    if ( idx && !mid && !rng && !pky)         return 'POINT';
    if ( idx &&  mid && !rng && !pky)         return 'PEACE';
    if ( idx &&  mid &&  rng && !pky)         return 'THREE';
    if ( idx && !mid && !rng &&  pky)         return 'ROCK_ON';
    return null;
}

/* ═══════════════════════════════════════════════
   GAME INIT
═══════════════════════════════════════════════ */
async function startGame() {
    gameState = STATES.LOADING;
    introOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video:{ width:{ideal:640}, height:{ideal:480}, facingMode:'user' },
        });
        videoEl = document.createElement('video');
        videoEl.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.appendChild(videoEl);
        Object.assign(videoEl, { srcObject:stream, autoplay:true, playsInline:true, muted:true });
        resizeCanvas();
        await videoEl.play().catch(()=>{});
        await new Promise(res=>{
            if(videoEl.readyState>=2){res();return;}
            videoEl.addEventListener('loadeddata',res,{once:true});
        });

        handsModel = new Hands({ locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
        handsModel.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.7, minTrackingConfidence:0.5 });
        handsModel.onResults(onHandResults);

        // Reset
        score=0; lives=5; wave=1; frameCount=0;
        enemies=[]; projectiles=[]; particles=[]; effects=[]; shields=[];
        cmdCooldowns={}; currentPose=null; poseHoldFrames=0;
        freezeFrames=0; betweenWaves=false; waveDelay=0;

        startWave(1);
        updateHUD();

        loadingOverlay.classList.add('hidden');
        gameState = STATES.PLAYING;
        gameLoop();
        sendFrames();

    } catch(err) {
        console.error('[GestureCommander]', err);
        loadingOverlay.classList.add('hidden');
        introOverlay.classList.remove('hidden');
        alert('⚠️  Camera access required. Please allow and try again.');
    }
}

/* ═══════════════════════════════════════════════
   MEDIAPIPE FRAME PIPELINE
═══════════════════════════════════════════════ */
async function sendFrames() {
    if (gameState===STATES.GAMEOVER) return;
    if (videoEl && handsModel && videoEl.readyState>=2) {
        try { await handsModel.send({image:videoEl}); } catch(_){}
    }
    setTimeout(sendFrames, 33);
}

function onHandResults(results) {
    if (!results.multiHandLandmarks?.length) {
        handLandmarks=null; fingerPos=null; return;
    }
    const lm = results.multiHandLandmarks[0];
    handLandmarks = lm;
    fingerPos = { x:(1-lm[8].x)*CW, y:lm[8].y*CH, landmarks:lm };
}

/* ═══════════════════════════════════════════════
   WAVE MANAGEMENT
═══════════════════════════════════════════════ */
function startWave(waveNum) {
    waveEnemiesLeft = 3 + waveNum * 2;
    const interval  = Math.max(350, 1100 - waveNum * 70);
    clearInterval(spawnTimer);
    spawnTimer = setInterval(()=>{
        if (gameState!==STATES.PLAYING){ clearInterval(spawnTimer); return; }
        if (waveEnemiesLeft<=0){ clearInterval(spawnTimer); return; }
        enemies.push(new Enemy(waveNum));
        waveEnemiesLeft--;
    }, interval);
}

function checkWaveComplete() {
    if (waveEnemiesLeft>0 || enemies.length>0 || betweenWaves) return;
    betweenWaves  = true;
    waveDelay     = 200;
    score        += wave * 50;
    updateHUD();
    effects.push(floatText(CW/2, CH/2-50, `✅ Wave ${wave} cleared! +${wave*50}`, '#23f5b2', 26));
}

/* ═══════════════════════════════════════════════
   ENEMY
═══════════════════════════════════════════════ */
class Enemy {
    constructor(waveNum) {
        const pool = ENEMY_TYPES.slice(0, Math.min(2+waveNum, ENEMY_TYPES.length));
        this.type  = pool[Math.floor(Math.random()*pool.length)];
        this.lane  = Math.floor(Math.random()*LANES);
        this.x     = CW + this.type.r + 10;
        this.y     = laneY(this.lane);
        this.maxHp = this.type.hp + Math.floor(waveNum/2);
        this.hp    = this.maxHp;
        this.spd   = this.type.spd * (1 + waveNum*0.05);
        this.r     = this.type.r;
        this.color = this.type.color;
        this.flash = 0;
        this.frozen= false;
        this.bob   = Math.random()*Math.PI*2;
    }

    update() {
        this.bob += 0.05;
        this.x -= this.frozen ? this.spd*0.18 : this.spd;
        if (this.flash>0) this.flash--;
    }

    hit(dmg) {
        this.hp  -= dmg;
        this.flash = 8;
        if (this.hp<=0) {
            score += this.maxHp*10;
            for(let i=0;i<14;i++) particles.push(new Particle(this.x,this.y,this.color));
            effects.push(floatText(this.x,this.y-22,`+${this.maxHp*10}`,this.color,19));
            return true;
        }
        return false;
    }

    draw() {
        const y = this.y + Math.sin(this.bob)*3;

        // Procedural monster sprite
        const renderer = MONSTER_DRAW[this.type.name];
        if (renderer) renderer(ctx, this.x, y, this.r, this.bob*2, this.flash, this.frozen);

        // Frozen ice overlay
        if (this.frozen) {
            ctx.save(); ctx.globalAlpha=0.22;
            ctx.beginPath(); ctx.arc(this.x,y,this.r*1.08,0,Math.PI*2);
            ctx.fillStyle='#74b9ff'; ctx.fill();
            ctx.strokeStyle='#74b9ff'; ctx.lineWidth=1.5;
            ctx.shadowColor='#74b9ff'; ctx.shadowBlur=10; ctx.stroke();
            ctx.restore();
        }

        // HP bar
        ctx.save();
        const bx=this.x-this.r, by=y+this.r+8, bw=this.r*2, bh=4;
        ctx.globalAlpha=0.88; ctx.shadowBlur=0;
        ctx.beginPath(); ctx.rect(bx,by,bw,bh); ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fill();
        ctx.beginPath(); ctx.rect(bx,by,bw*(this.hp/this.maxHp),bh);
        ctx.fillStyle=this.hp/this.maxHp>0.5?'#23f5b2':'#ff6348'; ctx.fill();
        ctx.restore();
    }

    reachedBase(){ return this.x-this.r < BASE_X+10; }
}

/* ═══════════════════════════════════════════════
   PROJECTILE
═══════════════════════════════════════════════ */
class Projectile {
    constructor(x,y,vx,vy,dmg,color,size=8){
        this.x=x; this.y=y; this.vx=vx; this.vy=vy;
        this.dmg=dmg; this.color=color; this.size=size;
        this.dead=false;
    }
    update(){
        this.x+=this.vx; this.y+=this.vy;
        if(this.x>CW+20||this.y<-20||this.y>CH+20) this.dead=true;
    }
    checkHits(){
        if(this.dead) return;
        for(const e of enemies){
            if(Math.hypot(this.x-e.x,this.y-e.y)<e.r+this.size){
                const died=e.hit(this.dmg);
                if(died){ enemies=enemies.filter(en=>en!==e); updateHUD(); }
                for(let i=0;i<5;i++) particles.push(new Particle(this.x,this.y,this.color));
                this.dead=true; return;
            }
        }
    }
    draw(){
        ctx.save();
        const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size*2.5);
        g.addColorStop(0,this.color+'ff'); g.addColorStop(.5,this.color+'80'); g.addColorStop(1,this.color+'00');
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size*2.5,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
        ctx.fillStyle=this.color; ctx.shadowColor=this.color; ctx.shadowBlur=8; ctx.fill();
        ctx.restore();
    }
    isDead(){ return this.dead; }
}

/* ═══════════════════════════════════════════════
   PARTICLE
═══════════════════════════════════════════════ */
class Particle {
    constructor(x,y,color){
        this.x=x; this.y=y; this.color=color;
        this.vx=(Math.random()-.5)*11; this.vy=(Math.random()-.5)*11;
        this.r=2+Math.random()*5; this.life=1;
    }
    update(){ this.x+=this.vx; this.y+=this.vy; this.vy+=.3; this.life-=.028; }
    draw(){
        ctx.save(); ctx.globalAlpha=Math.max(0,this.life);
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
        ctx.fillStyle=this.color; ctx.fill(); ctx.restore();
    }
    isDead(){ return this.life<=0; }
}

/* ═══════════════════════════════════════════════
   FIRE COMMANDS
═══════════════════════════════════════════════ */
function fireCommand(pose) {
    const cmd = COMMANDS[pose];
    if (!cmd) return;

    // Fullscreen colour flash
    effects.push({
        life:1, color:cmd.color,
        update(){ this.life-=0.10; },
        draw(){
            ctx.save(); ctx.globalAlpha=Math.max(0,this.life*0.13);
            ctx.fillStyle=this.color; ctx.fillRect(0,0,CW,CH); ctx.restore();
        },
        isDead(){ return this.life<=0; },
    });

    const cy = CH/2;

    switch(pose) {
        case 'FIST': {
            // Explosion — destroys all enemies within large radius
            const ex=CW*0.45;
            const rad=CW*0.38;
            for(let i=0;i<35;i++){
                const a=(i/35)*Math.PI*2, d=Math.random()*rad;
                particles.push(new Particle(ex+Math.cos(a)*d, cy+Math.sin(a)*d, cmd.color));
            }
            const n0=enemies.length;
            enemies=enemies.filter(e=>Math.hypot(e.x-ex,e.y-cy)>=rad);
            score+=(n0-enemies.length)*20;
            effects.push(floatText(ex,cy-45,'💥 EXPLOSION!',cmd.color,28));
            updateHUD(); break;
        }
        case 'OPEN': {
            shields.push({x:BASE_X+70, duration:180, maxDur:180, color:cmd.color});
            effects.push(floatText(BASE_X+90,cy-40,'🛡️ SHIELD UP!',cmd.color,24)); break;
        }
        case 'POINT': {
            const tgt=enemies.reduce((n,e)=>(!n||e.x<n.x)?e:n,null);
            if(tgt){
                const a=Math.atan2(tgt.y-cy,tgt.x-BASE_X);
                projectiles.push(new Projectile(BASE_X+25,cy,Math.cos(a)*13,Math.sin(a)*13,3,cmd.color,6));
            } else {
                projectiles.push(new Projectile(BASE_X+25,cy,13,0,3,cmd.color,6));
            }
            effects.push(floatText(BASE_X+50,cy-30,'⚡ LASER!',cmd.color,20)); break;
        }
        case 'PEACE': {
            [-14,14].forEach(deg=>{
                const rad=(deg*Math.PI)/180;
                projectiles.push(new Projectile(BASE_X+25,cy,Math.cos(rad)*10,Math.sin(rad)*10,2,cmd.color,7));
            });
            effects.push(floatText(BASE_X+50,cy-30,'✌️ SPREAD!',cmd.color,20)); break;
        }
        case 'THREE': {
            [-20,0,20].forEach(deg=>{
                const rad=(deg*Math.PI)/180;
                projectiles.push(new Projectile(BASE_X+25,cy,Math.cos(rad)*9,Math.sin(rad)*9,2,cmd.color,7));
            });
            effects.push(floatText(BASE_X+50,cy-30,'🖖 BARRAGE!',cmd.color,20)); break;
        }
        case 'ROCK_ON': {
            // Chain: stagger-hit every enemy
            [...enemies].sort((a,b)=>a.x-b.x).forEach((e,i)=>{
                setTimeout(()=>{
                    if(!enemies.includes(e)) return;
                    const died=e.hit(2);
                    if(died){ enemies=enemies.filter(en=>en!==e); updateHUD(); }
                    for(let j=0;j<7;j++) particles.push(new Particle(e.x,e.y,cmd.color));
                }, i*90);
            });
            effects.push(floatText(CW/2,cy-50,'⚡ CHAIN LIGHTNING!',cmd.color,26)); break;
        }
        case 'THUMBS_UP': {
            enemies.forEach(e=>e.frozen=true);
            freezeFrames=190;
            effects.push(floatText(CW/2,cy-50,'❄️ FREEZE!',cmd.color,26)); break;
        }
    }
}

/* ═══════════════════════════════════════════════
   POSE HOLD MECHANIC  (called every frame)
═══════════════════════════════════════════════ */
function processPoseHold() {
    // Tick cooldowns
    for(const p of Object.keys(cmdCooldowns))
        if(cmdCooldowns[p]>0) cmdCooldowns[p]--;

    // Tick freeze
    if(freezeFrames>0){
        freezeFrames--;
        if(freezeFrames===0) enemies.forEach(e=>e.frozen=false);
    }

    const pose = classifyPose(handLandmarks);

    if(pose && pose===currentPose){
        poseHoldFrames++;
        const cd=cmdCooldowns[pose]??0;
        if(poseHoldFrames>=HOLD_FRAMES && cd===0){
            fireCommand(pose);
            cmdCooldowns[pose]=(COMMANDS[pose]?.cooldown??30);
            poseHoldFrames=0;
        }
    } else {
        currentPose    = pose;
        poseHoldFrames = 0;
    }

    /* ── Update HTML HUD ──────────────────── */
    if(poseNameEl && cmdNameEl && holdBarEl){
        const cmd = pose ? COMMANDS[pose] : null;
        const cd  = pose ? (cmdCooldowns[pose]??0) : 0;

        if(cmd){
            poseNameEl.textContent = `${cmd.icon} ${pose.replace('_',' ')}`;
            cmdNameEl.textContent  = cd>0 ? `${cmd.name} — cooling down` : cmd.name;
            const holdPct = Math.min(100,(poseHoldFrames/HOLD_FRAMES)*100);
            holdBarEl.style.width      = `${cd>0?100-(cd/cmd.cooldown*100):holdPct}%`;
            holdBarEl.style.background = cd>0 ? '#636e72' : cmd.color;
            holdBarEl.parentElement.style.opacity = cd>0 ? '0.45' : '1';
        } else {
            poseNameEl.textContent = pose ?? '— no hand —';
            cmdNameEl.textContent  = 'show a known gesture';
            holdBarEl.style.width  = '0%';
            holdBarEl.parentElement.style.opacity='1';
        }
    }

    // Highlight matching guide card
    cmdItems.forEach(el=>{
        el.classList.toggle('active', el.dataset.pose===pose);
    });
}

/* ═══════════════════════════════════════════════
   HUD
═══════════════════════════════════════════════ */
function updateHUD(){
    scoreDisplay.textContent = score;
    livesDisplay.textContent = '❤️'.repeat(Math.max(0,lives));
    if(waveDisplay) waveDisplay.textContent = wave;
}

/* ═══════════════════════════════════════════════
   DRAW: HAND SKELETON + HOLD ARC  (Spell-Caster style)
   · Bone color tracks current pose command color
   · Extended fingertips → pulsing magic orbs
   · Palm sigil (rotating rune) builds up while holding
   · Hold arc tip emits a spark
═══════════════════════════════════════════════ */
function drawHand(lms){
    const p = i=>({x:(1-lms[i].x)*CW, y:lms[i].y*CH});

    const cmd       = currentPose && COMMANDS[currentPose] ? COMMANDS[currentPose] : null;
    const cd        = cmd ? (cmdCooldowns[currentPose]??0) : 0;
    const onCooldown= cd > 0;
    const spellColor= onCooldown ? '#636e72' : (cmd?.color ?? '#23f5b2');

    // Which fingertips are extended?
    const TIP_PIPS = [[4,null],[8,6],[12,10],[16,14],[20,18]];
    const palmY = (lms[5].y+lms[9].y+lms[13].y+lms[17].y)/4;
    const extMap = {};
    for(const [ti, pi] of TIP_PIPS){
        extMap[ti] = pi===null ? lms[4].y < palmY - 0.05 : fingerUp(lms,ti,pi);
    }

    ctx.save();

    /* ── 1. Bone connections — gradient glow lines ── */
    for(const [a,b] of CONNECTIONS){
        const p1=p(a), p2=p(b);
        const grad=ctx.createLinearGradient(p1.x,p1.y,p2.x,p2.y);
        grad.addColorStop(0, spellColor+'77');
        grad.addColorStop(1, spellColor+'cc');
        ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
        ctx.strokeStyle=grad; ctx.lineWidth=1.8;
        ctx.shadowColor=spellColor; ctx.shadowBlur=onCooldown?3:9;
        ctx.globalAlpha=0.65; ctx.stroke();
    }

    /* ── 2. Knuckle & wrist joints — diamond rune shapes ── */
    ctx.globalAlpha=0.7;
    for(let i=0;i<21;i++){
        if([4,8,12,16,20].includes(i)) continue; // tips drawn separately
        const pt=p(i);
        const sz=i===0?4.5:2.5;
        ctx.beginPath();
        ctx.moveTo(pt.x,     pt.y-sz);
        ctx.lineTo(pt.x+sz,  pt.y    );
        ctx.lineTo(pt.x,     pt.y+sz );
        ctx.lineTo(pt.x-sz,  pt.y    );
        ctx.closePath();
        ctx.fillStyle=spellColor;
        ctx.shadowColor=spellColor; ctx.shadowBlur=5;
        ctx.fill();
    }

    /* ── 3. Extended fingertip orbs ── */
    for(const [tipIdxStr, isUp] of Object.entries(extMap)){
        const ti=parseInt(tipIdxStr);
        const tip=p(ti);
        const orbR = ti===4 ? 7 : 9;
        const pulse=Math.sin(frameCount*0.15 + ti*1.1)*2.5;

        if(isUp){
            // outer halo
            const gOut=ctx.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,(orbR+pulse)*3.2);
            gOut.addColorStop(0, spellColor+'bb');
            gOut.addColorStop(0.35, spellColor+'44');
            gOut.addColorStop(1, spellColor+'00');
            ctx.globalAlpha=0.75;
            ctx.beginPath(); ctx.arc(tip.x,tip.y,(orbR+pulse)*3.2,0,Math.PI*2);
            ctx.fillStyle=gOut; ctx.shadowBlur=0; ctx.fill();

            // inner glowing orb
            ctx.globalAlpha=0.92;
            ctx.beginPath(); ctx.arc(tip.x,tip.y,orbR+pulse,0,Math.PI*2);
            ctx.fillStyle=spellColor; ctx.shadowColor=spellColor; ctx.shadowBlur=18;
            ctx.fill();

            // white spark core
            ctx.globalAlpha=1;
            ctx.beginPath(); ctx.arc(tip.x,tip.y,2.8,0,Math.PI*2);
            ctx.fillStyle='#ffffff'; ctx.shadowColor='#fff'; ctx.shadowBlur=8; ctx.fill();
        } else {
            // curled fingertip — dim ember
            ctx.globalAlpha=0.3;
            ctx.beginPath(); ctx.arc(tip.x,tip.y,3.5,0,Math.PI*2);
            ctx.fillStyle=spellColor; ctx.shadowBlur=3; ctx.fill();
        }
    }

    /* ── 4. Palm sigil: rotating rune while charging ── */
    if(currentPose && poseHoldFrames>4){
        const palmPts=[0,5,9,13,17].map(i=>p(i));
        const cx=palmPts.reduce((s,q)=>s+q.x,0)/palmPts.length;
        const cy=palmPts.reduce((s,q)=>s+q.y,0)/palmPts.length;
        const pct=poseHoldFrames/HOLD_FRAMES;
        const spin=frameCount*0.045;
        const sr=28;

        ctx.globalAlpha=pct*0.85;
        ctx.strokeStyle=spellColor; ctx.shadowColor=spellColor;
        ctx.shadowBlur=onCooldown?4:14; ctx.lineWidth=1.4;

        // outer ring
        ctx.beginPath(); ctx.arc(cx,cy,sr,0,Math.PI*2); ctx.stroke();

        // inner spinning star lines (6-fold)
        for(let i=0;i<6;i++){
            const a=spin+(i/6)*Math.PI*2;
            const x1=cx+Math.cos(a)*sr*0.9, y1=cy+Math.sin(a)*sr*0.9;
            const x2=cx+Math.cos(a+Math.PI)*sr*0.9, y2=cy+Math.sin(a+Math.PI)*sr*0.9;
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        }

        // orbiting spark bead
        const bx=cx+Math.cos(-spin*1.8)*sr, by=cy+Math.sin(-spin*1.8)*sr;
        ctx.globalAlpha=pct;
        ctx.beginPath(); ctx.arc(bx,by,3.5,0,Math.PI*2);
        ctx.fillStyle='#ffffff'; ctx.shadowBlur=10; ctx.fill();
    }

    ctx.restore();

    /* ── 5. Wrist hold-arc with spark at tip ── */
    if(currentPose && poseHoldFrames>0 && COMMANDS[currentPose]){
        const wrist=p(0);
        const pct=poseHoldFrames/HOLD_FRAMES;
        const ringColor=cd>0?'#636e72':cmd.color;
        const endAngle=-Math.PI/2+pct*Math.PI*2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(wrist.x,wrist.y,30,-Math.PI/2,endAngle);
        ctx.strokeStyle=ringColor; ctx.lineWidth=3.5;
        ctx.shadowColor=ringColor; ctx.shadowBlur=cd>0?0:16;
        ctx.lineCap='round'; ctx.stroke();

        // spark bead at leading edge
        if(cd===0 && pct>0.04){
            const sx=wrist.x+Math.cos(endAngle)*30;
            const sy=wrist.y+Math.sin(endAngle)*30;
            ctx.beginPath(); ctx.arc(sx,sy,4.5,0,Math.PI*2);
            ctx.fillStyle='#ffffff'; ctx.shadowColor=ringColor; ctx.shadowBlur=14;
            ctx.fill();
        }
        ctx.restore();
    }
}

/* ═══════════════════════════════════════════════
   DRAW: PLAYER BASE
═══════════════════════════════════════════════ */
function drawBase(){
    const x=BASE_X, y=CH/2;
    const pulse=Math.sin(frameCount*0.05)*3;
    ctx.save();
    ctx.shadowColor='#23f5b2'; ctx.shadowBlur=12+pulse;
    ctx.beginPath();
    for(let i=0;i<6;i++){
        const a=(i/6)*Math.PI*2-Math.PI/2, r=22+pulse;
        const [px,py]=[x+Math.cos(a)*r, y+Math.sin(a)*r];
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fillStyle='rgba(10,28,36,.9)'; ctx.strokeStyle='#23f5b2'; ctx.lineWidth=2;
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur=0; ctx.font='20px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.fillText('🔬',x,y);

    // Dashed lane guides
    ctx.globalAlpha=0.1; ctx.strokeStyle='#23f5b2'; ctx.lineWidth=1;
    ctx.setLineDash([6,9]);
    for(let l=0;l<LANES;l++){
        ctx.beginPath(); ctx.moveTo(x+30,laneY(l)); ctx.lineTo(CW,laneY(l)); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
}

/* ═══════════════════════════════════════════════
   DRAW: SHIELDS
═══════════════════════════════════════════════ */
function updateShields(){
    shields=shields.filter(s=>s.duration>0);
    for(const s of shields){
        s.duration--;
        const a=s.duration/s.maxDur;
        ctx.save(); ctx.globalAlpha=a*0.82;
        ctx.beginPath(); ctx.rect(s.x-8,0,16,CH);
        ctx.fillStyle=s.color+'35'; ctx.fill();
        ctx.strokeStyle=s.color; ctx.lineWidth=3;
        ctx.shadowColor=s.color; ctx.shadowBlur=10; ctx.stroke(); ctx.restore();
        // Block enemies behind shield
        const killed=enemies.filter(e=>e.x<s.x+10);
        killed.forEach(e=>{
            score+=e.maxHp*5;
            for(let i=0;i<8;i++) particles.push(new Particle(e.x,e.y,s.color));
        });
        if(killed.length){ enemies=enemies.filter(e=>e.x>=s.x+10); updateHUD(); }
    }
}

/* ═══════════════════════════════════════════════
   DRAW: ON-CANVAS POSE HINT (bottom-right)
═══════════════════════════════════════════════ */
function drawPoseHint(){
    if(!currentPose||!COMMANDS[currentPose]) return;
    const cmd=COMMANDS[currentPose];
    const cd =cmdCooldowns[currentPose]??0;
    const pct=Math.min(1,poseHoldFrames/HOLD_FRAMES);
    const px=CW-152, py=CH-62, w=142, h=50;

    ctx.save(); ctx.globalAlpha=0.9;
    rrect(px,py,w,h,10);
    ctx.fillStyle='rgba(10,20,28,.9)'; ctx.fill();
    rrect(px,py,w,h,10);
    ctx.strokeStyle=cd>0?'#636e72':cmd.color; ctx.lineWidth=1.5; ctx.stroke();

    ctx.font=`bold 13px "SUIT",sans-serif`; ctx.textAlign='left';
    ctx.textBaseline='top'; ctx.fillStyle=cmd.color;
    ctx.fillText(`${cmd.icon} ${cmd.name}`,px+10,py+10);

    const bx=px+8,by=py+30,bw=w-16,bh=7;
    ctx.beginPath(); ctx.rect(bx,by,bw,bh);
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fill();
    ctx.beginPath();
    ctx.rect(bx,by,bw*(cd>0?1-cd/cmd.cooldown:pct),bh);
    ctx.fillStyle=cd>0?'#636e72':cmd.color; ctx.fill();
    ctx.restore();
}

/* ═══════════════════════════════════════════════
   MAIN GAME LOOP
═══════════════════════════════════════════════ */
function gameLoop(){
    if(gameState!==STATES.PLAYING) return;
    frameCount++;
    ctx.clearRect(0,0,CW,CH);

    // 1. Webcam (mirrored)
    if(videoEl){
        ctx.save(); ctx.scale(-1,1); ctx.drawImage(videoEl,-CW,0,CW,CH); ctx.restore();
    }

    // 2. Scene overlay
    ctx.fillStyle='rgba(7,17,24,.42)'; ctx.fillRect(0,0,CW,CH);

    // 3. Pose processing
    processPoseHold();

    // 4. Player base + lane guides
    drawBase();

    // 5. Shield walls
    updateShields();

    // 6. Enemies
    for(const e of enemies){ e.update(); e.draw(); }

    // Enemies that reached base
    const breached=enemies.filter(e=>e.reachedBase());
    breached.forEach(b=>{
        lives=Math.max(0,lives-1);
        effects.push(floatText(BASE_X+25,CH/2-40,`${b.type.emoji} Escaped!  -❤️`,'#ff6348',20));
    });
    enemies=enemies.filter(e=>!e.reachedBase());
    if(breached.length) updateHUD();

    // 7. Projectiles
    for(const p of projectiles){ p.update(); p.checkHits(); p.draw(); }
    projectiles=projectiles.filter(p=>!p.isDead());

    // 8. Particles + floating text
    for(const p of particles){ p.update(); p.draw(); }
    for(const e of effects)  { e.update(); e.draw(); }
    particles=particles.filter(p=>!p.isDead());
    effects  =effects.filter(e=>!e.isDead());

    // 9. Hand skeleton
    if(fingerPos?.landmarks) drawHand(fingerPos.landmarks);

    // 10. Pose hint overlay
    drawPoseHint();

    // 11. No-hand nudge
    if(!fingerPos){
        ctx.save(); ctx.fillStyle='rgba(255,255,255,.45)';
        ctx.font='15px "SUIT",sans-serif'; ctx.textAlign='center';
        ctx.fillText('✋  Show your hand to the camera',CW/2,CH-18); ctx.restore();
    }

    // 12. Between-waves countdown
    if(betweenWaves){
        waveDelay--;
        if(waveDelay<=0){
            betweenWaves=false;
            wave++;
            startWave(wave);
            updateHUD();
            effects.push(floatText(CW/2,CH/2-60,`⚠️ Wave ${wave} incoming!`,'#ff6348',26));
        }
    }

    // 13. Wave complete check
    checkWaveComplete();

    // 14. Game over?
    if(lives<=0){ endGame(); return; }

    frameId=requestAnimationFrame(gameLoop);
}

/* ═══════════════════════════════════════════════
   END / RESTART
═══════════════════════════════════════════════ */
function endGame(){
    gameState=STATES.GAMEOVER;
    clearInterval(spawnTimer);
    cancelAnimationFrame(frameId);
    finalScoreEl.textContent=score;
    if(finalWaveEl) finalWaveEl.textContent=`Survived to Wave ${wave}`;
    gameOverOverlay.classList.remove('hidden');
    if(videoEl?.srcObject){ videoEl.srcObject.getTracks().forEach(t=>t.stop()); videoEl.srcObject=null; }
    if(videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl);
    videoEl=null;
    // Reset cmd guide highlights
    cmdItems.forEach(el=>el.classList.remove('active'));
}

function restartGame(){ gameOverOverlay.classList.add('hidden'); startGame(); }

startBtn.addEventListener('click',  startGame);
restartBtn.addEventListener('click',restartGame);
