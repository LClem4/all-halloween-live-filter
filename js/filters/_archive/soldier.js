/* ARCHIVED (not loaded): removed from the mirror by request. To restore, move back to js/filters/ (fix the ../../ imports) and add it to js/filters/index.js. */
/* A steel soldier's helmet sitting on the head (rim low on the forehead, sides over the temples),
   netting and a chin strap, over a faded war-film look. */
import { drawVideo } from '../../core.js';
import { facePt, desaturate, vignette } from '../../fx.js';

// rim: front centre, then out to the sides over the temples
const RIM = [[-0.64, 0.12], [-0.45, 0.31], [-0.22, 0.37], [0, 0.37], [0.22, 0.37], [0.45, 0.31], [0.64, 0.12]];

function helmet(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  // chin strap first, so the helmet covers its ends
  c.save();
  c.lineCap = 'round';
  for (const [col, w] of [['#2b2f17', 0.034], ['#5b6132', 0.022]]) {
    c.strokeStyle = col; c.lineWidth = fw * w;
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(...P(s * 0.58, 0.14)); c.quadraticCurveTo(...P(s * 0.56, -0.38), ...P(s * 0.05, -0.6)); c.stroke();
    }
  }
  c.restore();

  const rimPath = (lift) => {
    c.moveTo(...P(RIM[0][0], RIM[0][1] + lift));
    for (let i = 1; i < RIM.length; i++) c.lineTo(...P(RIM[i][0], RIM[i][1] + lift));
  };
  c.save();
  c.beginPath();
  rimPath(0);
  c.bezierCurveTo(...P(0.72, 0.62), ...P(0.46, 0.98), ...P(0, 1.0));
  c.bezierCurveTo(...P(-0.46, 0.98), ...P(-0.72, 0.62), ...P(-0.64, 0.12));
  c.closePath();
  const [gx, gy] = P(-0.18, 0.75);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.85);
  g.addColorStop(0, '#8a965c'); g.addColorStop(0.5, '#4c5731'); g.addColorStop(1, '#232910');
  c.fillStyle = g; c.fill();
  c.clip();
  c.strokeStyle = 'rgba(25,30,10,0.4)'; c.lineWidth = Math.max(1, fw * 0.006);
  for (let k = -7; k <= 7; k++) {
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...P(k * 0.1 - s * 0.6, 0)); c.lineTo(...P(k * 0.1 + s * 0.6, 1.1)); c.stroke(); }
  }
  // shade the lower edge so the shell reads as curving round the head
  const [sx, sy] = P(0, 0.2), [ex, ey] = P(0, 0.55);
  const sh = c.createLinearGradient(sx, sy, ex, ey);
  sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sh; c.fillRect(-1e4, -1e4, 2e4, 2e4);
  c.restore();

  // rolled rim with a thin highlight
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#1c2009'; c.lineWidth = fw * 0.04; c.beginPath(); rimPath(0); c.stroke();
  c.strokeStyle = 'rgba(170,180,120,0.5)'; c.lineWidth = fw * 0.01; c.beginPath(); rimPath(0.025); c.stroke();
  c.restore();
}

export default {
  name: 'Soldier',
  base(c) { drawVideo(c); desaturate(c, 0.55); },
  face(c, p) { helmet(c, p); },
  overlay(c) { vignette(c, '25,20,5', 0.55); },
};
