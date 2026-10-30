/* Wearable props shared by several filters: glasses, mustaches, outfits fitted to the
   body, mitres, veils, wings, friars' habits, beards. All sized from the face so they scale and
   tilt with it. */
import { W, H, TAU, drawVideo } from './core.js';
import { facePt, mix } from './fx.js';
import { personMask } from './segment.js';

/* ---------- glasses ----------
   Each style's front is drawn once into a sprite. It is then placed as a flat 3D object in front
   of the eyes, using the landmarks' depth to work out which way the head faces, so it tilts and
   foreshortens properly as the head turns. The arms are drawn live from the hinges back to the
   ears; the far arm fades out as the head turns enough to hide it. Sprite units: 1 = the distance
   between the eye centres, lenses centred at x = -0.5 and +0.5, y down. */
const SPRITE_PX = 200, SPRITE_W = 3, SPRITE_H = 1.6;   // px per unit; sprite size in units
const FWD = 0.2;   // how far the frame sits in front of the eyes, in eye spacings
const sprites = {};
const steady = new WeakMap();

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const pt3 = (p, i) => [p.pts[i][0], p.pts[i][1], p.z ? p.z[i] : 0];

/* The head's frame at the eyes: centre C between the eyes, unit axes R (towards the eye on the
   screen's right), U (up the face) and F (out of the face, towards the camera), eye spacing d
   (3D, so it doesn't shrink when the head turns), and the ears in that frame. The position is
   smoothed a lot while the head is still and hardly at all when it moves fast; the ears are a
   fixed part of the head, so they are smoothed heavily. at(u, v, w) gives a screen point for
   sprite units (u right, v down, w forward). lens: the two lens centres on screen; ang: tilt. */
export function glassesFrame(p) {
  const eye = (o, i) => lerp3(pt3(p, o), pt3(p, i), 0.5);
  let a = eye(33, 133), b = eye(263, 362);
  // order the eyes by screen side (the picture is mirrored)
  if ((b[0] - a[0]) * p.right[0] + (b[1] - a[1]) * p.right[1] < 0) [a, b] = [b, a];
  const C = lerp3(a, b, 0.5), R = norm(sub(b, a)), d = Math.hypot(...sub(b, a)) || 1;
  const u0 = sub(pt3(p, 10), pt3(p, 152)), U = norm(sub(u0, R.map((v) => v * dot(u0, R))));
  let ea = lerp3(pt3(p, 127), pt3(p, 162), 0.25), eb = lerp3(pt3(p, 356), pt3(p, 389), 0.25);   // the top of each ear
  if (dot(sub(eb, ea), R) < 0) [ea, eb] = [eb, ea];
  const F = facing(R, U);
  const local = (e) => { const q = sub(e, C); return [dot(q, R) / d, dot(q, U) / d, dot(q, F) / d]; };
  let s = steady.get(p);
  if (!s) steady.set(p, (s = { C, R, U, d, ears: [local(ea), local(eb)] }));
  else {
    const k = Math.min(1, 0.3 + Math.hypot(C[0] - s.C[0], C[1] - s.C[1]) / s.d * 5);
    s.C = lerp3(s.C, C, k); s.R = norm(lerp3(s.R, R, k));
    const uu = lerp3(s.U, U, k); s.U = norm(sub(uu, s.R.map((v) => v * dot(uu, s.R))));
    s.d += (d - s.d) * k * 0.5;
    s.ears = s.ears.map((e, i) => lerp3(e, local(i ? eb : ea), 0.08));
  }
  s.F = facing(s.R, s.U);
  s.at = (u, v, w = 0) => [0, 1].map((i) => s.C[i] + (s.R[i] * u - s.U[i] * v + s.F[i] * w) * s.d);
  s.ear = (i) => s.at(s.ears[i][0], -s.ears[i][1], s.ears[i][2]);
  s.lens = [s.at(-0.5, 0), s.at(0.5, 0)];
  s.ang = Math.atan2(s.R[1], s.R[0]);
  return s;
}
/* Out of the face: perpendicular to R and U, on the camera's side (smaller z is nearer). */
function facing(R, U) { const f = cross(R, U); return f[2] > 0 ? f.map((v) => -v) : f; }

