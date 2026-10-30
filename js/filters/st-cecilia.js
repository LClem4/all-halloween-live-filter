/* St. Cecilia, patroness of music: a crown of roses and white blossoms, a rose-coloured gown and
   a halo. Open your mouth to sing: music notes float out. */
import { TAU } from '../core.js';
import { jawI } from '../face.js';
import { facePt, caption, burst, drawHalo, topGlow } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

function flowerCrown(c, p) {
  const fw = p.fw, [cx, cy] = facePt(p, 0, 0.58), rx = fw * 0.52, ry = fw * 0.12;
  c.save(); c.translate(cx, cy); c.rotate(p.ang);
  const spots = [];
  for (let i = 0; i < 13; i++) { const a = Math.PI + (i / 12) * Math.PI; spots.push([Math.cos(a) * rx, Math.sin(a) * ry, i]); }
  for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI; spots.push([Math.cos(a) * rx, Math.sin(a) * ry, i + 20]); }
  spots.sort((a, b) => a[1] - b[1]);
  for (const [x, y, i] of spots) {
    c.fillStyle = '#3c8d40'; c.beginPath(); c.ellipse(x + fw * 0.04, y, fw * 0.05, fw * 0.02, 0.6, 0, TAU); c.fill();
    const r = fw * 0.055;
    if (i % 2) {
      c.fillStyle = '#e05a7a'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = '#a3243f'; c.lineWidth = fw * 0.008; c.beginPath(); c.arc(x, y, r * 0.55, 0.5, 5.5); c.stroke();
    } else {
      c.fillStyle = '#fffaf0';
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.45, 0, TAU); c.fill(); }
      c.fillStyle = '#f4c542'; c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill();
    }
  }
  c.restore();
}

export default {
  name: 'St. Cecilia',
  hint: 'Open your mouth to sing!',
  segment: 'mask',
  face(c, p, t, dt) {
    drawOutfit(c, p, (o) => fillBody(o, p, '#c96a86'));
    drawHalo(c, p, t, 1.0, 0.7);
    flowerCrown(c, p);
    const I = jawI(p);
    if (I > 0) burst(p, 'note', I * 0.9, dt);
  },
  overlay(c) { topGlow(c, 0.15); caption(c, 'St. Cecilia'); },
};
