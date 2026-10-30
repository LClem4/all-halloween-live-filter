/* Soft, polished everyday makeup: rosy blush, a tinted lip with a touch of gloss, soft
   eyeshadow, a thin winged liner and a little highlight. Tuned to still show in dim party light:
   multiply alone vanishes on dark skin pixels, so blush and lips also lay down a little plain colour. */
import { TAU } from '../core.js';
import { topGlow, mix } from '../fx.js';

const LIPS_OUT = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const LIPS_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
// upper lash lines, outer corner first
const LASH = [[33, 246, 161, 160, 159, 158, 157, 173, 133], [263, 466, 388, 387, 386, 385, 384, 398, 362]];

function soft(c, x, y, rx, ry, ang, rgb, a, op) {
  c.save();
  c.globalCompositeOperation = op;
  c.translate(x, y); c.rotate(ang); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.5, `rgba(${rgb},${a * 0.6})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
  c.restore();
}
function poly(c, P, ids) { ids.forEach((i, k) => (k ? c.lineTo(...P[i]) : c.moveTo(...P[i]))); c.closePath(); }

export default {
  name: 'Makeup',
  face(c, p) {
    const P = p.pts, fw = p.fw, up = p.up;
    // blush on the apples of the cheeks, swept slightly up towards the temples
    for (const [a, b, tilt] of [[P[50], P[205], -0.25], [P[280], P[425], 0.25]]) {
      soft(c, ...mix(a, b, 0.35), fw * 0.17, fw * 0.11, p.ang + tilt, '255,135,160', 0.5, 'multiply');
      soft(c, ...mix(a, b, 0.35), fw * 0.14, fw * 0.09, p.ang + tilt, '240,120,150', 0.12, 'source-over');
    }
    // highlight: cheekbones and down the nose
    soft(c, ...P[117], fw * 0.08, fw * 0.035, p.ang - 0.4, '255,245,235', 0.28, 'screen');
    soft(c, ...P[346], fw * 0.08, fw * 0.035, p.ang + 0.4, '255,245,235', 0.28, 'screen');
    soft(c, ...P[195], fw * 0.025, fw * 0.08, p.ang, '255,245,235', 0.22, 'screen');

    for (const ids of LASH) {
      const outer = P[ids[0]], inner = P[ids[ids.length - 1]];
      const mid = P[ids[4]];
      // eyeshadow: a soft rose-brown wash on the lid
      soft(c, mid[0] + up[0] * fw * 0.035, mid[1] + up[1] * fw * 0.035, fw * 0.12, fw * 0.05, p.ang, '195,110,120', 0.4, 'multiply');
      // liner: thickest at the outer corner, ending in a small flick up and out
      const ox = outer[0] - inner[0], oy = outer[1] - inner[1], ol = Math.hypot(ox, oy) || 1;
      const tip = [outer[0] + (ox / ol) * fw * 0.05 + up[0] * fw * 0.03, outer[1] + (oy / ol) * fw * 0.05 + up[1] * fw * 0.03];
      c.save();
      c.fillStyle = 'rgba(35,20,25,0.92)';
      c.beginPath();
      c.moveTo(...tip);
      for (let i = 0; i < ids.length; i++) {
        const q = P[ids[i]], th = fw * (0.016 * (1 - i / (ids.length - 1)) + 0.003);
        c.lineTo(q[0] + up[0] * th, q[1] + up[1] * th);
      }
      for (let i = ids.length - 1; i >= 0; i--) c.lineTo(...P[ids[i]]);
      c.closePath(); c.fill();
      c.restore();
    }

    // lips: tint the outer shape minus the mouth opening, then a soft gloss on the lower lip
    c.save();
    c.beginPath(); poly(c, P, LIPS_OUT); poly(c, P, LIPS_IN);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(220,110,130,0.55)'; c.fill('evenodd');
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(205,85,110,0.16)'; c.fill('evenodd');
    c.restore();
    soft(c, ...mix(P[14], P[17], 0.45), fw * 0.06, fw * 0.015, p.ang, '255,255,255', 0.4, 'screen');
  },
  overlay(c) { topGlow(c, 0.1); },
};