/* Draw glasses on a face. style: 'wayfarer' (dark sunglasses), 'aviator', 'nerd', 'hippie'.
   Pass f if you already called glassesFrame(p) this frame (it smooths on every call). */
export function glasses(c, p, style, f = glassesFrame(p)) {
  const img = sprite(style), { arm, lw, hinge: [hx, hy] } = ARMS[style];
  // arms first, so the front covers the hinges; the farther ear's arm fades as it goes behind the head
  const z = f.ears.map((e) => f.R[2] * e[0] + f.U[2] * e[1] + f.F[2] * e[2]), far = z[0] > z[1] ? 0 : 1;   // depth from the camera
  const hide = Math.min(1, Math.max(0, (Math.abs(z[0] - z[1]) - 0.45) / 0.55));
  c.save();
  c.strokeStyle = arm; c.lineCap = 'round'; c.lineWidth = Math.max(1.5, lw * f.d);
  for (const i of [0, 1]) {
    c.globalAlpha = i === far ? 1 - hide : 1;
    if (c.globalAlpha <= 0.02) continue;
    const h = f.at(i ? hx : -hx, hy, FWD), e = f.ear(i);
    c.beginPath(); c.moveTo(...h); c.lineTo(...e); c.stroke();
  }
  c.globalAlpha = 1;
  const o = f.at(0, 0, FWD), k = f.d / SPRITE_PX;
  c.transform(f.R[0] * k, f.R[1] * k, -f.U[0] * k, -f.U[1] * k, o[0], o[1]);
  c.drawImage(img, -img.width / 2, -img.height / 2);
  c.restore();
  return f;
}
/* Per style: arm colour, arm thickness and where the hinge is on the front (sprite units). */
const ARMS = {
  wayfarer: { arm: '#0b0b0b', lw: 0.075, hinge: [0.93, -0.3] },
  aviator: { arm: '#c9a54a', lw: 0.03, hinge: [0.92, -0.27] },
  nerd: { arm: '#111', lw: 0.09, hinge: [0.88, -0.27] },
  hippie: { arm: '#e0b24a', lw: 0.035, hinge: [0.94, -0.12] },
};

function sprite(style) {
  if (sprites[style]) return sprites[style];
  const cv = document.createElement('canvas');
  cv.width = SPRITE_W * SPRITE_PX; cv.height = SPRITE_H * SPRITE_PX;
  const g = cv.getContext('2d');
  g.translate(cv.width / 2, cv.height / 2); g.scale(SPRITE_PX, SPRITE_PX);
  STYLES[style](g);
  return (sprites[style] = cv);
}

/* Calls lens(g, side) in each lens's own frame (1 unit = lens width w, centred, slightly above the
   eye), then draws the bridge. */
function frame(g, w, lens, col, lw, double = false) {
  for (const side of [-1, 1]) {
    g.save(); g.translate(side * 0.5, -w * 0.05); g.scale(w, w);
    lens(g, side);
    g.restore();
  }
  const inner = 0.5 - w * 0.5;
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-inner, -w * 0.15); g.quadraticCurveTo(0, -w * 0.27, inner, -w * 0.15); g.stroke();
  if (double) { g.beginPath(); g.moveTo(-inner, -w * 0.35); g.lineTo(inner, -w * 0.35); g.stroke(); }
}

