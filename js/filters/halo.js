import { jawI } from '../face.js';
import { rays, haloPos, drawHalo, topGlow, burst } from '../fx.js';

export default {
  name: 'Halo',
  hint: 'Open your mouth!',
  face(c, p, t, dt) {
    const I = jawI(p);
    const [hx, hy] = haloPos(p);
    rays(c, hx, hy, p.fw * 1.6, I, t, undefined, p);
    drawHalo(c, p, t);
    if (I > 0) burst(p, 'sparkle', I, dt);
  },
  overlay(c) { topGlow(c, 0.16); },
};
