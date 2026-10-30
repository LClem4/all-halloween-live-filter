/* Royalty (background swap): the first person in view gets a jewelled gold crown, everyone else a
   diamond tiara. Behind them a palace with a gold dome, towers and royal purple banners; the
   Vatican flag flies from the left tower and a royal purple flag from the right. Herald trumpets
   hung with purple banners rise from the bottom corners and sound a fanfare every few seconds. */
import { W, H, TAU, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { facePt, drawStar, topGlow, parts } from '../fx.js';
import { key } from '../props.js';
import { personReady } from '../segment.js';

const HZ = 0.6;   // foot of the palace, fraction of the screen
const PURPLE = '#5a1d8c', GOLD = '#e2b84a';
const GEMS = ['#d11a3a', '#1f5fd1', '#1c9a4a', '#d11a3a', '#1f5fd1'];
const POINTS = [[-0.5, 0.95], [-0.32, 0.75], [-0.2, 1.08], [-0.08, 0.78], [0, 1.15], [0.08, 0.78], [0.2, 1.08], [0.32, 0.75], [0.5, 0.95]];
let palace = null, vatican = null, royal = null, lastT = 0;

function crown(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  // velvet cap behind the points
  c.beginPath(); c.moveTo(...P(-0.42, 0.68)); c.bezierCurveTo(...P(-0.4, 1.1), ...P(0.4, 1.1), ...P(0.42, 0.68)); c.closePath();
  c.fillStyle = '#7a0f22'; c.fill();
  // band with five points
  c.beginPath();
  c.moveTo(...P(-0.5, 0.5));
  for (const [a, b] of POINTS) c.lineTo(...P(a, b));
  c.lineTo(...P(0.5, 0.5)); c.quadraticCurveTo(...P(0, 0.56), ...P(-0.5, 0.5));
  c.closePath();
  const [gx, gy] = P(-0.15, 0.9);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.8);
  g.addColorStop(0, '#fff3b0'); g.addColorStop(0.4, '#e8b93a'); g.addColorStop(1, '#9a6b14');
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#7a5210'; c.lineWidth = fw * 0.012; c.stroke();
  // pearls on the tips, gems on the band
  for (const i of [0, 2, 4, 6, 8]) {
    c.fillStyle = '#fbf6ea'; c.beginPath(); c.arc(...P(POINTS[i][0], POINTS[i][1] + 0.03), fw * 0.03, 0, TAU); c.fill();
  }
  GEMS.forEach((col, i) => {
    const [x, y] = P(-0.36 + i * 0.18, 0.62);
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y, fw * 0.035, fw * 0.045, p.ang, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(x - fw * 0.01, y - fw * 0.015, fw * 0.01, 0, TAU); c.fill();
  });
  twinkle(c, t, POINTS.filter((_, i) => i % 2 === 0).map(([a, b]) => P(a, b + 0.05)), fw);
}

/* A diamond tiara: a fine silver band over the head rising to a peak, set with diamonds and a
   pink centre stone. */
function tiara(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  const [gx, gy] = P(-0.1, 0.8);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.6);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d4d9e1'); g.addColorStop(1, '#8d96a3');
  c.save();
  c.strokeStyle = g; c.fillStyle = g; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = fw * 0.035;
  c.beginPath(); c.moveTo(...P(-0.44, 0.5)); c.quadraticCurveTo(...P(0, 0.64), ...P(0.44, 0.5)); c.stroke();   // band
  c.lineWidth = fw * 0.02;
  const peak = [[-0.34, 0.55, 0.66], [-0.18, 0.6, 0.78], [0, 0.62, 0.95], [0.18, 0.6, 0.78], [0.34, 0.55, 0.66]];
  for (const [a, b0, b1] of peak) {   // filigree arches rising to each point
    const w = a === 0 ? 0.11 : 0.08;
    c.beginPath(); c.moveTo(...P(a - w, b0)); c.quadraticCurveTo(...P(a - w * 0.3, (b0 + b1) / 2 + 0.05), ...P(a, b1));
    c.quadraticCurveTo(...P(a + w * 0.3, (b0 + b1) / 2 + 0.05), ...P(a + w, b0)); c.stroke();
  }
  for (const [a, , b1] of peak) { c.fillStyle = '#f4fbff'; c.beginPath(); c.arc(...P(a, b1), fw * (a === 0 ? 0.04 : 0.028), 0, TAU); c.fill(); }
  for (let i = -4; i <= 4; i++) { c.fillStyle = '#eaf6ff'; c.beginPath(); c.arc(...P(i * 0.09, 0.57 - Math.abs(i) * 0.012), fw * 0.016, 0, TAU); c.fill(); }
  const [cx, cy] = P(0, 0.72);
  c.fillStyle = '#ff5fa2'; c.beginPath(); c.ellipse(cx, cy, fw * 0.04, fw * 0.055, p.ang, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(cx - fw * 0.012, cy - fw * 0.02, fw * 0.012, 0, TAU); c.fill();
  c.restore();
  twinkle(c, t, peak.map(([a, , b1]) => P(a, b1)), fw);
}

