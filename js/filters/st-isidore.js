/* St. Isidore the Farmer, patron of farmers: a straw hat and a halo, in a golden wheat field at
   harvest time (background swap), with ripe wheat swaying in front. */
import { W, H, TAU, drawVideo } from '../core.js';
import { facePt, drawHalo, caption, rng } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';
import { personReady } from '../segment.js';

let field = null;
function build() {
  field = document.createElement('canvas'); field.width = W; field.height = H;
  const c = field.getContext('2d'), r = rng(31), hz = H * 0.55;
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#7fb2e5'); g.addColorStop(1, '#fde3a7');
  c.fillStyle = g; c.fillRect(0, 0, W, hz);
  const sun = c.createRadialGradient(W * 0.2, hz * 0.6, 0, W * 0.2, hz * 0.6, H * 0.35);
  sun.addColorStop(0, 'rgba(255,245,200,1)'); sun.addColorStop(0.2, 'rgba(255,230,160,0.7)'); sun.addColorStop(1, 'rgba(255,230,160,0)');
  c.fillStyle = sun; c.fillRect(0, 0, W, H);
  c.fillStyle = '#9db86b';   // distant hills
  c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += W / 20) c.lineTo(x, hz - H * (0.04 + 0.03 * Math.sin(x * 0.01))); c.lineTo(W, hz); c.fill();
  c.fillStyle = '#8c3b2a'; c.fillRect(W * 0.78, hz - H * 0.09, W * 0.08, H * 0.07);   // farmhouse
  c.fillStyle = '#5a2b1f'; c.beginPath(); c.moveTo(W * 0.77, hz - H * 0.09); c.lineTo(W * 0.82, hz - H * 0.14); c.lineTo(W * 0.87, hz - H * 0.09); c.fill();
  const fg = c.createLinearGradient(0, hz, 0, H);
  fg.addColorStop(0, '#e9c46a'); fg.addColorStop(1, '#c98f2a');
  c.fillStyle = fg; c.fillRect(0, hz, W, H - hz);
  c.strokeStyle = 'rgba(150,100,30,0.35)'; c.lineWidth = 2;
  for (let i = -20; i < 20; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * 0.01, hz); c.lineTo(W / 2 + i * W * 0.12, H); c.stroke(); }
  for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(255,230,150,${r() * 0.5})`; c.fillRect(r() * W, hz + r() * (H - hz), 2, 4); }
}

function strawHat(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  const straw = (x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#f1d58a'); g.addColorStop(1, '#c79a45'); return g; };
  c.beginPath(); c.ellipse(...P(0, 0.5), fw * 1.0, fw * 0.2, p.ang, 0, TAU);
  c.fillStyle = straw(...P(0, 0.6), ...P(0, 0.4)); c.fill();
  c.beginPath(); c.moveTo(...P(-0.45, 0.52)); c.bezierCurveTo(...P(-0.5, 1.05), ...P(0.5, 1.05), ...P(0.45, 0.52)); c.closePath();
  c.fillStyle = straw(...P(-0.4, 1), ...P(0.4, 0.5)); c.fill();
  c.strokeStyle = 'rgba(120,80,20,0.45)'; c.lineWidth = Math.max(1, fw * 0.008);
  for (let k = 0.6; k < 1; k += 0.08) { c.beginPath(); c.moveTo(...P(-0.46, k)); c.quadraticCurveTo(...P(0, k + 0.08), ...P(0.46, k)); c.stroke(); }
  c.strokeStyle = '#7a3b1f'; c.lineWidth = fw * 0.05;
  c.beginPath(); c.moveTo(...P(-0.46, 0.6)); c.quadraticCurveTo(...P(0, 0.66), ...P(0.46, 0.6)); c.stroke();
}

export default {
  name: 'St. Isidore',
  segment: 'cutout',
  base(c) {
    if (!personReady()) { drawVideo(c); return; }
    if (!field || field.width !== W || field.height !== H) build();
    c.drawImage(field, 0, 0);
  },
  face(c, p, t) {
    drawOutfit(c, p, (o) => fillBody(o, p, '#7b6a4a'));   // a plain farmer's tunic
    drawHalo(c, p, t, 1.1, 0.75);
    strawHat(c, p);
  },
  overlay(c, t) {
    if (personReady()) {   // wheat swaying in the foreground
      const r = rng(4);
      c.strokeStyle = '#d9a441'; c.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const x = r() * W, h = H * (0.12 + r() * 0.12), sway = Math.sin(t * 1.6 + x * 0.01) * W * 0.012;
        c.lineWidth = Math.max(2, W * 0.003);
        c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x, H - h * 0.5, x + sway, H - h); c.stroke();
        c.fillStyle = '#e8b84f'; c.beginPath(); c.ellipse(x + sway, H - h - W * 0.012, W * 0.006, W * 0.018, sway * 0.01, 0, TAU); c.fill();
      }
    }
    caption(c, 'St. Isidore the Farmer');
  },
};
