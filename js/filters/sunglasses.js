/* Cool dark wayfarer sunglasses with a sheen. */
import { glasses } from '../props.js';

export default {
  name: 'Sunglasses',
  face(c, p) { glasses(c, p, 'wayfarer'); },
};
