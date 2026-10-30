/* Puppy: floppy ears, a shiny nose and whisker dots. Open your mouth and out comes a tongue. */
import { TAU } from '../core.js';
import { jawI } from '../face.js';
import { facePt } from '../fx.js';

/* One floppy ear, attached at the top, hanging down and out. Unit = face height, x outward, y down. */
function ear(c, x, y, side, u, ang) {
  c.save();
  c.translate(x, y); c.rotate(ang); c.scale(side * u, u);
  const g = c.createLinearGradient(0, 0, 0.3, 0.9);
  g.addColorStop(0, '#a26b37'); g.addColorStop(1, '#5e391a');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(0.25, -0.06, 0.44, 0.25, 0.38, 0.62);
  c.bezierCurveTo(0.34, 0.86, 0.12, 0.92, 0.04, 0.7);
  c.bezierCurveTo(-0.02, 0.45, -0.1, 0.2, 0, 0);
  c.fill();
  c.fillStyle = 'rgba(70,40,20,0.5)';
  c.beginPath();
  c.moveTo(0.06, 0.12);
  c.bezierCurveTo(0.22, 0.12, 0.32, 0.35, 0.29, 0.6);
  c.bezierCurveTo(0.26, 0.76, 0.14, 0.78, 0.1, 0.62);
  c.bezierCurveTo(0.06, 0.45, 0.02, 0.25, 0.06, 0.12);
  c.fill();
  c.restore();
}

export default {
  name: 'Puppy',
  hint: 'Open your mouth!',
  face(c, p, t) {
    const I = jawI(p), fw = p.fw, ang = p.ang;
    for (const s of [-1, 1]) {
      const [x, y] = facePt(p, s * 0.4, 0.55);
      ear(c, x, y, s, p.fh, ang - s * (0.12 + Math.sin(t * 2.3 + s) * 0.05 + I * 0.15));
    }

    // tongue
    if (I > 0.05) {
      const len = p.fh * (0.1 + 0.4 * I), w = fw * 0.13;
      c.save();
      c.translate(...p.mB); c.rotate(ang + Math.sin(t * 7) * 0.08 * I);
      const g = c.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, '#d9446a'); g.addColorStop(1, '#ff8fab');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-w, 0); c.lineTo(-w, len - w); c.arc(0, len - w, w, Math.PI, 0, true); c.lineTo(w, 0); c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(170,40,75,0.6)'; c.lineWidth = Math.max(1, fw * 0.008);
      c.beginPath(); c.moveTo(0, w * 0.3); c.lineTo(0, len - w * 0.8); c.stroke();
      c.restore();
    }

    // nose: rounded, a little wider than the real one, with a shine
    c.save();
    c.translate(...p.nose); c.rotate(ang);
    const nw = fw * 0.15, nh = fw * 0.1;
    const ng = c.createRadialGradient(-nw * 0.3, -nh * 0.4, 0, 0, 0, nw * 1.2);
    ng.addColorStop(0, '#4a3a3a'); ng.addColorStop(1, '#0d0909');
    c.fillStyle = ng;
    c.beginPath();
    c.moveTo(-nw, -nh * 0.5);
    c.bezierCurveTo(-nw, -nh * 1.2, nw, -nh * 1.2, nw, -nh * 0.5);
    c.bezierCurveTo(nw, nh * 0.4, nw * 0.3, nh, 0, nh);
    c.bezierCurveTo(-nw * 0.3, nh, -nw, nh * 0.4, -nw, -nh * 0.5);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.ellipse(-nw * 0.35, -nh * 0.55, nw * 0.25, nh * 0.15, -0.2, 0, TAU); c.fill();
    c.restore();

    // whisker dots
    c.fillStyle = 'rgba(40,25,20,0.75)';
    for (const s of [-1, 1]) {
      for (const [a, b] of [[0.16, -0.12], [0.21, -0.17], [0.24, -0.1]]) {
        const [x, y] = facePt(p, s * a, b);
        c.beginPath(); c.arc(x, y, fw * 0.011, 0, TAU); c.fill();
      }
    }
  },
};
