/* Candy Gobbler (mini game): sweets float across the screen towards the players. Open your mouth
   as one reaches it to gobble it: +100, golden candy corn +300. Spiders drop down on threads:
   keep your mouth shut or it's -200. Scores show above each head and reset when the game is
   switched back on. More players, more sweets. */
import { W, H, TAU, FONT, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { facePt, burst, drawCandy } from '../fx.js';

const items = [], pops = [];
let lastSeen = -1, lastT = 0, spawnIn = 0;
const open = (p) => p.jaw > 0.35;

/* A new sweet heading for (near) a random player's mouth from off one side, or a spider dropping
   down above one. */
function spawn(m) {
  const p = tracks[(Math.random() * tracks.length) | 0], r = Math.random();
  const tx = p.mouth[0] + (Math.random() - 0.5) * p.fw * 0.7, ty = p.mouth[1] + (Math.random() - 0.5) * p.fw * 0.5;
  if (r < 0.15) {
    items.push({ kind: 'spider', x: tx, top: 0, reach: ty, age: 0, life: 4.5, s: m * 0.03 });
    return;
  }
  const left = Math.random() < 0.5, x0 = left ? -m * 0.06 : W + m * 0.06, y0 = H * (0.1 + Math.random() * 0.6);
  const dur = 2 + Math.random() * 1.2;   // seconds to reach the target
  items.push({ kind: r < 0.27 ? 'gold' : 'candy', x: x0, y: y0, vx: (tx - x0) / dur, vy: (ty - y0) / dur, age: 0, life: dur * 2.2,
    size: m * 0.032, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, hue: (Math.random() * 360) | 0, kind2: (Math.random() * 3) | 0 });
}

function candyCorn(c, q, t) {
  const s = q.size * 1.3;
  c.save(); c.translate(q.x, q.y); c.rotate(q.rot);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.8);
  g.addColorStop(0, `rgba(255,220,90,${0.45 + 0.2 * Math.sin(t * 8)})`); g.addColorStop(1, 'rgba(255,200,60,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 1.8, 0, TAU); c.fill();
  c.globalCompositeOperation = 'source-over';
  const band = (y0, y1, col) => {
    const w0 = 0.75 * (y0 + 1) / 2, w1 = 0.75 * (y1 + 1) / 2;   // narrows to the point at the top
    c.fillStyle = col; c.beginPath(); c.moveTo(-w0 * s, y0 * s); c.lineTo(w0 * s, y0 * s); c.lineTo(w1 * s, y1 * s); c.lineTo(-w1 * s, y1 * s); c.closePath(); c.fill();
  };
  band(-1, -0.35, '#fffaf0'); band(-0.35, 0.3, '#ffb300'); band(0.3, 1, '#ff7b00');
  c.restore();
}

function spider(c, q, t) {
  const s = q.s, y = q.y;
  c.strokeStyle = 'rgba(235,235,235,0.7)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(q.x, 0); c.lineTo(q.x, y - s * 0.6); c.stroke();
  c.save(); c.translate(q.x, y);
  c.strokeStyle = '#111'; c.lineWidth = s * 0.12; c.lineCap = 'round';
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const k = Math.sin(t * 10 + i) * 0.15;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(sd * s * 0.8, -s * (0.5 - i * 0.3) + k * s); c.lineTo(sd * s * 1.2, s * (0.1 + i * 0.25) + k * s); c.stroke();
  }
  c.fillStyle = '#151515'; c.beginPath(); c.ellipse(0, s * 0.1, s * 0.55, s * 0.65, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(0, -s * 0.55, s * 0.35, 0, TAU); c.fill();
  c.fillStyle = '#ff3b30';
  for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * s * 0.13, -s * 0.6, s * 0.08, 0, TAU); c.fill(); }
  c.restore();
}

export default {
  name: 'Candy Gobbler',
  hint: 'Open wide to eat the candy, but not the spiders!',
  base(c, t) {
    if (t - lastSeen > 0.5) { items.length = 0; pops.length = 0; for (const p of tracks) p.gobble = 0; }
    lastSeen = t;
    drawVideo(c);
  },
  face(c, p) {
    if (p.gobble === undefined) p.gobble = 0;
    if (open(p)) {   // show the open mouth is "live"
      c.strokeStyle = 'rgba(255,230,120,0.7)'; c.lineWidth = Math.max(2, p.fw * 0.015);
      c.beginPath(); c.arc(...p.mouth, p.fw * 0.26, 0, TAU); c.stroke();
    }
  },
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT)), m = Math.min(W, H);
    lastT = t;
    spawnIn -= dt;
    if (spawnIn <= 0 && tracks.length && items.length < 12) { spawnIn = 0.85 / Math.min(3, tracks.length); spawn(m); }
    for (let i = items.length - 1; i >= 0; i--) {
      const q = items[i];
      q.age += dt;
      if (q.kind === 'spider') q.y = q.reach * Math.sin(Math.min(1, q.age / q.life) * Math.PI) ** 0.6;   // down, hang, back up
      else { q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; }
      let eaten = null;
      for (const p of tracks) if (open(p) && Math.hypot(q.x - p.mouth[0], q.y - p.mouth[1]) < p.fw * 0.28) { eaten = p; break; }
      if (eaten) {
        const pts = q.kind === 'spider' ? -200 : q.kind === 'gold' ? 300 : 100;
        eaten.gobble = (eaten.gobble || 0) + pts;
        pops.push({ x: q.x, y: q.y - eaten.fw * 0.1, life: 1.1, text: pts > 0 ? `+${pts}` : `YUCK! ${pts}`, col: pts > 0 ? (pts > 100 ? '#ffd54f' : '#7CFC00') : '#9be15d' });
        if (pts > 0) burst(eaten, 'sparkle', 1, 0.15, [q.x, q.y]);
        items.splice(i, 1); continue;
      }
      if (q.age > q.life) { items.splice(i, 1); continue; }
      if (q.kind === 'spider') spider(c, q, t);
      else if (q.kind === 'gold') candyCorn(c, q, t);
      else drawCandy(c, { x: q.x, y: q.y, rot: q.rot, size: q.size, hue: q.hue, kind: q.kind2 });
    }
    const size = Math.round(m * 0.045);
    c.save();
    c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = size * 0.35;
    for (const p of tracks) {
      const [x, y] = facePt(p, 0, 0.85);
      c.fillStyle = '#fff3c4'; c.fillText(`${p.gobble || 0}`, x, Math.max(y, size * 1.3));   // kept on screen
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const q = pops[i];
      q.life -= dt; q.y -= m * 0.08 * dt;
      if (q.life <= 0) { pops.splice(i, 1); continue; }
      c.globalAlpha = Math.min(1, q.life); c.fillStyle = q.col; c.fillText(q.text, q.x, q.y);
    }
    c.restore();
  },
};