function twinkle(c, t, pts, fw) {
  c.save(); c.globalCompositeOperation = 'lighter';
  pts.forEach(([x, y], i) => {
    const k = Math.max(0, Math.sin(t * 2.5 + i * 1.7)) ** 6;
    if (k > 0.05) drawStar(c, x, y, fw * 0.07 * k, t, `rgba(255,250,220,${k})`);
  });
  c.restore();
}

/* A little gold crown emblem centred at (x, y), s wide. */
function emblem(c, x, y, s) {
  c.fillStyle = GOLD;
  c.beginPath(); c.moveTo(x - s / 2, y + s * 0.3);
  for (const [a, b] of [[-0.5, -0.3], [-0.25, 0], [0, -0.4], [0.25, 0], [0.5, -0.3]]) c.lineTo(x + a * s, y + b * s);
  c.lineTo(x + s / 2, y + s * 0.3); c.closePath(); c.fill();
}

function buildFlags(w, h) {
  vatican = document.createElement('canvas'); vatican.width = w; vatican.height = h;
  let c = vatican.getContext('2d');
  c.fillStyle = '#ffe000'; c.fillRect(0, 0, w / 2, h);
  c.fillStyle = '#ffffff'; c.fillRect(w / 2, 0, w / 2, h);
  c.save(); c.translate(w * 0.75, h * 0.62);   // the crossed keys, gold and silver
  c.save(); c.rotate(0.6); key(c, h * 0.5, '#e2b84a', '#8a6414'); c.restore();
  c.save(); c.rotate(-0.6); c.scale(-1, 1); key(c, h * 0.5, '#c9ced6', '#6d7682'); c.restore();
  c.restore();
  const tx = w * 0.75, ty = h * 0.3, tw = h * 0.16;   // the papal tiara above them
  c.fillStyle = '#f4f4f4'; c.strokeStyle = '#b38a2a'; c.lineWidth = Math.max(1, h * 0.012);
  c.beginPath(); c.moveTo(tx - tw / 2, ty + tw * 0.55); c.bezierCurveTo(tx - tw * 0.6, ty - tw * 0.3, tx - tw * 0.2, ty - tw * 0.6, tx, ty - tw * 0.62);
  c.bezierCurveTo(tx + tw * 0.2, ty - tw * 0.6, tx + tw * 0.6, ty - tw * 0.3, tx + tw / 2, ty + tw * 0.55); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#e2b84a';
  for (const b of [0.4, 0.05, -0.3]) c.fillRect(tx - tw * (0.5 - Math.abs(b) * 0.25), ty + tw * b, tw * (1 - Math.abs(b) * 0.5), tw * 0.1);
  c.fillRect(tx - tw * 0.03, ty - tw * 0.85, tw * 0.06, tw * 0.25); c.fillRect(tx - tw * 0.1, ty - tw * 0.78, tw * 0.2, tw * 0.06);
  royal = document.createElement('canvas'); royal.width = w; royal.height = h;
  c = royal.getContext('2d');
  c.fillStyle = PURPLE; c.fillRect(0, 0, w, h);
  c.strokeStyle = GOLD; c.lineWidth = h * 0.06; c.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  emblem(c, w / 2, h / 2, h * 0.5);
}

/* A flag image flying from the top of a pole standing at (x, foot), waving in strips. */
function flag(c, img, x, foot, t, ph) {
  const n = 12, sw = img.width / n, y = foot - img.height * 1.3;
  c.fillStyle = '#6b5a3a'; c.fillRect(x - 2, y - img.height * 0.1, 4, foot - y + img.height * 0.1);   // pole
  for (let i = 0; i < n; i++) {
    const k = i / n, dy = Math.sin(t * 4 - k * 5 + ph) * img.height * 0.08 * k, shade = 0.12 * Math.sin(t * 4 - k * 5 + ph + 1);
    c.drawImage(img, i * sw, 0, sw + 1, img.height, x + i * sw, y + dy, sw + 1, img.height);
    if (shade > 0) { c.fillStyle = `rgba(0,0,0,${shade})`; c.fillRect(x + i * sw, y + dy, sw + 1, img.height); }
  }
}

