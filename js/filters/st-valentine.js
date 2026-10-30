/* St. Valentine: little hearts drift up all the time. When two hands make a heart (index
   fingertips touching above, thumbs touching below), a glowing heart appears in them; if there
   are two people in the picture, St. Valentine himself appears above the couple to bless them.
   The people stay themselves; he is a drawn figure. */
import { W, H, TAU, FONT } from '../core.js';
import { tracks } from '../face.js';
import { caption } from '../fx.js';
import { heartPath } from '../props.js';
import { heartGestures } from '../hands.js';

let seen = 0, heartSeen = 0, lastT = 0;
const floaters = [];

/* A drawn bust of the saint: red vestments, white beard, halo, holding a heart. s = height. */
function saint(c, x, y, s, a, t) {
  c.save();
  c.globalAlpha = a;
  c.translate(x, y + Math.sin(t * 1.5) * s * 0.03); c.scale(s, s);
  const glow = c.createRadialGradient(0, -0.1, 0, 0, -0.1, 0.8);
  glow.addColorStop(0, 'rgba(255,240,200,0.7)'); glow.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = glow; c.beginPath(); c.arc(0, -0.1, 0.8, 0, TAU); c.fill();
  c.strokeStyle = '#f2cf6b'; c.lineWidth = 0.035; c.beginPath(); c.arc(0, -0.3, 0.26, 0, TAU); c.stroke();   // halo
  c.fillStyle = '#b3202c';                                                                                  // vestments
  c.beginPath(); c.moveTo(-0.45, 0.5); c.quadraticCurveTo(-0.42, 0.02, -0.1, -0.02); c.lineTo(0.1, -0.02); c.quadraticCurveTo(0.42, 0.02, 0.45, 0.5); c.closePath(); c.fill();
  c.fillStyle = '#e0b84a'; c.fillRect(-0.04, 0, 0.08, 0.5);
  c.fillStyle = '#f1c9a5'; c.beginPath(); c.arc(0, -0.28, 0.17, 0, TAU); c.fill();                          // face
  c.fillStyle = '#7a5a44'; c.beginPath(); c.arc(0, -0.33, 0.17, Math.PI, TAU); c.fill();                    // hair
  c.fillStyle = '#efeae0';                                                                                  // beard
  c.beginPath(); c.moveTo(-0.16, -0.27); c.quadraticCurveTo(-0.15, -0.02, 0, 0.02); c.quadraticCurveTo(0.15, -0.02, 0.16, -0.27); c.quadraticCurveTo(0, -0.17, -0.16, -0.27); c.fill();
  c.fillStyle = '#3a2a20'; for (const s2 of [-1, 1]) { c.beginPath(); c.arc(s2 * 0.06, -0.3, 0.017, 0, TAU); c.fill(); }
  c.strokeStyle = '#8a4a3a'; c.lineWidth = 0.015; c.beginPath(); c.arc(0, -0.22, 0.05, 0.3, Math.PI - 0.3); c.stroke();
  heartPath(c, 0, 0.28, 0.32); c.fillStyle = '#e63950'; c.fill();                                          // the heart he holds
  c.fillStyle = '#f1c9a5'; for (const s2 of [-1, 1]) { c.beginPath(); c.arc(s2 * 0.13, 0.33, 0.05, 0, TAU); c.fill(); }
  c.restore();
}

export default {
  name: 'St. Valentine',
  hint: 'Couples: make a heart with your hands',
  hands: true,
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
    const m = Math.min(W, H);
    // hearts drifting up
    if (Math.random() < dt * 3) floaters.push({ x: Math.random() * W, y: H + m * 0.05, s: m * (0.02 + Math.random() * 0.03), ph: Math.random() * TAU });
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y -= m * 0.08 * dt; f.ph += dt * 2;
      if (f.y < -m * 0.1) { floaters.splice(i, 1); continue; }
      heartPath(c, f.x + Math.sin(f.ph) * m * 0.02, f.y, f.s); c.fillStyle = 'rgba(255,120,150,0.55)'; c.fill();
    }
    const hearts = heartGestures();
    heartSeen += ((hearts.length ? 1 : 0) - heartSeen) * 0.15;
    for (const h of hearts) {
      const pulse = 1 + Math.sin(t * 6) * 0.08;
      c.save();
      c.shadowColor = '#ff4d6d'; c.shadowBlur = h.size * 0.6;
      heartPath(c, h.c[0], h.c[1], h.size * 1.3 * pulse); c.fillStyle = 'rgba(230,57,80,0.85)'; c.fill();
      c.restore();
    }
    // St. Valentine appears above the couple
    const two = [...tracks].sort((a, b) => b.fw - a.fw).slice(0, 2);
    seen += ((hearts.length && two.length === 2 ? 1 : 0) - seen) * 0.08;
    if (seen > 0.02 && two.length === 2) {
      const x = (two[0].c[0] + two[1].c[0]) / 2, s = (two[0].fw + two[1].fw) * 0.9;
      const top = Math.min(two[0].c[1] - two[0].fh * 0.8, two[1].c[1] - two[1].fh * 0.8);
      saint(c, x, Math.max(s * 0.55, top - s * 0.45), s, seen, t);
      c.save();
      c.globalAlpha = seen;
      const size = Math.round(m * 0.05);
      c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#ffe3ea';
      c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = size * 0.4;
      c.fillText('Blessed be this love!', W / 2, H - m * 0.2);
      c.restore();
    }
    caption(c, 'St. Valentine');
  },
};
