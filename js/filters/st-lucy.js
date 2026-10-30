/* St. Lucy, bringer of light: a crown of lit candles on an evergreen wreath, a white gown with a
   red sash, and warm candlelight on the face. */
import { TAU } from '../core.js';
import { facePt, caption, softSpot, vignette } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

function candleCrown(c, p, t) {
  const fw = p.fw, [cx, cy] = facePt(p, 0, 0.62), rx = fw * 0.55, ry = fw * 0.14;
  c.save();
  c.translate(cx, cy); c.rotate(p.ang);
  // wreath
  c.strokeStyle = '#1f5f2e'; c.lineWidth = fw * 0.09;
  c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU;
    c.fillStyle = i % 3 ? '#2e7d3c' : '#174d25';
    c.beginPath(); c.ellipse(Math.cos(a) * rx, Math.sin(a) * ry, fw * 0.06, fw * 0.025, a + 0.6, 0, TAU); c.fill();
    if (i % 4 === 0) { c.fillStyle = '#c62828'; c.beginPath(); c.arc(Math.cos(a) * rx * 1.02, Math.sin(a) * ry * 1.1, fw * 0.018, 0, TAU); c.fill(); }
  }
  // candles, back ones first
  const cand = [];
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 7) * TAU; cand.push([Math.cos(a) * rx, Math.sin(a) * ry]); }
  cand.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of cand) {
    const h = fw * 0.32, w = fw * 0.055;
    c.fillStyle = '#fbf7ea'; c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + w * 0.15, y - h, w * 0.35, h);
    const flick = 1 + Math.sin(t * 17 + x) * 0.12 + Math.sin(t * 9 + y) * 0.08, fy = y - h - fw * 0.02;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, fy - fw * 0.03, 0, x, fy - fw * 0.03, fw * 0.14);
    g.addColorStop(0, 'rgba(255,220,120,0.6)'); g.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, fy - fw * 0.03, fw * 0.14, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#ffb703';
    c.beginPath(); c.moveTo(x, fy - fw * 0.09 * flick); c.quadraticCurveTo(x + fw * 0.03, fy, x, fy + fw * 0.01); c.quadraticCurveTo(x - fw * 0.03, fy, x, fy - fw * 0.09 * flick); c.fill();
    c.fillStyle = '#fff5cc'; c.beginPath(); c.ellipse(x, fy - fw * 0.02, fw * 0.01, fw * 0.025, 0, 0, TAU); c.fill();
  }
  c.restore();
}

export default {
  name: 'St. Lucy',
  segment: 'mask',
  face(c, p, t) {
    const P = (a, b) => facePt(p, a, b), fw = p.fw;
    drawOutfit(c, p, (o) => {
      fillBody(o, p, '#fbfaf6');
      o.strokeStyle = '#c1121f'; o.lineWidth = fw * 0.22;   // red sash across the body
      o.beginPath(); o.moveTo(...P(-1.3, -1.0)); o.lineTo(...P(1.2, -3.2)); o.stroke();
    });
    softSpot(c, ...P(0, 0.3), fw * 0.9, fw * 0.8, p.ang, '255,190,110', 0.25, 'screen');   // candlelight on the face
    candleCrown(c, p, t);
  },
  overlay(c) { vignette(c, '20,10,0', 0.5); caption(c, 'St. Lucy'); },
};
