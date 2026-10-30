/* St. Francis Xavier, Jesuit missionary to India and Japan: a black Jesuit cassock with a white
   collar, his heart aflame with love of God on his chest, a cross held at his side and a halo. Behind him (background swap) a dawn sea with a mountain on the far shore,
   gulls, and a ship with red crosses on its sails sailing past. Along the bottom scuttles the crab
   of his legend, carrying back the crucifix he lost at sea. */
import { W, H, TAU, drawVideo } from '../core.js';
import { facePt, drawHalo, caption, topGlow } from '../fx.js';
import { drawOutfit, fillBody, heartPath } from '../props.js';
import { personReady } from '../segment.js';

const HZ = 0.6;   // horizon, fraction of the screen
let sea = null;
function build() {
  sea = document.createElement('canvas'); sea.width = W; sea.height = H;
  const c = sea.getContext('2d'), hz = H * HZ;
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#2c3e70'); g.addColorStop(0.55, '#c98a98'); g.addColorStop(1, '#ffd59a');
  c.fillStyle = g; c.fillRect(0, 0, W, hz);
  const sun = c.createRadialGradient(W * 0.22, hz - H * 0.03, 0, W * 0.22, hz - H * 0.03, H * 0.3);
  sun.addColorStop(0, 'rgba(255,250,220,1)'); sun.addColorStop(0.12, 'rgba(255,225,150,0.9)'); sun.addColorStop(1, 'rgba(255,200,140,0)');
  c.fillStyle = sun; c.fillRect(0, 0, W, hz);
  // the far shore: a snow-capped mountain and low hills
  c.fillStyle = '#6d5a78';
  c.beginPath(); c.moveTo(W * 0.55, hz);
  c.lineTo(W * 0.74, hz - H * 0.16); c.lineTo(W * 0.8, hz - H * 0.165); c.lineTo(W * 1.0, hz - H * 0.02); c.lineTo(W, hz); c.closePath(); c.fill();
  c.fillStyle = '#f4eef2';
  c.beginPath(); c.moveTo(W * 0.715, hz - H * 0.13); c.lineTo(W * 0.74, hz - H * 0.16); c.lineTo(W * 0.8, hz - H * 0.165);
  c.lineTo(W * 0.83, hz - H * 0.13); c.lineTo(W * 0.8, hz - H * 0.14); c.lineTo(W * 0.77, hz - H * 0.125); c.lineTo(W * 0.745, hz - H * 0.14); c.closePath(); c.fill();
  c.fillStyle = '#5a4a66';
  c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W * 0.4; x += W / 40) c.lineTo(x, hz - H * (0.015 + 0.012 * Math.sin(x * 0.02))); c.lineTo(W * 0.4, hz); c.fill();
  const sg = c.createLinearGradient(0, hz, 0, H);
  sg.addColorStop(0, '#5f84a8'); sg.addColorStop(1, '#173a5e');
  c.fillStyle = sg; c.fillRect(0, hz, W, H - hz);
  for (let i = 0; i < 60; i++) {   // the sun's path on the water
    const y = hz + (H - hz) * (i / 60) ** 1.4, w = W * (0.02 + 0.1 * (i / 60)) * (0.5 + Math.random());
    c.fillStyle = `rgba(255,225,160,${0.5 * (1 - i / 60)})`; c.fillRect(W * 0.22 - w / 2 + (Math.random() - 0.5) * W * 0.03, y, w, Math.max(1, H * 0.003));
  }
}

function waves(c, t) {
  const hz = H * HZ;
  c.strokeStyle = 'rgba(220,235,255,0.35)'; c.lineWidth = Math.max(1, H * 0.003);
  for (let i = 1; i < 12; i++) {
    const y = hz + (H - hz) * (i / 12) ** 1.6, amp = H * 0.004 * (1 + i * 0.3), ph = t * (0.8 + i * 0.05) + i * 1.7;
    c.beginPath();
    for (let x = 0; x <= W; x += W / 30) c.lineTo(x, y + Math.sin(x * 0.015 / (1 + i * 0.15) + ph) * amp);
    c.stroke();
  }
}

