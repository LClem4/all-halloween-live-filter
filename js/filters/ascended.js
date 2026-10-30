/* The person is painted out of the mirror entirely (see the 'vanish' mode in segment.js). */
import { drawVanished } from '../segment.js';

export default {
  name: 'Ascended',
  hint: 'Step out of view, then walk back in',
  segment: 'vanish',
  base(c) { drawVanished(c); },
};
