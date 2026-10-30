import { W, H, TAU, drawVideo } from '../core.js';
import { jawI } from '../face.js';
import { rays, vignette, burst } from '../fx.js';

function warmTint(c) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = '#efd7a0'; c.fillRect(0, 0, W, H);
  c.restore();
}
function nimbus(c, x, y, R) {
  c.save();
  const g = c.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
  g.addColorStop(0, '#fff1b8'); g.addColorStop(0.55, '#e8bf55'); g.addColorStop(1, '#b8862a');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  c.lineWidth = R * 0.04; c.strokeStyle = '#7a4f12'; c.stroke();
  c.beginPath(); c.arc(x, y, R * 0.86, 0, TAU); c.lineWidth = R * 0.015; c.stroke();
  c.fillStyle = 'rgba(122,79,18,0.8)';
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * TAU;
    c.beginPath(); c.arc(x + Math.cos(a) * R * 0.93, y + Math.sin(a) * R * 0.93, R * 0.012, 0, TAU); c.fill();
  }
  c.restore();
}
function iconFrame(c) {
  const b = Math.min(W, H) * 0.045;
  c.save();
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#8a5a14'); g.addColorStop(0.3, '#f3d27a'); g.addColorStop(0.6, '#b07d22');
  g.addColorStop(0.8, '#f6dc8c'); g.addColorStop(1, '#7a4f12');
  c.fillStyle = g;
  c.beginPath(); c.rect(0, 0, W, H); c.rect(b, b, W - 2 * b, H - 2 * b); c.fill('evenodd');
  c.strokeStyle = '#7a1f1f'; c.lineWidth = b * 0.18;
  c.strokeRect(b * 1.1, b * 1.1, W - 2.2 * b, H - 2.2 * b);
  c.restore();
}

export default {
  name: 'Saint Icon',
  hint: 'Open your mouth!',
  base(c) { drawVideo(c); warmTint(c); },
  face(c, p, t, dt) {
    const I = jawI(p);
    const nx = p.c[0] + p.up[0] * p.fh * 0.32, ny = p.c[1] + p.up[1] * p.fh * 0.32;
    const R = p.fw * 0.95;
    rays(c, nx, ny, R * 1.9, 0.25 + I * 0.75, t);
    nimbus(c, nx, ny, R);
    const hx = p.c[0] + p.up[0] * p.fh * 0.12, hy = p.c[1] + p.up[1] * p.fh * 0.12;
    c.save();
    c.beginPath(); c.ellipse(hx, hy, p.fw * 0.6, p.fh * 0.76, p.ang, 0, TAU); c.clip();
    drawVideo(c); warmTint(c);
    c.restore();
    if (I > 0) burst(p, 'sparkle', I, dt);
  },
  overlay(c) { vignette(c, '60,35,5', 0.55); iconFrame(c); },
};
