/* Face Swap: with two people in frame, their faces trade places (the two largest faces). */
import { W, H, FONT, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { snapshot, swapFace } from '../warp.js';

export default {
  name: 'Face Swap',
  hint: 'Needs two people',
  base(c) { drawVideo(c); snapshot(); },
  overlay(c) {
    const fs = [...tracks].sort((a, b) => b.fw - a.fw).slice(0, 2);
    if (fs.length === 2) { swapFace(c, fs[0], fs[1]); swapFace(c, fs[1], fs[0]); return; }
    if (!fs.length) return;
    const size = Math.round(Math.min(W, H) * 0.05);
    c.save();
    c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'top';
    c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = size * 0.4; c.fillStyle = '#ffe7a0';
    c.fillText('Bring a friend to swap faces!', W / 2, H * 0.06);
    c.restore();
  },
};
