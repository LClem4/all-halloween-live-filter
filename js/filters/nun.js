/* Nun: black veil over the head and shoulders with a white coif framing the face, and a soft
   golden glow with slowly turning rays of light behind her head. */
import { TAU } from '../core.js';
import { rays, haloPos, clipHead, vignette } from '../fx.js';
import { veil } from '../props.js';

export default {
  name: 'Nun',
  face(c, p, t) {
    const [hx, hy] = haloPos(p, 0.1), r = p.fw * 1.8;
    c.save();   // warm glow round the head, behind it
    clipHead(c, p);
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(hx, hy, 0, hx, hy, r);
    g.addColorStop(0, 'rgba(255,225,150,0.5)'); g.addColorStop(0.45, 'rgba(255,205,120,0.2)'); g.addColorStop(1, 'rgba(255,205,120,0)');
    c.fillStyle = g; c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.fill();
    c.restore();
    rays(c, hx, hy, r, 0.8 + 0.15 * Math.sin(t * 1.3), t, undefined, p);
    veil(c, p);
  },
  overlay(c) { vignette(c, '0,0,0', 0.35); },
};