function build() {
  palace = document.createElement('canvas'); palace.width = W; palace.height = H;
  const c = palace.getContext('2d'), hz = H * HZ, m = Math.min(W, H);
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#7fb6f0'); g.addColorStop(1, '#ffe4bd');
  c.fillStyle = g; c.fillRect(0, 0, W, hz);
  // courtyard, with a red carpet running up to the doors
  c.fillStyle = '#d8cdb8'; c.fillRect(0, hz, W, H - hz);
  c.strokeStyle = 'rgba(120,100,70,0.25)'; c.lineWidth = 1;
  for (let i = 1; i < 8; i++) { const y = hz + (H - hz) * (i / 8) ** 1.5; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#b3121f';
  c.beginPath(); c.moveTo(W * 0.46, hz); c.lineTo(W * 0.54, hz); c.lineTo(W * 0.72, H); c.lineTo(W * 0.28, H); c.closePath(); c.fill();
  c.strokeStyle = GOLD; c.lineWidth = Math.max(2, m * 0.006); c.stroke();
  const wall = '#f2e3c2', trim = '#d9c49a', win = (x, y, w, h) => {
    c.fillStyle = '#34447a'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = Math.max(1, w * 0.12); c.stroke();
  };
  // main block
  const top = hz - H * 0.2;
  c.fillStyle = wall; c.fillRect(W * 0.16, top, W * 0.68, H * 0.2);
  c.fillStyle = trim; c.fillRect(W * 0.15, top - H * 0.015, W * 0.7, H * 0.02);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
    const x = W * (0.19 + i * 0.054);
    if (x > W * 0.4 && x < W * 0.58) continue;
    win(x, top + H * (0.03 + r * 0.085), W * 0.022, H * 0.055);
  }
  for (const x of [0.3, 0.68]) {   // purple banners hanging down the front
    c.fillStyle = PURPLE; c.beginPath(); c.moveTo(W * x, top); c.lineTo(W * (x + 0.035), top); c.lineTo(W * (x + 0.035), top + H * 0.15);
    c.lineTo(W * (x + 0.0175), top + H * 0.13); c.lineTo(W * x, top + H * 0.15); c.closePath(); c.fill();
    emblem(c, W * (x + 0.0175), top + H * 0.04, W * 0.022);
  }
  // portico with columns and a pediment, the drum and the gold dome
  c.fillStyle = '#fbf3e0';
  for (let i = 0; i < 4; i++) c.fillRect(W * (0.43 + i * 0.043), top + H * 0.01, W * 0.012, H * 0.19);
  c.fillStyle = '#3b2a1a'; c.fillRect(W * 0.47, hz - H * 0.09, W * 0.06, H * 0.09);
  c.fillStyle = wall; c.beginPath(); c.moveTo(W * 0.41, top); c.lineTo(W * 0.5, top - H * 0.06); c.lineTo(W * 0.59, top); c.closePath(); c.fill();
  c.strokeStyle = trim; c.lineWidth = Math.max(2, m * 0.004); c.stroke();
  c.fillStyle = wall; c.fillRect(W * 0.44, top - H * 0.12, W * 0.12, H * 0.065);
  for (let i = 0; i < 4; i++) win(W * (0.452 + i * 0.027), top - H * 0.11, W * 0.012, H * 0.04);
  const dg = c.createRadialGradient(W * 0.47, top - H * 0.2, 0, W * 0.5, top - H * 0.14, W * 0.08);
  dg.addColorStop(0, '#fff1b0'); dg.addColorStop(0.5, '#e2b84a'); dg.addColorStop(1, '#9a6b14');
  c.fillStyle = dg; c.beginPath(); c.ellipse(W * 0.5, top - H * 0.12, W * 0.065, H * 0.1, 0, Math.PI, TAU); c.fill();
  c.fillStyle = GOLD; c.fillRect(W * 0.497, top - H * 0.26, W * 0.006, H * 0.05); c.fillRect(W * 0.49, top - H * 0.245, W * 0.02, H * 0.008);
  // towers with conical purple roofs
  for (const x of [0.1, 0.84]) {
    const tx = W * x, tw = W * 0.09, tt = hz - H * 0.32;
    c.fillStyle = wall; c.fillRect(tx - tw / 2, tt, tw, hz - tt);
    c.fillStyle = trim; c.fillRect(tx - tw * 0.55, tt - H * 0.012, tw * 1.1, H * 0.015);
    for (let r = 0; r < 3; r++) win(tx - tw * 0.15, tt + H * (0.04 + r * 0.09), tw * 0.3, H * 0.05);
    c.fillStyle = '#4b2a7a'; c.beginPath(); c.moveTo(tx - tw * 0.6, tt - H * 0.01); c.lineTo(tx, tt - H * 0.13); c.lineTo(tx + tw * 0.6, tt - H * 0.01); c.closePath(); c.fill();
  }
  // hedges along the front
  c.fillStyle = '#3f7a3a';
  for (let x = 0; x < W; x += m * 0.05) if (x < W * 0.4 || x > W * 0.6) { c.beginPath(); c.arc(x, hz + m * 0.01, m * 0.035, Math.PI, TAU); c.fill(); }
  const fw = Math.round(Math.min(W * 0.13, m * 0.15));
  buildFlags(fw, Math.round(fw * 0.66));
}

