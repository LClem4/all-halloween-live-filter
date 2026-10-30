/* End of the World (background swap): a burning red sky, erupting volcanoes, mushroom clouds
   with a flash, a stricken plane diving in and exploding, a T-rex stomping along the horizon and
   pterodactyls overhead, and on the ground people fleeing from zombies and laser-firing aliens.
   An alien invasion overhead: a mothership looming across the top that charges up and blasts the
   horizon, a flying saucer beaming someone up, and saucers strafing the ground with lasers.
   Falling ash, and everything tinted red-orange. */
import { W, H, TAU, drawVideo } from '../core.js';
import { vignette } from '../fx.js';
import { personReady } from '../segment.js';

const GROUND = 0.86;   // horizon height, fraction of the screen
const VOLCANOES = [[0.14, 0.42, 0.36], [0.86, 0.5, 0.44], [0.56, 0.28, 0.22]];   // x, base width, height (fractions)
const NUKES = [[0.33, 0, 0.9], [0.72, 4.5, 0.7]];                                 // x, time offset (s), size
const PERIOD = 9, PLANE = 16;
let bg = null;
const lava = [], ash = [], debris = [];

function build() {
  bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  const c = bg.getContext('2d'), gy = H * GROUND;
  const g = c.createLinearGradient(0, 0, 0, gy);
  g.addColorStop(0, '#160302'); g.addColorStop(0.55, '#6e1606'); g.addColorStop(1, '#ff6a1a');
  c.fillStyle = g; c.fillRect(0, 0, W, gy);
  for (const [x, w, h] of VOLCANOES) {
    const cx = x * W, bw = w * W, top = gy - h * H;
    c.beginPath();
    c.moveTo(cx - bw / 2, gy); c.quadraticCurveTo(cx - bw * 0.12, gy - h * H * 0.6, cx - bw * 0.07, top);
    c.lineTo(cx + bw * 0.07, top); c.quadraticCurveTo(cx + bw * 0.12, gy - h * H * 0.6, cx + bw / 2, gy); c.closePath();
    const vg = c.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
    vg.addColorStop(0, '#120806'); vg.addColorStop(0.5, '#2a120b'); vg.addColorStop(1, '#0d0504');
    c.fillStyle = vg; c.fill();
    c.strokeStyle = 'rgba(255,110,20,0.85)'; c.lineWidth = Math.max(2, W * 0.004); c.lineCap = 'round';
    for (const k of [-0.6, 0, 0.5]) {
      c.beginPath(); c.moveTo(cx + k * bw * 0.06, top);
      c.quadraticCurveTo(cx + k * bw * 0.15, top + h * H * 0.4, cx + k * bw * 0.28, top + h * H * (0.6 + Math.abs(k) * 0.2)); c.stroke();
    }
  }
  const gg = c.createLinearGradient(0, gy, 0, H);
  gg.addColorStop(0, '#3a0f05'); gg.addColorStop(1, '#0a0302');
  c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
}

function mushroom(c, x, s, k) {
  const gy = H * GROUND, grow = 1 - (1 - Math.min(1, k / 0.45)) ** 3, fade = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  const h = H * 0.42 * s * grow, r = W * 0.12 * s * grow;
  if (r < 1) return;
  c.save();
  c.globalAlpha = fade;
  const sg = c.createLinearGradient(0, gy - h, 0, gy);
  sg.addColorStop(0, '#ffcf7a'); sg.addColorStop(1, '#8a2a08');
  c.fillStyle = sg;
  c.beginPath(); c.moveTo(x - r * 0.18, gy); c.quadraticCurveTo(x - r * 0.1, gy - h * 0.5, x - r * 0.22, gy - h); c.lineTo(x + r * 0.22, gy - h);
  c.quadraticCurveTo(x + r * 0.1, gy - h * 0.5, x + r * 0.18, gy); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,150,60,0.7)'; c.beginPath(); c.ellipse(x, gy - h * 0.5, r * 0.5, r * 0.1, 0, 0, TAU); c.fill();
  const cg = c.createRadialGradient(x, gy - h, 0, x, gy - h, r);
  cg.addColorStop(0, '#fff6d0'); cg.addColorStop(0.35, '#ffb040'); cg.addColorStop(0.75, '#c2410c'); cg.addColorStop(1, 'rgba(70,20,8,0)');
  c.fillStyle = cg;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU, rr = r * (0.55 + 0.1 * Math.sin(i * 3 + k * 10));
    c.beginPath(); c.arc(x + Math.cos(a) * r * 0.45, gy - h + Math.sin(a) * r * 0.22, rr, 0, TAU); c.fill();
  }
  c.restore();
}

