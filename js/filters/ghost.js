/* Bedsheet ghost: a white sheet over each whole person, head and shoulders included, hanging
   straight down to the bottom of the screen, with two eye holes over the real eyes. The sheet is
   the person's silhouette (segmentation) grown a little and smeared downwards. Until
   segmentation is ready, a drawn sheet shape stands in. */
import { TAU, drawVideo } from '../core.js';
import { facePt, eyeGeom, vignette } from '../fx.js';
import { personMask } from '../segment.js';

const sheet = document.createElement('canvas'), sc = sheet.getContext('2d');

function drawnSheet(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.beginPath();
  c.moveTo(...P(-0.6, 0.25));
  c.bezierCurveTo(...P(-0.7, 1.0), ...P(0.7, 1.0), ...P(0.6, 0.25));
  c.bezierCurveTo(...P(0.9, -0.5), ...P(1.7, -0.9), ...P(1.9, -6));
  c.lineTo(...P(-1.9, -6));
  c.bezierCurveTo(...P(-1.7, -0.9), ...P(-0.9, -0.5), ...P(-0.6, 0.25));
  c.closePath();
  c.fillStyle = '#eef0f4'; c.fill();
}

export default {
  name: 'Ghost',
  segment: 'mask',
  base(c, t) {
    drawVideo(c);
    const m = personMask();
    if (!m) return;
    if (sheet.width !== m.width || sheet.height !== m.height) { sheet.width = m.width; sheet.height = m.height; }
    const w = sheet.width, h = sheet.height, r = w * 0.025;
    sc.globalCompositeOperation = 'source-over';
    sc.clearRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) sc.drawImage(m, Math.cos((i / 8) * TAU) * r, Math.sin((i / 8) * TAU) * r);   // a bit bigger than the body
    for (let dy = r; dy < h; dy += r * 1.5) sc.drawImage(m, 0, dy);                                          // hanging to the floor
    sc.globalCompositeOperation = 'source-in';
    const g = sc.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd3dc');
    sc.fillStyle = g; sc.fillRect(0, 0, w, h);
    // soft folds swaying in the draught
    sc.globalCompositeOperation = 'source-atop';
    sc.strokeStyle = 'rgba(130,135,160,0.22)'; sc.lineWidth = w * 0.012; sc.lineCap = 'round';
    for (let x = w * 0.05; x < w; x += w * 0.09) {
      sc.beginPath(); sc.moveTo(x, h * 0.3); sc.quadraticCurveTo(x + Math.sin(t * 1.7 + x) * w * 0.02, h * 0.65, x + Math.sin(t * 1.3 + x) * w * 0.03, h); sc.stroke();
    }
    sc.globalCompositeOperation = 'source-over';
    drawVideo(c, sheet);
  },
  face(c, p, t) {
    if (!personMask()) drawnSheet(c, p, t);
    c.fillStyle = '#0a0a0a';
    for (const e of eyeGeom(p)) { c.beginPath(); c.ellipse(e.c[0], e.c[1], e.w * 0.5, e.w * 0.62, p.ang, 0, TAU); c.fill(); }
  },
  overlay(c) { vignette(c, '5,8,20', 0.55); },
};
