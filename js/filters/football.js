/* Football player: helmet with a face mask (eyes left clear), eye black, and a jersey with
   shoulder stripes and a number, fitted to the body. */
import { facePt, eyeGeom, vignette } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

const TEAM = '#0b2a5b', TRIM = '#f2b134';

function jersey(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  drawOutfit(c, p, (o) => {
    fillBody(o, p, TEAM);
    o.strokeStyle = '#fff'; o.lineWidth = fw * 0.09;   // stripes over the shoulder pads
    for (const s of [-1, 1]) for (const k of [0, 0.16]) {
      o.beginPath(); o.moveTo(...P(s * (0.75 + k), -0.75)); o.quadraticCurveTo(...P(s * (1.0 + k), -1.0), ...P(s * (1.05 + k), -1.6)); o.stroke();
    }
    const [nx, ny] = P(0, -1.75);
    o.save(); o.translate(nx, ny); o.rotate(p.ang);
    o.font = `900 ${fw * 0.75}px 'Arial Black', Impact, sans-serif`; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.lineWidth = fw * 0.05; o.strokeStyle = TRIM; o.strokeText('12', 0, 0);
    o.fillStyle = '#fff'; o.fillText('12', 0, 0);
    o.restore();
    o.fillStyle = TRIM;   // V collar
    o.beginPath(); o.moveTo(...P(-0.3, -0.75)); o.lineTo(...P(0, -1.05)); o.lineTo(...P(0.3, -0.75)); o.lineTo(...P(0.22, -0.75)); o.lineTo(...P(0, -0.95)); o.lineTo(...P(-0.22, -0.75)); o.fill();
  }, -0.7);
}

function helmet(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  // shell round the head with an opening for the face
  c.beginPath();
  c.moveTo(...P(-0.64, -0.42));
  c.bezierCurveTo(...P(-0.82, 0.45), ...P(-0.55, 1.05), ...P(0, 1.06));
  c.bezierCurveTo(...P(0.55, 1.05), ...P(0.82, 0.45), ...P(0.64, -0.42));
  c.lineTo(...P(0.47, -0.42)); c.quadraticCurveTo(...P(0.52, 0.2), ...P(0.42, 0.34));
  c.quadraticCurveTo(...P(0, 0.48), ...P(-0.42, 0.34)); c.quadraticCurveTo(...P(-0.52, 0.2), ...P(-0.47, -0.42));
  c.closePath();
  const [gx, gy] = P(-0.25, 0.8);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 1.0);
  g.addColorStop(0, '#2c5aa8'); g.addColorStop(0.5, TEAM); g.addColorStop(1, '#04112a');
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.fillStyle = TRIM; c.beginPath(); c.moveTo(...P(-0.06, 0.4)); c.lineTo(...P(-0.06, 1.1)); c.lineTo(...P(0.06, 1.1)); c.lineTo(...P(0.06, 0.4)); c.fill();   // centre stripe
  c.restore();
  c.fillStyle = '#04112a';
  for (const s of [-1, 1]) { c.beginPath(); c.arc(...P(s * 0.6, 0.02), fw * 0.045, 0, Math.PI * 2); c.fill(); }   // ear holes
  // face mask: bars across the nose, mouth and chin, and one up the middle
  c.save();
  c.strokeStyle = '#b8bec6'; c.lineWidth = fw * 0.03; c.lineCap = 'round';
  c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = fw * 0.02;
  for (const b of [-0.08, -0.3, -0.5]) {
    c.beginPath(); c.moveTo(...P(-0.5, b + 0.04)); c.quadraticCurveTo(...P(0, b - 0.06), ...P(0.5, b + 0.04)); c.stroke();
  }
  c.beginPath(); c.moveTo(...P(0, -0.12)); c.lineTo(...P(0, -0.53)); c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...P(s * 0.5, 0.1)); c.lineTo(...P(s * 0.5, -0.46)); c.stroke(); }
  c.restore();
}

export default {
  name: 'Football',
  segment: 'mask',
  face(c, p) {
    jersey(c, p);
    // eye black under each eye
    c.fillStyle = 'rgba(15,15,15,0.85)';
    for (const e of eyeGeom(p)) {
      c.save(); c.translate(e.c[0] - p.up[0] * e.w * 0.95, e.c[1] - p.up[1] * e.w * 0.95); c.rotate(p.ang);
      c.fillRect(-e.w * 0.4, -e.w * 0.07, e.w * 0.8, e.w * 0.14);
      c.restore();
    }
    helmet(c, p);
  },
  overlay(c) { vignette(c, '0,10,30', 0.4); },
};