/* ---------- creatures and people (simple silhouettes; dir = +1 facing right) ---------- */
function person(c, x, y, h, t, dir, col) {
  const sw = Math.sin(t * 14) * 0.5;
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = h * 0.08; c.lineCap = 'round';
  const hip = [x, y - h * 0.45], neck = [x + dir * h * 0.08, y - h * 0.78];
  c.beginPath(); c.arc(neck[0] + dir * h * 0.04, neck[1] - h * 0.1, h * 0.1, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(...neck); c.lineTo(...hip); c.stroke();
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(...hip); c.lineTo(x + Math.sin(sw * s) * h * 0.3, y); c.stroke();
    c.beginPath(); c.moveTo(...neck); c.lineTo(neck[0] - Math.sin(sw * s) * h * 0.25, neck[1] + h * 0.3); c.stroke();   // arms pumping
  }
}
function zombie(c, x, y, h, t, dir) {
  const sw = Math.sin(t * 5) * 0.3, lurch = Math.sin(t * 5) * h * 0.03;
  c.strokeStyle = '#5f8a3a'; c.fillStyle = '#5f8a3a'; c.lineWidth = h * 0.09; c.lineCap = 'round';
  const hip = [x, y - h * 0.45], neck = [x + dir * h * 0.05, y - h * 0.8 + lurch];
  c.beginPath(); c.arc(neck[0] + dir * h * 0.02, neck[1] - h * 0.1, h * 0.11, 0.4, TAU - 0.2); c.fill();
  c.beginPath(); c.moveTo(...neck); c.lineTo(...hip); c.stroke();
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(...hip); c.lineTo(x + Math.sin(sw * s) * h * 0.25, y); c.stroke();
    c.beginPath(); c.moveTo(...neck); c.lineTo(neck[0] + dir * h * 0.4, neck[1] + h * (0.05 + s * 0.04)); c.stroke();   // arms out in front
  }
  c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(neck[0] + dir * h * 0.07, neck[1] - h * 0.12, h * 0.02, 0, TAU); c.fill();
}
function alien(c, x, y, h, t, dir) {
  const sw = Math.sin(t * 8) * 0.35;
  c.strokeStyle = '#9fb59a'; c.fillStyle = '#9fb59a'; c.lineWidth = h * 0.06; c.lineCap = 'round';
  const hip = [x, y - h * 0.4], neck = [x, y - h * 0.72];
  c.beginPath(); c.ellipse(x, neck[1] - h * 0.16, h * 0.15, h * 0.19, 0, 0, TAU); c.fill();
  c.fillStyle = '#0b0b0b';
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * h * 0.06 + dir * h * 0.03, neck[1] - h * 0.16, h * 0.04, h * 0.07, s * 0.5, 0, TAU); c.fill(); }
  c.beginPath(); c.moveTo(...neck); c.lineTo(...hip); c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...hip); c.lineTo(x + Math.sin(sw * s) * h * 0.25, y); c.stroke(); }
  const gun = [neck[0] + dir * h * 0.38, neck[1] + h * 0.08];
  c.beginPath(); c.moveTo(...neck); c.lineTo(...gun); c.stroke();
  return gun;
}
function laser(c, from, to, t, seed) {
  const k = (t * 1.3 + seed) % 1;
  if (k > 0.25) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (const [col, w] of [['rgba(80,255,120,0.35)', 0.012], ['rgba(200,255,200,0.95)', 0.004]]) {
    c.strokeStyle = col; c.lineWidth = Math.min(W, H) * w;
    c.beginPath(); c.moveTo(...from); c.lineTo(...to); c.stroke();
  }
  c.fillStyle = 'rgba(180,255,180,0.8)'; c.beginPath(); c.arc(...to, Math.min(W, H) * 0.012, 0, TAU); c.fill();
  c.restore();
}
/* A group running across: two people chased by two zombies and an alien. */
function chase(c, t, speed, y, h, dir, seed) {
  const span = W * 1.8, lead = ((t * speed * W + seed * W) % span) - W * 0.4;
  const x0 = dir > 0 ? lead : W - lead;
  const at = (off) => x0 - dir * off * h;
  const runners = [at(0), at(0.8)];
  runners.forEach((x, i) => person(c, x, y, h, t + i * 0.3, dir, '#1b1310'));
  zombie(c, at(2.2), y, h, t, dir);
  zombie(c, at(3.1), y, h * 1.05, t + 0.5, dir);
  const gun = alien(c, at(4.2), y, h * 0.95, t, dir);
  laser(c, gun, [runners[1], y - h * 0.5], t, seed);
}
function trex(c, x, y, s, t) {
  const step = Math.sin(t * 3);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#1a0c08';
  c.beginPath();
  c.moveTo(-1.2, -0.95); c.quadraticCurveTo(-0.4, -1.15, 0.2, -1.2);             // tail to back
  c.quadraticCurveTo(0.45, -1.5, 0.75, -1.55); c.lineTo(1.05, -1.5); c.lineTo(1.1, -1.35);   // neck and head
  c.lineTo(0.85, -1.32); c.lineTo(1.0, -1.22); c.lineTo(0.7, -1.2);              // jaw
  c.quadraticCurveTo(0.55, -0.9, 0.3, -0.75); c.quadraticCurveTo(-0.2, -0.7, -1.2, -0.95);
  c.fill();
  c.lineWidth = 0.12; c.strokeStyle = '#1a0c08'; c.lineCap = 'round';
  for (const k of [-1, 1]) { c.beginPath(); c.moveTo(0, -0.8); c.lineTo(0.05 + k * step * 0.15, -0.35); c.lineTo(0.1 + k * step * 0.2, 0); c.stroke(); }
  c.lineWidth = 0.05; c.beginPath(); c.moveTo(0.55, -1.0); c.lineTo(0.68, -0.9); c.stroke();   // little arm
  c.restore();
}
function ptero(c, x, y, s, t) {
  const flap = Math.sin(t * 6) * 0.5;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#1a0c08';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-1, -0.3 - flap); c.lineTo(-0.3, 0.05); c.lineTo(0.3, 0.05); c.lineTo(1, -0.3 - flap); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(0.2, -0.05); c.lineTo(0.55, -0.12); c.lineTo(0.25, 0.08); c.fill();
  c.restore();
}
/* ---------- the invasion ---------- */
/* A flying saucer centred at (x, y), s = half its width. */
function saucer(c, x, y, s, t, seed) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2.2 + seed * 7) * 0.1); c.scale(s, s);
  const dg = c.createLinearGradient(0, -0.5, 0, -0.1);
  dg.addColorStop(0, 'rgba(210,255,250,0.95)'); dg.addColorStop(1, 'rgba(60,150,160,0.85)');
  c.fillStyle = dg; c.beginPath(); c.ellipse(0, -0.1, 0.4, 0.38, 0, Math.PI, TAU); c.fill();
  const hg = c.createLinearGradient(0, -0.22, 0, 0.22);
  hg.addColorStop(0, '#e6e9ee'); hg.addColorStop(0.45, '#8a929c'); hg.addColorStop(1, '#2a2e34');
  c.fillStyle = hg; c.beginPath(); c.ellipse(0, 0, 1, 0.22, 0, 0, TAU); c.fill();
  c.fillStyle = '#30353c'; c.beginPath(); c.ellipse(0, 0.14, 0.5, 0.1, 0, 0, TAU); c.fill();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {   // lights chasing round the rim
    const a = 0.25 + (i / 6) * (Math.PI - 0.5), on = (i + Math.floor(t * 8 + seed * 10)) % 3 === 0;
    c.fillStyle = on ? 'rgba(140,255,230,1)' : 'rgba(255,190,80,0.5)';
    c.beginPath(); c.arc(Math.cos(a) * 0.82, Math.sin(a) * 0.1 + 0.02, 0.06, 0, TAU); c.fill();
  }
  c.restore();
}
/* A huge mothership across the top of the sky. Its core charges up, then blasts the horizon. */
const BLAST = 7;
function mothership(c, t) {
  const m = Math.min(W, H), x = W * 0.68, y = H * 0.05, rx = W * 0.42, ry = H * 0.08, gy = H * GROUND;
  c.save();
  const g = c.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, '#3a3f48'); g.addColorStop(0.6, '#1b1e24'); g.addColorStop(1, '#0b0c0f');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
  c.fillStyle = '#252930'; c.beginPath(); c.ellipse(x, y + ry * 0.6, rx * 0.5, ry * 0.45, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(170,180,200,0.4)'; c.lineWidth = Math.max(1, m * 0.003);
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.stroke();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const a = 0.1 + (i / 17) * (Math.PI - 0.2), on = (i + Math.floor(t * 6)) % 4 === 0 ? 1 : 0.35;
    c.fillStyle = `rgba(120,255,230,${on})`;
    c.beginPath(); c.arc(x + Math.cos(a) * rx * 0.9, y + Math.sin(a) * ry * 0.8, m * 0.006, 0, TAU); c.fill();
  }
  const k = (t % BLAST) / BLAST, cx = x, cy = y + ry * 0.95, charge = Math.min(1, k / 0.6), cr = m * 0.05 * (0.4 + charge);
  const cg = c.createRadialGradient(cx, cy, 0, cx, cy, cr);
  cg.addColorStop(0, `rgba(210,255,255,${0.3 + 0.7 * charge})`); cg.addColorStop(1, 'rgba(80,220,255,0)');
  c.fillStyle = cg; c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fill();
  if (k > 0.6 && k < 0.72) {   // the blast
    const e = (k - 0.6) / 0.12, tx = W * 0.12, ty = gy;   // across the sky to the far left, where it shows past people
    for (const [col, w] of [['rgba(90,230,255,0.35)', 0.05], ['rgba(220,255,255,0.95)', 0.016]]) {
      c.strokeStyle = col; c.lineWidth = m * w * (1 - e * 0.5); c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(tx, ty); c.stroke();
    }
    const r = m * 0.16 * Math.sqrt(e), bg = c.createRadialGradient(tx, ty, 0, tx, ty, r);
    bg.addColorStop(0, 'rgba(230,255,255,0.95)'); bg.addColorStop(0.4, 'rgba(120,220,255,0.6)'); bg.addColorStop(1, 'rgba(40,120,200,0)');
    c.fillStyle = bg; c.beginPath(); c.arc(tx, ty, r, 0, TAU); c.fill();
  }
  c.restore();
}
function saucers(c, t) {
  const m = Math.min(W, H), gy = H * GROUND;
  // one hovering low at the side, beaming someone up
  const ax = W * (0.88 + 0.02 * Math.sin(t * 0.7)), ay = H * 0.4 + Math.sin(t * 1.7) * H * 0.01, as = m * 0.065;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const bg = c.createLinearGradient(0, ay, 0, gy);
  bg.addColorStop(0, `rgba(150,255,220,${0.45 + 0.1 * Math.sin(t * 9)})`); bg.addColorStop(1, 'rgba(150,255,220,0.08)');
  c.fillStyle = bg;
  c.beginPath(); c.moveTo(ax - as * 0.35, ay + as * 0.12); c.lineTo(ax + as * 0.35, ay + as * 0.12); c.lineTo(ax + as * 0.95, gy + H * 0.02); c.lineTo(ax - as * 0.95, gy + H * 0.02); c.closePath(); c.fill();
  c.restore();
  const k = (t % 5) / 5, py = gy + H * 0.02 - (gy + H * 0.02 - ay) * k;
  c.save();
  c.globalAlpha = 1 - k ** 4;
  c.translate(ax + Math.sin(t * 3) * as * 0.15, py); c.rotate(Math.sin(t * 2.5) * 0.6); c.translate(0, m * 0.025);
  person(c, 0, 0, m * 0.05, t * 0.6, 1, '#1b1310');   // flailing as they float up
  c.restore();
  saucer(c, ax, ay, as, t, 0);
  // two more zipping across the sky, strafing the ground
  for (const [sp, yy, seed, dir] of [[0.09, 0.24, 0.3, 1], [0.07, 0.34, 0.8, -1]]) {
    const u = ((t * sp + seed) % 1.4) - 0.2, x = dir > 0 ? u * W : W - u * W, y = H * yy + Math.sin(t * 2 + seed * 9) * H * 0.03;
    saucer(c, x, y, m * 0.042, t, seed);
    laser(c, [x, y + m * 0.012], [x + dir * W * 0.09, gy + H * 0.04], t, seed);
  }
}

