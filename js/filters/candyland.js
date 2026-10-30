/* Candy Kingdom (background swap): a pastel sky with a big rainbow and drifting cotton-candy
   clouds over gumdrop hills, lollipop trees, candy canes and a peppermint path. A unicorn
   gallops along the rainbow and another prances over the hills, trailing sparkles. Open your
   mouth and sweets tumble out and the rainbow shines brighter. */
import { W, H, TAU, drawVideo } from '../core.js';
import { tracks, jawI } from '../face.js';
import { burst, rng, drawStar } from '../fx.js';
import { personReady } from '../segment.js';

const HZ = 0.62;   // where the hills meet the sky, fraction of the screen
const RAINBOW = ['#ff5a7a', '#ff9f43', '#ffe066', '#7ee081', '#5ec8ff', '#7d7bff', '#c77dff'];
let land = null, cloud = null, shine = 0, lastT = 0;

function build() {
  land = document.createElement('canvas'); land.width = W; land.height = H;
  const c = land.getContext('2d'), r = rng(21), m = Math.min(W, H), hz = H * HZ;
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#ffb3d9'); g.addColorStop(0.55, '#e4c6ff'); g.addColorStop(1, '#c7ecff');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // gumdrop hills, back row then front row
  for (const [row, n, hh, cols] of [[0, 6, 0.1, ['#ffc4e1', '#d7c4ff', '#bff0d4']], [1, 5, 0.16, ['#ff8fc7', '#a98bff', '#7fe0b0', '#ffd27f']]]) {
    for (let i = 0; i < n; i++) {
      const x = W * ((i + 0.5 * row) / (n - 1)), w = W / (n - 1) * 0.75, h = H * hh * (0.8 + r() * 0.4), base = hz + H * 0.06 * row;
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.moveTo(x - w, base + H * 0.05); c.bezierCurveTo(x - w * 0.8, base - h, x + w * 0.8, base - h, x + w, base + H * 0.05); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';   // sugar sparkles
      for (let k = 0; k < 14; k++) c.fillRect(x + (r() - 0.5) * w * 1.2, base - r() * h * 0.6, 2, 2);
    }
  }
  const gg = c.createLinearGradient(0, hz + H * 0.08, 0, H);
  gg.addColorStop(0, '#9be7c4'); gg.addColorStop(1, '#5fcf9f');
  c.fillStyle = gg; c.fillRect(0, hz + H * 0.08, W, H);
  // a peppermint path winding to the front
  c.fillStyle = '#fff4f8';
  c.beginPath(); c.moveTo(W * 0.47, hz + H * 0.08); c.bezierCurveTo(W * 0.3, H * 0.8, W * 0.75, H * 0.85, W * 0.35, H); c.lineTo(W * 0.75, H);
  c.bezierCurveTo(W * 0.95, H * 0.85, W * 0.45, H * 0.8, W * 0.53, hz + H * 0.08); c.fill();
  for (let i = 0; i < 9; i++) {   // peppermint stepping stones along it
    const k = i / 8, x = W * (0.5 + 0.12 * Math.sin(k * 3.5)) , y = hz + H * 0.1 + (H - hz) * 0.9 * k, s = m * (0.012 + k * 0.03);
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, s, s * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = '#ff4d6d';
    for (let j = 0; j < 6; j += 2) { c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, s, s * 0.45, 0, (j / 6) * TAU, ((j + 1) / 6) * TAU); c.closePath(); c.fill(); }
  }
  // lollipop trees and candy canes
  for (const [x, s] of [[0.07, 1], [0.25, 0.7], [0.72, 0.75], [0.93, 1.05]]) {
    const cx = W * x, base = hz + H * 0.12, h = m * 0.26 * s, rr = m * 0.07 * s;
    c.fillStyle = '#fffaf0'; c.fillRect(cx - m * 0.006 * s, base - h, m * 0.012 * s, h);
    c.fillStyle = RAINBOW[Math.round(x * 10) % RAINBOW.length]; c.beginPath(); c.arc(cx, base - h, rr, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = rr * 0.18;
    c.beginPath(); for (let a = 0; a < TAU * 2.2; a += 0.2) { const q = rr * 0.9 * (a / (TAU * 2.2)); c.lineTo(cx + Math.cos(a) * q, base - h + Math.sin(a) * q); } c.stroke();
  }
  for (const [x, s] of [[0.16, 1], [0.84, 0.9]]) {
    const cx = W * x, base = hz + H * 0.16, h = m * 0.2 * s, lw = m * 0.022 * s;
    for (const [col, dash] of [['#fff', []], ['#e8233f', [lw * 0.9, lw * 0.9]]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.setLineDash(dash);
      c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - h); c.arc(cx + h * 0.18, base - h, h * 0.18, Math.PI, 0); c.stroke();
    }
    c.setLineDash([]);
  }
  // one fluffy cotton-candy cloud, drawn once and reused
  cloud = document.createElement('canvas'); cloud.width = Math.round(m * 0.4); cloud.height = Math.round(m * 0.2);
  const k = cloud.getContext('2d'), cw = cloud.width, ch = cloud.height;
  for (const [x, y, rr, col] of [[0.25, 0.62, 0.22, '#ffd6ec'], [0.45, 0.45, 0.3, '#ffe3f2'], [0.68, 0.55, 0.25, '#f3dcff'], [0.5, 0.68, 0.25, '#ffeaf6']]) {
    k.fillStyle = col; k.beginPath(); k.arc(x * cw, y * ch, rr * ch * 1.4, 0, TAU); k.fill();
  }
}

/* Rainbow arc: centre (W/2, base), outer radius R. */
const ARC = () => ({ x: W / 2, y: H * HZ + H * 0.06, R: Math.min(W * 0.62, H * 0.62) });

