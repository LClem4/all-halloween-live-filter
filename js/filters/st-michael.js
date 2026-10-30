/* St. Michael the Archangel: great wings behind the body, shining plate armour fitted to the
   body, a halo, and a flaming sword raised at his side. */
import { TAU } from '../core.js';
import { facePt, caption, drawHalo, topGlow } from '../fx.js';
import { drawOutfit, armorPaint, wings } from '../props.js';

function sword(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  const hilt = P(1.15, -1.0), tip = P(1.45, 1.5);
  const ang = Math.atan2(tip[1] - hilt[1], tip[0] - hilt[0]), len = Math.hypot(tip[0] - hilt[0], tip[1] - hilt[1]);
  c.save();
  c.translate(...hilt); c.rotate(ang);
  // flames licking along the blade
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const k = i / 13, x = len * (0.15 + k * 0.85), r = fw * (0.16 + 0.07 * Math.sin(t * 12 + i * 1.7));
    const g = c.createRadialGradient(x, 0, 0, x, 0, r);
    g.addColorStop(0, 'rgba(255,200,80,0.8)'); g.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, 0, r, 0, TAU); c.fill();
  }
  c.restore();
  const g = c.createLinearGradient(0, -fw * 0.04, 0, fw * 0.04);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#b8c0ca'); g.addColorStop(1, '#6d7682');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(len * 0.12, -fw * 0.075); c.lineTo(len * 0.9, -fw * 0.06); c.lineTo(len, 0); c.lineTo(len * 0.9, fw * 0.06); c.lineTo(len * 0.12, fw * 0.075); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(80,90,100,0.6)'; c.lineWidth = fw * 0.01; c.beginPath(); c.moveTo(len * 0.14, 0); c.lineTo(len * 0.92, 0); c.stroke();
  c.fillStyle = '#d4aa3c'; c.fillRect(len * 0.09, -fw * 0.22, fw * 0.07, fw * 0.44);   // cross-guard
  c.fillStyle = '#5a3a1a'; c.fillRect(-len * 0.02, -fw * 0.03, len * 0.12, fw * 0.06);  // grip
  c.fillStyle = '#d4aa3c'; c.beginPath(); c.arc(-len * 0.02, 0, fw * 0.045, 0, TAU); c.fill();
  c.restore();
}

export default {
  name: 'St. Michael',
  segment: 'cutout',
  behind(c, p, t) { wings(c, p, t); },
  face(c, p, t) {
    drawOutfit(c, p, (o) => armorPaint(o, p));
    drawHalo(c, p, t);
    sword(c, p, t);
  },
  overlay(c) { topGlow(c, 0.2); caption(c, 'St. Michael the Archangel'); },
};
