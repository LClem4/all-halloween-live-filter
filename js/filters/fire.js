/* Tongues of fire (Pentecost). */
import { TAU } from '../core.js';
import { jawI } from '../face.js';
import { rays, haloPos, vignette, burst } from '../fx.js';

/* One tongue: a teardrop whose upper half sways and whose tip wanders. Unit height,
   base at the origin, tip towards -y. */
function tonguePath(c, w, h, t, seed) {
  const sway = Math.sin(t * 5.3 + seed) * 0.05 + Math.sin(t * 8.7 + seed * 1.7) * 0.025;
  const tip = Math.sin(t * 6.1 + seed * 2.3) * 0.1 + Math.sin(t * 13.3 + seed) * 0.04;
  const hh = h * (1 + 0.07 * Math.sin(t * 11 + seed * 3) + 0.04 * Math.sin(t * 17.9 + seed));
  c.beginPath();
  c.moveTo(0, w * 0.35);
  c.bezierCurveTo(-w * 1.05, w * 0.35, -w * 1.1, -hh * 0.3, -w * 0.5 + sway, -hh * 0.58);
  c.quadraticCurveTo(-w * 0.12 + sway * 1.6, -hh * 0.82, tip, -hh);
  c.quadraticCurveTo(w * 0.12 + sway * 1.6, -hh * 0.82, w * 0.5 + sway, -hh * 0.58);
  c.bezierCurveTo(w * 1.1, -hh * 0.3, w * 1.05, w * 0.35, 0, w * 0.35);
}
function flameLayer(c, w, h, t, seed, bottom, top) {
  const g = c.createLinearGradient(0, w * 0.35, 0, -h);
  g.addColorStop(0, bottom); g.addColorStop(0.45, bottom); g.addColorStop(1, top);
  c.fillStyle = g;
  tonguePath(c, w, h, t, seed);
  c.fill();
}
/* Flames rise with gravity, so they stay upright on screen even when the head tilts. */
function drawFlame(c, x, y, u, t, seed) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(x, y); c.scale(u, u);
  const flick = 0.85 + 0.15 * Math.sin(t * 19 + seed) * Math.sin(t * 7.3 + seed);
  const g = c.createRadialGradient(0, -0.35, 0, 0, -0.35, 1.1);
  g.addColorStop(0, `rgba(255,120,30,${0.3 * flick})`); g.addColorStop(1, 'rgba(255,90,20,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, -0.35, 1.1, 0, TAU); c.fill();
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * 0.16, 0.02); c.rotate(s * 0.18);
    flameLayer(c, 0.12, 0.55, t * 1.3, seed + s * 4, 'rgba(255,90,25,0.75)', 'rgba(200,30,10,0)');
    c.restore();
  }
  flameLayer(c, 0.3, 1, t, seed, 'rgba(255,110,30,0.85)', 'rgba(210,35,10,0)');
  flameLayer(c, 0.21, 0.78, t * 1.15, seed + 1.3, 'rgba(255,175,55,0.85)', 'rgba(255,110,30,0)');
  flameLayer(c, 0.12, 0.5, t * 1.3, seed + 2.1, 'rgba(255,250,215,0.95)', 'rgba(255,215,120,0)');
  c.fillStyle = 'rgba(90,150,255,0.3)';
  c.beginPath(); c.ellipse(0, 0.04, 0.14, 0.06, 0, 0, TAU); c.fill();
  c.restore();
}
/* Flickering warm light from the flame falling on the face. */
function fireLight(c, p, t, I) {
  const a = (0.13 + 0.05 * Math.sin(t * 13) * Math.sin(t * 5.1) + 0.12 * I);
  const x = p.c[0] + p.up[0] * p.fh * 0.6, y = p.c[1] + p.up[1] * p.fh * 0.6, R = p.fh * 1.3;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, `rgba(255,130,50,${a})`); g.addColorStop(1, 'rgba(255,130,50,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  c.restore();
}

export default {
  name: 'Tongues of Fire',
  hint: 'Open your mouth!',
  face(c, p, t, dt) {
    const I = jawI(p);
    const [fx, fy] = haloPos(p, 0.26);
    const u = p.fh * (0.55 + 0.35 * I);
    fireLight(c, p, t, I);
    rays(c, fx, fy - u * 0.4, p.fw * 1.7, I, t, '255,150,60', p);
    drawFlame(c, fx, fy, u, t, p.seed);
    burst(p, 'ember', 0.25 + I * 1.2, dt, [fx, fy - u * 0.3]);
  },
  overlay(c) { vignette(c, '40,8,0', 0.45); },
};