const STYLES = {
  /* Dark wayfarer sunglasses with a sheen. */
  wayfarer(g) {
    frame(g, 0.92, (g) => {
      g.beginPath();
      g.moveTo(-0.5, -0.32); g.lineTo(0.5, -0.36);
      g.quadraticCurveTo(0.52, 0.2, 0.3, 0.3); g.lineTo(-0.3, 0.3);
      g.quadraticCurveTo(-0.52, 0.2, -0.5, -0.32); g.closePath();
      const gr = g.createLinearGradient(0, -0.35, 0, 0.3);
      gr.addColorStop(0, '#2a2a30'); gr.addColorStop(1, '#050507');
      g.fillStyle = gr; g.fill();
      g.lineWidth = 0.08; g.strokeStyle = '#0b0b0b'; g.stroke();
      g.save(); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.beginPath(); g.moveTo(-0.4, 0.3); g.lineTo(-0.1, -0.4); g.lineTo(0.05, -0.4); g.lineTo(-0.25, 0.3); g.fill();
      g.restore();
    }, '#0b0b0b', 0.08);
  },
  /* Teardrop aviators: thin gold frame, double bridge, dark green-grey lenses. */
  aviator(g) {
    frame(g, 0.9, (g, side) => {
      g.save(); g.scale(-side, 1);   // the teardrop's point faces the nose
      g.beginPath();
      g.moveTo(-0.5, -0.3);
      g.bezierCurveTo(-0.1, -0.4, 0.45, -0.38, 0.5, -0.2);
      g.bezierCurveTo(0.55, 0.25, 0.1, 0.48, -0.25, 0.32);
      g.bezierCurveTo(-0.5, 0.2, -0.56, 0, -0.5, -0.3);
      g.closePath();
      g.restore();
      const gr = g.createLinearGradient(0, -0.4, 0, 0.45);
      gr.addColorStop(0, '#3b4a3f'); gr.addColorStop(0.6, '#1d2620'); gr.addColorStop(1, '#4f5d45');
      g.fillStyle = gr; g.fill();
      g.lineWidth = 0.04; g.strokeStyle = '#c9a54a'; g.stroke();
      g.save(); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.2)';
      g.beginPath(); g.ellipse(-0.15, -0.15, 0.3, 0.08, -0.4, 0, TAU); g.fill();
      g.restore();
    }, '#c9a54a', 0.035, true);
  },
  /* Thick black nerd glasses with clear lenses and tape on the bridge. */
  nerd(g) {
    const w = 0.82;
    frame(g, w, (g) => {
      g.beginPath(); g.roundRect ? g.roundRect(-0.5, -0.38, 1, 0.72, 0.16) : g.rect(-0.5, -0.38, 1, 0.72);
      g.fillStyle = 'rgba(200,230,255,0.12)'; g.fill();
      g.lineWidth = 0.13; g.strokeStyle = '#111'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath(); g.ellipse(-0.2, -0.15, 0.16, 0.05, -0.5, 0, TAU); g.fill();
    }, '#111', w * 0.13);
    g.fillStyle = '#f2f0e6'; g.fillRect(-w * 0.12, -w * 0.3, w * 0.24, w * 0.26);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.006;
    for (const k of [-0.05, 0.05]) { g.beginPath(); g.moveTo(w * k, -w * 0.3); g.lineTo(w * k, -w * 0.04); g.stroke(); }
  },
  /* Big round hippie glasses: thin gold wire and rose-to-amber tinted lenses. */
  hippie(g) {
    frame(g, 0.9, (g) => {
      g.beginPath(); g.arc(0, 0.02, 0.5, 0, TAU);
      const gr = g.createLinearGradient(0, -0.48, 0, 0.52);
      gr.addColorStop(0, 'rgba(255,60,170,0.78)'); gr.addColorStop(0.55, 'rgba(255,120,60,0.62)'); gr.addColorStop(1, 'rgba(255,215,60,0.5)');
      g.fillStyle = gr; g.fill();
      g.lineWidth = 0.05; g.strokeStyle = '#e0b24a'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.4)';
      g.beginPath(); g.ellipse(-0.18, -0.2, 0.17, 0.06, -0.6, 0, TAU); g.fill();
    }, '#e0b24a', 0.045);
  },
};

