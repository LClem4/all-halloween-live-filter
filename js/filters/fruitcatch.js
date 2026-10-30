/* Fruit Catch (mini game): everyone gets a bucket on their head and fruit falls from the sky.
   Move to catch it in your bucket: each catch is +100 points, shown above your bucket. Scores
   reset when the game is switched back on. More players, more fruit. */
import { W, H, TAU, FONT, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { facePt } from '../fx.js';

const KINDS = ['apple', 'orange', 'banana', 'grapes', 'cherries'];
const fruits = [], pops = [];
let lastSeen = -1, spawnIn = 0, lastT = 0;

function drawFruit(c, f) {
  const s = f.s;
  c.save(); c.translate(f.x, f.y); c.rotate(f.rot);
  if (f.kind === 'apple' || f.kind === 'orange') {
    c.fillStyle = f.kind === 'apple' ? '#d62828' : '#f77f00';
    c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-s * 0.35, -s * 0.35, s * 0.25, 0, TAU); c.fill();
    c.strokeStyle = '#5a3a1a'; c.lineWidth = s * 0.12; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.1, -s * 1.3); c.stroke();
    c.fillStyle = '#2d8a3e'; c.beginPath(); c.ellipse(s * 0.3, -s * 1.15, s * 0.3, s * 0.13, -0.5, 0, TAU); c.fill();
  } else if (f.kind === 'banana') {
    c.strokeStyle = '#f5d33b'; c.lineWidth = s * 0.55; c.lineCap = 'round';
    c.beginPath(); c.arc(0, -s * 0.6, s * 1.1, 0.35, Math.PI - 0.35); c.stroke();
    c.strokeStyle = '#5a3a1a'; c.lineWidth = s * 0.15;
    c.beginPath(); c.moveTo(s * 1.02, -s * 0.2); c.lineTo(s * 1.15, -s * 0.35); c.stroke();
  } else if (f.kind === 'grapes') {
    c.fillStyle = '#6a2c91';
    for (const [x, y] of [[-0.4, -0.5], [0, -0.55], [0.4, -0.5], [-0.2, -0.1], [0.2, -0.1], [0, 0.3], [-0.4, 0.3], [0.4, 0.3], [0.1, 0.7]]) {
      c.beginPath(); c.arc(x * s, y * s, s * 0.28, 0, TAU); c.fill();
    }
    c.fillStyle = '#2d8a3e'; c.beginPath(); c.ellipse(0, -s * 0.95, s * 0.35, s * 0.15, 0.3, 0, TAU); c.fill();
  } else {
    c.strokeStyle = '#2d6a1e'; c.lineWidth = s * 0.1;
    c.beginPath(); c.moveTo(-s * 0.4, s * 0.2); c.quadraticCurveTo(0, -s * 0.9, 0, -s); c.quadraticCurveTo(0, -s * 0.9, s * 0.4, s * 0.2); c.stroke();
    c.fillStyle = '#b5121b';
    for (const x of [-0.4, 0.4]) { c.beginPath(); c.arc(x * s, s * 0.35, s * 0.42, 0, TAU); c.fill(); }
  }
  c.restore();
}

function bucket(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.save();
  c.beginPath();
  c.moveTo(...P(-0.36, 0.52)); c.lineTo(...P(-0.48, 1.05)); c.lineTo(...P(0.48, 1.05)); c.lineTo(...P(0.36, 0.52)); c.closePath();
  const [gx, gy] = P(-0.48, 0.8), [hx, hy] = P(0.48, 0.8);
  const g = c.createLinearGradient(gx, gy, hx, hy);
  g.addColorStop(0, '#8d98a5'); g.addColorStop(0.35, '#e6ebf0'); g.addColorStop(1, '#6d7682');
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#4c545e'; c.lineWidth = fw * 0.02; c.stroke();
  for (const b of [0.65, 0.92]) { c.beginPath(); c.moveTo(...P(-0.4 - (b - 0.52) * 0.2, b)); c.lineTo(...P(0.4 + (b - 0.52) * 0.2, b)); c.stroke(); }
  c.beginPath(); c.ellipse(...P(0, 1.05), fw * 0.48, fw * 0.08, p.ang, 0, TAU);   // open top
  c.fillStyle = '#3a4048'; c.fill(); c.stroke();
  c.restore();
}

export default {
  name: 'Fruit Catch',
  hint: 'Catch the fruit in your bucket!',
  base(c, t) {
    if (t - lastSeen > 0.5) { fruits.length = 0; pops.length = 0; for (const p of tracks) p.score = 0; }
    lastSeen = t;
    drawVideo(c);
  },
  face(c, p) {
    if (p.score === undefined) p.score = 0;
    bucket(c, p);
  },
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT)), m = Math.min(W, H);
    lastT = t;
    spawnIn -= dt;
    if (spawnIn <= 0 && tracks.length) {
      spawnIn = 0.9 / Math.min(3, tracks.length);
      fruits.push({ x: W * (0.08 + Math.random() * 0.84), y: -m * 0.05, vy: H * (0.18 + Math.random() * 0.12), s: m * 0.035, rot: 0, vr: (Math.random() - 0.5) * 2, kind: KINDS[(Math.random() * KINDS.length) | 0] });
    }
    for (let i = fruits.length - 1; i >= 0; i--) {
      const f = fruits[i], y0 = f.y;
      f.y += f.vy * dt; f.vy += H * 0.08 * dt; f.rot += f.vr * dt;
      let caught = false;
      for (const p of tracks) {   // into the bucket: crossing the rim, within its width
        const [rx, ry] = facePt(p, 0, 1.05);
        if (y0 <= ry && f.y > ry && Math.abs(f.x - rx) < p.fw * 0.46) {
          p.score = (p.score || 0) + 100; caught = true;
          pops.push({ x: rx, y: ry - p.fw * 0.2, life: 1 });
          break;
        }
      }
      if (caught || f.y > H + f.s * 2) fruits.splice(i, 1); else drawFruit(c, f);
    }
    const size = Math.round(m * 0.045);
    c.save();
    c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = size * 0.35;
    for (const p of tracks) {
      const [x, y] = facePt(p, 0, 1.3);
      c.fillStyle = '#fff3c4'; c.fillText(`${p.score || 0}`, x, y);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const q = pops[i];
      q.life -= dt; q.y -= m * 0.08 * dt;
      if (q.life <= 0) { pops.splice(i, 1); continue; }
      c.globalAlpha = q.life; c.fillStyle = '#7CFC00'; c.fillText('+100', q.x, q.y);
    }
    c.restore();
  },
};
