/**
 * game.js — Animal Spotter
 * CV Classification Demo using MediaPipe Hands
 *
 * Gestures:
 *   🤏 PINCH  — thumb tip (LM4) ↔ index tip (LM8) distance < threshold
 *   👋 SWIPE  — wrist (LM0) horizontal velocity > threshold in < 350ms
 *
 * Game loop:
 *   Animal cards fly right → left.
 *   Pinch the target animal → score.
 *   Swipe to wave away wrong animals → bonus.
 *   Pinch the wrong animal → lose a life.
 */

'use strict';

/* ═══════════════════════════════════════════════
   ANIMAL DATA
═══════════════════════════════════════════════ */
const ANIMALS = [
    { emoji: '🐱', name: 'Cat'     },
    { emoji: '🐶', name: 'Dog'     },
    { emoji: '🐻', name: 'Bear'    },
    { emoji: '🦊', name: 'Fox'     },
    { emoji: '🐸', name: 'Frog'    },
    { emoji: '🐧', name: 'Penguin' },
    { emoji: '🦁', name: 'Lion'    },
    { emoji: '🐯', name: 'Tiger'   },
    { emoji: '🐼', name: 'Panda'   },
    { emoji: '🐰', name: 'Rabbit'  },
];

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const STATES = Object.freeze({
    INTRO: 'intro', LOADING: 'loading', PLAYING: 'playing', GAMEOVER: 'gameover',
});

/** MediaPipe 21-landmark hand skeleton connections */
const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],           // thumb
    [0,5],[5,6],[6,7],[7,8],           // index
    [0,9],[9,10],[10,11],[11,12],      // middle
    [0,13],[13,14],[14,15],[15,16],    // ring
    [0,17],[17,18],[18,19],[19,20],    // pinky
    [5,9],[9,13],[13,17],              // palm
];

const CARD_W    = 95;   // animal card width (px)
const CARD_H    = 105;  // animal card height (px)
const PROX_PX   = 72;   // gesture proximity radius

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
const livesDisplay    = document.getElementById('livesDisplay');
const comboDisplay    = document.getElementById('comboDisplay');
const finalScoreEl    = document.getElementById('finalScore');
const targetPanel     = document.getElementById('targetPanel');

/* ═══════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════ */
let gameState    = STATES.INTRO;
let score        = 0;
let lives        = 3;
let combo        = 1;
let comboFrames  = 0;
let targetAnimal = null;

let animals      = [];  // FlyingAnimal[]
let particles    = [];  // Particle[]
let effects      = [];  // floating text objects

/* ═══════════════════════════════════════════════
   CV / HAND STATE
═══════════════════════════════════════════════ */
let fingerPos      = null;  // { x, y, landmarks[] }  — index tip
let thumbPos       = null;  // { x, y }               — thumb tip
let pinchDist      = Infinity;
let pinchActive    = false; // currently holding pinch
let pinchFired     = false; // edge-trigger flag (leading edge of pinch)
let waveFired      = false; // edge-trigger flag
let pinchCooldown  = 0;
let waveCooldown   = 0;
let wristXHistory  = [];    // [{x, t}] for swipe detection

/* ═══════════════════════════════════════════════
   CANVAS & VIDEO
═══════════════════════════════════════════════ */
let CW = 640, CH = 480;
let videoEl    = null;
let handsModel = null;
let frameId    = null;
let spawnTimer = null;

/* ───────────────────────────────────────────── */
function resizeCanvas() {
    const w = (canvas.parentElement.clientWidth || 640);
    CW = Math.min(w, 900);
    CH = Math.round(CW * 0.75);
    canvas.width  = CW;
    canvas.height = CH;
}
window.addEventListener('resize', resizeCanvas);
requestAnimationFrame(resizeCanvas);

/* ═══════════════════════════════════════════════
   HELPER — rounded rect path
═══════════════════════════════════════════════ */
function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
}

/* ═══════════════════════════════════════════════
   TARGET ANIMAL
═══════════════════════════════════════════════ */
function pickTarget(excludeName = null) {
    const pool = excludeName ? ANIMALS.filter(a => a.name !== excludeName) : ANIMALS;
    targetAnimal = pool[Math.floor(Math.random() * pool.length)];
    if (targetPanel) {
        targetPanel.innerHTML = `
            <span class="targetEmoji">${targetAnimal.emoji}</span>
            <span class="targetName">${targetAnimal.name}</span>`;
    }
}