/* A mustache on the upper lip. style: 'handlebar' (curled tips) or 'chevron' (thick and bushy). */
export function mustache(c, p, style = 'handlebar', col = '#2b1a10') {
  const P = p.pts;
  const at = mix(P[2], P[0], 0.55);                      // between the nose and the top lip
  const w = Math.hypot(P[291][0] - P[61][0], P[291][1] - P[61][1]) * (style === 'chevron' ? 1.25 : 1.4);
  c.save();
  c.translate(...at); c.rotate(p.ang);
  c.fillStyle = col;
  c.beginPath();
  if (style === 'chevron') {
    c.moveTo(0, -w * 0.14);
    c.bezierCurveTo(w * 0.25, -w * 0.2, w * 0.48, -w * 0.08, w * 0.52, w * 0.16);
    c.bezierCurveTo(w * 0.3, w * 0.12, w * 0.15, w * 0.14, 0, w * 0.1);
    c.bezierCurveTo(-w * 0.15, w * 0.14, -w * 0.3, w * 0.12, -w * 0.52, w * 0.16);
    c.bezierCurveTo(-w * 0.48, -w * 0.08, -w * 0.25, -w * 0.2, 0, -w * 0.14);
  } else {
    c.moveTo(0, -w * 0.06);
    c.bezierCurveTo(w * 0.2, -w * 0.18, w * 0.4, -w * 0.02, w * 0.52, -w * 0.05);
    c.bezierCurveTo(w * 0.62, -w * 0.08, w * 0.66, -w * 0.2, w * 0.58, -w * 0.25);   // curl up
    c.bezierCurveTo(w * 0.7, -w * 0.2, w * 0.68, w * 0.05, w * 0.5, w * 0.06);
    c.bezierCurveTo(w * 0.3, w * 0.1, w * 0.12, w * 0.08, 0, w * 0.04);
    c.bezierCurveTo(-w * 0.12, w * 0.08, -w * 0.3, w * 0.1, -w * 0.5, w * 0.06);
    c.bezierCurveTo(-w * 0.68, w * 0.05, -w * 0.7, -w * 0.2, -w * 0.58, -w * 0.25);
    c.bezierCurveTo(-w * 0.66, -w * 0.2, -w * 0.62, -w * 0.08, -w * 0.52, -w * 0.05);
    c.bezierCurveTo(-w * 0.4, -w * 0.02, -w * 0.2, -w * 0.18, 0, -w * 0.06);
  }
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = Math.max(1, w * 0.01);
  for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * w * 0.06, -w * 0.06); c.lineTo(i * w * 0.075, w * 0.06); c.stroke(); }
  c.restore();
}

/* Clothing from the neck down: fill(path) is called with a yoke shape (neckline at b = -0.78,
   widening over the shoulders and off the bottom of the screen). */
export function yokePath(c, p) {
  const P = (a, b) => facePt(p, a, b);
  c.beginPath();
  c.moveTo(...P(-0.36, -0.7));
  c.quadraticCurveTo(...P(0, -0.92), ...P(0.36, -0.7));
  c.bezierCurveTo(...P(0.9, -0.95), ...P(1.5, -1.15), ...P(1.9, -1.6));
  c.lineTo(...P(2.2, -6)); c.lineTo(...P(-2.2, -6)); c.lineTo(...P(-1.9, -1.6));
  c.bezierCurveTo(...P(-1.5, -1.15), ...P(-0.9, -0.95), ...P(-0.36, -0.7));
  c.closePath();
}

/* ---------- outfits fitted to the body ---------- */
const oc = document.createElement('canvas'), ox = oc.getContext('2d');
/* Paint clothing onto this person's body: paint(o) draws the costume onto a stage-sized canvas,
   which is kept only inside the person's silhouette (segmentation; needs segment 'mask' or
   'cutout') from the neckline down, near this face. The person's own light and shadow is laid
   back over the costume colour so folds and arms still read. Without segmentation it falls back
   to the yoke shape. neck: neckline height in face heights (default just under the chin).
   shade: how much of the person's own light and shadow shows through (0 = flat colour). */
