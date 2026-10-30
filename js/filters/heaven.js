/* Background swap: the person stands in a golden sky above drifting clouds. */
import { W, H, TAU, drawVideo } from '../core.js';
import { rays, rng, drawHalo } from '../fx.js';
import { personReady } from '../segment.js';

let sky = null;
function buildSky() {
  sky = document.createElement('canvas');
  sky.width = W; sky.height = H;
  const c = sky.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6c9fe8'); g.addColorStop(0.5, '#c9dcf7'); g.addColorStop(1, '#ffe9bf');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const s = c.createRadialGradient(W / 2, H * 0.15, 0, W / 2, H * 0.15, H * 0.7);
  s.addColorStop(0, 'rgba(255,250,225,0.95)'); s.addColorStop(0.3, 'rgba(255,235,180,0.45)'); s.addColorStop(1, 'rgba(255,235,180,0)');
  c.fillStyle = s; c.fillRect(0, 0, W, H);
}

/* One puffy cloud sprite, reused at different sizes. */
const cloud = document.createElement('canvas');
{
  cloud.width = 512; cloud.height = 220;
  const c = cloud.getContext('2d'), r = rng(3);
  for (let i = 0; i < 26; i++) {
    const x = 70 + r() * 372, y = 120 - Math.sin(((x - 70) / 372) * Math.PI) * 50 + r() * 30, rad = 45 + r() * 45;
    const g = c.createRadialGradient(x, y - rad * 0.2, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
  }
  c.globalCompositeOperation = 'source-atop';
  const sh = c.createLinearGradient(0, 60, 0, 220);
  sh.addColorStop(0, 'rgba(255,240,215,0)'); sh.addColorStop(1, 'rgba(160,175,210,0.45)');
  c.fillStyle = sh; c.fillRect(0, 0, 512, 220);
}
// cloud layers: height on screen, size (fraction of width), speed (widths per minute), count, opacity
const LAYERS = [[0.2, 0.35, 0.5, 3, 0.6], [0.4, 0.45, 0.8, 3, 0.55], [0.82, 0.7, 1.2, 4, 1], [0.95, 0.9, 1.8, 4, 1]];
function clouds(c, t, from, to) {
  for (let l = from; l < to; l++) {
    const [y, size, speed, n, a] = LAYERS[l];
    const w = W * size, h = (w * 220) / 512, span = W + w;
    c.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const x = ((i / n) * span + (t * speed * W) / 60 + l * 137) % span - w;
      c.drawImage(cloud, x, H * y - h / 2, w, h);
    }
  }
  c.globalAlpha = 1;
}

export default {
  name: 'Heaven',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!sky || sky.width !== W || sky.height !== H) buildSky();
    c.drawImage(sky, 0, 0);
    rays(c, W / 2, H * 0.15, Math.max(W, H) * 0.9, 0.5, t, '255,245,210');
    clouds(c, t, 0, 2);
  },
  face(c, p, t) { if (personReady()) drawHalo(c, p, t); },
  overlay(c, t) { if (personReady()) clouds(c, t, 2, 4); },   // a cloud bank in front, so they stand in the clouds
};
