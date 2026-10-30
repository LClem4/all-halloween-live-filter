/* Angel: wings from the shoulder blades, behind the body (the person is cut out and drawn back
   over them), and a halo. */
import { drawHalo, topGlow } from '../fx.js';
import { wings } from '../props.js';

export default {
  name: 'Angel',
  segment: 'cutout',
  behind(c, p, t) { wings(c, p, t); },
  face(c, p, t) { drawHalo(c, p, t, 0.85, 0.48); },
  overlay(c) { topGlow(c, 0.28); },
};
