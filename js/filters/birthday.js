/* Birthday Party: a party hat on everyone, a "HAPPY BIRTHDAY" pennant banner and a string of party
   lights across the top, balloons bobbing up the sides, a cake with candles and a pile of presents
   along the bottom. Open your mouth and the party lights up: the room brightens, the bulbs glow
   and twinkle, coloured spotlights sweep, the candles flare, confetti pours out of your mouth and
   confetti cannons pop in the bottom corners. */
import { W, H, TAU, FONT, drawVideo } from '../core.js';
import { tracks, jawI } from '../face.js';
import { facePt, burst, mix, parts } from '../fx.js';

const COLS = ['#ff4d6d', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#fb5607'];
const WORD = 'HAPPY BIRTHDAY';
let party = 0, lastT = 0, fired = false, banner = null;

/* Pennants with the letters on a sagging string, drawn once. */
function buildBanner() {
  banner = document.createElement('canvas'); banner.width = W; banner.height = Math.ceil(H * 0.2);
  const c = banner.getContext('2d'), n = WORD.length, pw = W / (n + 1.5), y0 = H * 0.015, sag = H * 0.04;
  const at = (x) => y0 + sag * (1 - ((2 * x) / W - 1) ** 2);   // the string's height at x
  c.strokeStyle = '#f5f0e6'; c.lineWidth = Math.max(1.5, W * 0.002);
  c.beginPath(); for (let x = 0; x <= W; x += W / 40) c.lineTo(x, at(x)); c.stroke();
  for (let i = 0; i < n; i++) {
    if (WORD[i] === ' ') continue;
    const x = pw * (i + 1.25), y = at(x), w = pw * 0.9, h = w * 1.15;
    c.fillStyle = COLS[i % COLS.length];
    c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x, y + h); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.font = `700 ${Math.round(w * 0.55)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(WORD[i], x, y + h * 0.36);
  }
}
const lightAt = (k) => [W * k, H * 0.2 + H * 0.05 * (1 - (2 * k - 1) ** 2)];   // the light string, k = 0..1 across

function hat(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw, i = Math.floor(p.seed * 7) % COLS.length;
  const l = P(-0.38, 0.5), r = P(0.38, 0.5), tip = P(0.1, 1.55);
  c.save();
  c.beginPath(); c.moveTo(...l); c.lineTo(...tip); c.lineTo(...r); c.quadraticCurveTo(...P(0, 0.44), ...l); c.closePath();
  c.fillStyle = COLS[i]; c.fill();
  c.clip();
  c.fillStyle = COLS[(i + 2) % COLS.length];
  for (const k of [0.12, 0.42, 0.72]) {   // stripes round the cone
    const a0 = mix(l, tip, k), b0 = mix(r, tip, k), a1 = mix(l, tip, k + 0.13), b1 = mix(r, tip, k + 0.13);
    c.beginPath(); c.moveTo(...a0); c.lineTo(...b0); c.lineTo(...b1); c.lineTo(...a1); c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.25)';   // shine down one side
  c.beginPath(); c.moveTo(...mix(l, r, 0.2)); c.lineTo(...tip); c.lineTo(...mix(l, r, 0.32)); c.closePath(); c.fill();
  c.restore();
  c.fillStyle = '#fff';
  for (let k = 0; k <= 8; k++) { c.beginPath(); c.arc(...mix(mix(l, P(0, 0.44), k / 8), mix(P(0, 0.44), r, k / 8), k / 8), fw * 0.045, 0, TAU); c.fill(); }   // fluffy brim
  c.fillStyle = COLS[(i + 1) % COLS.length];   // pom-pom
  for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + t; c.beginPath(); c.arc(tip[0] + Math.cos(a) * fw * 0.05, tip[1] + Math.sin(a) * fw * 0.05, fw * 0.05, 0, TAU); c.fill(); }
}

function balloon(c, x, y, s, col) {
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = Math.max(1, s * 0.03);
  c.beginPath(); c.moveTo(x, y + s * 0.62); c.bezierCurveTo(x - s * 0.3, y + s * 1.4, x + s * 0.3, y + s * 2, x, H + 5); c.stroke();
  c.fillStyle = col;
  c.beginPath(); c.ellipse(x, y, s * 0.42, s * 0.52, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x, y + s * 0.5); c.lineTo(x - s * 0.07, y + s * 0.62); c.lineTo(x + s * 0.07, y + s * 0.62); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(x - s * 0.15, y - s * 0.2, s * 0.08, s * 0.16, -0.4, 0, TAU); c.fill();
}

function cake(c, x, y, s, t, L) {
  c.fillStyle = '#e8e8f0'; c.beginPath(); c.ellipse(x, y, s * 0.62, s * 0.08, 0, 0, TAU); c.fill();   // plate
  for (const [w, h, y0, body, icing] of [[1, 0.36, 0, '#f7c6d9', '#fff'], [0.68, 0.3, 0.36, '#c9a6f2', '#fff']]) {
    const top = y - (y0 + h) * s;
    c.fillStyle = body; c.fillRect(x - w * s / 2, top, w * s, h * s);
    c.fillStyle = icing;   // icing dripping down from the top
    c.beginPath(); c.moveTo(x - w * s / 2, top);
    for (let k = 0; k <= 8; k++) { const xx = x - w * s / 2 + (w * s * k) / 8; c.lineTo(xx, top + s * (k % 2 ? 0.1 : 0.05)); }
    c.lineTo(x + w * s / 2, top); c.closePath(); c.fill();
  }
  const top = y - 0.66 * s;
  for (let k = 0; k < 5; k++) {   // candles
    const cx = x + (k - 2) * s * 0.12;
    c.fillStyle = COLS[k]; c.fillRect(cx - s * 0.02, top - s * 0.2, s * 0.04, s * 0.2);
    const f = s * (0.06 + 0.04 * L) * (1 + 0.15 * Math.sin(t * 17 + k * 2));
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(cx, top - s * 0.24, 0, cx, top - s * 0.24, f * 3);
    g.addColorStop(0, `rgba(255,200,90,${0.35 + 0.4 * L})`); g.addColorStop(1, 'rgba(255,160,60,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, top - s * 0.24, f * 3, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(cx, top - s * 0.24 - f * 1.4); c.quadraticCurveTo(cx + f * 0.7, top - s * 0.24, cx, top - s * 0.205); c.quadraticCurveTo(cx - f * 0.7, top - s * 0.24, cx, top - s * 0.24 - f * 1.4); c.fill();
  }
}

function present(c, x, y, w, h, col, ribbon) {
  c.fillStyle = col; c.fillRect(x - w / 2, y - h, w, h);
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + w * 0.2, y - h, w * 0.3, h);
  c.fillStyle = ribbon; c.fillRect(x - w * 0.07, y - h, w * 0.14, h); c.fillRect(x - w / 2, y - h * 0.62, w, h * 0.12);
  for (const s of [-1, 1]) {   // bow
    c.beginPath(); c.ellipse(x + s * w * 0.13, y - h - w * 0.06, w * 0.14, w * 0.08, s * 0.5, 0, TAU); c.fill();
  }
}

/* A burst of confetti from a bottom corner. */
function cannon(x, dir) {
  const m = Math.min(W, H);
  for (let i = 0; i < 40 && parts.length < 300; i++) {
    const a = -Math.PI / 2 + dir * (0.25 + Math.random() * 0.5), v = m * (1 + Math.random() * 0.9);
    parts.push({ type: 'confetti', x, y: H, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ay: m * 1.1, drag: 1.2, life: 2.5 + Math.random(),
      size: m * (0.008 + Math.random() * 0.006), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9, phase: Math.random() * TAU, hue: (Math.random() * 360) | 0 });
  }
}

export default {
  name: 'Birthday Party',
  hint: 'Open your mouth to start the party!',
  base(c, t) {
    drawVideo(c);
    const v = Math.round(150 + 105 * party);   // lights down until the party starts
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${v},${v - 10},${Math.min(255, v + 20)})`; c.fillRect(0, 0, W, H); c.restore();
    // the string of party lights and the banner, behind the hats
    const L = party;
    c.strokeStyle = '#2b2b2b'; c.lineWidth = Math.max(1.5, Math.min(W, H) * 0.003);
    c.beginPath(); for (let k = 0; k <= 1.001; k += 0.025) c.lineTo(...lightAt(k)); c.stroke();
    for (let i = 0; i < 16; i++) {
      const [x, y] = lightAt((i + 0.5) / 16), col = COLS[i % COLS.length], tw = 0.6 + 0.4 * Math.sin(t * 7 + i * 2.3), r = Math.min(W, H) * 0.012;
      if (L > 0.02) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(x, y + r, 0, x, y + r, r * 5);
        g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = L * tw; c.fillStyle = g; c.beginPath(); c.arc(x, y + r, r * 5, 0, TAU); c.fill();
        c.restore();
      }
      c.globalAlpha = 0.45 + 0.55 * L; c.fillStyle = col; c.beginPath(); c.ellipse(x, y + r, r * 0.75, r, 0, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    if (!banner || banner.width !== W) buildBanner();
    c.drawImage(banner, 0, 0);
  },
  face(c, p, t, dt) {
    hat(c, p, t);
    const I = jawI(p);
    if (I > 0) burst(p, 'confetti', I * 3, dt);
  },
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT)), m = Math.min(W, H);
    lastT = t;
    let want = 0;
    for (const p of tracks) want = Math.max(want, jawI(p));
    party += (want - party) * Math.min(1, dt * (want > party ? 6 : 1.2));
    if (party > 0.5 && !fired) { fired = true; cannon(0, 1); cannon(W, -1); }
    if (party < 0.2) fired = false;
    const L = party;

    c.save();
    c.globalCompositeOperation = 'lighter';
    if (L > 0.02) for (let i = 0; i < 4; i++) {   // spotlights sweeping from the top corners
      const sx = i < 2 ? 0 : W, a = Math.atan2(H, W / 2 - sx) + Math.sin(t * (0.9 + i * 0.2) + i * 1.7) * 0.5, len = Math.hypot(W, H);
      const g = c.createLinearGradient(sx, 0, sx + Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, `hsla(${(i * 90 + t * 40) % 360},100%,65%,${0.35 * L})`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + Math.cos(a - 0.1) * len, Math.sin(a - 0.1) * len); c.lineTo(sx + Math.cos(a + 0.1) * len, Math.sin(a + 0.1) * len); c.closePath(); c.fill();
    }
    c.restore();

    for (const [i, side] of [[0, -1], [1, -1], [2, -1], [3, 1], [4, 1], [5, 1]]) {   // balloons up both sides
      const k = i % 3, x = side < 0 ? W * (0.05 + k * 0.045) : W * (0.95 - k * 0.045);
      balloon(c, x, H * (0.38 + k * 0.1) + Math.sin(t * 1.3 + i) * H * 0.015, m * 0.09, COLS[(i * 2 + 1) % COLS.length]);
    }
    const s = m * 0.24;
    cake(c, W * 0.17, H - s * 0.06, s, t, L);
    present(c, W * 0.8, H, s * 0.5, s * 0.42, '#3a86ff', '#ffbe0b');
    present(c, W * 0.92, H, s * 0.36, s * 0.3, '#ff4d6d', '#fff');
    present(c, W * 0.81, H - s * 0.42, s * 0.3, s * 0.26, '#06d6a0', '#ff4d6d');
  },
};