/* A carrack: dark hull, three masts, square white sails with red crosses. */
function ship(c, t) {
  const m = Math.min(W, H), s = m * 0.11, k = (t / 45) % 1;
  const x = W * (-0.15 + 1.3 * k), y = H * HZ + s * 0.12 + Math.sin(t * 1.4) * s * 0.03;
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.1) * 0.03); c.scale(s, s);
  c.fillStyle = '#3a2616';
  c.beginPath(); c.moveTo(-0.75, -0.25); c.lineTo(0.85, -0.3); c.lineTo(0.62, 0); c.quadraticCurveTo(0, 0.08, -0.55, 0); c.closePath(); c.fill();
  c.fillStyle = '#5a3a20'; c.fillRect(-0.72, -0.4, 0.3, 0.16); c.fillRect(0.5, -0.38, 0.28, 0.1);   // castles fore and aft
  c.strokeStyle = '#2a1a0e'; c.lineWidth = 0.035;
  for (const [mx, mh, sw] of [[-0.35, 0.9, 0.36], [0.12, 1.15, 0.46], [0.55, 0.75, 0.3]]) {
    c.beginPath(); c.moveTo(mx, -0.25); c.lineTo(mx, -0.25 - mh); c.stroke();
    for (const [top, hgt, w] of [[-0.25 - mh * 0.9, mh * 0.38, sw * 0.75], [-0.25 - mh * 0.5, mh * 0.42, sw]]) {
      c.fillStyle = '#f3ead6';
      c.beginPath(); c.moveTo(mx - w / 2, top); c.lineTo(mx + w / 2, top);
      c.quadraticCurveTo(mx + w * 0.62, top + hgt * 0.5, mx + w / 2, top + hgt); c.lineTo(mx - w / 2, top + hgt);
      c.quadraticCurveTo(mx - w * 0.38, top + hgt * 0.5, mx - w / 2, top); c.fill();
      if (w === sw) {
        c.fillStyle = '#b3202c';
        c.fillRect(mx - w * 0.06, top + hgt * 0.15, w * 0.12, hgt * 0.7); c.fillRect(mx - w * 0.28, top + hgt * 0.38, w * 0.56, hgt * 0.12);
      }
    }
  }
  c.restore();
}

function gulls(c, t) {
  const m = Math.min(W, H);
  c.strokeStyle = '#3b3346'; c.lineWidth = Math.max(1.5, m * 0.004); c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = W * (((t * (0.02 + i * 0.006) + i * 0.37) % 1.2) - 0.1), y = H * (0.15 + i * 0.08) + Math.sin(t * 0.9 + i * 2) * H * 0.02;
    const s = m * (0.025 - i * 0.004), f = Math.sin(t * 6 + i * 2) * 0.5;
    c.beginPath(); c.moveTo(x - s, y - s * (0.3 + f)); c.quadraticCurveTo(x - s * 0.4, y - s * 0.4, x, y); c.quadraticCurveTo(x + s * 0.4, y - s * 0.4, x + s, y - s * (0.3 + f)); c.stroke();
  }
}

