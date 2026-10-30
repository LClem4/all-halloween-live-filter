/* Slow-motion trail: colour-tinted echoes of each person follow behind them as they move. */
import { drawVideo } from '../core.js';
import { personCanvas } from '../segment.js';

const N = 7, EVERY = 0.12;   // echoes kept, seconds between them
const echoes = [];
let lastStamp = 0, lastSeen = -1;

export default {
  name: 'Trail',
  hint: 'Move around!',
  segment: 'cutout',
  base(c, t) {
    if (t - lastSeen > 0.5) echoes.length = 0;
    lastSeen = t;
    drawVideo(c);
    const pc = personCanvas();
    if (pc && t - lastStamp > EVERY) {
      lastStamp = t;
      const e = echoes.length >= N ? echoes.shift() : document.createElement('canvas');
      if (e.width !== pc.width || e.height !== pc.height) { e.width = pc.width; e.height = pc.height; }
      const ec = e.getContext('2d');
      ec.clearRect(0, 0, e.width, e.height);
      ec.drawImage(pc, 0, 0);
      ec.globalCompositeOperation = 'source-atop';
      ec.fillStyle = `hsla(${(t * 90) % 360},90%,60%,0.4)`; ec.fillRect(0, 0, e.width, e.height);
      ec.globalCompositeOperation = 'source-over';
      echoes.push(e);
    }
    echoes.forEach((e, i) => { c.globalAlpha = 0.1 + 0.45 * (i / echoes.length); drawVideo(c, e); });
    c.globalAlpha = 1;
  },
};
