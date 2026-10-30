/* St. Joan of Arc: plate armour fitted to the body, a halo, and her white battle standard with
   golden fleurs-de-lis waving behind her. */
import { TAU } from '../core.js';
import { facePt, caption, drawHalo, vignette } from '../fx.js';
import { drawOutfit, armorPaint } from '../props.js';

function fleur(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#d4aa3c';
  c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(0.35, -0.4, 0, 0.2); c.quadraticCurveTo(-0.35, -0.4, 0, -1); c.fill();
  for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 0.1, 0); c.quadraticCurveTo(d * 0.9, -0.6, d * 0.5, 0.2); c.quadraticCurveTo(d * 0.35, 0, d * 0.1, 0.1); c.fill(); }
  c.fillRect(-0.45, 0.15, 0.9, 0.15);
  c.beginPath(); c.moveTo(-0.15, 0.3); c.lineTo(0, 0.75); c.lineTo(0.15, 0.3); c.fill();
  c.restore();
}

function standard(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  const [x0, y0] = P(-1.2, -3.2), [x1, y1] = P(-1.0, 1.7);
  c.strokeStyle = '#6b4a2b'; c.lineWidth = fw * 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  // the flag streams out from the top of the pole, rippling
  const L = fw * 1.6, h = fw * 0.75, n = 14;
  c.save(); c.translate(x1, y1); c.rotate(p.ang * 0.4);
  const wave = (k) => Math.sin(t * 4 - k * 5) * fw * 0.06 * k;
  c.beginPath(); c.moveTo(0, 0);
  for (let i = 1; i <= n; i++) { const k = i / n; c.lineTo(-L * k, wave(k)); }
  c.lineTo(-L * 0.85, h * 0.5 + wave(1)); c.lineTo(-L, h + wave(1));
  for (let i = n; i >= 0; i--) { const k = i / n; c.lineTo(-L * k, h + wave(k)); }
  c.closePath();
  c.fillStyle = '#f8f6ef'; c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = fw * 0.01; c.stroke();
  for (const [k, yy] of [[0.25, 0.3], [0.55, 0.55], [0.4, 0.8]]) fleur(c, -L * k, h * yy - h * 0.2 + wave(k), fw * 0.1);
  c.restore();
}

export default {
  name: 'St. Joan of Arc',
  segment: 'cutout',
  behind(c, p, t) { standard(c, p, t); },
  face(c, p, t) {
    drawOutfit(c, p, (o) => armorPaint(o, p));
    drawHalo(c, p, t);
  },
  overlay(c) { vignette(c, '30,20,10', 0.4); caption(c, 'St. Joan of Arc'); },
};
