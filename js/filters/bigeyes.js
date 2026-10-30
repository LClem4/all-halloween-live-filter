/* Big eyes, tiny mouth. Each warp reads a fresh snapshot so the eye regions don't fight. */
import { drawVideo } from '../core.js';
import { eyeGeom } from '../fx.js';
import { snapshot, warpRegion, scaleAbout } from '../warp.js';

export default {
  name: 'Big Eyes',
  base(c) { drawVideo(c); },
  face(c, p) {
    const P = p.pts, mw = Math.hypot(P[291][0] - P[61][0], P[291][1] - P[61][1]) / 2;
    for (const e of eyeGeom(p)) { snapshot(); warpRegion(c, e.c, e.w * 0.72, e.w * 0.55, p.ang, scaleAbout(e.c, 1.6)); }
    snapshot(); warpRegion(c, p.mouth, mw * 1.2, mw * 0.8, p.ang, scaleAbout(p.mouth, 0.5));
  },
};
