/* ARCHIVED (not loaded): removed from the mirror by request. To restore, move back to js/filters/ (fix the ../../ imports) and add it to js/filters/index.js. */
/* Freckles across the nose and cheeks, with a light sun-kissed flush. Each freckle is a fixed
   blend of a few nearby landmarks, so it sticks to the skin as the face turns. */
import { TAU } from '../../core.js';
import { rng, mix } from '../../fx.js';

// landmark clusters: nose and bridge, one cheek, the mirrored cheek
const CLUSTERS = [
  [[6, 197, 195, 5, 4, 45, 275, 51, 281, 48, 278, 115, 344, 220, 440], 24],
  [[116, 117, 118, 119, 100, 101, 50, 36, 205, 187, 123, 147, 206, 203], 34],
  [[345, 346, 347, 348, 329, 330, 280, 266, 425, 411, 352, 376, 426, 423], 34],
];
const FRECKLES = [];
{
  const r = rng(7);
  for (const [ids, n] of CLUSTERS) {
    for (let i = 0; i < n; i++) {
      // a random triangle of cluster landmarks, and a uniformly random point inside it
      const pick = [0, 1, 2].map(() => ids[(r() * ids.length) | 0]);
      const s = Math.sqrt(r()), t = r();
      FRECKLES.push({ ids: pick, w: [1 - s, s * (1 - t), s * t], size: 0.004 + r() * 0.006, a: 0.28 + r() * 0.3, sq: 0.7 + r() * 0.3, rot: r() * TAU });
    }
  }
}

function flush(c, p, x, y, rx) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, 'rgba(235,150,120,0.35)'); g.addColorStop(1, 'rgba(235,150,120,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, TAU); c.fill();
  c.restore();
}

export default {
  name: 'Freckles',
  face(c, p) {
    const P = p.pts;
    flush(c, p, ...P[5], p.fw * 0.16);
    flush(c, p, ...mix(P[50], P[205], 0.4), p.fw * 0.2);
    flush(c, p, ...mix(P[280], P[425], 0.4), p.fw * 0.2);
    c.save();
    c.globalCompositeOperation = 'multiply';
    for (const f of FRECKLES) {
      const [a, b, d] = f.ids.map((i) => P[i]);
      const x = a[0] * f.w[0] + b[0] * f.w[1] + d[0] * f.w[2], y = a[1] * f.w[0] + b[1] * f.w[1] + d[1] * f.w[2];
      const s = p.fw * f.size;
      c.fillStyle = `rgba(125,70,40,${f.a})`;
      c.beginPath(); c.ellipse(x, y, s, s * f.sq, f.rot, 0, TAU); c.fill();
    }
    c.restore();
  },
};