export function drawOutfit(c, p, paint, neck = -0.72, shade = 0.3) {
  if (oc.width !== W || oc.height !== H) { oc.width = W; oc.height = H; }
  const P = (a, b) => facePt(p, a, b);
  ox.globalCompositeOperation = 'source-over'; ox.globalAlpha = 1;
  ox.clearRect(0, 0, W, H);
  paint(ox);
  ox.globalCompositeOperation = 'luminosity'; ox.globalAlpha = shade;
  drawVideo(ox);
  ox.globalAlpha = 1;
  ox.globalCompositeOperation = 'destination-in';
  const m = personMask();
  if (m) drawVideo(ox, m); else { yokePath(ox, p); ox.fill(); }
  ox.beginPath();
  ox.moveTo(...P(-2.6, neck + 0.35)); ox.lineTo(...P(-0.9, neck + 0.02)); ox.lineTo(...P(-0.36, neck + 0.04));
  ox.quadraticCurveTo(...P(0, neck - 0.2), ...P(0.36, neck + 0.04));
  ox.lineTo(...P(0.9, neck + 0.02)); ox.lineTo(...P(2.6, neck + 0.35)); ox.lineTo(...P(2.6, -12)); ox.lineTo(...P(-2.6, -12)); ox.closePath();
  ox.fill();
  ox.globalCompositeOperation = 'source-over';
  c.drawImage(oc, 0, 0);
}
/* Fill a big area in the face frame (for painting outfit colours). */
export function fillBody(o, p, style) {
  o.fillStyle = style;
  o.beginPath();
  o.moveTo(...facePt(p, -3, 1)); o.lineTo(...facePt(p, 3, 1)); o.lineTo(...facePt(p, 3, -12)); o.lineTo(...facePt(p, -3, -12)); o.closePath();
  o.fill();
}

/* ---------- church headwear and dress ---------- */
/* A bishop's mitre. col: { body, shade, band, edge, cross } */
export function mitre(c, p, col = {}) {
  const k = { body: '#fffdf6', shade: '#d9cfb4', band: '#d4aa3c', edge: '#b38a2a', cross: '#b3202c', ...col };
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  const shape = () => {
    c.beginPath();
    c.moveTo(...P(-0.5, 0.42));
    c.bezierCurveTo(...P(-0.56, 0.9), ...P(-0.38, 1.35), ...P(0, 1.62));
    c.bezierCurveTo(...P(0.38, 1.35), ...P(0.56, 0.9), ...P(0.5, 0.42));
    c.quadraticCurveTo(...P(0, 0.48), ...P(-0.5, 0.42));
    c.closePath();
  };
  c.save();
  shape();
  const [gx, gy] = P(-0.15, 1.0);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 1.1);
  g.addColorStop(0, k.body); g.addColorStop(1, k.shade);
  c.fillStyle = g; c.fill();
  c.clip();
  c.fillStyle = k.band;
  c.beginPath(); c.moveTo(...P(-0.7, 0.4)); c.lineTo(...P(0.7, 0.4)); c.lineTo(...P(0.7, 0.58)); c.quadraticCurveTo(...P(0, 0.64), ...P(-0.7, 0.58)); c.fill();
  c.beginPath(); c.moveTo(...P(-0.07, 0.5)); c.lineTo(...P(0.07, 0.5)); c.lineTo(...P(0.07, 1.7)); c.lineTo(...P(-0.07, 1.7)); c.fill();
  c.restore();
  c.save(); shape(); c.strokeStyle = k.edge; c.lineWidth = fw * 0.025; c.stroke(); c.restore();
  const [cx, cy] = P(0, 1.08);
  c.save(); c.translate(cx, cy); c.rotate(p.ang);
  c.fillStyle = k.cross;
  c.fillRect(-fw * 0.035, -fw * 0.13, fw * 0.07, fw * 0.26); c.fillRect(-fw * 0.1, -fw * 0.06, fw * 0.2, fw * 0.07);
  c.restore();
}

