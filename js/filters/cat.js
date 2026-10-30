/* Cat: pointed ears (with the odd flick), a pink nose, whiskers and a little cat mouth. */
import { TAU } from '../core.js';
import { facePt } from '../fx.js';

function ear(c, p, side, t) {
  const P = (a, b) => facePt(p, a, b);
  const twitch = Math.max(0, Math.sin(t * 1.3 + side * 2)) ** 12 * 0.06;
  c.beginPath();
  c.moveTo(...P(side * 0.15, 0.62));
  c.quadraticCurveTo(...P(side * 0.3, 1.0), ...P(side * (0.52 + twitch), 1.08));
  c.quadraticCurveTo(...P(side * 0.62, 0.8), ...P(side * 0.55, 0.42));
  c.closePath();
  c.fillStyle = '#6b5a50'; c.fill();
  c.strokeStyle = '#3f332d'; c.lineWidth = p.fw * 0.015; c.stroke();
  c.beginPath();
  c.moveTo(...P(side * 0.24, 0.6));
  c.quadraticCurveTo(...P(side * 0.33, 0.9), ...P(side * (0.5 + twitch), 0.95));
  c.quadraticCurveTo(...P(side * 0.55, 0.78), ...P(side * 0.48, 0.5));
  c.closePath();
  c.fillStyle = '#f2a7b5'; c.fill();
}

export default {
  name: 'Cat',
  face(c, p, t) {
    const fw = p.fw;
    for (const s of [-1, 1]) ear(c, p, s, t);
    // nose and a little "w" mouth under it
    c.save();
    c.translate(...p.nose); c.rotate(p.ang);
    c.beginPath(); c.moveTo(-fw * 0.07, -fw * 0.03); c.lineTo(fw * 0.07, -fw * 0.03); c.lineTo(0, fw * 0.05); c.closePath();
    c.fillStyle = '#f08ea2'; c.fill();
    c.strokeStyle = '#3a2a2a'; c.lineWidth = fw * 0.012; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, fw * 0.05); c.lineTo(0, fw * 0.1);
    c.quadraticCurveTo(-fw * 0.04, fw * 0.15, -fw * 0.08, fw * 0.11);
    c.moveTo(0, fw * 0.1); c.quadraticCurveTo(fw * 0.04, fw * 0.15, fw * 0.08, fw * 0.11);
    c.stroke();
    c.restore();
    // whiskers and whisker dots
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1, fw * 0.007);
    for (const s of [-1, 1]) {
      for (const k of [-1, 0, 1]) {
        c.beginPath(); c.moveTo(...facePt(p, s * 0.14, -0.13 + k * 0.03));
        c.quadraticCurveTo(...facePt(p, s * 0.4, -0.12 + k * 0.06), ...facePt(p, s * 0.62, -0.1 + k * 0.1));
        c.stroke();
      }
      c.fillStyle = 'rgba(60,40,35,0.6)';
      for (const [a, b] of [[0.12, -0.15], [0.16, -0.18], [0.17, -0.13]]) { c.beginPath(); c.arc(...facePt(p, s * a, b), fw * 0.008, 0, TAU); c.fill(); }
    }
  },
};
