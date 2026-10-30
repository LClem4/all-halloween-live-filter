/* Open your mouth and sweets tumble out: wrapped candies, peppermints and gumdrops. */
import { jawI } from '../face.js';
import { burst } from '../fx.js';

export default {
  name: 'Candy',
  hint: 'Open your mouth!',
  face(c, p, t, dt) { const I = jawI(p); if (I > 0) burst(p, 'candy', I * 1.3, dt); },
};
