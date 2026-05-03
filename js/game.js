/**
 * game.js — Finger Catch
 * Computer Vision demo using MediaPipe Hands
 *
 * Architecture:
 *  - MediaPipe Hands detects 21 3D landmarks from webcam frames
 *  - Landmark #8 (index finger tip) drives the game cursor
 *  - Canvas renders: mirrored webcam → hand skeleton → bubbles → particles
 *  - Game states: INTRO → LOADING → PLAYING → GAMEOVER
 */

'use strict';

/* ─────────────────────────────────────────────────────
   DOM REFS
───────────────────────────────────────────────────── */
const canvas           = document.getElementById('gameCanvas');
const ctx              = canvas.getContext('2d');
const introOverlay     = document.getElementById('introOverlay');
const loadingOverlay   = document.getElementById('loadingOverlay');
const gameOverOverlay  = document.getElementById('gameOverOverlay');
const startBtn         = document.getElementById('startBtn');
const restartBtn       = document.getElementById('restartBtn');
const scoreDisplay     = document.getElementById('scoreDisplay');
const livesDisplay     = document.getElementById('livesDisplay');
const comboDisplay     = document.getElementById('comboDisplay');
const finalScoreEl     = document.getElementById('finalScore');

/* ─────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────── */
const STATES = Object.freeze({ INTRO: 'intro', LOADING: 'loading', PLAYING: 'playing', GAMEOVER: 'gameover' });

/** Hand skeleton: pairs of landmark indices to connect with lines */
const HAND_CONNECTIONS = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm knuckle line
    [5, 9], [9, 13], [13, 17],
];

/** Bubble fill colours — accent-friendly palette */
const BUBBLE_COLORS = [
    '#23f5b2', '#56f7c8', '#7fffd4',   // teal / cyan
    '#3498db', '#1a6fa0', '#74b9ff',   // blue
    '#ffd700', '#fdcb6e', '#f0a500',   // gold
    '#fd79a8', '#a29bfe', '#6c5ce7',   // pink / purple
];

/** Finger tip collision radius in canvas pixels */
const FINGER_RADIUS = 20;

/* ─────────────────────────────────────────────────────
   GAME STATE
───────────────────────────────────────────────────── */
let gameState   = STATES.INTRO;
let score       = 0;
let lives       = 3;
let combo       = 1;
let comboFrames = 0;   // countdown frames until combo resets

let bubbles     = [];
let particles   = [];
let fingerPos   = null;   // { x, y, landmarks[] } — updated by MediaPipe callback

let videoEl     = null;
let handsModel  = null;
let frameId     = null;
let spawnTimer  = null;

/** Canvas logical dimensions (updated on resize) */
let CW = 640;
let CH = 480;

/* ─────────────────────────────────────────────────────
   CANVAS SIZING
───────────────────────────────────────────────────── */
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    // Use clientWidth if layout has computed, otherwise fall back to 640
    const w = wrapper.clientWidth > 0 ? wrapper.clientWidth : 640;
    CW = Math.min(w, 900);
    CH = Math.round(CW * 0.75);   // 4:3
    canvas.width  = CW;
    canvas.height = CH;
}

window.addEventListener('resize', resizeCanvas);
// Defer first resize until after CSS layout has fully computed
requestAnimationFrame(resizeCanvas);

/* ─────────────────────────────────────────────────────
   GAME INITIALISATION
───────────────────────────────────────────────────── */
async function startGame() {
    gameState = STATES.LOADING;
    introOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');

    try {
        // 1. Request webcam access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });

        videoEl = document.createElement('video');
        // Must be in DOM for reliable frame decoding in Chromium
        videoEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.appendChild(videoEl);
        videoEl.srcObject   = stream;
        videoEl.autoplay    = true;
        videoEl.playsInline = true;
        videoEl.muted       = true;
        // Recalculate canvas size at game start (fixes 0-width init race)
        resizeCanvas();
        await videoEl.play().catch(() => {});
        await new Promise(resolve => {
            if (videoEl.readyState >= 2) { resolve(); return; }
            videoEl.addEventListener('loadeddata', resolve, { once: true });
        });

        // 2. Initialise MediaPipe Hands
        handsModel = new Hands({
            locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        handsModel.setOptions({
            maxNumHands:            1,
            modelComplexity:        1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence:  0.5,
        });

        handsModel.onResults(handleHandResults);

        // 3. Reset game variables
        score       = 0;
        lives       = 3;
        combo       = 1;
        comboFrames = 0;
        bubbles     = [];
        particles   = [];
        fingerPos   = null;

        updateHUD();

        // 4. Begin
        loadingOverlay.classList.add('hidden');
        gameState = STATES.PLAYING;

        spawnBubble();                              // first bubble immediately
        spawnTimer = setInterval(spawnBubble, 1400);

        gameLoop();
        sendFramesToMediaPipe();

    } catch (err) {
        console.error('[FingerCatch] Camera / model init error:', err);
        loadingOverlay.classList.add('hidden');
        introOverlay.classList.remove('hidden');
        alert('⚠️  Could not access the camera.\nPlease allow camera permission and try again.');
    }
}

/* ─────────────────────────────────────────────────────
   FRAME PIPELINE → MEDIAPIPE
───────────────────────────────────────────────────── */
async function sendFramesToMediaPipe() {
    if (gameState === STATES.GAMEOVER) return;
    if (videoEl && handsModel && videoEl.readyState >= 2) {
        try { await handsModel.send({ image: videoEl }); } catch (_) { /* skip dropped frame */ }
    }
    // ~30 fps feed to MediaPipe (camera may run faster, that's fine)
    setTimeout(sendFramesToMediaPipe, 33);
}

/* ─────────────────────────────────────────────────────
   MEDIAPIPE RESULTS CALLBACK
───────────────────────────────────────────────────── */
function handleHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];
        const tip = lm[8]; // index finger tip
        fingerPos = {
            x: (1 - tip.x) * CW,   // mirror x so it feels like a selfie camera
            y: tip.y * CH,
            landmarks: lm,
        };
    } else {
        fingerPos = null;
    }
}