function ovalPath(c, p, k = 1) {
  const C = p.c;
  p.oval.forEach(([x, y], i) => {
    const X = C[0] + (x - C[0]) * k, Y = C[1] + (y - C[1]) * k;
    if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
  });
  c.closePath();
}
/* A sister's veil over the head and shoulders with a white coif framing the face. */
export function veil(c, p, veilCol = ['#2a2a2e', '#121214', '#050506']) {
  const C = p.c, u = p.up, r = p.right, fw = p.fw, fh = p.fh;
  const P = (a, b) => [C[0] + r[0] * a * fw + u[0] * b * fh, C[1] + r[1] * a * fw + u[1] * b * fh];
  c.save();
  c.beginPath();
  const top = P(0, 0.8);
  c.moveTo(...top);
  c.bezierCurveTo(...P(0.5, 0.82), ...P(0.74, 0.56), ...P(0.74, 0.12));
  c.bezierCurveTo(...P(0.77, -0.45), ...P(0.98, -1.05), ...P(1.2, -2.4));
  c.lineTo(...P(-1.2, -2.4));
  c.bezierCurveTo(...P(-0.98, -1.05), ...P(-0.77, -0.45), ...P(-0.74, 0.12));
  c.bezierCurveTo(...P(-0.74, 0.56), ...P(-0.5, 0.82), ...top);
  c.closePath();
  ovalPath(c, p, 1.15);
  const [gx0, gy0] = P(0, 0.8), [gx1, gy1] = P(0, -2.4);
  const g = c.createLinearGradient(gx0, gy0, gx1, gy1);
  g.addColorStop(0, veilCol[0]); g.addColorStop(0.5, veilCol[1]); g.addColorStop(1, veilCol[2]);
  c.fillStyle = g; c.fill('evenodd');
  c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = Math.max(1.5, fw * 0.012);
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(...P(0.62 * s, 0.1)); c.bezierCurveTo(...P(0.66 * s, -0.6), ...P(0.85 * s, -1.2), ...P(0.95 * s, -2.2)); c.stroke();
  }
  c.beginPath(); ovalPath(c, p, 1.16); ovalPath(c, p, 1.0);
  c.fillStyle = '#f5f5f0'; c.fill('evenodd');
  c.strokeStyle = '#cfcfc4'; c.lineWidth = Math.max(1, fw * 0.008);
  c.beginPath(); ovalPath(c, p, 1.0); c.stroke();
  c.restore();
}

/* A friar's habit (Franciscan brown by default): fitted robe, a cowl round the neck and a
   knotted white cord down the front. */
export function habit(c, p, col = '#5e4128') {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  drawOutfit(c, p, (o) => {
    fillBody(o, p, col);
    o.strokeStyle = 'rgba(0,0,0,0.25)'; o.lineWidth = fw * 0.03;
    for (const s of [-1, 1]) { o.beginPath(); o.moveTo(...P(s * 0.5, -1.2)); o.quadraticCurveTo(...P(s * 0.7, -2), ...P(s * 0.6, -3.2)); o.stroke(); }
  });
  c.save();
  // cowl lying round the neck
  c.beginPath();
  c.moveTo(...P(-0.85, -0.82)); c.quadraticCurveTo(...P(0, -1.05), ...P(0.85, -0.82));
  c.quadraticCurveTo(...P(0.5, -1.35), ...P(0, -1.3)); c.quadraticCurveTo(...P(-0.5, -1.35), ...P(-0.85, -0.82)); c.closePath();
  c.fillStyle = col; c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = fw * 0.02; c.stroke();
  // knotted cord
  c.strokeStyle = '#efe8d8'; c.lineWidth = fw * 0.035; c.lineCap = 'round';
  c.beginPath(); c.moveTo(...P(0.12, -1.3)); c.quadraticCurveTo(...P(0.18, -2), ...P(0.14, -2.8)); c.stroke();
  c.fillStyle = '#efe8d8';
  for (const b of [-1.8, -2.2, -2.6]) { c.beginPath(); c.arc(...P(0.155, b), fw * 0.035, 0, TAU); c.fill(); }
  c.restore();
}