/* His heart aflame with the love of God, on the chest. */
function flamingHeart(c, p, t) {
  const fw = p.fw, [x, y] = facePt(p, -0.24, -1.6), s = fw * 0.32;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const glow = c.createRadialGradient(x, y - s * 0.3, 0, x, y - s * 0.3, s * 1.6);
  glow.addColorStop(0, 'rgba(255,170,70,0.55)'); glow.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = glow; c.beginPath(); c.arc(x, y - s * 0.3, s * 1.6, 0, TAU); c.fill();
  c.restore();
  c.save(); c.translate(x, y); c.rotate(p.ang); c.translate(-x, -y);
  for (let i = 0; i < 3; i++) {   // flames rising from the top of the heart
    const fx = x + (i - 1) * s * 0.16, h = s * (0.6 + 0.25 * Math.sin(t * 9 + i * 2)) * (i === 1 ? 1.25 : 0.85), lean = Math.sin(t * 5 + i) * s * 0.06;
    const g = c.createLinearGradient(fx, y - s * 0.2, fx, y - s * 0.2 - h);
    g.addColorStop(0, '#ff7a1a'); g.addColorStop(0.6, '#ffc23a'); g.addColorStop(1, 'rgba(255,240,170,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(fx - s * 0.12, y - s * 0.15);
    c.quadraticCurveTo(fx - s * 0.14, y - s * 0.2 - h * 0.6, fx + lean, y - s * 0.2 - h);
    c.quadraticCurveTo(fx + s * 0.14, y - s * 0.2 - h * 0.6, fx + s * 0.12, y - s * 0.15); c.closePath(); c.fill();
  }
  heartPath(c, x, y, s);
  const hg = c.createRadialGradient(x - s * 0.12, y - s * 0.12, 0, x, y, s * 0.55);
  hg.addColorStop(0, '#ff5a5a'); hg.addColorStop(1, '#a3101c');
  c.fillStyle = hg; c.fill();
  c.strokeStyle = '#e2b84a'; c.lineWidth = fw * 0.018; c.stroke();
  c.restore();
}

/* A plain wooden cross held at the side, with gold ends. */
function cross(c, p) {
  const fw = p.fw, [x, y] = facePt(p, 1.15, -1.25);
  c.save(); c.translate(x, y); c.rotate(p.ang + 0.12);
  const w = fw * 0.07;
  c.fillStyle = '#6b4423';
  c.fillRect(-w / 2, -fw * 0.7, w, fw * 1.5); c.fillRect(-fw * 0.3, -fw * 0.42, fw * 0.6, w);
  c.fillStyle = '#e2b84a';
  for (const [cx, cy] of [[0, -fw * 0.7], [0, fw * 0.8], [-fw * 0.3, -fw * 0.42 + w / 2], [fw * 0.3, -fw * 0.42 + w / 2]]) { c.beginPath(); c.arc(cx, cy, w * 0.6, 0, TAU); c.fill(); }
  c.restore();
}

/* The crab that carried his crucifix back out of the sea, scuttling along the bottom. */
function crab(c, t) {
  const m = Math.min(W, H), s = m * 0.09, x = W * (0.5 + 0.4 * Math.sin(t * 0.22)), y = H - s * 0.45;
  const walk = t * 12;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#b8381a'; c.lineCap = 'round'; c.lineWidth = 0.07;
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {   // legs
    const ph = Math.sin(walk + i * 2 + (sd > 0 ? 1 : 0)) * 0.12;
    c.beginPath(); c.moveTo(sd * 0.3, 0.05 + i * 0.06); c.lineTo(sd * (0.6 + i * 0.05), -0.05 + i * 0.08 + ph); c.lineTo(sd * (0.72 + i * 0.06), 0.3 + ph * 0.5); c.stroke();
  }
  // claws raised, holding the cross between them
  c.fillStyle = '#e2b84a';
  c.fillRect(-0.035, -1.05, 0.07, 0.75); c.fillRect(-0.2, -0.85, 0.4, 0.07);
  c.lineWidth = 0.09;
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(sd * 0.25, -0.05); c.quadraticCurveTo(sd * 0.4, -0.35, sd * 0.12, -0.55); c.stroke();
    c.fillStyle = '#d4471f'; c.beginPath(); c.ellipse(sd * 0.1, -0.6, 0.1, 0.13, sd * 0.4, 0, TAU); c.fill();
  }
  c.fillStyle = '#d4471f'; c.beginPath(); c.ellipse(0, 0.02, 0.42, 0.26, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,200,170,0.35)'; c.beginPath(); c.ellipse(-0.1, -0.07, 0.2, 0.08, -0.2, 0, TAU); c.fill();
  for (const sd of [-1, 1]) {   // eyes on stalks
    c.strokeStyle = '#b8381a'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(sd * 0.1, -0.18); c.lineTo(sd * 0.13, -0.32); c.stroke();
    c.fillStyle = '#111'; c.beginPath(); c.arc(sd * 0.13, -0.34, 0.05, 0, TAU); c.fill();
  }
  c.restore();
}

export default {
  name: 'St. Francis Xavier',
  segment: 'cutout',
  base(c, t) {
    if (!personReady()) { drawVideo(c); return; }
    if (!sea || sea.width !== W || sea.height !== H) build();
    c.drawImage(sea, 0, 0);
    gulls(c, t);
    ship(c, t);
    waves(c, t);
  },
  face(c, p, t) {
    const P = (a, b) => facePt(p, a, b), fw = p.fw;
    drawOutfit(c, p, (o) => fillBody(o, p, '#111114'), undefined, 0.2);   // black Jesuit cassock
    c.beginPath(); c.moveTo(...P(-0.34, -0.7)); c.quadraticCurveTo(...P(0, -0.9), ...P(0.34, -0.7));   // white collar
    c.lineTo(...P(0.35, -0.75)); c.quadraticCurveTo(...P(0, -0.96), ...P(-0.35, -0.75)); c.closePath();
    c.fillStyle = '#f2f0e8'; c.fill();
    flamingHeart(c, p, t);
    cross(c, p);
    drawHalo(c, p, t);
  },
  overlay(c, t) {
    topGlow(c, 0.12);
    if (personReady()) crab(c, t);
    caption(c, 'St. Francis Xavier');
  },
};
