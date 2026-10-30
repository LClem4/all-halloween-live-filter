/* Drawing helpers shared by several filters: rays, the halo, glows and particles. */
import { W, H, TAU, FONT } from './core.js';

/* A point in the face's own frame: a across in face widths (right +), b up in face heights from the centre. */
export function facePt(p, a, b) {
  return [p.c[0] + p.right[0] * a * p.fw + p.up[0] * b * p.fh, p.c[1] + p.right[1] * a * p.fw + p.up[1] * b * p.fh];
}
export const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/* Small seeded random generator, so patterns (freckles, glass) stay the same every frame. */
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Pull colour out of everything drawn so far (0 = none, 1 = black and white). */
export function desaturate(c, amount) {
  c.save();
  c.globalCompositeOperation = 'saturation';
  c.globalAlpha = amount;
  c.fillStyle = '#808080'; c.fillRect(0, 0, W, H);
  c.restore();
}

/* A soft elliptical spot of colour (radial falloff), e.g. blush, contour shadow, highlight. */
export function softSpot(c, x, y, rx, ry, ang, rgb, a, op = 'source-over') {
  c.save();
  c.globalCompositeOperation = op;
  c.translate(x, y); c.rotate(ang); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.5, `rgba(${rgb},${a * 0.6})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
  c.restore();
}

/* Both eyes: centre, width (corner to corner), corners and how open they are (0 shut, ~0.3 open). */
export function eyeGeom(p) {
  const P = p.pts;
  const eye = (o, i, top, bot) => {
    const w = Math.hypot(P[o][0] - P[i][0], P[o][1] - P[i][1]) || 1;
    return { c: mix(P[o], P[i], 0.5), w, outer: P[o], inner: P[i], open: Math.hypot(P[top][0] - P[bot][0], P[top][1] - P[bot][1]) / w };
  };
  return [eye(33, 133, 159, 145), eye(263, 362, 386, 374)];
}

/* Where the head is pointing, roughly -1..1 on screen axes (from how far the nose tip sits off-centre). */
export function headDir(p) {
  const [e0, e1] = eyeGeom(p);
  const mid = mix(mix(e0.c, e1.c, 0.5), p.mouth, 0.45);
  const k = 2.2 / p.fw;
  return [Math.max(-1, Math.min(1, (p.nose[0] - mid[0]) * k)), Math.max(-1, Math.min(1, (p.nose[1] - mid[1]) * k))];
}

export function drawStar(c, x, y, r, rot, fill) {
  c.save();
  c.translate(x, y); c.rotate(rot);
  c.fillStyle = fill;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? r : r * 0.28;
    const a = (i * Math.PI) / 4;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath(); c.fill();
  c.restore();
}

/* Clip out the head so effects appear to sit behind it. */
export function clipHead(c, p) {
  const hx = p.c[0] + p.up[0] * p.fh * 0.12, hy = p.c[1] + p.up[1] * p.fh * 0.12;
  c.beginPath();
  c.rect(0, 0, W, H);
  c.ellipse(hx, hy, p.fw * 0.6, p.fh * 0.76, p.ang, 0, TAU);
  c.clip('evenodd');
}

export function rays(c, x, y, r, I, t, rgb = '255,215,120', behind = null) {
  if (I <= 0.01) return;
  c.save();
  if (behind) clipHead(c, behind);
  c.translate(x, y); c.rotate(t * 0.15);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, r * 0.05, 0, 0, r);
  g.addColorStop(0, `rgba(${rgb},${0.55 * I})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  const n = 18;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = a0 + (Math.PI / n) * 0.7;
    c.moveTo(0, 0); c.arc(0, 0, r, a0, a1); c.closePath();
  }
  c.fill();
  c.restore();
}

export function haloPos(p, lift = 0.55) {
  return [p.fore[0] + p.up[0] * p.fh * lift, p.fore[1] + p.up[1] * p.fh * lift];
}

/* A simple ring of light floating above the head, drawn whole (never tucked behind it):
   layered additive strokes for bloom, glow, core and hot centre, with a gentle bob. */