/* A white beard (St. Nicholas, St. Peter). long: 1 = down to the chest, 0.3 = short. */
export function beard(c, p, long = 1, col = '#f4f2ec') {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  c.save();
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(...P(-0.48, -0.12));
  c.bezierCurveTo(...P(-0.53, -0.45 - long * 0.3), ...P(-0.3, -0.7 - long * 0.5), ...P(0, -0.75 - long * 0.6));
  c.bezierCurveTo(...P(0.3, -0.7 - long * 0.5), ...P(0.53, -0.45 - long * 0.3), ...P(0.48, -0.12));
  c.lineTo(...P(0.42, -0.14)); c.quadraticCurveTo(...P(0.25, -0.2), ...P(0.15, -0.36));
  c.quadraticCurveTo(...P(0, -0.44), ...P(-0.15, -0.36));   // leave the mouth showing
  c.quadraticCurveTo(...P(-0.25, -0.2), ...P(-0.42, -0.14));
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(150,150,140,0.35)'; c.lineWidth = Math.max(1, fw * 0.008);
  for (let i = -6; i <= 6; i++) {
    c.beginPath(); c.moveTo(...P(i * 0.06, -0.45)); c.quadraticCurveTo(...P(i * 0.075, -0.6 - long * 0.2), ...P(i * 0.05, -0.65 - long * 0.5)); c.stroke();
  }
  // mustache over the top lip
  c.beginPath();
  c.moveTo(...P(0, -0.22)); c.quadraticCurveTo(...P(0.2, -0.18), ...P(0.3, -0.34)); c.quadraticCurveTo(...P(0.12, -0.3), ...P(0, -0.27));
  c.quadraticCurveTo(...P(-0.12, -0.3), ...P(-0.3, -0.34)); c.quadraticCurveTo(...P(-0.2, -0.18), ...P(0, -0.22));
  c.fill();
  c.restore();
}

/* ---------- angel wings ---------- */
/* Wing in its own frame: root at the origin, x outward, y down, 1 unit = wing length.
   The leading edge arches up and out; rows of feathers hang from it. */
