/* St. Patrick: a green bishop's mitre, green vestments with a gold cross, a white beard, a
   shepherd's crozier at his side, and shamrocks drifting down. */
import { TAU } from '../core.js';
import { facePt, caption, rain, drawHalo } from '../fx.js';
import { drawOutfit, fillBody, mitre, beard } from '../props.js';

function crozier(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.save();
  c.strokeStyle = '#c9a03a'; c.lineCap = 'round'; c.lineWidth = fw * 0.06;
  c.beginPath(); c.moveTo(...P(1.15, -4)); c.lineTo(...P(1.15, 1.15)); c.stroke();
  const [x, y] = P(1.0, 1.15), r = fw * 0.16;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI, true); c.stroke();   // the crook
  c.fillStyle = '#c9a03a'; c.beginPath(); c.arc(x - r, y, fw * 0.04, 0, TAU); c.fill();
  c.restore();
}

export default {
  name: 'St. Patrick',
  segment: 'mask',
  face(c, p, t) {
    const P = (a, b) => facePt(p, a, b), fw = p.fw;
    drawOutfit(c, p, (o) => {
      fillBody(o, p, '#1f7a3e');
      o.fillStyle = '#d4aa3c';   // gold Y-cross orphrey
      o.beginPath(); o.moveTo(...P(-0.08, -1.25)); o.lineTo(...P(0.08, -1.25)); o.lineTo(...P(0.08, -5)); o.lineTo(...P(-0.08, -5)); o.fill();
      o.strokeStyle = '#d4aa3c'; o.lineWidth = fw * 0.16;
      o.beginPath(); o.moveTo(...P(-1.1, -0.85)); o.lineTo(...P(0, -1.3)); o.lineTo(...P(1.1, -0.85)); o.stroke();
    });
    beard(c, p, 0.6);
    drawHalo(c, p, t, 1.0, 1.25);
    mitre(c, p, { body: '#2f9e55', shade: '#16592c', band: '#d4aa3c', edge: '#b38a2a', cross: '#f4f2ec' });
    crozier(c, p);
  },
  overlay(c) { rain('shamrock', 2.5, 1 / 60); caption(c, 'St. Patrick'); },
};
