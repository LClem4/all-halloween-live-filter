/* Police officer in a donut shop: peaked cap with a badge, aviators and a bushy mustache, with
   the background swapped for a donut shop. Lift a hand into view and it holds a coffee mug (hand
   on the left of your face) or donuts (hand on the right). */
import { W, H, TAU, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { facePt, rng } from '../fx.js';
import { glasses, mustache } from '../props.js';
import { personReady } from '../segment.js';
import { hands } from '../hands.js';

function cap(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.save();
  // crown: flares out above the band, like a peaked cap seen from the front
  c.beginPath();
  c.moveTo(...P(-0.5, 0.42));
  c.bezierCurveTo(...P(-0.68, 0.62), ...P(-0.74, 0.82), ...P(-0.55, 0.88));
  c.quadraticCurveTo(...P(0, 0.97), ...P(0.55, 0.88));
  c.bezierCurveTo(...P(0.74, 0.82), ...P(0.68, 0.62), ...P(0.5, 0.42));
  c.closePath();
  const [gx, gy] = P(-0.2, 0.8);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.9);
  g.addColorStop(0, '#2c3d66'); g.addColorStop(1, '#0d1430');
  c.fillStyle = g; c.fill();
  // black band
  c.beginPath();
  c.moveTo(...P(-0.5, 0.42)); c.quadraticCurveTo(...P(0, 0.48), ...P(0.5, 0.42));
  c.lineTo(...P(0.53, 0.54)); c.quadraticCurveTo(...P(0, 0.6), ...P(-0.53, 0.54)); c.closePath();
  c.fillStyle = '#0a0a0a'; c.fill();
  // glossy visor shading the brow
  c.beginPath();
  c.moveTo(...P(-0.5, 0.43)); c.quadraticCurveTo(...P(0, 0.5), ...P(0.5, 0.43));
  c.quadraticCurveTo(...P(0.36, 0.27), ...P(0, 0.26)); c.quadraticCurveTo(...P(-0.36, 0.27), ...P(-0.5, 0.43));
  const [vx, vy] = P(0, 0.45), [wx, wy] = P(0, 0.26);
  const vg = c.createLinearGradient(vx, vy, wx, wy);
  vg.addColorStop(0, '#383838'); vg.addColorStop(0.4, '#050505'); vg.addColorStop(1, '#1a1a1a');
  c.fillStyle = vg; c.fill();
  // badge
  const [bx, by] = P(0, 0.68), r = fw * 0.065;
  c.translate(bx, by); c.rotate(p.ang);
  c.beginPath();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.7 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath();
  const bg = c.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  bg.addColorStop(0, '#fff1b0'); bg.addColorStop(1, '#b8892a');
  c.fillStyle = bg; c.fill();
  c.restore();
}

/* ---------- the donut shop ---------- */
const FROSTING = ['#f48fb1', '#6d3b1f', '#fff3e0', '#ffd54f', '#b39ddb', '#80cbc4'];
function donut(c, x, y, r, frost, seed) {
  c.fillStyle = '#d9a35c'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = frost; c.beginPath(); c.arc(x, y - r * 0.05, r * 0.86, 0, TAU); c.fill();
  c.fillStyle = '#8a5a2b'; c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill();
  const rr = rng(seed);
  for (let i = 0; i < 9; i++) {
    const a = rr() * TAU, d = r * (0.45 + rr() * 0.3);
    c.save(); c.translate(x + Math.cos(a) * d, y + Math.sin(a) * d); c.rotate(rr() * TAU);
    c.fillStyle = ['#e53935', '#43a047', '#1e88e5', '#fdd835', '#fff'][i % 5]; c.fillRect(-r * 0.09, -r * 0.025, r * 0.18, r * 0.05);
    c.restore();
  }
}
let shop = null;
function buildShop() {
  shop = document.createElement('canvas'); shop.width = W; shop.height = H;
  const c = shop.getContext('2d'), m = Math.min(W, H);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ffd1dc'); g.addColorStop(0.55, '#fff4f6'); g.addColorStop(1, '#ffe0e8');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // checker tiles along the wall
  const ts = m * 0.04;
  for (let x = 0; x < W; x += ts) for (let k = 0; k < 2; k++) { c.fillStyle = (x / ts + k) % 2 < 1 ? '#5ec4c0' : '#fff'; c.fillRect(x, H * 0.5 + k * ts, ts, ts); }
  // menu boards: names on the left, prices on the right, text shrunk to fit the board
  const MENU = [['GLAZED', '1.29'], ['SPRINKLE', '1.49'], ['CHOCO', '1.49'], ['COFFEE', '0.99']];
  const bw = W * 0.2, bh = H * 0.26, pad = bw * 0.08;
  for (const x of [W * 0.06, W * 0.74]) {
    c.fillStyle = '#2d2a32'; c.fillRect(x, H * 0.14, bw, bh);
    c.strokeStyle = '#c8a46a'; c.lineWidth = m * 0.008; c.strokeRect(x, H * 0.14, bw, bh);
    let size = Math.min(m * 0.03, (bh / MENU.length) * 0.5);
    c.font = `700 ${size}px sans-serif`;
    const need = Math.max(...MENU.map(([n, pr]) => c.measureText(n).width + c.measureText(pr).width)) + size;
    if (need > bw - pad * 2) size *= (bw - pad * 2) / need;
    c.font = `700 ${size}px sans-serif`; c.fillStyle = '#f5f5f5'; c.textBaseline = 'middle';
    MENU.forEach(([n, pr], i) => {
      const y = H * 0.14 + (bh * (i + 0.5)) / MENU.length;
      c.textAlign = 'left'; c.fillText(n, x + pad, y);
      c.textAlign = 'right'; c.fillText(pr, x + bw - pad, y);
    });
  }
  // glass display case full of donuts
  const top = H * 0.62;
  c.fillStyle = '#e8d6c3'; c.fillRect(0, top - H * 0.02, W, H * 0.03);
  c.fillStyle = 'rgba(200,235,245,0.55)'; c.fillRect(0, top, W, H - top);
  let s = 1;
  for (let row = 0; row < 3; row++) {
    const y = top + H * (0.07 + row * 0.11), r = m * 0.035;
    c.fillStyle = '#d7c3ad'; c.fillRect(0, y + r * 1.1, W, H * 0.008);
    for (let x = r * 1.5; x < W; x += r * 2.4) donut(c, x, y, r, FROSTING[(s++) % FROSTING.length], s);
  }
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, top, W, H * 0.02);
}