const edge = (s) => [2 * (1 - s) * s * 0.35 + s * s, 2 * (1 - s) * s * -1.05 + s * s * -0.55];
const ROWS = [
  // count, from s, length scale, width, colour
  [17, 0.06, 1, 0.075, '#e8ecf6'],
  [13, 0.04, 0.55, 0.07, '#f3f5fb'],
  [10, 0.02, 0.26, 0.065, '#ffffff'],
];
function feather(c, len, w, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, -w * 0.5);
  c.quadraticCurveTo(len * 0.6, -w, len, 0);
  c.quadraticCurveTo(len * 0.6, w, 0, w * 0.5);
  c.closePath();
  c.fill(); c.stroke();
}
function drawWing(c, x, y, side, L, roll, lift) {
  c.save();
  c.translate(x, y); c.rotate(roll); c.scale(side * L, L); c.rotate(-lift);
  const glow = c.createRadialGradient(0.45, -0.5, 0, 0.45, -0.5, 1);
  glow.addColorStop(0, 'rgba(255,255,255,0.3)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = glow; c.beginPath(); c.arc(0.45, -0.5, 1, 0, TAU); c.fill();
  c.lineWidth = 0.006; c.strokeStyle = 'rgba(150,158,190,0.7)';
  for (const [n, s0, k, w, col] of ROWS) {
    for (let i = n - 1; i >= 0; i--) {
      const s = s0 + (1 - s0) * (i / (n - 1));
      const [bx, by] = edge(s);
      const ang = 1.75 + (0.5 - 1.75) * s;                 // hang straight down at the root, sweep out at the tip
      const len = (0.42 + 0.48 * Math.sin(s * Math.PI * 0.8)) * k;
      c.save();
      c.translate(bx, by); c.rotate(ang);
      feather(c, len, w, col);
      c.restore();
    }
  }
  c.lineCap = 'round'; c.strokeStyle = '#fbfcff'; c.lineWidth = 0.09;
  c.beginPath();
  for (let i = 0; i <= 20; i++) { const [ex, ey] = edge((i / 20) * 0.97); if (i) c.lineTo(ex, ey); else c.moveTo(ex, ey); }
  c.stroke();
  c.restore();
}
/* A pair of wings from the shoulder blades. Draw them in a `behind` hook (segment 'cutout') so
   the person covers them. */
export function wings(c, p, t) {
  const L = p.fw * 2.3, roll = p.ang * 0.4, lift = Math.sin(t * 1.6) * 0.05;   // the body tilts less than the head
  for (const side of [-1, 1]) {
    const [x, y] = facePt(p, side * 0.38, -1.15);
    drawWing(c, x, y, side, L, roll, lift);
  }
}

/* Plate armour for an outfit paint callback: polished steel, overlapping plates, gold trim and a
   cross on the breastplate (St. Michael, St. Joan). */
export function armorPaint(o, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  const [gx, gy] = P(-0.6, -1.2), [hx, hy] = P(0.8, -1.6);
  const g = o.createLinearGradient(gx, gy, hx, hy);
  g.addColorStop(0, '#f2f4f7'); g.addColorStop(0.4, '#a3abb5'); g.addColorStop(0.7, '#d6dbe1'); g.addColorStop(1, '#5d6670');
  fillBody(o, p, g);
  o.strokeStyle = 'rgba(40,45,52,0.55)'; o.lineWidth = fw * 0.02;
  for (let b = -2.1; b > -4.5; b -= 0.28) { o.beginPath(); o.moveTo(...P(-1.4, b + 0.08)); o.quadraticCurveTo(...P(0, b - 0.1), ...P(1.4, b + 0.08)); o.stroke(); }
  for (const s of [-1, 1]) {   // pauldrons
    o.beginPath(); o.arc(...P(s * 1.1, -1.1), fw * 0.35, 0, TAU); o.stroke();
    o.beginPath(); o.arc(...P(s * 1.1, -1.1), fw * 0.22, 0, TAU); o.stroke();
  }
  o.strokeStyle = '#d4aa3c'; o.lineWidth = fw * 0.03;
  o.beginPath(); o.moveTo(...P(-0.42, -0.75)); o.quadraticCurveTo(...P(0, -0.98), ...P(0.42, -0.75)); o.stroke();
  o.fillStyle = '#d4aa3c';
  const [cx, cy] = P(0, -1.6);
  o.save(); o.translate(cx, cy); o.rotate(p.ang);
  o.fillRect(-fw * 0.04, -fw * 0.25, fw * 0.08, fw * 0.5); o.fillRect(-fw * 0.17, -fw * 0.1, fw * 0.34, fw * 0.08);
  o.restore();
}

/* A key standing upright at the origin, bow at the top, len long (St. Peter, the Vatican flag). */
export function key(c, len, col, edge) {
  c.fillStyle = col; c.strokeStyle = edge; c.lineWidth = len * 0.02;
  c.beginPath(); c.arc(0, -len * 0.42, len * 0.11, 0, TAU); c.arc(0, -len * 0.42, len * 0.05, 0, TAU, true); c.fill('evenodd'); c.stroke();   // bow
  c.fillRect(-len * 0.025, -len * 0.32, len * 0.05, len * 0.72); c.strokeRect(-len * 0.025, -len * 0.32, len * 0.05, len * 0.72);       // shaft
  c.fillRect(len * 0.025, len * 0.25, len * 0.12, len * 0.05); c.fillRect(len * 0.025, len * 0.34, len * 0.09, len * 0.05);           // bit
}

/* A heart shape centred at (x, y), s = width. */
export function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.45, y - s * 0.55, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.45, y - s * 0.55, x + s * 0.6, y - s * 0.05, x, y + s * 0.35);
  c.closePath();
}
