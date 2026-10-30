/* Disco: a big afro and round tinted hippie glasses on everyone, in a dark club. A big spinning
   mirror ball throws flecks of light over the whole room, coloured beams sweep out of it, two
   spotlights swing in from the top corners and colour washes roam about, all pulsing to a
   120 bpm beat. */
import { W, H, TAU, drawVideo } from '../core.js';
import { facePt, rng, drawStar } from '../fx.js';
import { glasses } from '../props.js';

const BPM = 120;
const beat = (t) => (1 - ((t * BPM) / 60) % 1) ** 3;   // 1 on each beat, dying away
const BALL_X = 0.8, BALL_Y = 0.1;   // the ball hangs off to one side, clear of faces
const r0 = rng(77);
const FLECKS = Array.from({ length: 90 }, () => ({ lat: (r0() - 0.5) * 2.2, lon: r0() * TAU, s: 0.6 + r0() * 0.8, hue: (r0() * 360) | 0 }));

function afro(c, p, t) {
  const fw = p.fw, fh = p.fh, [cx, cy] = facePt(p, 0, 0.45), rx = fw * 0.95, ry = fh * 0.85;
  c.save();
  // keep the face clear
  c.beginPath(); c.rect(-1e4, -1e4, 2e4, 2e4);
  p.oval.forEach(([x, y], i) => { const X = p.c[0] + (x - p.c[0]) * 1.02, Y = p.c[1] + (y - p.c[1]) * 1.02; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
  c.closePath(); c.clip('evenodd');
  c.translate(cx, cy); c.rotate(p.ang);
  const r = rng(13);
  c.fillStyle = '#3d2716';
  c.beginPath(); c.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, 0, TAU); c.fill();
  for (let i = 0; i < 50; i++) {   // fluffy edge
    const a = (i / 50) * TAU, k = 0.85 + r() * 0.12, rr = fw * (0.14 + r() * 0.08);
    c.beginPath(); c.arc(Math.cos(a) * rx * k, Math.sin(a) * ry * k, rr, 0, TAU); c.fill();
  }
  c.fillStyle = 'rgba(150,105,70,0.45)';
  for (let i = 0; i < 170; i++) {   // texture
    const a = r() * TAU, d = Math.sqrt(r());
    c.beginPath(); c.arc(Math.cos(a) * rx * d, Math.sin(a) * ry * d, fw * 0.012, 0, TAU); c.fill();
  }
  // coloured rim light from the club lights
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, rx * 0.6, 0, 0, rx * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, `hsla(${(t * 90) % 360},100%,60%,${0.12 + 0.14 * beat(t)})`);
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx * 1.05, ry * 1.05, 0, 0, TAU); c.fill();
  c.restore();
}

function mirrorBall(c, t) {
  const m = Math.min(W, H), x = W * BALL_X, y = H * BALL_Y, r = m * 0.075;
  c.strokeStyle = '#888'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y - r); c.stroke();
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  c.fillStyle = '#9aa0a8'; c.fillRect(x - r, y - r, r * 2, r * 2);
  const n = 12;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const lit = Math.max(0, Math.sin(t * 5 + i * 1.7 + j * 2.3)) ** 6;
    c.fillStyle = `hsl(${(i * 40 + j * 25 + t * 80) % 360},45%,${55 + lit * 45}%)`;
    c.fillRect(x - r + (i * 2 * r) / n + 1, y - r + (j * 2 * r) / n + 1, (2 * r) / n - 2, (2 * r) / n - 2);
  }
  const sh = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);   // make it read as a sphere
  sh.addColorStop(0, 'rgba(255,255,255,0.35)'); sh.addColorStop(0.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = sh; c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {   // glints twinkling on the ball
    const k = Math.max(0, Math.sin(t * 3 + i * 2.1));
    drawStar(c, x + Math.cos(i * 2.4) * r * 0.55, y + Math.sin(i * 2.4) * r * 0.55, r * 0.55 * k, t * 0.5, 'rgba(255,255,255,0.9)');
  }
  c.restore();
}

