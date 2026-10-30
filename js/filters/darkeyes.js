/* Eyes in the Dark: the picture goes nearly black and glowing cartoon eyes sit over each real
   pair. The pupils look the way the head is facing; close your eyes and they blink shut. */
import { W, H, drawVideo } from '../core.js';
import { eyeGeom, headDir } from '../fx.js';

export default {
  name: 'Eyes in the Dark',
  hint: 'Look around',
  base(c) { drawVideo(c); c.fillStyle = 'rgba(0,0,0,0.93)'; c.fillRect(0, 0, W, H); },
  face(c, p) {
    const [dx, dy] = headDir(p);
    for (const e of eyeGeom(p)) {
      const r = e.w * 0.62;
      c.save();
      c.translate(...e.c); c.rotate(p.ang);
      c.shadowColor = 'rgba(255,235,150,0.9)'; c.shadowBlur = r * 1.2;
      if (e.open < 0.12) {   // blink
        c.strokeStyle = '#ffeeb0'; c.lineWidth = r * 0.18; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, r * 0.35, r, 0); c.stroke();
        c.restore();
        continue;
      }
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, '#fffdf0'); g.addColorStop(1, '#e9d27e');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
      c.restore();
      // pupil, offset in screen space towards where the head points
      const px = e.c[0] + dx * r * 0.45, py = e.c[1] + dy * r * 0.4;
      c.fillStyle = '#120a00'; c.beginPath(); c.arc(px, py, r * 0.38, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(px - r * 0.12, py - r * 0.12, r * 0.1, 0, Math.PI * 2); c.fill();
    }
  },
};
