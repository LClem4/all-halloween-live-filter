/* Background swap: the person stands in a dark cathedral in front of a glowing rose window. */
import { W, H, TAU, drawVideo } from '../core.js';
import { rays, rng, vignette } from '../fx.js';
import { personReady } from '../segment.js';

const GLASS = ['#1e4fb8', '#b3202c', '#e2a92c', '#2e8b4c', '#6a2c9a', '#1e7fbf'];
let bg = null;

function lead(c, w) { c.strokeStyle = '#120d08'; c.lineWidth = w; c.stroke(); }
function roseWindow(c, x, y, R) {
  c.save();
  c.beginPath(); c.arc(x, y, R * 1.08, 0, TAU); c.fillStyle = '#3a3128'; c.fill();
  // outer ring of roundels
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    c.beginPath(); c.arc(x + Math.cos(a) * R * 0.86, y + Math.sin(a) * R * 0.86, R * 0.105, 0, TAU);
    c.fillStyle = GLASS[i % 3 === 0 ? 2 : i % 2 ? 0 : 1]; c.fill(); lead(c, R * 0.012);
  }
  // petals
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * TAU, a1 = ((i + 1) / 12) * TAU, am = (a0 + a1) / 2;
    c.beginPath(); c.arc(x, y, R * 0.72, a0, a1); c.arc(x, y, R * 0.2, a1, a0, true); c.closePath();
    c.fillStyle = GLASS[i % 2 ? 0 : 1]; c.fill(); lead(c, R * 0.02);
    c.beginPath(); c.arc(x + Math.cos(am) * R * 0.46, y + Math.sin(am) * R * 0.46, R * 0.1, 0, TAU);
    c.fillStyle = GLASS[[2, 3, 4][i % 3]]; c.fill(); lead(c, R * 0.012);
  }
  c.beginPath(); c.arc(x, y, R * 0.2, 0, TAU); c.fillStyle = '#f0c34a'; c.fill(); lead(c, R * 0.02);
  c.beginPath(); c.arc(x, y, R * 0.72, 0, TAU); lead(c, R * 0.03);
  c.restore();
}
function lancet(c, x, y, w, h, r) {
  const path = () => {
    c.beginPath();
    c.moveTo(x - w / 2, y + h); c.lineTo(x - w / 2, y + w * 0.6);
    c.quadraticCurveTo(x - w / 2, y, x, y - w * 0.2); c.quadraticCurveTo(x + w / 2, y, x + w / 2, y + w * 0.6);
    c.lineTo(x + w / 2, y + h); c.closePath();
  };
  c.save();
  path(); c.clip();
  const cols = 3, rows = Math.ceil((h + w * 0.2) / (w / cols));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      c.fillStyle = GLASS[(r() * GLASS.length) | 0];
      c.fillRect(x - w / 2 + (i * w) / cols, y - w * 0.2 + (j * w) / cols, w / cols + 1, w / cols + 1);
    }
  }
  c.strokeStyle = '#120d08'; c.lineWidth = w * 0.035;
  for (let i = 1; i < cols; i++) { c.beginPath(); c.moveTo(x - w / 2 + (i * w) / cols, y - w); c.lineTo(x - w / 2 + (i * w) / cols, y + h); c.stroke(); }
  for (let j = 1; j < rows; j++) { c.beginPath(); c.moveTo(x - w, y - w * 0.2 + (j * w) / cols); c.lineTo(x + w, y - w * 0.2 + (j * w) / cols); c.stroke(); }
  c.restore();
  path(); c.strokeStyle = '#3a3128'; c.lineWidth = w * 0.12; c.stroke();
}
function build() {
  bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  const c = bg.getContext('2d'), m = Math.min(W, H), r = rng(11);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d1812'); g.addColorStop(1, '#090705');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // stone courses
  c.strokeStyle = 'rgba(255,230,190,0.04)'; c.lineWidth = 2;
  for (let y = 0; y < H; y += m * 0.06) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  roseWindow(c, W / 2, H * 0.3, m * 0.3);
  for (const s of [-1, 1]) lancet(c, W / 2 + s * W * 0.36, H * 0.22, m * 0.13, H * 0.5, r);
}

export default {
  name: 'Cathedral',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!bg || bg.width !== W || bg.height !== H) build();
    c.drawImage(bg, 0, 0);
    // light through the glass: a gentle pulse, slow rays and drifting dust
    const m = Math.min(W, H);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, m * 0.5);
    gl.addColorStop(0, `rgba(255,220,160,${0.18 + 0.05 * Math.sin(t * 0.9)})`); gl.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgb(255,235,200)';
    for (let i = 0; i < 40; i++) {
      const k = (t * 0.02 + i * 0.137) % 1;
      c.globalAlpha = Math.sin(k * Math.PI) * 0.35;
      c.beginPath(); c.arc(W * ((i * 0.618) % 1) + Math.sin(t * 0.3 + i) * W * 0.02, H * (1 - k), m * 0.003, 0, TAU); c.fill();
    }
    c.restore();
    rays(c, W / 2, H * 0.3, Math.max(W, H) * 0.8, 0.35, t, '255,215,160');
  },
  overlay(c) { if (personReady()) vignette(c, '0,0,0', 0.5); },
};
