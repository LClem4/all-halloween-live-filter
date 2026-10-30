/* Priest hearing confessions: black clerical shirt fitted to the body, white collar tab, and a
   purple confession stole round the neck with gold crosses at the ends. */
import { facePt } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

function stole(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  for (const s of [-1, 1]) {
    // a band from behind the neck, over the collarbone and straight down the chest
    c.beginPath();
    c.moveTo(...P(s * 0.3, -0.72)); c.quadraticCurveTo(...P(s * 0.5, -0.95), ...P(s * 0.42, -1.3));
    c.lineTo(...P(s * 0.4, -3.2)); c.lineTo(...P(s * 0.16, -3.2)); c.lineTo(...P(s * 0.18, -1.3));
    c.quadraticCurveTo(...P(s * 0.22, -0.95), ...P(s * 0.12, -0.8)); c.closePath();
    const [gx, gy] = P(s * 0.3, -1), [hx, hy] = P(s * 0.3, -3);
    const g = c.createLinearGradient(gx, gy, hx, hy);
    g.addColorStop(0, '#5a2378'); g.addColorStop(1, '#3a1252');
    c.fillStyle = g; c.fill();
    c.strokeStyle = '#d4aa3c'; c.lineWidth = fw * 0.012; c.stroke();
    // gold cross near the end
    const [x, y] = P(s * 0.29, -2.0);
    c.save(); c.translate(x, y); c.rotate(p.ang);
    c.fillStyle = '#e2b84a';
    c.fillRect(-fw * 0.02, -fw * 0.08, fw * 0.04, fw * 0.16); c.fillRect(-fw * 0.06, -fw * 0.035, fw * 0.12, fw * 0.04);
    c.restore();
  }
}

export default {
  name: 'Priest',
  segment: 'mask',
  face(c, p) {
    const P = (a, b) => facePt(p, a, b), fw = p.fw;
    drawOutfit(c, p, (o) => fillBody(o, p, '#08080a'), undefined, 0.16);
    // collar band and the white tab
    c.beginPath(); c.moveTo(...P(-0.36, -0.68)); c.quadraticCurveTo(...P(0, -0.9), ...P(0.36, -0.68));
    c.lineTo(...P(0.38, -0.78)); c.quadraticCurveTo(...P(0, -1.0), ...P(-0.38, -0.78)); c.closePath();
    c.fillStyle = '#0c0c0f'; c.fill();
    const [x, y] = P(0, -0.86);
    c.save(); c.translate(x, y); c.rotate(p.ang);
    c.fillStyle = '#f7f7f2'; c.fillRect(-fw * 0.07, -fw * 0.035, fw * 0.14, fw * 0.07);
    c.restore();
    stole(c, p);
  },
};