/* ═══════════════════════════════════════════════
   GAME INIT
═══════════════════════════════════════════════ */
async function startGame() {
    gameState = STATES.LOADING;
    introOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');

    try {
        // 1. Webcam
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        videoEl = document.createElement('video');
        videoEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.appendChild(videoEl);
        videoEl.srcObject   = stream;
        videoEl.autoplay    = true;
        videoEl.playsInline = true;
        videoEl.muted       = true;
        resizeCanvas();
        await videoEl.play().catch(() => {});
        await new Promise(res => {
            if (videoEl.readyState >= 2) { res(); return; }
            videoEl.addEventListener('loadeddata', res, { once: true });
        });

        // 2. MediaPipe Hands
        handsModel = new Hands({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        handsModel.setOptions({
            maxNumHands: 1, modelComplexity: 1,
            minDetectionConfidence: 0.7, minTrackingConfidence: 0.5,
        });
        handsModel.onResults(onHandResults);

        // 3. Reset state
        score = 0; lives = 3; combo = 1; comboFrames = 0;
        animals = []; particles = []; effects = [];
        wristXHistory = []; pinchCooldown = 0; waveCooldown = 0;
        pinchActive = false; pinchFired = false; waveFired = false;
        pickTarget();
        updateHUD();

        loadingOverlay.classList.add('hidden');
        gameState = STATES.PLAYING;

        spawnAnimal();
        spawnTimer = setInterval(spawnAnimal, 1600);
        gameLoop();
        sendFrames();

    } catch (err) {
        console.error('[AnimalSpotter]', err);
        loadingOverlay.classList.add('hidden');
        introOverlay.classList.remove('hidden');
        alert('⚠️  Camera access required. Please allow and try again.');
    }
}

/* ═══════════════════════════════════════════════
   MEDIAPIPE FRAME PIPELINE
═══════════════════════════════════════════════ */
async function sendFrames() {
    if (gameState === STATES.GAMEOVER) return;
    if (videoEl && handsModel && videoEl.readyState >= 2) {
        try { await handsModel.send({ image: videoEl }); } catch (_) {}
    }
    setTimeout(sendFrames, 33);
}

/* ═══════════════════════════════════════════════
   HAND RESULTS → GESTURE FLAGS
═══════════════════════════════════════════════ */
function onHandResults(results) {
    if (!results.multiHandLandmarks?.length) {
        fingerPos = null; thumbPos = null;
        wristXHistory = [];
        return;
    }

    const lm   = results.multiHandLandmarks[0];
    const toXY = i => ({ x: (1 - lm[i].x) * CW, y: lm[i].y * CH });

    const idx   = toXY(8);  // index finger tip
    const thm   = toXY(4);  // thumb tip
    const wrist = toXY(0);

    fingerPos = { x: idx.x, y: idx.y, landmarks: lm };
    thumbPos  = { x: thm.x, y: thm.y };

    /* ── Pinch (LM4 ↔ LM8 distance) ──────── */
    pinchDist = Math.hypot(idx.x - thm.x, idx.y - thm.y);
    const pinching = pinchDist < CW * 0.065;

    if (pinching && !pinchActive && pinchCooldown === 0) {
        pinchActive = true;
        pinchFired  = true;   // leading-edge trigger
    } else if (!pinching) {
        pinchActive = false;
    }

    /* ── Swipe (wrist x-velocity over 8 frames) ── */
    wristXHistory.push({ x: wrist.x, t: performance.now() });
    if (wristXHistory.length > 10) wristXHistory.shift();

    if (waveCooldown === 0 && wristXHistory.length >= 8) {
        const dx = Math.abs(wristXHistory.at(-1).x - wristXHistory[0].x);
        const dt = wristXHistory.at(-1).t - wristXHistory[0].t;
        if (dx > CW * 0.15 && dt < 350) {
            waveFired     = true;
            wristXHistory = [];   // reset after detection
        }
    }
}

/* ═══════════════════════════════════════════════
   FLYING ANIMAL CARD
═══════════════════════════════════════════════ */
class FlyingAnimal {
    constructor(forceTarget = false) {
        const isT  = forceTarget || Math.random() < 0.35;
        this.type  = isT ? targetAnimal : ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        this.x     = CW + CARD_W;
        this.y     = CARD_H * 0.9 + Math.random() * (CH - CARD_H * 1.8);
        this.speed = 1.6 + Math.random() * 1.2 + Math.min(score, 500) / 350;
        this.bob   = Math.random() * Math.PI * 2;  // phase offset for bobbing
        this.caught = false;
        this.passed = false;
        this.alpha  = 1;
    }

    /** Is this card currently the target animal? (rechecked live) */
    get isTarget() { return targetAnimal && this.type.name === targetAnimal.name; }

    /** Is the index finger tip close enough to act on this card? */
    nearFinger() {
        if (!fingerPos) return false;
        return Math.hypot(fingerPos.x - this.x, fingerPos.y - this.y) < PROX_PX;
    }

    update() {
        if (this.caught || this.passed) return;
        this.x   -= this.speed;
        this.bob += 0.04;
        if (this.x + CARD_W < 0) this.passed = true;
    }

    draw() {
        if (this.caught || this.passed) return;

        const cy  = this.y + Math.sin(this.bob) * 5;   // gentle bob
        const cx  = this.x;
        const lx  = cx - CARD_W / 2;
        const ty  = cy - CARD_H / 2;
        const isT = this.isTarget;
        const nr  = this.nearFinger();

        ctx.save();
        ctx.globalAlpha = this.alpha;

        /* Card shadow */
        ctx.shadowColor   = isT ? '#23f5b240' : 'rgba(0,0,0,0.35)';
        ctx.shadowBlur    = nr ? 18 : 8;
        ctx.shadowOffsetY = 4;

        /* Card body */
        rrect(lx, ty, CARD_W, CARD_H, 14);
        ctx.fillStyle = 'rgba(10, 20, 28, 0.88)';
        ctx.fill();

        /* Border */
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        rrect(lx, ty, CARD_W, CARD_H, 14);
        if (isT && nr)       { ctx.strokeStyle = '#23f5b2'; ctx.lineWidth = 3.5; }
        else if (isT)        { ctx.strokeStyle = '#23f5b270'; ctx.lineWidth = 2; }
        else                 { ctx.strokeStyle = '#1e3a4a';   ctx.lineWidth = 1.5; }
        ctx.stroke();

        /* Emoji */
        ctx.font         = `${CARD_W * 0.52}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = isT ? '#23f5b250' : 'transparent';
        ctx.shadowBlur   = isT ? 8 : 0;
        ctx.fillStyle    = '#ffffff';
        ctx.fillText(this.type.emoji, cx, cy - 6);

        /* Name tag */
        ctx.shadowBlur   = 0;
        ctx.font         = `bold ${CARD_W * 0.14}px "SUIT", sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle    = isT ? '#23f5b2' : '#6ba4bc';
        ctx.fillText(this.type.name.toUpperCase(), cx, cy + CARD_H * 0.37);

        ctx.restore();
    }
}

/* ═══════════════════════════════════════════════
   PARTICLE  (burst)
═══════════════════════════════════════════════ */
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 11;
        this.vy = (Math.random() - 0.5) * 11;
        this.r  = 3 + Math.random() * 5;
        this.life = 1;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.3; this.vx *= 0.96;
        this.life -= 0.028;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    isDead() { return this.life <= 0; }
}

/* floating score / label text */
function floatText(x, y, text, color, size = 22) {
    return {
        x, y, text, color, size, life: 1,
        update() { this.y -= 1.8; this.life -= 0.02; },
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.font        = `bold ${this.size}px "SUIT", sans-serif`;
            ctx.textAlign   = 'center';
            ctx.fillStyle   = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur  = 8;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        },
        isDead() { return this.life <= 0; },
    };
}