/* A long herald trumpet from (x0, y0) to its bell at (x1, y1), with a purple banner hung on it. */
function trumpet(c, x0, y0, x1, y1, t, side) {
  const m = Math.min(W, H), a = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
  c.save(); c.translate(x0, y0); c.rotate(a);
  const g = c.createLinearGradient(0, -m * 0.01, 0, m * 0.01);
  g.addColorStop(0, '#fff0a8'); g.addColorStop(0.5, '#d9a93c'); g.addColorStop(1, '#8a6414');
  c.fillStyle = g;
  c.fillRect(0, -m * 0.006, len, m * 0.012);   // tube
  c.beginPath(); c.moveTo(len - m * 0.1, -m * 0.006); c.quadraticCurveTo(len - m * 0.02, -m * 0.01, len, -m * 0.045);
  c.lineTo(len, m * 0.045); c.quadraticCurveTo(len - m * 0.02, m * 0.01, len - m * 0.1, m * 0.006); c.closePath(); c.fill();   // bell
  c.fillStyle = '#8a6414'; c.beginPath(); c.ellipse(len, 0, m * 0.008, m * 0.045, 0, 0, TAU); c.fill();
  c.restore();
  // the banner hangs straight down from the tube
  const k = 0.55, bx = x0 + (x1 - x0) * k, by = y0 + (y1 - y0) * k, bw = m * 0.11, bh = m * 0.15, sway = Math.sin(t * 1.5 + side) * m * 0.006;
  c.fillStyle = PURPLE;
  c.beginPath(); c.moveTo(bx - bw / 2, by); c.lineTo(bx + bw / 2, by); c.lineTo(bx + bw / 2 + sway, by + bh); c.lineTo(bx + sway, by + bh * 0.8); c.lineTo(bx - bw / 2 + sway, by + bh); c.closePath(); c.fill();
  c.strokeStyle = GOLD; c.lineWidth = Math.max(1.5, m * 0.004); c.stroke();
  emblem(c, bx + sway * 0.5, by + bh * 0.38, bw * 0.5);
}

/* A burst of gold music notes from a trumpet bell. */
function fanfare(x, y, dir) {
  const m = Math.min(W, H);
  for (let i = 0; i < 6 && parts.length < 300; i++) {
    parts.push({ type: 'note', x, y, vx: dir * m * (0.1 + Math.random() * 0.2), vy: -m * (0.15 + Math.random() * 0.2), ay: -m * 0.03, drag: 0.8,
      life: 1.8 + Math.random(), size: m * (0.035 + Math.random() * 0.02), rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 1.5,
      phase: Math.random() * TAU, kind: (Math.random() * 3) | 0, hue: 45 });
  }
}

export default {
  name: 'Royalty',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!palace || palace.width !== W || palace.height !== H) build();
    c.drawImage(palace, 0, 0);
    const roof = H * HZ - H * 0.45;   // the tips of the tower roofs
    flag(c, vatican, W * 0.1, roof, t, 0);
    flag(c, royal, W * 0.84, roof, t, 1.3);
  },
  face(c, p, t) {
    let first = p;   // the person who has been in view longest wears the crown
    for (const q of tracks) if (q.id < first.id) first = q;
    if (first === p) crown(c, p, t); else tiara(c, p, t);
  },
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    topGlow(c, 0.12);
    if (!personReady()) return;
    const b0 = [W * 0.2, H * 0.62], b1 = [W * 0.8, H * 0.62];
    trumpet(c, -W * 0.02, H * 1.02, ...b0, t, 0);
    trumpet(c, W * 1.02, H * 1.02, ...b1, t, 1);
    if (t % 8 < dt) { fanfare(...b0, -1); fanfare(...b1, 1); }
  },
};
