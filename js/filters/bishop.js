/* Bishop: a white and gold mitre and a pectoral cross on the chest. */
import { facePt, vignette } from '../fx.js';
import { mitre } from '../props.js';

function pectoralCross(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.strokeStyle = '#c9a03a'; c.lineWidth = Math.max(1, fw * 0.012);
  c.beginPath(); c.moveTo(...P(-0.32, -0.7)); c.quadraticCurveTo(...P(0, -1.35), ...P(0.32, -0.7)); c.stroke();
  const [x, y] = P(0, -1.2);
  c.save(); c.translate(x, y); c.rotate(p.ang);
  const g = c.createLinearGradient(-fw * 0.1, -fw * 0.1, fw * 0.1, fw * 0.25);
  g.addColorStop(0, '#fff0a8'); g.addColorStop(1, '#a8781e');
  c.fillStyle = g;
  c.fillRect(-fw * 0.03, 0, fw * 0.06, fw * 0.3); c.fillRect(-fw * 0.1, fw * 0.07, fw * 0.2, fw * 0.06);
  c.restore();
}

export default {
  name: 'Bishop',
  face(c, p) { pectoralCross(c, p); mitre(c, p); },
  overlay(c) { vignette(c, '40,20,0', 0.4); },
};
