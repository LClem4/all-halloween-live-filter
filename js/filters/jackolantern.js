/* Jack-o'-lantern: the head becomes a carved pumpkin whose eyes, nose and grin sit on the real
   ones and glow with a flickering candle. The grin opens with your mouth. */
import { TAU } from '../core.js';
import { jawI } from '../face.js';
import { facePt, eyeGeom, vignette } from '../fx.js';

function hole(c, x, y, ang, path, glow) {
  c.save();
  c.translate(x, y); c.rotate(ang);
  path();
  c.fillStyle = '#3a1200'; c.fill();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(255,200,60,${0.75 * glow})`; c.fill();
  c.restore();
}

export default {
  name: "Jack-o'-Lantern",
  hint: 'Open your mouth!',
  face(c, p, t) {
    const fw = p.fw, fh = p.fh, ang = p.ang, I = jawI(p);
    const glow = 0.75 + 0.15 * Math.sin(t * 13 + p.seed) * Math.sin(t * 7.7) + 0.1 * Math.sin(t * 23);
    // pumpkin body: overlapping lobes, outer ones first
    const [cx, cy] = facePt(p, 0, 0.08), rx = fw * 0.8, ry = fh * 0.8;
    c.save();
    c.translate(cx, cy); c.rotate(ang);
    c.fillStyle = '#3d5a1e';
    c.beginPath(); c.moveTo(-rx * 0.06, -ry * 0.92); c.quadraticCurveTo(-rx * 0.02, -ry * 1.2, rx * 0.12, -ry * 1.25);
    c.lineTo(rx * 0.14, -ry * 1.16); c.quadraticCurveTo(rx * 0.05, -ry * 1.1, rx * 0.06, -ry * 0.92); c.fill();
    for (const k of [-2, 2, -1, 1, 0]) {
      const w = rx * (k === 0 ? 0.5 : 0.42), h = ry * (1 - Math.abs(k) * 0.06);
      const g = c.createRadialGradient(k * rx * 0.27 - w * 0.3, -h * 0.3, 0, k * rx * 0.27, 0, Math.max(w, h));
      g.addColorStop(0, '#ffb347'); g.addColorStop(0.6, '#f07c12'); g.addColorStop(1, '#a8460a');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(k * rx * 0.27, 0, w, h, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(120,45,5,0.5)'; c.lineWidth = fw * 0.01; c.stroke();
    }
    // candlelight glowing through the skin
    const gl = c.createRadialGradient(0, ry * 0.1, 0, 0, ry * 0.1, rx);
    gl.addColorStop(0, `rgba(255,180,60,${0.25 * glow})`); gl.addColorStop(1, 'rgba(255,180,60,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(-rx, -ry, rx * 2, ry * 2);
    c.restore();

    // carved eyes (triangles), nose, and a toothy grin
    for (const e of eyeGeom(p)) {
      const s = e.w * 0.85;
      hole(c, e.c[0], e.c[1], ang, () => { c.beginPath(); c.moveTo(0, -s * 0.6); c.lineTo(s * 0.6, s * 0.4); c.lineTo(-s * 0.6, s * 0.4); c.closePath(); }, glow);
    }
    const ns = fw * 0.09;
    hole(c, ...p.nose, ang, () => { c.beginPath(); c.moveTo(0, -ns * 0.5); c.lineTo(ns * 0.5, ns * 0.4); c.lineTo(-ns * 0.5, ns * 0.4); c.closePath(); }, glow);
    const mw = fw * 0.36, mh = fh * (0.07 + 0.22 * I);
    hole(c, ...p.mouth, ang, () => {
      c.beginPath();
      c.moveTo(-mw, -mh * 0.6);
      for (let i = 1; i < 6; i++) c.lineTo(-mw + (i * mw * 2) / 6, -mh * (i % 2 ? 0.1 : 0.6));      // top teeth
      c.lineTo(mw, -mh * 0.6);
      c.quadraticCurveTo(mw * 0.6, mh * 1.2, 0, mh);
      c.quadraticCurveTo(-mw * 0.6, mh * 1.2, -mw, -mh * 0.6);
      c.closePath();
    }, glow);
  },
  overlay(c) { vignette(c, '30,8,0', 0.6); },
};
