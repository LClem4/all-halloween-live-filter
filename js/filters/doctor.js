/* Doctor: white coat over blue scrubs (fitted to the body) with a pocket of pens and a name
   badge, a stethoscope round the neck, and a head mirror on the forehead. */
import { TAU } from '../core.js';
import { facePt } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

function coat(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  drawOutfit(c, p, (o) => {
    fillBody(o, p, '#f6f8fa');
    o.fillStyle = '#6fa8cf';   // scrubs showing in the V of the coat
    o.beginPath(); o.moveTo(...P(-0.38, -0.7)); o.lineTo(...P(0.38, -0.7)); o.lineTo(...P(0.12, -2.0)); o.lineTo(...P(-0.12, -2.0)); o.closePath(); o.fill();
    o.strokeStyle = '#c9d1d9'; o.lineWidth = fw * 0.025;   // lapels
    for (const s of [-1, 1]) { o.beginPath(); o.moveTo(...P(s * 0.4, -0.72)); o.lineTo(...P(s * 0.12, -2.0)); o.lineTo(...P(s * 0.12, -5)); o.stroke(); }
    o.strokeStyle = '#d5dce3'; o.lineWidth = fw * 0.02;   // breast pocket with pens
    o.strokeRect(...P(-0.85, -1.55), fw * 0.32, fw * 0.3);
    for (const [k, col] of [[0, '#1e5aa8'], [0.08, '#c62828'], [0.16, '#222']]) {
      o.strokeStyle = col; o.lineWidth = fw * 0.02;
      o.beginPath(); o.moveTo(...P(-0.8 + k, -1.5)); o.lineTo(...P(-0.8 + k, -1.38)); o.stroke();
    }
    const [bx, by] = P(0.62, -1.5);
    o.save(); o.translate(bx, by); o.rotate(p.ang);
    o.fillStyle = '#fff'; o.fillRect(-fw * 0.18, -fw * 0.06, fw * 0.36, fw * 0.13);
    o.strokeStyle = '#1e5aa8'; o.lineWidth = fw * 0.008; o.strokeRect(-fw * 0.18, -fw * 0.06, fw * 0.36, fw * 0.13);
    o.fillStyle = '#1e5aa8'; o.font = `700 ${fw * 0.065}px sans-serif`; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText('Dr. Mirror', 0, fw * 0.005);
    o.restore();
  });
}

function stethoscope(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.save();
  c.strokeStyle = '#26282c'; c.lineWidth = fw * 0.035; c.lineCap = 'round';
  c.beginPath(); c.moveTo(...P(-0.42, -0.72)); c.quadraticCurveTo(...P(-0.5, -1.1), ...P(-0.3, -1.6)); c.stroke();
  c.beginPath(); c.moveTo(...P(0.42, -0.72)); c.quadraticCurveTo(...P(0.5, -1.0), ...P(0.32, -1.3)); c.stroke();
  const [x, y] = P(0.3, -1.4);
  const g = c.createRadialGradient(x - fw * 0.03, y - fw * 0.03, 0, x, y, fw * 0.09);
  g.addColorStop(0, '#f4f6f8'); g.addColorStop(1, '#7d8590');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, fw * 0.08, 0, TAU); c.fill();
  c.restore();
}

function headMirror(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.strokeStyle = '#3a3d42'; c.lineWidth = fw * 0.025;
  c.beginPath(); c.moveTo(...P(-0.52, 0.38)); c.quadraticCurveTo(...P(0, 0.5), ...P(0.52, 0.38)); c.stroke();
  const [x, y] = P(0.12, 0.55), r = fw * 0.17;
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#c5ccd4'); g.addColorStop(1, '#7d8590');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = '#4a4f56'; c.lineWidth = fw * 0.015; c.stroke();
  c.fillStyle = '#2a2d31'; c.beginPath(); c.arc(x, y, r * 0.15, 0, TAU); c.fill();
}

export default {
  name: 'Doctor',
  segment: 'mask',
  face(c, p) { coat(c, p); stethoscope(c, p); headMirror(c, p); },
};
