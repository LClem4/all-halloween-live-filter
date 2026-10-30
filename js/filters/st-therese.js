/* St. Thérèse of Lisieux, the Little Flower: Carmelite brown habit, black veil and white coif,
   and her promised "shower of roses" falling from heaven. */
import { caption, rain, topGlow } from '../fx.js';
import { habit, veil } from '../props.js';

export default {
  name: 'St. Thérèse',
  segment: 'mask',
  face(c, p, t, dt) {
    habit(c, p, '#5a3d2b');
    veil(c, p);
  },
  overlay(c, t) {
    rain('rose', 5, 1 / 60);
    topGlow(c, 0.12);
    caption(c, 'St. Thérèse of Lisieux');
  },
};