/* ═══════════════════════════════════════════════
   SPAWN
═══════════════════════════════════════════════ */
function spawnAnimal() {
    if (gameState !== STATES.PLAYING) return;
    // Force a target card if none is currently flying
    const hasTarget = animals.some(a => !a.caught && !a.passed && a.isTarget);
    animals.push(new FlyingAnimal(!hasTarget && Math.random() < 0.6));
}

/* ═══════════════════════════════════════════════
   GESTURE PROCESSING  (runs once per frame)
═══════════════════════════════════════════════ */
function processGestures() {
    if (pinchCooldown > 0) pinchCooldown--;
    if (waveCooldown  > 0) waveCooldown--;

    /* ── PINCH ─────────────────────────────── */
    if (pinchFired) {
        pinchFired    = false;
        pinchCooldown = 30;  // ~0.5s cooldown at 60fps

        // Find the closest card within reach
        let nearest = null, minD = Infinity;
        for (const a of animals) {
            if (a.caught || a.passed) continue;
            const d = Math.hypot((fingerPos?.x ?? -999) - a.x, (fingerPos?.y ?? -999) - a.y);
            if (d < PROX_PX && d < minD) { minD = d; nearest = a; }
        }

        if (nearest) {
            nearest.caught = true;

            if (nearest.isTarget) {
                // ✅ Correct catch
                const pts = 20 * combo;
                score    += pts;
                combo     = Math.min(combo + 1, 8);
                comboFrames = 110;
                for (let i = 0; i < 18; i++)
                    particles.push(new Particle(nearest.x, nearest.y, '#23f5b2'));
                effects.push(floatText(nearest.x, nearest.y - 35, `+${pts}  CATCH! 🎯`, '#23f5b2', 24));
                // Pick a new target after a beat
                setTimeout(() => pickTarget(targetAnimal?.name), 150);
            } else {
                // ❌ Wrong animal
                lives = Math.max(0, lives - 1);
                combo = 1;
                for (let i = 0; i < 12; i++)
                    particles.push(new Particle(nearest.x, nearest.y, '#ff6348'));
                effects.push(floatText(nearest.x, nearest.y - 35, `WRONG! -1 ❤️`, '#ff6348', 22));
            }
        } else if (fingerPos) {
            // Pinch in the air — show small indicator
            effects.push(floatText(fingerPos.x, fingerPos.y - 20, '🤏', '#ffffff', 28));
        }
        updateHUD();
    }

    /* ── WAVE / SWIPE ──────────────────────── */
    if (waveFired) {
        waveFired    = false;
        waveCooldown = 28;

        let waved = 0;
        if (fingerPos) {
            for (const a of animals) {
                if (a.caught || a.passed) continue;
                const d = Math.hypot(fingerPos.x - a.x, fingerPos.y - a.y);
                if (d < PROX_PX * 2.5) {
                    a.passed = true;
                    if (a.isTarget) {
                        effects.push(floatText(a.x, a.y, `Oops — target gone!`, '#fdcb6e', 17));
                    } else {
                        waved++;
                    }
                }
            }
        }

        if (waved > 0) {
            const bonus = waved * 5;
            score += bonus;
            if (fingerPos) effects.push(floatText(fingerPos.x, fingerPos.y - 45, `👋 PASS! +${bonus}`, '#74b9ff', 24));
            updateHUD();
        } else if (fingerPos) {
            effects.push(floatText(fingerPos.x, fingerPos.y - 45, '👋 WAVE!', '#74b9ff', 22));
        }
    }
}

