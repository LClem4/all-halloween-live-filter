/* Elvis: a tall, glossy black pompadour, tapered sideburns, and a white jumpsuit with gold studs
   and a big pointed collar (fitted to the body). Open your mouth to sing: music notes float out. */
import { TAU } from '../core.js';
import { jawI } from '../face.js';
import { facePt, burst, rng } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

function jumpsuit(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  drawOutfit(c, p, (o) => {
    fillBody(o, p, '#fbfaf5');
    const r = rng(9);
    o.fillStyle = '#d9a93c';
    for (let b = -1.0; b > -5; b -= 0.18) for (let a = -2.6; a < 2.6; a += 0.18) {
      if (r() < 0.55) { o.beginPath(); o.arc(...P(a + (r() - 0.5) * 0.04, b), fw * 0.014, 0, TAU); o.fill(); }
    }
    o.strokeStyle = '#d9a93c'; o.lineWidth = fw * 0.03;   // deep V edged in gold
    o.beginPath(); o.moveTo(...P(-0.32, -0.8)); o.lineTo(...P(0, -1.6)); o.lineTo(...P(0.32, -0.8)); o.stroke();
  });
  // big pointed 70s collar lying out over the shoulders
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(...P(s * 0.22, -0.72)); c.quadraticCurveTo(...P(s * 0.55, -0.68), ...P(s * 0.95, -0.82));
    c.lineTo(...P(s * 0.62, -1.25)); c.quadraticCurveTo(...P(s * 0.45, -1.0), ...P(s * 0.3, -0.95)); c.closePath();
    c.fillStyle = '#fbfaf5'; c.fill();
    c.strokeStyle = '#d9a93c'; c.lineWidth = fw * 0.02; c.stroke();
  }
}

function pompadour(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  for (const s of [-1, 1]) {   // tapered sideburns down to the earlobe
    c.beginPath(); c.moveTo(...P(s * 0.5, 0.22)); c.lineTo(...P(s * 0.42, 0.2)); c.quadraticCurveTo(...P(s * 0.42, -0.05), ...P(s * 0.47, -0.2)); c.lineTo(...P(s * 0.5, -0.18)); c.closePath();
    c.fillStyle = '#0d0b0a'; c.fill();
  }
  // hair close at the sides, swept up into a tall wave over the forehead that rolls forward
  c.beginPath();
  c.moveTo(...P(-0.56, 0.2));
  c.bezierCurveTo(...P(-0.62, 0.62), ...P(-0.5, 0.95), ...P(-0.2, 1.12));
  c.bezierCurveTo(...P(0.1, 1.28), ...P(0.5, 1.22), ...P(0.55, 1.0));
  c.bezierCurveTo(...P(0.58, 0.85), ...P(0.42, 0.78), ...P(0.3, 0.86));        // the front roll
  c.bezierCurveTo(...P(0.45, 0.7), ...P(0.6, 0.55), ...P(0.56, 0.2));
  c.quadraticCurveTo(...P(0.5, 0.45), ...P(0.25, 0.52));                       // hairline over the forehead
  c.quadraticCurveTo(...P(-0.15, 0.6), ...P(-0.48, 0.42));
  c.closePath();
  const [gx, gy] = P(0.1, 1.05);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.8);
  g.addColorStop(0, '#4a505c'); g.addColorStop(0.35, '#16171b'); g.addColorStop(1, '#050506');
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(160,170,195,0.4)'; c.lineWidth = Math.max(1, fw * 0.01); c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {   // combed shine lines sweeping up and back
    c.beginPath(); c.moveTo(...P(-0.45 + i * 0.1, 0.5 + i * 0.01)); c.bezierCurveTo(...P(-0.4 + i * 0.1, 0.8), ...P(-0.1 + i * 0.08, 1.1), ...P(0.25 + i * 0.04, 1.16)); c.stroke();
  }
}

export default {
  name: 'Elvis',
  hint: 'Open your mouth to sing!',
  segment: 'mask',
  face(c, p, t, dt) {
    jumpsuit(c, p);
    pompadour(c, p);
    const I = jawI(p);
    if (I > 0) burst(p, 'note', I * 0.9, dt);
  },
};
