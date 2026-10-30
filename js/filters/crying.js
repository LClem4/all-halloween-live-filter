/* Crying, dramatically: a quivering frown, red puffy eyes and thick tear streams down the cheeks,
   dripping off the jaw into a pool of tears rising at the bottom of the screen. Frown (or raise
   your inner brows) to sob harder: the streams swell and run faster, a second stream starts by
   the nose and the drips turn into a downpour. The pool fills faster the more people are crying
   and the harder they cry, and drains slowly when everyone leaves. Cold blue wash. */
import { W, H, TAU, clamp, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { eyeGeom, facePt, softSpot, mix } from '../fx.js';
import { snapshot, warpRegion } from '../warp.js';

const quad = (a, b, k, s) => mix(mix(a, b, s), mix(b, k, s), s);
const MAX = 0.38;   // the pool's highest level, fraction of the screen
let level = 0, lastSeen = -1;

/* How hard this face is crying, 0..1. Rises quickly with a frown, eases off slowly. */
function sob(p, dt) {
  const frown = (p.bs.mouthFrownLeft + p.bs.mouthFrownRight) / 2;
  const want = clamp((frown - 0.04) / 0.26 + Math.max(0, p.bs.browInnerUp - 0.5) * 0.6, 0, 1);
  p.sob = p.sob === undefined ? want : p.sob + (want - p.sob) * Math.min(1, dt * (want > p.sob ? 4 : 1.2));
  return p.sob;
}

/* A tear stream from s0 down the cheek to s2: glow, body and a bright core. */
function stream(c, s0, s1, s2, fw, wide, a = 1) {
  for (const [col, w, o] of [['120,190,255', 0.075, 0.55], ['190,230,255', 0.04, 0.7], ['255,255,255', 0.012, 0.75]]) {
    c.strokeStyle = `rgba(${col},${o * a})`; c.lineWidth = fw * w * wide;
    c.beginPath(); c.moveTo(...s0); c.quadraticCurveTo(...s1, ...s2); c.stroke();
  }
}

export default {
  name: 'Crying',
  hint: 'Frown to really sob!',
  base(c, t) {
    if (t - lastSeen > 0.5) level = 0;
    const dt = Math.min(0.05, Math.max(0, t - lastSeen));
    lastSeen = t;
    if (!tracks.length) level = Math.max(0, level - H * 0.01 * dt);   // everyone left: drain
    drawVideo(c); snapshot();
  },
  face(c, p, t, dt) {
    const P = p.pts, fw = p.fw, fh = p.fh, ang = p.ang, u = p.up, k = sob(p, dt);
    const mw = Math.hypot(P[291][0] - P[61][0], P[291][1] - P[61][1]) / 2;
    const quiver = 1 + Math.sin(t * (14 + 8 * k)) * (0.15 + 0.2 * k);
    warpRegion(c, p.mouth, mw * 1.2, mw * 0.75, ang, (pt) => {
      const dx = ((pt[0] - p.mouth[0]) * p.right[0] + (pt[1] - p.mouth[1]) * p.right[1]) / mw;
      const d = clamp(Math.abs(dx), 0, 1.3) ** 2 * fh * (0.08 + 0.05 * k) * quiver;
      return [pt[0] - u[0] * d, pt[1] - u[1] * d];
    });
    const pool = H - level, wide = 1 + 0.9 * k, flow = 0.9 * (1 + 1.6 * k);
    const [e0, e1] = eyeGeom(p);
    for (const [e, lid] of [[e0, P[145]], [e1, P[374]]]) {
      // which side of the face this eye is on, on screen (the picture is mirrored)
      const side = Math.sign((e.c[0] - p.c[0]) * p.right[0] + (e.c[1] - p.c[1]) * p.right[1]) || 1;
      const off = side > 0 ? 0.13 : 0;
      softSpot(c, e.c[0] - u[0] * fh * 0.03, e.c[1] - u[1] * fh * 0.03, e.w * (0.95 + 0.15 * k), e.w * (0.45 + 0.1 * k), ang, '255,90,90', 0.5 + 0.3 * k, 'multiply');
      // a thick stream from the lower lid down the cheek and off the jaw
      const s0 = lid, s1 = facePt(p, side * 0.28, -0.15), s2 = facePt(p, side * (0.33 + 0.03 * k), -0.65);
      c.save();
      c.lineCap = 'round';
      stream(c, s0, s1, s2, fw, wide);
      if (k > 0.05) stream(c, e.inner, facePt(p, side * 0.13, -0.2), facePt(p, side * 0.2, -0.62), fw, 0.5 + 0.3 * k, Math.min(1, k * 2));
      const n = 5 + Math.round(4 * k);
      for (let i = 0; i < n; i++) {   // bulges running down the stream
        const [x, y] = quad(s0, s1, s2, (t * flow + i / n + off) % 1);
        c.fillStyle = 'rgba(205,235,255,0.9)'; c.beginPath(); c.arc(x, y, fw * 0.035 * (1 + 0.4 * k), 0, TAU); c.fill();
      }
      // drops falling off the jaw, all the way down into the pool when it is high enough
      const fall = Math.max(fh * 0.4, Math.min(pool - s2[1], fh * (1.2 + 2.5 * k)));
      const hits = s2[1] + fall >= pool - 1, m = 4 + Math.round(6 * k);
      for (let i = 0; i < m && s2[1] < pool; i++) {
        const f = (t * (1.1 + 1.3 * k) + i / m + off * 3) % 1, x = s2[0] + Math.sin(i * 2.3) * fw * 0.02 * k;
        const r = fw * (0.025 + 0.012 * k);
        c.fillStyle = `rgba(200,230,255,${0.9 * (hits ? 1 : 1 - f)})`;
        c.beginPath(); c.ellipse(x, s2[1] + f * f * fall, r, r * 1.45, 0, 0, TAU); c.fill();
        if (hits && f > 0.85) {   // splash ring where it lands
          const g = (f - 0.85) / 0.15;
          c.strokeStyle = `rgba(230,245,255,${0.8 * (1 - g)})`; c.lineWidth = Math.max(1, fw * 0.008);
          c.beginPath(); c.ellipse(x, pool, r * (1 + g * 4), r * (0.3 + g), 0, 0, TAU); c.stroke();
        }
      }
      c.restore();
    }
    // the pool fills a little from everyone, and much faster from anyone sobbing
    level = Math.min(H * MAX, level + H * (0.004 + 0.02 * k) * dt);
  },
  overlay(c, t) {
    c.save();
    c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(185,205,255,0.5)'; c.fillRect(0, 0, W, H);
    c.restore();
    if (level < 1) return;
    // the rising pool of tears
    const y0 = H - level;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += W / 40) c.lineTo(x, y0 + Math.sin(x * 0.02 + t * 2.5) * H * 0.006 + Math.sin(x * 0.007 - t * 1.3) * H * 0.008);
    c.lineTo(W, H); c.closePath();
    const g = c.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, 'rgba(120,190,255,0.65)'); g.addColorStop(1, 'rgba(40,90,190,0.8)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = H * 0.004; c.stroke();
  },
};