/* ═══════════════════════════════════════════════
   HUD
═══════════════════════════════════════════════ */
function updateHUD() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));
    comboDisplay.textContent = `x${combo}`;
}

/* ═══════════════════════════════════════════════
   HAND SKELETON DRAW
═══════════════════════════════════════════════ */
function drawHand(landmarks) {
    const lp = i => ({ x: (1 - landmarks[i].x) * CW, y: landmarks[i].y * CH });

    /* Skeleton lines */
    ctx.save();
    ctx.strokeStyle = '#23f5b2';
    ctx.lineWidth   = 1.8;
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = '#23f5b2';
    ctx.shadowBlur  = 4;
    for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = lp(a), p2 = lp(b);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    /* Landmark dots */
    ctx.globalAlpha = 0.75;
    ctx.shadowBlur  = 2;
    for (let i = 0; i < 21; i++) {
        if (i === 4 || i === 8) continue;
        const p = lp(i);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();

    /* ── Pinch visualizer (thumb ↔ index) ──── */
    const thm = lp(4);
    const idx = lp(8);
    const ratio = Math.max(0, 1 - pinchDist / (CW * 0.12));  // 0 = open, 1 = pinched

    ctx.save();
    // Line between the two tips
    ctx.beginPath();
    ctx.moveTo(thm.x, thm.y);
    ctx.lineTo(idx.x, idx.y);
    ctx.strokeStyle = `rgba(253, 203, 110, ${0.25 + ratio * 0.75})`;
    ctx.lineWidth   = 1.5 + ratio * 3.5;
    ctx.shadowColor = '#fdcb6e';
    ctx.shadowBlur  = ratio * 14;
    ctx.stroke();

    // Thumb tip dot (gold)
    ctx.beginPath(); ctx.arc(thm.x, thm.y, 6 + ratio * 5, 0, Math.PI * 2);
    ctx.fillStyle   = '#fdcb6e';
    ctx.globalAlpha = 0.55 + ratio * 0.45;
    ctx.shadowBlur  = ratio * 10;
    ctx.fill();

    // Index tip glow
    const g = ctx.createRadialGradient(idx.x, idx.y, 0, idx.x, idx.y, 28);
    g.addColorStop(0,   '#23f5b2ff');
    g.addColorStop(0.4, '#23f5b260');
    g.addColorStop(1,   '#23f5b200');
    ctx.beginPath(); ctx.arc(idx.x, idx.y, 28, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fill();
    ctx.beginPath(); ctx.arc(idx.x, idx.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#23f5b2'; ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

    ctx.restore();
}

/* ═══════════════════════════════════════════════
   ON-CANVAS TARGET HINT  (top-left corner)
═══════════════════════════════════════════════ */
function drawTargetHint() {
    if (!targetAnimal) return;
    const px = 14, py = 14, w = 132, h = 52, r = 10;

    ctx.save();
    ctx.globalAlpha = 0.88;

    rrect(px, py, w, h, r);
    ctx.fillStyle = 'rgba(10, 20, 28, 0.9)'; ctx.fill();
    rrect(px, py, w, h, r);
    ctx.strokeStyle = '#23f5b2'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.font      = '11px "SUIT", sans-serif';
    ctx.fillStyle = '#7fbfd4';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CATCH →', px + 10, py + 10);

    ctx.font      = '26px serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(targetAnimal.emoji, px + 10, py + 36);

    ctx.font      = `bold 15px "SUIT", sans-serif`;
    ctx.fillStyle = '#23f5b2';
    ctx.fillText(targetAnimal.name, px + 44, py + 36);

    ctx.restore();
}

/* ═══════════════════════════════════════════════
   MAIN GAME LOOP
═══════════════════════════════════════════════ */
function gameLoop() {
    if (gameState !== STATES.PLAYING) return;

    ctx.clearRect(0, 0, CW, CH);

    // 1. Mirrored webcam
    if (videoEl) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, -CW, 0, CW, CH);
        ctx.restore();
    }

    // 2. Dark scene overlay
    ctx.fillStyle = 'rgba(7, 17, 24, 0.40)';
    ctx.fillRect(0, 0, CW, CH);

    // 3. Gestures
    processGestures();

    // 4. Animals
    for (const a of animals) { a.update(); a.draw(); }
    animals = animals.filter(a => !a.passed && !a.caught);

    // 5. Particles + floating text
    for (const p of particles) { p.update(); p.draw(); }
    for (const e of effects)   { e.update(); e.draw(); }
    particles = particles.filter(p => !p.isDead());
    effects   = effects.filter(e => !e.isDead());

    // 6. Combo timer
    if (comboFrames > 0) { comboFrames--; }
    else if (combo > 1)  { combo = 1; updateHUD(); }

    // 7. Hand skeleton + pinch viz
    if (fingerPos?.landmarks) drawHand(fingerPos.landmarks);

    // 8. Target reminder overlay
    drawTargetHint();

    // 9. No-hand nudge
    if (!fingerPos) {
        ctx.save();
        ctx.fillStyle  = 'rgba(255,255,255,0.48)';
        ctx.font       = '15px "SUIT", sans-serif';
        ctx.textAlign  = 'center';
        ctx.fillText('✋  Show your hand to the camera', CW / 2, CH - 18);
        ctx.restore();
    }

    // 10. Game over?
    if (lives <= 0) { endGame(); return; }

    frameId = requestAnimationFrame(gameLoop);
}

/* ═══════════════════════════════════════════════
   END & RESTART
═══════════════════════════════════════════════ */
function endGame() {
    gameState = STATES.GAMEOVER;
    clearInterval(spawnTimer);
    cancelAnimationFrame(frameId);
    finalScoreEl.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    if (videoEl?.srcObject) {
        videoEl.srcObject.getTracks().forEach(t => t.stop());
        videoEl.srcObject = null;
    }
    if (videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl);
    videoEl = null;
}

function restartGame() {
    gameOverOverlay.classList.add('hidden');
    startGame();
}

startBtn.addEventListener('click',   startGame);
restartBtn.addEventListener('click', restartGame);
