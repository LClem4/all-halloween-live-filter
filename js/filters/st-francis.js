/* St. Francis of Assisi: a brown Franciscan habit with cowl and knotted cord, a halo, and
   little birds fluttering round him, two perched on his shoulders. */
import { TAU } from '../core.js';
import { facePt, caption, drawHalo, topGlow } from '../fx.js';
import { habit } from '../props.js';

const COLS = ['#5b7fb3', '#a0522d', '#e9c46a', '#6a994e', '#b56576'];
function bird(c, x, y, s, flap, dir, col) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = col;
  c.beginPath(); c.ellipse(0, 0, 0.5, 0.3, -0.2, 0, TAU); c.fill();                        // body
  c.beginPath(); c.arc(0.42, -0.22, 0.2, 0, TAU); c.fill();                                // head
  c.beginPath(); c.moveTo(-0.4, 0); c.lineTo(-0.85, -0.1); c.lineTo(-0.8, 0.15); c.fill();  // tail
  c.fillStyle = '#f4a261'; c.beginPath(); c.moveTo(0.6, -0.25); c.lineTo(0.8, -0.18); c.lineTo(0.6, -0.14); c.fill();   // beak
  c.fillStyle = '#111'; c.beginPath(); c.arc(0.48, -0.27, 0.04, 0, TAU); c.fill();
  c.save(); c.scale(1, flap); c.fillStyle = 'rgba(0,0,0,0.25)';
  c.beginPath(); c.moveTo(-0.15, -0.1); c.quadraticCurveTo(0, -0.9, 0.25, -0.1); c.fill();   // wing
  c.restore();
  c.restore();
}

export default {
  name: 'St. Francis',
  segment: 'mask',
  face(c, p, t) {
    habit(c, p);
    drawHalo(c, p, t);
    const s = p.fw * 0.24;
    for (let i = 0; i < 5; i++) {   // fluttering round the head
      const a = t * (0.6 + i * 0.07) + i * 1.3;
      const [x, y] = facePt(p, Math.cos(a) * 1.15, 0.45 + Math.sin(a * 1.3) * 0.45);
      bird(c, x, y, s, Math.sin(t * 14 + i), -Math.sign(Math.sin(a)) || 1, COLS[i]);
    }
    for (const sd of [-1, 1]) {      // perched on the shoulders, bobbing
      const [x, y] = facePt(p, sd * 0.9, -0.88 + Math.max(0, Math.sin(t * 3 + sd)) * 0.03);
      bird(c, x, y, s * 1.1, 0.4, -sd, COLS[sd > 0 ? 1 : 3]);
    }
  },
  overlay(c) { topGlow(c, 0.18); caption(c, 'St. Francis of Assisi'); },
};