/* ─────────────────────────────────────────────────────
   BUBBLE
───────────────────────────────────────────────────── */
class Bubble {
    constructor() {
        this.radius = 22 + Math.random() * 18;
        this.x      = this.radius + Math.random() * (CW - this.radius * 2);
        this.y      = -this.radius;
        // Speed scales gently with score so the game gets harder over time
        this.speed  = (CH / 220) * (1 + Math.min(score, 600) / 400);
        this.color  = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
        this.pulse  = Math.random() * Math.PI * 2;
        this.caught = false;
        this.missed = false;
    }

    update() {
        if (this.caught) return;
        this.y     += this.speed;
        this.pulse += 0.06;
        if (this.y - this.radius > CH) this.missed = true;
    }

    draw() {
        const r = this.radius + Math.sin(this.pulse) * 2;

        // Outer glow
        const glow = ctx.createRadialGradient(this.x, this.y, r * 0.2, this.x, this.y, r * 1.5);
        glow.addColorStop(0,   this.color + '99');
        glow.addColorStop(1,   this.color + '00');
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Main body
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + 'bb';
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = 2;
        ctx.stroke();

        // Shine highlight
        ctx.beginPath();
        ctx.arc(this.x - r * 0.28, this.y - r * 0.28, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.fill();
    }
}

/* ─────────────────────────────────────────────────────
   PARTICLE  (burst on catch)
───────────────────────────────────────────────────── */
class Particle {
    constructor(x, y, color) {
        this.x     = x;
        this.y     = y;
        this.vx    = (Math.random() - 0.5) * 9;
        this.vy    = (Math.random() - 0.5) * 9;
        this.color = color;
        this.r     = 3 + Math.random() * 4;
        this.life  = 1;
    }
    update() {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vy += 0.25;   // gravity
        this.vx *= 0.97;
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

/* Floating score text — lightweight inline object */
function makeScoreText(x, y, text, color) {
    return {
        x, y, text, color, life: 1,
        update() { this.y -= 1.8; this.life -= 0.022; },
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle   = this.color;
            ctx.font        = 'bold 22px "SUIT", sans-serif';
            ctx.textAlign   = 'center';
            ctx.shadowColor = this.color;
            ctx.shadowBlur  = 6;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        },
        isDead() { return this.life <= 0; },
    };
}

/* ─────────────────────────────────────────────────────
   SPAWN
───────────────────────────────────────────────────── */
function spawnBubble() {
    if (gameState === STATES.PLAYING) bubbles.push(new Bubble());
}

/* ─────────────────────────────────────────────────────
   COLLISION DETECTION
───────────────────────────────────────────────────── */
function checkCollisions() {
    if (!fingerPos) return;

    for (const b of bubbles) {
        if (b.caught || b.missed) continue;
        const dx   = fingerPos.x - b.x;
        const dy   = fingerPos.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < b.radius + FINGER_RADIUS) {
            b.caught    = true;
            const pts   = 10 * combo;
            score      += pts;
            combo       = Math.min(combo + 1, 8);
            comboFrames = 100;   // frames until combo resets

            // Burst particles
            for (let i = 0; i < 14; i++) particles.push(new Particle(b.x, b.y, b.color));
            // Floating score label
            particles.push(makeScoreText(b.x, b.y - 15, `+${pts}`, b.color));

            updateHUD();
        }
    }
}

/* ─────────────────────────────────────────────────────
   HUD UPDATE
───────────────────────────────────────────────────── */
function updateHUD() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));
    comboDisplay.textContent = `x${combo}`;
}

