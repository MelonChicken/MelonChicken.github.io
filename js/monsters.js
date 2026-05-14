/**
 * monsters.js — Gesture Commander
 * Procedural canvas-drawn monster renderers (no external assets, CC0)
 *
 * Each function: (ctx, x, y, rad, t, flash, frozen)
 *   ctx    — CanvasRenderingContext2D
 *   x, y   — centre position (Enemy.draw already applies bob offset)
 *   rad    — collision radius from ENEMY_TYPES
 *   t      — animation phase (this.bob × 2)
 *   flash  — truthy when hit (renders red tint)
 *   frozen — bool (renders ice-blue tint)
 *
 * NOTE: Golem uses rrect() which is defined in game.js.
 *       This file must be loaded BEFORE game.js.
 */

'use strict';

/* ═══════════════════════════════════════════════
   MONSTER RENDERERS
═══════════════════════════════════════════════ */
const MONSTER_DRAW = {

    /* ── Slime: bouncy teal blob ─────────────── */
    Slime(ctx, x, y, rad, t, flash, frozen) {
        const squX = 1 + Math.sin(t) * 0.18;
        const squY = 1 - Math.sin(t) * 0.14;
        const col  = frozen ? '#74b9ff' : '#00b894';
        const rx = rad * squX, ry = rad * squY;

        ctx.save();
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
        ctx.fillStyle   = flash ? '#ff4455' : col;
        ctx.shadowColor = col; ctx.shadowBlur = flash ? 0 : 14;
        ctx.fill();

        // highlight bubble
        ctx.beginPath(); ctx.ellipse(x-rx*.28, y-ry*.28, rx*.22, ry*.18, -.4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.shadowBlur = 0; ctx.fill();

        // eyes
        const ey = y - ry*.12;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(x-rx*.3, ey, rad*.16, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+rx*.3, ey, rad*.16, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x-rx*.24, ey-rad*.07, rad*.06, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+rx*.36, ey-rad*.07, rad*.06, 0, Math.PI*2); ctx.fill();

        // smile / wince
        ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = rad*.09; ctx.lineCap = 'round';
        ctx.beginPath();
        flash ? ctx.arc(x, y+ry*.2,  rad*.22, 0, Math.PI, true)
              : ctx.arc(x, y+ry*.12, rad*.22, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
    },

    /* ── Phantom: floating ghost ──────────────── */
    Phantom(ctx, x, y, rad, t, flash, frozen) {
        const col  = frozen ? '#74b9ff' : '#a29bfe';
        const body = flash ? '#ff4455bb' : col + 'cc';
        ctx.save();
        ctx.shadowColor = col; ctx.shadowBlur = flash ? 0 : 16;

        // wavy tail (3-bump scallop)
        const bw = (rad * 1.8) / 3;
        ctx.beginPath(); ctx.moveTo(x - rad*.9, y + rad*.1);
        for (let i = 0; i < 3; i++) {
            const wa = Math.sin(t*1.1 + i*1.4) * rad*.2;
            const bx = x - rad*.9 + bw*(i+.5);
            ctx.quadraticCurveTo(x-rad*.9+bw*i+bw*.25, y+rad*.78+wa, bx, y+rad*.44);
            ctx.quadraticCurveTo(x-rad*.9+bw*i+bw*.75, y+rad*.1-wa, x-rad*.9+bw*(i+1), y+rad*.1);
        }
        ctx.closePath(); ctx.fillStyle = body; ctx.fill();

        // head dome
        ctx.beginPath();
        ctx.arc(x, y, rad*.88, Math.PI, 0);
        ctx.lineTo(x+rad*.88, y+rad*.12); ctx.lineTo(x-rad*.88, y+rad*.12);
        ctx.closePath(); ctx.fillStyle = body; ctx.fill();

        // glowing eyes
        for (const ex of [x-rad*.32, x+rad*.32]) {
            const g = ctx.createRadialGradient(ex, y-rad*.08, 0, ex, y-rad*.08, rad*.26);
            g.addColorStop(0, '#ffffff'); g.addColorStop(.5, col); g.addColorStop(1, col+'00');
            ctx.beginPath(); ctx.arc(ex, y-rad*.08, rad*.26, 0, Math.PI*2);
            ctx.fillStyle = g; ctx.shadowBlur = 0; ctx.fill();
        }
        ctx.restore();
    },

    /* ── Golem: stone creature ────────────────── */
    Golem(ctx, x, y, rad, t, flash, frozen) {
        const col  = frozen ? '#74b9ff' : '#b2bec3';
        const dark = frozen ? '#4a6fa5' : '#636e72';
        const walk = Math.sin(t*.5);
        ctx.save();
        ctx.shadowColor = col; ctx.shadowBlur = flash ? 20 : 7;

        // legs
        ctx.fillStyle = flash ? '#ff4455' : dark;
        ctx.beginPath(); ctx.rect(x-rad*.45, y+rad*.5,  rad*.35, rad*.52-walk*4); ctx.fill();
        ctx.beginPath(); ctx.rect(x+rad*.1,  y+rad*.5,  rad*.35, rad*.52+walk*4); ctx.fill();

        // arms
        ctx.fillStyle = flash ? '#ff4455' : '#74808a';
        ctx.beginPath(); ctx.rect(x-rad*.96, y-rad*.36, rad*.38, rad*.56); ctx.fill();
        ctx.beginPath(); ctx.rect(x+rad*.58, y-rad*.36, rad*.38, rad*.56); ctx.fill();

        // body (uses rrect from game.js)
        ctx.fillStyle = flash ? '#ff4455' : col;
        rrect(x-rad*.65, y-rad*.62, rad*1.3, rad*1.22, rad*.12); ctx.fill();

        // crack lines
        ctx.save();
        ctx.strokeStyle='#2d3436'; ctx.lineWidth=rad*.045; ctx.globalAlpha=.5;
        ctx.beginPath();
        ctx.moveTo(x-rad*.15,y-rad*.5); ctx.lineTo(x+rad*.05,y-rad*.08); ctx.lineTo(x+rad*.2,y-rad*.3);
        ctx.stroke();
        ctx.restore();

        // menacing red eye slits
        ctx.fillStyle = flash ? '#fff' : '#e17055';
        ctx.shadowColor='#e17055'; ctx.shadowBlur=9;
        ctx.beginPath(); ctx.rect(x-rad*.44, y-rad*.28, rad*.28, rad*.15); ctx.fill();
        ctx.beginPath(); ctx.rect(x+rad*.16, y-rad*.28, rad*.28, rad*.15); ctx.fill();

        ctx.restore();
    },

    /* ── Imp: winged demon ────────────────────── */
    Imp(ctx, x, y, rad, t, flash, frozen) {
        const col  = frozen ? '#74b9ff' : '#e17055';
        const hop  = -Math.abs(Math.sin(t*.7)) * rad*.2;
        const flap =  Math.sin(t*1.3) * rad*.3;
        ctx.save();

        // wings (drawn behind body)
        ctx.globalAlpha = .68; ctx.fillStyle = flash ? '#ff4455' : '#2d3436'; ctx.shadowBlur = 0;
        for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x + sx*rad*.38, y+hop);
            ctx.quadraticCurveTo(x+sx*rad*1.35, y-rad*.7+flap+hop, x+sx*rad*1.05, y+rad*.36+hop);
            ctx.quadraticCurveTo(x+sx*rad*.75,  y+rad*.2+hop,      x+sx*rad*.38, y+hop);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowColor = col; ctx.shadowBlur = flash ? 0 : 12;

        // body + head
        ctx.fillStyle = flash ? '#ff4455' : col;
        ctx.beginPath(); ctx.ellipse(x, y+rad*.16+hop, rad*.52, rad*.58, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y-rad*.32+hop, rad*.52, rad*.48, 0, 0, Math.PI*2); ctx.fill();

        // horns
        ctx.fillStyle = flash ? '#ff6666' : '#b33000'; ctx.shadowBlur = 0;
        for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x+sx*rad*.33, y-rad*.67+hop);
            ctx.lineTo(x+sx*rad*.52, y-rad*1.22+hop);
            ctx.lineTo(x+sx*rad*.13, y-rad*.72+hop);
            ctx.closePath(); ctx.fill();
        }

        // eyes
        ctx.fillStyle='#fdcb6e'; ctx.shadowColor='#fdcb6e'; ctx.shadowBlur=9;
        ctx.beginPath(); ctx.ellipse(x-rad*.22, y-rad*.35+hop, rad*.14, rad*.1,  .3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+rad*.22, y-rad*.35+hop, rad*.14, rad*.1, -.3, 0, Math.PI*2); ctx.fill();

        // tail
        ctx.strokeStyle = flash ? '#ff4455' : col;
        ctx.lineWidth = rad*.12; ctx.lineCap = 'round'; ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(x+rad*.3, y+rad*.6+hop);
        ctx.quadraticCurveTo(x+rad*.9, y+rad*.9+hop, x+rad*.72, y+rad*1.1+hop);
        ctx.stroke();
        ctx.fillStyle = flash ? '#ff4455' : col;
        ctx.beginPath();
        ctx.moveTo(x+rad*.58, y+rad*.98+hop);
        ctx.lineTo(x+rad*.9,  y+rad*1.2+hop);
        ctx.lineTo(x+rad*.7,  y+rad*.94+hop);
        ctx.closePath(); ctx.fill();

        ctx.restore();
    },

    /* ── Specter: fast dashing ghost ─────────── */
    Specter(ctx, x, y, rad, t, flash, frozen) {
        const col = frozen ? '#74b9ff' : '#fd79a8';
        ctx.save();

        // speed streaks (motion blur)
        if (!flash && !frozen) {
            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = .14 - i*.03;
                ctx.beginPath(); ctx.ellipse(x+i*rad*.58, y, rad*(1-i*.18), rad*.5, 0, 0, Math.PI*2);
                ctx.fillStyle = col; ctx.fill();
            }
        }

        ctx.globalAlpha = .9;
        ctx.shadowColor = col; ctx.shadowBlur = flash ? 0 : 18;

        // main body
        ctx.beginPath(); ctx.ellipse(x, y, rad*1.12, rad*.62, 0, 0, Math.PI*2);
        ctx.fillStyle = flash ? '#ff4455cc' : col+'cc'; ctx.fill();

        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        // eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(x-rad*.32, y-rad*.07, rad*.2,  rad*.12, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+rad*.32, y-rad*.07, rad*.2,  rad*.12, 0, 0, Math.PI*2); ctx.fill();
        // pupils
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(x-rad*.28, y-rad*.07, rad*.09, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+rad*.36, y-rad*.07, rad*.09, 0, Math.PI*2); ctx.fill();

        // jagged grin
        ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=rad*.07; ctx.lineCap='round';
        const [mx, my, mw] = [x-rad*.32, y+rad*.19, rad*.64];
        ctx.beginPath(); ctx.moveTo(mx, my);
        for (let i = 0; i < 4; i++) ctx.lineTo(mx+mw*(i/4)+mw/8, my-rad*(i%2===0?.16:.04));
        ctx.lineTo(mx+mw, my); ctx.stroke();

        ctx.restore();
    },
};
