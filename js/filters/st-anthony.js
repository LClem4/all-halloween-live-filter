/* St. Anthony of Padua, finder of lost things: a brown Franciscan habit and halo, with car keys,
   a phone, a wallet and a TV remote floating round him. Open your mouth and they light up:
   "Found it!" */
import { TAU, FONT } from '../core.js';
import { jawI } from '../face.js';
import { facePt, caption, drawHalo, drawStar } from '../fx.js';
import { habit } from '../props.js';

function keys(c, s) {
  c.strokeStyle = '#b8bec6'; c.lineWidth = s * 0.08;
  c.beginPath(); c.arc(0, -s * 0.3, s * 0.22, 0, TAU); c.stroke();
  c.fillStyle = '#c9a03a'; c.fillRect(-s * 0.05, -s * 0.1, s * 0.1, s * 0.6); c.fillRect(s * 0.05, s * 0.3, s * 0.12, s * 0.06);
  c.fillStyle = '#222'; c.fillRect(-s * 0.35, -s * 0.12, s * 0.22, s * 0.45);   // car fob
  c.fillStyle = '#c62828'; c.beginPath(); c.arc(-s * 0.24, s * 0.05, s * 0.05, 0, TAU); c.fill();
}
function phone(c, s) {
  c.fillStyle = '#111'; c.beginPath(); c.roundRect ? c.roundRect(-s * 0.25, -s * 0.48, s * 0.5, s * 0.96, s * 0.08) : c.rect(-s * 0.25, -s * 0.48, s * 0.5, s * 0.96); c.fill();
  const g = c.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
  g.addColorStop(0, '#5aa9e6'); g.addColorStop(1, '#7c3aed');
  c.fillStyle = g; c.fillRect(-s * 0.21, -s * 0.4, s * 0.42, s * 0.8);
}
function wallet(c, s) {
  c.fillStyle = '#6b4226'; c.fillRect(-s * 0.45, -s * 0.3, s * 0.9, s * 0.6);
  c.strokeStyle = '#d9b38c'; c.setLineDash([s * 0.05, s * 0.04]); c.lineWidth = s * 0.03; c.strokeRect(-s * 0.4, -s * 0.25, s * 0.8, s * 0.5); c.setLineDash([]);
  c.fillStyle = '#4caf50'; c.fillRect(-s * 0.3, -s * 0.38, s * 0.5, s * 0.1);   // a note poking out
}
function remote(c, s) {
  c.fillStyle = '#1b1b1d'; c.fillRect(-s * 0.15, -s * 0.55, s * 0.3, s * 1.1);
  c.fillStyle = '#e53935'; c.beginPath(); c.arc(0, -s * 0.42, s * 0.05, 0, TAU); c.fill();
  c.fillStyle = '#9e9e9e';
  for (let r = 0; r < 4; r++) for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(k * s * 0.08, -s * 0.2 + r * s * 0.15, s * 0.03, 0, TAU); c.fill(); }
}
const THINGS = [keys, phone, wallet, remote];

export default {
  name: 'St. Anthony',
  hint: 'Open your mouth!',
  segment: 'mask',
  face(c, p, t) {
    habit(c, p);
    drawHalo(c, p, t);
    const I = jawI(p), s = p.fw * 0.42;
    THINGS.forEach((draw, i) => {
      const a = t * 0.5 + (i / THINGS.length) * TAU;
      const [x, y] = facePt(p, Math.cos(a) * 1.15, 0.2 + Math.sin(a) * 0.55 + Math.sin(t * 2 + i) * 0.04);
      c.save();
      c.translate(x, y); c.rotate(Math.sin(t * 1.3 + i) * 0.4);
      if (I > 0.2) { c.shadowColor = 'rgba(255,230,120,1)'; c.shadowBlur = s * 0.8 * I; }
      draw(c, s);
      c.restore();
      if (I > 0.2) drawStar(c, x + s * 0.4, y - s * 0.4, s * 0.3 * I, t * 3 + i, `rgba(255,250,200,${I})`);
    });
    if (I > 0.25) {
      const [x, y] = facePt(p, 0, 1.15), size = Math.round(p.fw * 0.22 * (0.8 + 0.2 * I));
      c.save();
      c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(255,210,90,0.9)'; c.shadowBlur = size * 0.5;
      c.fillStyle = '#fff3c4'; c.globalAlpha = Math.min(1, (I - 0.25) * 3);
      c.fillText('Found it!', x, y);
      c.restore();
    }
  },
  overlay(c) { caption(c, 'St. Anthony of Padua'); },
};
