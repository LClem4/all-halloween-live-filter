/* St. Nicholas, the generous bishop: red mitre, red cope with gold trim, a long white beard.
   Open your mouth and gold coins tumble out. */
import { jawI } from '../face.js';
import { facePt, caption, burst, drawHalo } from '../fx.js';
import { drawOutfit, fillBody, mitre, beard } from '../props.js';

export default {
  name: 'St. Nicholas',
  hint: 'Open your mouth!',
  segment: 'mask',
  face(c, p, t, dt) {
    const P = (a, b) => facePt(p, a, b), fw = p.fw;
    drawOutfit(c, p, (o) => {
      fillBody(o, p, '#a3171f');
      o.strokeStyle = '#e0b84a'; o.lineWidth = fw * 0.12;   // gold edges of the cope
      for (const s of [-1, 1]) { o.beginPath(); o.moveTo(...P(s * 0.35, -0.8)); o.lineTo(...P(s * 0.3, -5)); o.stroke(); }
      o.fillStyle = '#e0b84a';
      for (let b = -1.3; b > -4; b -= 0.5) for (const s of [-1, 1]) { o.beginPath(); o.arc(...P(s * 0.32, b), fw * 0.05, 0, Math.PI * 2); o.fill(); }
    });
    beard(c, p, 1);
    drawHalo(c, p, t, 1.0, 1.25);
    mitre(c, p, { body: '#c62828', shade: '#7f1015', band: '#e0b84a', edge: '#a8821e', cross: '#f6e7b0' });
    const I = jawI(p);
    if (I > 0) burst(p, 'coin', I * 1.5, dt);
  },
  overlay(c) { caption(c, 'St. Nicholas'); },
};
