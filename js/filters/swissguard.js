/* Pontifical Swiss Guard: the blue, yellow and red striped uniform fitted to the whole body
   (segmentation), a pleated white ruff, and a steel morion helmet with a red plume. */
import { facePt } from '../fx.js';
import { drawOutfit } from '../props.js';

const STRIPES = ['#1d3c8f', '#f2c230', '#c4262e', '#f2c230'];

function uniform(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  drawOutfit(c, p, (o) => {
    for (let i = -20; i < 20; i++) {
      o.beginPath();
      o.moveTo(...P(i * 0.16, 0)); o.lineTo(...P((i + 1) * 0.16, 0)); o.lineTo(...P((i + 1) * 0.2, -8)); o.lineTo(...P(i * 0.2, -8)); o.closePath();
      o.fillStyle = STRIPES[(i + 40) % 4]; o.fill();
    }
    // puffed bands across the chest and sleeves
    o.strokeStyle = 'rgba(0,0,0,0.18)'; o.lineWidth = fw * 0.05;
    for (const b of [-1.5, -2.3]) { o.beginPath(); o.moveTo(...P(-3, b)); o.quadraticCurveTo(...P(0, b - 0.15), ...P(3, b)); o.stroke(); }
  });
  // pleated white ruff
  const [rx, ry] = P(0, -0.8);
  c.save(); c.translate(rx, ry); c.rotate(p.ang);
  c.fillStyle = '#fbfbf6'; c.strokeStyle = '#c9c9c0'; c.lineWidth = Math.max(1, fw * 0.006);
  c.beginPath(); c.ellipse(0, 0, fw * 0.5, fw * 0.13, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    c.beginPath(); c.moveTo(Math.cos(a) * fw * 0.2, Math.sin(a) * fw * 0.05); c.lineTo(Math.cos(a) * fw * 0.5, Math.sin(a) * fw * 0.13); c.stroke();
  }
  c.restore();
}

function morion(c, p, t) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  // plume of red feathers springing from the crest
  for (let i = 0; i < 9; i++) {
    const k = i / 8, sway = Math.sin(t * 1.8 + i) * 0.02;
    const [x, y] = P(0.05 + k * 0.4 + sway, 1.11 + Math.sin(k * Math.PI) * 0.35);
    c.save(); c.translate(x, y); c.rotate(p.ang - 0.6 + k * 1.2);
    c.fillStyle = i % 2 ? '#d1202f' : '#a5141f';
    c.beginPath(); c.ellipse(0, 0, fw * 0.16, fw * 0.07, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  const steel = (x0, y0, x1, y1) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#f4f6f8'); g.addColorStop(0.45, '#9aa3ad'); g.addColorStop(1, '#4c545d');
    return g;
  };
  const [ax, ay] = P(-0.4, 0.96), [bx, by] = P(0.4, 0.26);
  c.strokeStyle = '#3b4249'; c.lineWidth = fw * 0.01;
  c.beginPath(); c.moveTo(...P(-0.28, 0.81)); c.quadraticCurveTo(...P(0, 1.31), ...P(0.28, 0.81)); c.closePath();
  c.fillStyle = steel(ax, ay, bx, by); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(...P(-0.48, 0.36)); c.bezierCurveTo(...P(-0.5, 0.91), ...P(0.5, 0.91), ...P(0.48, 0.36)); c.closePath();
  c.fillStyle = steel(ax, ay, bx, by); c.fill(); c.stroke();
  c.beginPath();
  c.moveTo(...P(-0.98, 0.71)); c.quadraticCurveTo(...P(-0.55, 0.31), ...P(0, 0.28)); c.quadraticCurveTo(...P(0.55, 0.31), ...P(0.98, 0.71));
  c.quadraticCurveTo(...P(0.6, 0.44), ...P(0, 0.41)); c.quadraticCurveTo(...P(-0.6, 0.44), ...P(-0.98, 0.71)); c.closePath();
  c.fillStyle = steel(...P(0, 0.66), ...P(0, 0.26)); c.fill(); c.stroke();
}

export default {
  name: 'Swiss Guard',
  segment: 'mask',
  face(c, p, t) { uniform(c, p); morion(c, p, t); },
};