const HALO_PASSES = [
  [7, '255,190,80', 0.08], [3, '255,205,110', 0.18], [1.4, '255,230,160', 0.5], [0.45, '255,252,240', 0.95],
];
export function drawHalo(c, p, t, scale = 1, lift = 0.55) {
  const [hx, hy] = haloPos(p, lift + Math.sin(t * 1.4) * 0.015);
  const rx = p.fw * 0.42 * scale, ry = rx * 0.3;
  const lw = Math.max(1.5, p.fw * 0.03 * scale);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(hx, hy); c.rotate(p.ang);
  for (const [wm, rgb, a] of HALO_PASSES) {
    c.globalAlpha = a;
    c.strokeStyle = `rgb(${rgb})`;
    c.lineWidth = lw * wm;
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
  }
  c.restore();
}

export function topGlow(c, a) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(W / 2, -H * 0.15, 0, W / 2, -H * 0.15, H * 0.95);
  g.addColorStop(0, `rgba(255,244,215,${a})`);
  g.addColorStop(1, 'rgba(255,244,215,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

export function vignette(c, rgb, a) {
  c.save();
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

/* ---------- particles ---------- */
/* Types: sparkle, feather, ember, confetti, candy, coin, note (music), tear (from[2] = side to
   gush towards), and the falling-from-the-sky ones made by rain(): rose, shamrock. */
export const parts = [];
function makePart(p, type, from) {
  const u = p.fw, r = Math.random;
  const o = from || p.mouth;
  const x = o[0] + (r() - 0.5) * u * 0.15, y = o[1];
  if (type === 'note') {
    return { type, x, y, vx: (r() - 0.5) * u * 1.4, vy: -u * (0.5 + r() * 0.6), ay: -u * 0.1, drag: 0.8,
      life: 1.8 + r(), size: u * (0.08 + r() * 0.06), rot: (r() - 0.5) * 0.6, vr: (r() - 0.5) * 1.5, phase: r() * TAU, kind: (r() * 3) | 0, hue: (r() * 360) | 0 };
  }
  if (type === 'tear') {
    const side = (from && from[2]) || (r() < 0.5 ? -1 : 1);
    return { type, x: o[0], y: o[1], vx: side * u * (0.5 + r() * 0.9), vy: -u * (0.2 + r() * 0.6), ay: u * 2.4, drag: 0.2,
      life: 1.4, size: u * (0.025 + r() * 0.03), rot: 0, vr: 0 };
  }
  if (type === 'coin') {
    return { type, x, y, vx: (r() - 0.5) * u * 1.8, vy: -u * (0.5 + r() * 0.8), ay: u * 1.4, drag: 0.6,
      life: 2.2, size: u * (0.05 + r() * 0.02), rot: 0, vr: 0, phase: r() * TAU };
  }
  if (type === 'ember') {
    const life = 0.8 + r() * 0.9;
    return { type, x, y: y - r() * u * 0.3, vx: (r() - 0.5) * u * 0.5, vy: -u * (0.5 + r() * 0.7), ay: -u * 0.25, drag: 0.9,
      life, max: life, size: u * (0.007 + r() * 0.01), rot: 0, vr: 0, phase: r() * TAU };
  }
  if (type === 'confetti' || type === 'candy') {
    const life = 2 + r();
    return { type, x, y, vx: (r() - 0.5) * u * 2.2, vy: -u * (0.5 + r() * 0.9), ay: u * 1.1, drag: 0.9,
      life, size: u * (type === 'candy' ? 0.045 + r() * 0.025 : 0.02 + r() * 0.015), rot: r() * TAU, vr: (r() - 0.5) * 9,
      phase: r() * TAU, hue: (r() * 360) | 0, kind: (r() * 3) | 0 };
  }
  if (type === 'sparkle') {
    return { type, x, y, vx: (r() - 0.5) * u * 1.2, vy: -u * (0.4 + r() * 0.8), ay: u * 0.3, drag: 0.6,
      life: 1 + r() * 0.6, size: u * (0.025 + r() * 0.03), rot: r() * TAU, vr: (r() - 0.5) * 4 };
  }
  return { type: 'feather', x, y, vx: (r() - 0.5) * u * 1.6, vy: -u * (0.6 + r() * 0.6), ay: u * 0.9, drag: 1.6,
    term: u * 0.25, life: 2.2 + r(), size: u * (0.06 + r() * 0.04), rot: r() * TAU, vr: (r() - 0.5) * 3, phase: r() * TAU };
}
export function burst(p, type, I, dt, from) {
  let n = I * 40 * dt;
  while (n > 0) {
    if (Math.random() < n && parts.length < 300) parts.push(makePart(p, type, from));
    n -= 1;
  }
}
/* Things falling from the top of the screen (roses, shamrocks): `rate` per second. */
export function rain(type, rate, dt) {
  let n = rate * dt;
  const r = Math.random, u = Math.min(W, H) * 0.25;
  while (n > 0) {
    if (r() < n && parts.length < 300) {
      parts.push({ type, x: r() * W, y: -u * 0.1, vx: (r() - 0.5) * u * 0.3, vy: u * (0.3 + r() * 0.3), ay: 0, drag: 0,
        life: H / (u * 0.3) + 1, size: u * (0.14 + r() * 0.08), rot: r() * TAU, vr: (r() - 0.5) * 2, phase: r() * TAU });
    }
    n -= 1;
  }
}
export function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i];
    q.life -= dt;
    if (q.life <= 0) { parts.splice(i, 1); continue; }
    q.vx *= 1 - q.drag * dt;
    q.vy += q.ay * dt;
    if (q.term && q.vy > q.term) q.vy = q.term;
    q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
    if (q.type === 'feather' || q.type === 'rose' || q.type === 'shamrock') q.x += Math.cos(q.phase + q.life * 3) * q.size * 2.5 * dt;
    else if (q.type === 'note') q.x += Math.sin(q.phase + q.life * 5) * q.size * 3 * dt;
    if (q.y > H + q.size * 2) q.life = 0;
    else if (q.type === 'ember') q.x += Math.sin(q.phase + q.life * 9) * q.size * 12 * dt;
  }
}
export function drawParts(c) {
  for (const q of parts) {
    c.globalAlpha = Math.min(1, q.life / 0.6);
    if (q.type === 'sparkle') {
      drawStar(c, q.x, q.y, q.size, q.rot, '#fff2b0');
    } else if (q.type === 'ember') {
      const k = q.life / q.max;
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgb(255,${(90 + 150 * k) | 0},${(30 + 90 * k * k) | 0})`;
      c.beginPath(); c.arc(q.x, q.y, q.size * (0.6 + 0.4 * k), 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
    } else if (q.type === 'confetti') {
      c.save();
      c.translate(q.x, q.y); c.rotate(q.rot); c.scale(1, Math.cos(q.phase + q.life * 8));   // tumbling
      c.fillStyle = `hsl(${q.hue},90%,60%)`;
      c.fillRect(-q.size, -q.size * 0.5, q.size * 2, q.size);
      c.restore();
    } else if (q.type === 'candy') {
      drawCandy(c, q);
    } else if (q.type === 'note') {
      c.save();
      c.translate(q.x, q.y); c.rotate(q.rot);
      c.font = `700 ${q.size}px ${FONT}, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = q.size * 0.2;
      c.fillStyle = `hsl(${q.hue},80%,72%)`;
      c.fillText(['♪', '♫', '♬'][q.kind], 0, 0);
      c.restore();
    } else if (q.type === 'tear') {
      c.save();
      c.translate(q.x, q.y); c.rotate(Math.atan2(q.vy, q.vx) - Math.PI / 2);   // point back along the flight path
      c.fillStyle = 'rgba(150,205,255,0.9)';
      c.beginPath(); c.moveTo(0, -q.size * 1.8); c.quadraticCurveTo(q.size, 0, 0, q.size); c.quadraticCurveTo(-q.size, 0, 0, -q.size * 1.8); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(-q.size * 0.3, 0, q.size * 0.25, 0, TAU); c.fill();
      c.restore();
    } else if (q.type === 'coin') {
      c.save();
      c.translate(q.x, q.y); c.scale(Math.cos(q.phase + q.life * 7), 1);   // spinning
      c.fillStyle = '#e8b62c'; c.beginPath(); c.arc(0, 0, q.size, 0, TAU); c.fill();
      c.strokeStyle = '#9c6f10'; c.lineWidth = q.size * 0.15; c.stroke();
      c.fillStyle = '#fff1a8'; c.beginPath(); c.arc(-q.size * 0.3, -q.size * 0.3, q.size * 0.25, 0, TAU); c.fill();
      c.restore();
    } else if (q.type === 'rose') {
      c.save();
      c.translate(q.x, q.y); c.rotate(q.rot); c.scale(1, 0.6 + 0.4 * Math.cos(q.phase + q.life * 3));
      c.fillStyle = '#d6264b';
      c.beginPath(); c.moveTo(0, -q.size * 0.5); c.bezierCurveTo(q.size * 0.6, -q.size * 0.6, q.size * 0.5, q.size * 0.4, 0, q.size * 0.5);
      c.bezierCurveTo(-q.size * 0.5, q.size * 0.4, -q.size * 0.6, -q.size * 0.6, 0, -q.size * 0.5); c.fill();
      c.fillStyle = 'rgba(255,170,190,0.5)'; c.beginPath(); c.ellipse(-q.size * 0.12, -q.size * 0.1, q.size * 0.12, q.size * 0.25, 0.3, 0, TAU); c.fill();
      c.restore();
    } else if (q.type === 'shamrock') {
      c.save();
      c.translate(q.x, q.y); c.rotate(q.rot);
      c.fillStyle = '#2f9e44';
      for (let i = 0; i < 3; i++) {
        c.save(); c.rotate((i / 3) * TAU);
        c.beginPath(); c.arc(-q.size * 0.13, -q.size * 0.3, q.size * 0.18, 0, TAU); c.arc(q.size * 0.13, -q.size * 0.3, q.size * 0.18, 0, TAU); c.fill();
        c.restore();
      }
      c.strokeStyle = '#2f9e44'; c.lineWidth = q.size * 0.08; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(q.size * 0.1, q.size * 0.4, q.size * 0.25, q.size * 0.6); c.stroke();
      c.restore();
    } else {
      c.save();
      c.translate(q.x, q.y); c.rotate(q.rot);
      c.fillStyle = 'rgba(255,255,255,0.95)';
      c.beginPath(); c.ellipse(0, 0, q.size, q.size * 0.32, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(175,178,205,0.85)'; c.lineWidth = Math.max(1, q.size * 0.05);
      c.beginPath(); c.moveTo(-q.size, 0); c.lineTo(q.size * 0.9, 0); c.stroke();
      c.restore();
    }
  }
  c.globalAlpha = 1;
}

/* Three sweets (q.kind 0-2): a wrapped candy, a peppermint swirl and a gumdrop, at q.x, q.y,
   size q.size, turned q.rot, coloured q.hue. */
export function drawCandy(c, q) {
  const s = q.size;
  c.save();
  c.translate(q.x, q.y); c.rotate(q.rot);
  if (q.kind === 0) {
    c.fillStyle = `hsl(${q.hue},80%,55%)`;
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.6, 0); c.lineTo(d * s * 1.25, -s * 0.45); c.lineTo(d * s * 1.25, s * 0.45); c.closePath(); c.fill(); }
    c.beginPath(); c.ellipse(0, 0, s * 0.7, s * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.ellipse(-s * 0.2, -s * 0.18, s * 0.3, s * 0.1, -0.3, 0, TAU); c.fill();
  } else if (q.kind === 1) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, s * 0.6, 0, TAU); c.fill();
    c.fillStyle = '#e0283c';
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s * 0.6, (i / 6) * TAU, (i / 6) * TAU + 0.45); c.closePath(); c.fill(); }
  } else {
    c.fillStyle = `hsl(${q.hue},85%,50%)`;
    c.beginPath(); c.moveTo(-s * 0.55, s * 0.35); c.quadraticCurveTo(-s * 0.55, -s * 0.5, 0, -s * 0.5); c.quadraticCurveTo(s * 0.55, -s * 0.5, s * 0.55, s * 0.35); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc((i - 2) * s * 0.18, -s * 0.1 + (i % 2) * s * 0.2, s * 0.04, 0, TAU); c.fill(); }
  }
  c.restore();
}

/* A gold ribbon banner across the top with a name on it (used for the saints). */
export function caption(c, text) {
  const size = Math.round(Math.min(W, H) * 0.045);
  c.save();
  c.font = `700 ${size}px ${FONT}`;
  const tw = c.measureText(text).width, w = tw + size * 2.4, h = size * 1.6, x = W / 2, y = size * 1.4;
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#f6dc8c'); g.addColorStop(0.5, '#d9a93c'); g.addColorStop(1, '#a8781e');
  c.fillStyle = g;
  c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = size * 0.4;
  c.beginPath();
  c.moveTo(x - w / 2 - size * 0.6, y - h / 2); c.lineTo(x + w / 2 + size * 0.6, y - h / 2);
  c.lineTo(x + w / 2, y); c.lineTo(x + w / 2 + size * 0.6, y + h / 2);
  c.lineTo(x - w / 2 - size * 0.6, y + h / 2); c.lineTo(x - w / 2, y); c.closePath();
  c.fill();
  c.shadowBlur = 0;
  c.fillStyle = '#3b1f05'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, x, y + size * 0.05);
  c.restore();
}
