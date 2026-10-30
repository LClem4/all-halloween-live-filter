/* A curled handlebar mustache, in Paris: the background becomes a dusk skyline with the Eiffel
   Tower (its lights sparkle) over cream stone buildings with lit windows. */
import { W, H, TAU, drawVideo } from '../core.js';
import { rng } from '../fx.js';
import { mustache } from '../props.js';
import { personReady } from '../segment.js';

const TOWER = { x: 0.8, top: 0.1, base: 0.9, w: 0.3 };   // fractions of the screen
let paris = null;

function tower(c, x, top, base, w) {
  const h = base - top;
  const half = (k) => (k < 0.08 ? 0.012 + k * 0.2 : k < 0.36 ? 0.03 + (k - 0.08) * 0.11 : k < 0.6 ? 0.06 + (k - 0.36) * 0.2 : 0.11 + ((k - 0.6) / 0.4) ** 1.6 * 0.39) * w;
  c.save();
  c.beginPath();
  for (let k = 0; k <= 1.0001; k += 0.02) c.lineTo(x + half(k), top + k * h);
  c.quadraticCurveTo(x, base - h * 0.2, x - half(1), base);   // the arch between the legs
  for (let k = 1; k >= 0; k -= 0.02) c.lineTo(x - half(k), top + k * h);
  c.closePath();
  c.fillStyle = '#3d3029'; c.fill();
  c.clip();
  c.strokeStyle = 'rgba(160,120,90,0.35)'; c.lineWidth = Math.max(1, w * 0.006);
  for (let i = -30; i < 30; i++) {
    c.beginPath(); c.moveTo(x + i * w * 0.03, top); c.lineTo(x + i * w * 0.03 + h * 0.4, base); c.stroke();
    c.beginPath(); c.moveTo(x + i * w * 0.03, top); c.lineTo(x + i * w * 0.03 - h * 0.4, base); c.stroke();
  }
  c.restore();
  c.fillStyle = '#2b211c';
  for (const k of [0.36, 0.6]) c.fillRect(x - half(k) * 1.2, top + k * h - h * 0.012, half(k) * 2.4, h * 0.024);
}

function build() {
  paris = document.createElement('canvas'); paris.width = W; paris.height = H;
  const c = paris.getContext('2d'), r = rng(21);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#24305e'); g.addColorStop(0.55, '#a76d8e'); g.addColorStop(0.85, '#f6a96b');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const sun = c.createRadialGradient(W * 0.3, H * 0.78, 0, W * 0.3, H * 0.78, H * 0.4);
  sun.addColorStop(0, 'rgba(255,220,160,0.8)'); sun.addColorStop(1, 'rgba(255,220,160,0)');
  c.fillStyle = sun; c.fillRect(0, 0, W, H);
  tower(c, W * TOWER.x, H * TOWER.top, H * TOWER.base, W * TOWER.w);
  // Haussmann buildings: cream stone, grey mansard roofs, warm windows
  let x = -W * 0.02;
  while (x < W) {
    const bw = W * (0.09 + r() * 0.07), bh = H * (0.18 + r() * 0.1), y = H - bh;
    c.fillStyle = '#e9dcc3'; c.fillRect(x, y, bw, bh);
    c.fillStyle = '#5d6c7c';
    c.beginPath(); c.moveTo(x - bw * 0.02, y); c.lineTo(x + bw * 0.08, y - bh * 0.18); c.lineTo(x + bw * 0.92, y - bh * 0.18); c.lineTo(x + bw * 1.02, y); c.fill();
    c.fillStyle = '#4a4440'; c.fillRect(x + bw * 0.7, y - bh * 0.3, bw * 0.08, bh * 0.14);   // chimney
    for (let wy = y + bh * 0.1; wy < H - bh * 0.08; wy += bh * 0.2) {
      for (let wx = x + bw * 0.1; wx < x + bw * 0.85; wx += bw * 0.22) {
        c.fillStyle = r() < 0.6 ? '#ffd27a' : '#3a4250'; c.fillRect(wx, wy, bw * 0.12, bh * 0.12);
        c.fillStyle = '#2a2622'; c.fillRect(wx - bw * 0.02, wy + bh * 0.12, bw * 0.16, bh * 0.015);   // balcony rail
      }
    }
    x += bw + W * 0.004;
  }
}

export default {
  name: 'Mustache',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!paris || paris.width !== W || paris.height !== H) build();
    c.drawImage(paris, 0, 0);
    // the tower's sparkling lights
    const h = H * (TOWER.base - TOWER.top), r = rng(5);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const k = r(), side = r() - 0.5, x = W * TOWER.x + side * W * TOWER.w * (0.05 + k * 0.6) * k, y = H * TOWER.top + k * h;
      const on = Math.max(0, Math.sin(t * 6 + i * 2.3)) ** 8;
      if (on > 0.1) { c.fillStyle = `rgba(255,250,220,${on})`; c.beginPath(); c.arc(x, y, Math.min(W, H) * 0.004 * (1 + on), 0, TAU); c.fill(); }
    }
    c.restore();
  },
  face(c, p) { mustache(c, p, 'handlebar'); },
};
