/* Time Warp Scan: a glowing line sweeps slowly down the screen and freezes everything above it,
   so moving while it passes stretches or doubles you. Holds the result, then starts again. */
import { W, H, canvas, drawVideo } from '../core.js';

const SWEEP = 9, HOLD = 4;   // seconds
const frozen = document.createElement('canvas'), fc = frozen.getContext('2d');
let start = 0, lastSeen = -1, lineY = 0;

export default {
  name: 'Time Warp',
  hint: 'Move slowly as the line passes',
  base(c, t) {
    if (t - lastSeen > 0.5 || frozen.width !== W || frozen.height !== H) {   // just switched to this filter
      frozen.width = W; frozen.height = H; start = t; lineY = 0;
    }
    lastSeen = t;
    let el = t - start;
    if (el > SWEEP + HOLD) { start = t; el = 0; lineY = 0; fc.clearRect(0, 0, W, H); }
    drawVideo(c);
    const y = Math.min(H, Math.round((el / SWEEP) * H));
    if (y > lineY) { fc.drawImage(canvas, 0, lineY, W, y - lineY, 0, lineY, W, y - lineY); lineY = y; }   // freeze the newly passed rows
    if (lineY > 0) c.drawImage(frozen, 0, 0, W, lineY, 0, 0, W, lineY);
    if (el < SWEEP) {
      const g = c.createLinearGradient(0, lineY - H * 0.02, 0, lineY + H * 0.02);
      g.addColorStop(0, 'rgba(80,220,255,0)'); g.addColorStop(0.5, 'rgba(120,235,255,0.95)'); g.addColorStop(1, 'rgba(80,220,255,0)');
      c.fillStyle = g; c.fillRect(0, lineY - H * 0.02, W, H * 0.04);
    }
  },
};