/* ---------- held props ---------- */
function mug(c, x, y, s, t) {
  c.save(); c.translate(x, y - s * 0.3);
  c.strokeStyle = '#f2f2f2'; c.lineWidth = s * 0.12;
  c.beginPath(); c.arc(s * 0.48, 0, s * 0.25, -1.2, 1.2); c.stroke();
  c.fillStyle = '#f7f7f7';
  c.beginPath(); c.moveTo(-s * 0.45, -s * 0.5); c.lineTo(s * 0.45, -s * 0.5); c.lineTo(s * 0.4, s * 0.5); c.quadraticCurveTo(0, s * 0.6, -s * 0.4, s * 0.5); c.closePath(); c.fill();
  c.fillStyle = '#1d3c8f'; c.fillRect(-s * 0.44, -s * 0.18, s * 0.86, s * 0.3);
  c.fillStyle = '#fff'; c.font = `700 ${s * 0.18}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COFFEE', 0, -s * 0.03);
  c.fillStyle = '#4e2a12'; c.beginPath(); c.ellipse(0, -s * 0.5, s * 0.44, s * 0.08, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = s * 0.05; c.lineCap = 'round';
  for (const k of [-0.2, 0.15]) {
    c.beginPath(); c.moveTo(s * k, -s * 0.6);
    c.bezierCurveTo(s * (k + 0.15), -s * 0.8, s * (k - 0.15), -s * 0.95, s * k + Math.sin(t * 3 + k * 9) * s * 0.08, -s * 1.15); c.stroke();
  }
  c.restore();
}
function donuts(c, x, y, s) {
  donut(c, x - s * 0.25, y - s * 0.2, s * 0.42, '#6d3b1f', 3);
  donut(c, x + s * 0.2, y - s * 0.35, s * 0.42, '#f48fb1', 7);
}

export default {
  name: 'Cop',
  hint: 'Raise a hand!',
  segment: 'cutout',
  hands: true,
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!shop || shop.width !== W || shop.height !== H) buildShop();
    c.drawImage(shop, 0, 0);
    // the neon sign hums and flickers on the back wall, behind people
    const m = Math.min(W, H), on = Math.sin(t * 23) > -0.95 ? 1 : 0.3;
    c.save();
    c.font = `900 ${m * 0.09}px 'Arial Rounded MT Bold', 'Arial Black', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff2e88'; c.shadowBlur = m * 0.04 * on; c.fillStyle = on > 0.5 ? '#ffd0e6' : '#c06090';
    c.fillText('DONUTS', W * 0.5, H * 0.08);
    c.restore();
  },
  face(c, p) { mustache(c, p, 'chevron', '#3a2516'); glasses(c, p, 'aviator'); cap(c, p); },
  overlay(c, t) {
    for (const h of hands) {
      let f = null;
      for (const q of tracks) if (!f || Math.hypot(q.c[0] - h.c[0], q.c[1] - h.c[1]) < Math.hypot(f.c[0] - h.c[0], f.c[1] - h.c[1])) f = q;
      const left = f ? (h.c[0] - f.c[0]) * f.right[0] + (h.c[1] - f.c[1]) * f.right[1] < 0 : h.c[0] < W / 2;
      if (left) mug(c, h.c[0], h.c[1], h.size * 1.1, t); else donuts(c, h.c[0], h.c[1], h.size * 1.1);
    }
  },
};
