/* A glowing outline around each person's body, cycling through the colours of the rainbow. */
import { TAU, drawVideo } from '../core.js';
import { personMask } from '../segment.js';

const ring = document.createElement('canvas'), rc = ring.getContext('2d');

export default {
  name: 'Outline',
  segment: 'mask',
  base(c, t) {
    drawVideo(c);
    const m = personMask();
    if (!m) return;
    if (ring.width !== m.width || ring.height !== m.height) { ring.width = m.width; ring.height = m.height; }
    const w = ring.width, h = ring.height, r = w * 0.012;
    // grow the mask in 12 directions, then cut the original out: what's left is a band round the body
    rc.globalCompositeOperation = 'source-over';
    rc.clearRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) rc.drawImage(m, Math.cos((i / 12) * TAU) * r, Math.sin((i / 12) * TAU) * r);
    rc.globalCompositeOperation = 'destination-out';
    rc.drawImage(m, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    const hue = t * 70;
    const g = rc.createLinearGradient(0, 0, w, h);
    for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsl(${(hue + k * 60) % 360},100%,60%)`);
    rc.fillStyle = g; rc.fillRect(0, 0, w, h);
    rc.globalCompositeOperation = 'source-over';
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.shadowColor = `hsl(${hue % 360},100%,60%)`; c.shadowBlur = 30;
    drawVideo(c, ring);
    c.restore();
  },
};