/* A unicorn side-on, facing right, s = body length. ph = gallop phase. */
function unicorn(c, x, y, s, ph, dir = 1) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  const leg = (hx, a, b) => {   // hip at (hx, 0.1); two segments; gold hoof
    c.strokeStyle = '#f4ecff'; c.lineWidth = 0.09; c.lineCap = 'round';
    const kx = hx + Math.sin(a) * 0.18, ky = 0.32, fx = kx + Math.sin(b) * 0.16, fy = 0.55;
    c.beginPath(); c.moveTo(hx, 0.1); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
    c.fillStyle = '#e8b62c'; c.beginPath(); c.arc(fx, fy, 0.05, 0, TAU); c.fill();
  };
  leg(-0.3, ph + 1, ph + 2); leg(0.25, ph + 3, ph + 4);   // far legs
  // tail, rainbow strands
  RAINBOW.slice(0, 5).forEach((col, i) => {
    c.strokeStyle = col; c.lineWidth = 0.07;
    c.beginPath(); c.moveTo(-0.45, -0.05); c.quadraticCurveTo(-0.75, -0.1 + i * 0.05 + Math.sin(ph + i) * 0.04, -0.8 - i * 0.02, 0.25 + i * 0.05); c.stroke();
  });
  c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(0, 0, 0.5, 0.24, 0, 0, TAU); c.fill();   // body
  c.beginPath(); c.moveTo(0.25, -0.15); c.lineTo(0.48, -0.55); c.lineTo(0.62, -0.5); c.lineTo(0.5, 0.05); c.closePath(); c.fill();   // neck
  c.beginPath(); c.ellipse(0.66, -0.55, 0.2, 0.11, 0.5, 0, TAU); c.fill();   // head
  c.fillStyle = '#ffd1e8'; c.beginPath(); c.ellipse(0.8, -0.47, 0.07, 0.05, 0.5, 0, TAU); c.fill();   // muzzle
  c.fillStyle = '#3b2a4a'; c.beginPath(); c.arc(0.64, -0.6, 0.03, 0, TAU); c.fill();   // eye
  c.fillStyle = '#ffd34d';   // horn
  c.beginPath(); c.moveTo(0.6, -0.66); c.lineTo(0.78, -0.95); c.lineTo(0.68, -0.64); c.closePath(); c.fill();
  RAINBOW.slice(0, 5).forEach((col, i) => {   // mane down the neck
    c.fillStyle = col;
    c.beginPath(); c.ellipse(0.5 - i * 0.07, -0.62 + i * 0.12, 0.09, 0.06, 0.6, 0, TAU); c.fill();
  });
  leg(-0.25, ph, ph + 1.5); leg(0.3, ph + 2.5, ph + 3.5);   // near legs
  c.restore();
}

export default {
  name: 'Candy Kingdom',
  hint: 'Open your mouth!',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!land || land.width !== W || land.height !== H) build();
    c.drawImage(land, 0, 0);
    const m = Math.min(W, H), { x, y, R } = ARC();
    c.save();   // the rainbow, brighter when someone opens their mouth
    c.globalAlpha = 0.6 + 0.35 * shine;
    const bw = R * 0.07;
    RAINBOW.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = bw * 1.05; c.beginPath(); c.arc(x, y, R - i * bw, Math.PI, TAU); c.stroke(); });
    c.restore();
    for (let i = 0; i < 4; i++) {   // drifting clouds
      const cx = ((t * (0.012 + i * 0.004) + i * 0.29) % 1.3 - 0.15) * W, cy = H * (0.08 + (i % 2) * 0.12 + i * 0.03);
      c.drawImage(cloud, cx - cloud.width / 2, cy - cloud.height / 2);
    }
    // a unicorn galloping along the rainbow, and one prancing over the hills
    const k = (t * 0.06) % 1, a = Math.PI + k * Math.PI, rr = R - bw * 3;
    const ux = x + Math.cos(a) * rr, uy = y + Math.sin(a) * rr;
    unicorn(c, ux, uy - m * 0.065, m * 0.14, t * 9);
    const k2 = (t * 0.045 + 0.5) % 1.3 - 0.15, hx = W * (1 - k2), hy = H * (HZ + 0.06) - Math.abs(Math.sin(t * 4)) * m * 0.04;
    unicorn(c, hx, hy, m * 0.12, t * 8, -1);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 1; i < 7; i++) {   // sparkle trails
      const ka = a - i * 0.03, b = Math.sin(t * 6 + i) * 0.5 + 0.5;
      drawStar(c, x + Math.cos(ka) * rr, y + Math.sin(ka) * rr - m * 0.03, m * 0.012 * b, t, 'rgba(255,255,255,0.9)');
      drawStar(c, hx + i * m * 0.025, hy + Math.sin(t * 5 + i) * m * 0.01, m * 0.01 * b, t, 'rgba(255,240,255,0.9)');
    }
    c.restore();
  },
  face(c, p, t, dt) {
    const I = jawI(p);
    if (I > 0) burst(p, 'candy', I * 1.3, dt);
  },
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    let want = 0;
    for (const p of tracks) want = Math.max(want, jawI(p));
    shine += (want - shine) * Math.min(1, dt * 3);
    if (shine > 0.05 && personReady()) {   // sparkles showering down while the rainbow shines
      const m = Math.min(W, H);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 24; i++) {
        const x = ((i * 0.618 + t * 0.03) % 1) * W, y = ((i * 0.37 + t * 0.15) % 1) * H, b = Math.max(0, Math.sin(t * 5 + i * 1.9));
        drawStar(c, x, y, m * 0.014 * b * shine, t + i, 'rgba(255,255,255,0.9)');
      }
      c.restore();
    }
  },
};