export default {
  name: 'Disco',
  base(c) {
    drawVideo(c);
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(95,85,125)'; c.fillRect(0, 0, W, H); c.restore();
  },
  face(c, p, t) {
    afro(c, p, t);
    const f = glasses(c, p, 'hippie');
    c.save(); c.globalCompositeOperation = 'lighter';   // the lights catch the lenses
    const [lx, ly] = f.lens[(Math.floor(t * 2) % 2)];
    drawStar(c, lx - f.d * 0.15, ly - f.d * 0.15, f.d * 0.18 * beat(t), t, 'rgba(255,255,255,0.9)');
    c.restore();
  },
  overlay(c, t) {
    const m = Math.min(W, H), b = beat(t), bx = W * BALL_X, by = H * BALL_Y, len = Math.hypot(W, H);
    c.save();
    c.globalCompositeOperation = 'lighter';
    // colour wash that changes on every beat
    c.fillStyle = `hsla(${(Math.floor((t * BPM) / 60) * 67) % 360},100%,55%,${0.05 + 0.08 * b})`; c.fillRect(0, 0, W, H);
    // beams from the ball
    for (let i = 0; i < 12; i++) {
      const a = t * 0.9 + (i / 12) * TAU, hue = (i * 30 + t * 60) % 360;
      const g = c.createLinearGradient(bx, by, bx + Math.cos(a) * len, by + Math.abs(Math.sin(a)) * len);
      g.addColorStop(0, `hsla(${hue},100%,60%,${0.3 + 0.2 * b})`); g.addColorStop(1, `hsla(${hue},100%,60%,0)`);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(bx, by);
      c.lineTo(bx + Math.cos(a - 0.05) * len, by + Math.abs(Math.sin(a - 0.05)) * len);
      c.lineTo(bx + Math.cos(a + 0.05) * len, by + Math.abs(Math.sin(a + 0.05)) * len);
      c.closePath(); c.fill();
    }
    // spotlights swinging in from the top corners
    for (const [sx, hue, ph] of [[0, 300, 0], [W, 185, 2]]) {
      const a = Math.atan2(H, W / 2 - sx) + Math.sin(t * 0.8 + ph) * 0.45;
      const g = c.createLinearGradient(sx, 0, sx + Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, `hsla(${hue},100%,65%,${0.4 + 0.2 * b})`); g.addColorStop(1, `hsla(${hue},100%,65%,0)`);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(sx, 0);
      c.lineTo(sx + Math.cos(a - 0.12) * len, Math.sin(a - 0.12) * len); c.lineTo(sx + Math.cos(a + 0.12) * len, Math.sin(a + 0.12) * len);
      c.closePath(); c.fill();
    }
    // roaming spots
    for (let i = 0; i < 6; i++) {
      const x = W * (0.5 + 0.45 * Math.sin(t * (0.5 + i * 0.13) + i * 2)), y = H * (0.55 + 0.4 * Math.sin(t * (0.6 + i * 0.11) + i));
      const g = c.createRadialGradient(x, y, 0, x, y, m * 0.3);
      g.addColorStop(0, `hsla(${(i * 60 + t * 70) % 360},100%,55%,${0.3 + 0.2 * b})`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
      c.fillStyle = g; c.fillRect(x - m * 0.3, y - m * 0.3, m * 0.6, m * 0.6);
    }
    // flecks of light thrown round the room by the turning ball
    for (const f of FLECKS) {
      const lon = f.lon + t * 0.6, z = Math.cos(f.lat) * Math.cos(lon);
      if (z <= 0.05) continue;
      const x = W * (0.5 + 0.62 * Math.cos(f.lat) * Math.sin(lon)), y = H * (0.18 + 0.82 * (0.5 + 0.5 * Math.sin(f.lat) / Math.sin(1.1)));
      const s = m * 0.007 * f.s;
      c.fillStyle = `hsla(${f.hue},70%,80%,${0.25 * z})`; c.beginPath(); c.arc(x, y, s * 2.6, 0, TAU); c.fill();
      c.fillStyle = `rgba(255,255,255,${0.85 * z})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
    }
    c.restore();
    mirrorBall(c, t);
  },
};