/* ─────────────────────────────────────────────────────
   HAND SKELETON DRAW
───────────────────────────────────────────────────── */
function drawHandSkeleton(landmarks) {
    /** Convert normalised MediaPipe coords → canvas pixels (mirrored x) */
    const toXY = lm => ({ x: (1 - lm.x) * CW, y: lm.y * CH });

    // Skeleton lines
    ctx.save();
    ctx.strokeStyle   = '#23f5b2';
    ctx.lineWidth     = 2;
    ctx.globalAlpha   = 0.65;
    ctx.shadowColor   = '#23f5b2';
    ctx.shadowBlur    = 4;

    for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = toXY(landmarks[a]);
        const p2 = toXY(landmarks[b]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // Regular landmark nodes
    ctx.shadowBlur  = 2;
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < landmarks.length; i++) {
        if (i === 8) continue; // index tip drawn separately
        const p = toXY(landmarks[i]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = i === 4 ? '#ffd700' : '#ffffff';
        ctx.fill();
    }
    ctx.restore();

    // Index finger tip — glowing cursor
    const tip = toXY(landmarks[8]);
    const glowR = 28;
    const glowG = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, glowR);
    glowG.addColorStop(0,   '#23f5b2ff');
    glowG.addColorStop(0.45,'#23f5b270');
    glowG.addColorStop(1,   '#23f5b200');

    ctx.save();
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glowG;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 9, 0, Math.PI * 2);
    ctx.fillStyle   = '#23f5b2';
    ctx.shadowColor = '#23f5b2';
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
}

/* ─────────────────────────────────────────────────────
   MAIN GAME LOOP
───────────────────────────────────────────────────── */
function gameLoop() {
    if (gameState !== STATES.PLAYING) return;

    ctx.clearRect(0, 0, CW, CH);

    // 1. Draw mirrored webcam frame
    if (videoEl) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, -CW, 0, CW, CH);
        ctx.restore();
    }

    // 2. Dark overlay — improves bubble/skeleton legibility
    ctx.fillStyle = 'rgba(7, 17, 24, 0.38)';
    ctx.fillRect(0, 0, CW, CH);

    // 3. Update & draw bubbles
    for (const b of bubbles) { b.update(); if (!b.caught) b.draw(); }

    // 4. Detect misses — deduct lives
    const justMissed = bubbles.filter(b => b.missed);
    for (const _ of justMissed) lives = Math.max(0, lives - 1);
    if (justMissed.length) updateHUD();

    // Remove finished bubbles
    bubbles = bubbles.filter(b => !b.missed && !b.caught);

    // 5. Collision check
    checkCollisions();

    // 6. Update & draw particles / text effects
    for (const p of particles) { p.update(); p.draw(); }
    particles = particles.filter(p => !p.isDead());

    // 7. Combo timer
    if (comboFrames > 0) {
        comboFrames--;
    } else if (combo > 1) {
        combo = 1;
        updateHUD();
    }

    // 8. Draw hand skeleton on top
    if (fingerPos?.landmarks) {
        drawHandSkeleton(fingerPos.landmarks);
    }

    // 9. "No hand" hint
    if (!fingerPos) {
        ctx.save();
        ctx.fillStyle  = 'rgba(255,255,255,0.55)';
        ctx.font       = '15px "SUIT", sans-serif';
        ctx.textAlign  = 'center';
        ctx.fillText('✋  Show your hand to the camera', CW / 2, CH - 18);
        ctx.restore();
    }

    // 10. Game over?
    if (lives <= 0) { endGame(); return; }

    frameId = requestAnimationFrame(gameLoop);
}

/* ─────────────────────────────────────────────────────
   GAME OVER
───────────────────────────────────────────────────── */
function endGame() {
    gameState = STATES.GAMEOVER;
    clearInterval(spawnTimer);
    cancelAnimationFrame(frameId);

    finalScoreEl.textContent = score;
    gameOverOverlay.classList.remove('hidden');

    // Stop camera tracks and remove hidden video from DOM
    if (videoEl?.srcObject) {
        videoEl.srcObject.getTracks().forEach(t => t.stop());
        videoEl.srcObject = null;
    }
    if (videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl);
    videoEl = null;
}

/* ─────────────────────────────────────────────────────
   RESTART
───────────────────────────────────────────────────── */
function restartGame() {
    gameOverOverlay.classList.add('hidden');
    startGame();
}

/* ─────────────────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────────────────── */
startBtn.addEventListener('click',   startGame);
restartBtn.addEventListener('click', restartGame);
