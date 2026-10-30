/* St. Peter: a short white beard, a green tunic under a golden mantle, a halo, and the keys of
   the kingdom (one gold, one silver) crossed and floating beside him. */
import { facePt, caption, drawHalo, topGlow } from '../fx.js';
import { drawOutfit, fillBody, beard, key } from '../props.js';

export default {
  name: 'St. Peter',
  segment: 'mask',
  face(c, p, t) {
    const P = (a, b) => facePt(p, a, b), fw = p.fw;
    drawOutfit(c, p, (o) => {
      fillBody(o, p, '#2e6b4f');
      o.fillStyle = '#d08a2e';   // golden mantle over one shoulder
      o.beginPath(); o.moveTo(...P(-3, -0.6)); o.lineTo(...P(-0.2, -0.8)); o.lineTo(...P(1.6, -4)); o.lineTo(...P(-3, -4)); o.closePath(); o.fill();
      o.strokeStyle = 'rgba(0,0,0,0.2)'; o.lineWidth = fw * 0.03;
      for (let k = 0; k < 4; k++) { o.beginPath(); o.moveTo(...P(-1.5 + k * 0.35, -1.0)); o.lineTo(...P(-0.4 + k * 0.4, -4)); o.stroke(); }
    });
    beard(c, p, 0.3, '#e9e6de');
    drawHalo(c, p, t);
    const [kx, ky] = P(1.05, 0.25 + Math.sin(t * 1.4) * 0.04), len = fw * 0.75;
    c.save(); c.translate(kx, ky);
    c.shadowColor = 'rgba(255,230,150,0.8)'; c.shadowBlur = fw * 0.15;
    c.save(); c.rotate(0.6 + Math.sin(t) * 0.05); key(c, len, '#e2b84a', '#8a6414'); c.restore();
    c.save(); c.rotate(-0.6 + Math.sin(t) * 0.05); key(c, len, '#d6dbe1', '#6d7682'); c.restore();
    c.restore();
  },
  overlay(c) { topGlow(c, 0.15); caption(c, 'St. Peter'); },
};