function plane(c, t) {
  const k = (t % PLANE) / PLANE, m = Math.min(W, H);
  const crash = [W * 0.22, H * GROUND], start = [-W * 0.1, H * 0.08];
  const pos = (u) => [start[0] + (crash[0] - start[0]) * u, start[1] + (crash[1] - start[1]) * u * u];   // curving into a dive
  if (k < 0.55) {
    const u = k / 0.55, [x, y] = pos(u), [x2, y2] = pos(Math.min(1, u + 0.01));
    for (let i = 1; i < 14; i++) {   // smoke trail
      const v = u - i * 0.025; if (v < 0) break;
      const [sx, sy] = pos(v);
      c.fillStyle = `rgba(40,30,30,${0.45 - i * 0.03})`; c.beginPath(); c.arc(sx, sy, m * (0.012 + i * 0.003), 0, TAU); c.fill();
    }
    c.save(); c.translate(x, y); c.rotate(Math.atan2(y2 - y, x2 - x)); c.scale(m * 0.05, m * 0.05);
    c.fillStyle = '#d8d8d8';
    c.beginPath(); c.ellipse(0, 0, 1, 0.14, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(0.1, 0); c.lineTo(-0.35, -0.75); c.lineTo(-0.5, -0.75); c.lineTo(-0.2, 0); c.lineTo(-0.5, 0.75); c.lineTo(-0.35, 0.75); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-0.8, 0); c.lineTo(-1.05, -0.35); c.lineTo(-0.95, 0); c.fill();
    c.fillStyle = `rgba(255,${(120 + Math.random() * 80) | 0},30,0.9)`; c.beginPath(); c.arc(-0.3, -0.35, 0.18 + Math.random() * 0.08, 0, TAU); c.fill();
    c.restore();
  } else if (k < 0.8) {
    const e = (k - 0.55) / 0.25, r = m * 0.18 * Math.sqrt(e);
    if (debris.length === 0 && e < 0.1) for (let i = 0; i < 30; i++) debris.push({ x: crash[0], y: crash[1], vx: (Math.random() - 0.5) * W * 0.4, vy: -Math.random() * H * 0.6, life: 1.5 });
    const g = c.createRadialGradient(crash[0], crash[1] - r * 0.4, 0, crash[0], crash[1] - r * 0.4, r);
    g.addColorStop(0, `rgba(255,250,210,${1 - e})`); g.addColorStop(0.4, `rgba(255,160,40,${1 - e * 0.7})`); g.addColorStop(1, 'rgba(120,20,5,0)');
    c.fillStyle = g; c.beginPath(); c.arc(crash[0], crash[1] - r * 0.4, r, 0, TAU); c.fill();
  } else {
    const e = (k - 0.8) / 0.2;
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(35,25,25,${0.5 * (1 - e)})`; c.beginPath(); c.arc(crash[0] + Math.sin(i + t) * m * 0.02, crash[1] - i * m * 0.05 - e * m * 0.1, m * (0.03 + i * 0.01), 0, TAU); c.fill(); }
    debris.length = 0;
  }
  for (const d of debris) {
    d.life -= 1 / 60; d.vy += H * 0.9 / 60; d.x += d.vx / 60; d.y += d.vy / 60;
    if (d.life > 0 && d.y < H) { c.fillStyle = 'rgba(255,140,40,0.9)'; c.fillRect(d.x, d.y, m * 0.006, m * 0.006); }
  }
}

export default {
  name: 'End of the World',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!bg || bg.width !== W || bg.height !== H) build();
    c.drawImage(bg, 0, 0);
    const gy = H * GROUND, m = Math.min(W, H);
    mothership(c, t);
    trex(c, ((t * 0.035) % 1.4 - 0.2) * W, gy, m * 0.12, t);                      // stomping along the horizon
    for (let i = 0; i < 3; i++) ptero(c, (((t * 0.06 + i * 0.37) % 1.3) - 0.15) * W, H * (0.18 + i * 0.07) + Math.sin(t + i) * H * 0.02, m * 0.035, t + i);
    for (const [x, off, s] of NUKES) mushroom(c, x * W, s, ((t + off) % PERIOD) / PERIOD);
    plane(c, t);
    saucers(c, t);
    for (const [x, , h] of VOLCANOES) if (Math.random() < 0.5) {
      lava.push({ x: x * W, y: gy - h * H, vx: (Math.random() - 0.5) * W * 0.15, vy: -H * (0.25 + Math.random() * 0.3), life: 1.6 });
    }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = lava.length - 1; i >= 0; i--) {
      const q = lava[i];
      q.life -= 1 / 60; q.vy += H * 0.5 / 60; q.x += q.vx / 60; q.y += q.vy / 60;
      if (q.life <= 0 || q.y > H) { lava.splice(i, 1); continue; }
      c.fillStyle = `rgba(255,${(120 + 100 * q.life / 1.6) | 0},40,${Math.min(1, q.life)})`;
      c.beginPath(); c.arc(q.x, q.y, W * 0.004, 0, TAU); c.fill();
    }
    c.restore();
    chase(c, t, 0.07, H * 0.94, m * 0.08, 1, 0.1);
    chase(c, t, 0.055, H * 0.99, m * 0.1, -1, 0.6);
  },
  overlay(c, t) {
    if (!personReady()) return;
    c.save();
    c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(255,130,80,0.55)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, H, 0, H * 0.5);
    g.addColorStop(0, 'rgba(255,90,20,0.25)'); g.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
    while (ash.length < 70) ash.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), ember: Math.random() < 0.3 });
    for (const a of ash) {
      a.y += H * (0.0015 + a.s * 0.002); a.x += Math.sin(t + a.s * 10) * W * 0.0008;
      if (a.y > H) { a.y = -5; a.x = Math.random() * W; }
      c.fillStyle = a.ember ? 'rgba(255,140,40,0.9)' : 'rgba(60,50,45,0.6)';
      c.beginPath(); c.arc(a.x, a.y, W * (0.0015 + a.s * 0.002), 0, TAU); c.fill();
    }
    for (const [, off] of NUKES) {
      const k = ((t + off) % PERIOD) / PERIOD;
      if (k < 0.04) { c.fillStyle = `rgba(255,245,220,${0.6 * (1 - k / 0.04)})`; c.fillRect(0, 0, W, H); }
    }
    const pk = (t % PLANE) / PLANE;
    if (pk > 0.55 && pk < 0.58) { c.fillStyle = `rgba(255,230,180,${0.5 * (1 - (pk - 0.55) / 0.03)})`; c.fillRect(0, 0, W, H); }
    const bk = (t % BLAST) / BLAST;
    if (bk > 0.6 && bk < 0.63) { c.fillStyle = `rgba(200,250,255,${0.35 * (1 - (bk - 0.6) / 0.03)})`; c.fillRect(0, 0, W, H); }
    vignette(c, '20,0,0', 0.6);
  },
};
