/* Open your mouth and confetti pours out. */
import { jawI } from '../face.js';
import { burst } from '../fx.js';

export default {
  name: 'Confetti',
  hint: 'Open your mouth!',
  face(c, p, t, dt) { const I = jawI(p); if (I > 0) burst(p, 'confetti', I * 3, dt); },
};
