/* Thick taped nerd glasses that magnify the eyes a little. */
import { glasses, glassesFrame } from '../props.js';
import { snapshot, warpRegion, scaleAbout } from '../warp.js';

export default {
  name: 'Nerd',
  face(c, p) {
    const f = glassesFrame(p);
    for (const e of f.lens) { snapshot(); warpRegion(c, e, f.d * 0.36, f.d * 0.26, f.ang, scaleAbout(e, 1.3)); }
    glasses(c, p, 'nerd', f);
  },
};
