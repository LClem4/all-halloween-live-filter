/* Mesh warping: snapshot the stage, then redraw parts of it as triangles, each with its own
   affine map. Used to reshape faces (big eyes, crying frown) and to zoom the whole frame. */
import { canvas, W, H } from './core.js';

const snap = document.createElement('canvas');
const sctx = snap.getContext('2d');
export function snapshot() {
  if (snap.width !== W || snap.height !== H) { snap.width = W; snap.height = H; }
  sctx.drawImage(canvas, 0, 0);
  return snap;
}

const same = (a, b) => Math.abs(a[0] - b[0]) < 0.3 && Math.abs(a[1] - b[1]) < 0.3;
/* Draw source triangle s0-s1-s2 of the snapshot onto destination triangle d0-d1-d2. */
export function drawTri(c, s0, s1, s2, d0, d1, d2) {
  if (same(s0, d0) && same(s1, d1) && same(s2, d2)) return;
  const [x0, y0] = s0, [x1, y1] = s1, [x2, y2] = s2, [u0, v0] = d0, [u1, v1] = d1, [u2, v2] = d2;
  const den = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (Math.abs(den) < 1e-3) return;
  const a = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / den;
  const b = ((u2 - u0) * (x1 - x0) - (u1 - u0) * (x2 - x0)) / den;
  const cc = ((v1 - v0) * (y2 - y0) - (v2 - v0) * (y1 - y0)) / den;
  const d = ((v2 - v0) * (x1 - x0) - (v1 - v0) * (x2 - x0)) / den;
  const e = u0 - a * x0 - b * y0, f = v0 - cc * x0 - d * y0;
  // clip slightly larger than the triangle so neighbours overlap and no seams show
  const mx = (u0 + u1 + u2) / 3, my = (v0 + v1 + v2) / 3;
  c.save();
  c.beginPath();
  for (const [u, v] of [d0, d1, d2]) {
    const l = Math.hypot(u - mx, v - my) || 1;
    c.lineTo(u + ((u - mx) / l) * 1.5, v + ((v - my) / l) * 1.5);
  }
  c.closePath(); c.clip();
  c.setTransform(a, cc, b, d, e, f);
  const sx = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 2), sy = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 2);
  const ex = Math.min(W, Math.ceil(Math.max(x0, x1, x2)) + 2), ey = Math.min(H, Math.ceil(Math.max(y0, y1, y2)) + 2);
  if (ex > sx && ey > sy) c.drawImage(snap, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
  c.restore();
}

/* Reshape a face: `move(pt)` gives where each face-outline point should go. The centre stays
   put and an outer ring (1.8x the outline) is fixed, so the warp fades out smoothly.
   Call snapshot() first. */
export function warpFace(c, p, move) {
  const C = p.c, N = 18, ring = [], dst = [], outer = [];
  for (let i = 0; i < N; i++) {
    const s = p.oval[i * 2];
    ring.push(s); dst.push(move(s));
    outer.push([C[0] + (s[0] - C[0]) * 1.8, C[1] + (s[1] - C[1]) * 1.8]);
  }
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    drawTri(c, C, ring[i], ring[j], C, dst[i], dst[j]);
    drawTri(c, ring[i], outer[i], outer[j], dst[i], outer[i], outer[j]);
    drawTri(c, ring[i], outer[j], ring[j], dst[i], outer[j], dst[j]);
  }
}

/* Reshape a small area: an elliptical ring (radius rx, ry, rotated ang) around `center` moves by
   `move(pt)`; the centre moves by move(center); a ring at 1.9x stays fixed so it blends out.
   e.g. scale the ring up for big eyes, down for a tiny mouth. Call snapshot() first. */
export function warpRegion(c, center, rx, ry, ang, move, n = 14) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const at = (k, i) => {
    const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    return [center[0] + x * ca - y * sa, center[1] + x * sa + y * ca];
  };
  const C = move(center);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = at(1, i), b = at(1, j), oa = at(1.9, i), ob = at(1.9, j);
    const ma = move(a), mb = move(b);
    drawTri(c, center, a, b, C, ma, mb);
    drawTri(c, a, oa, ob, ma, oa, ob);
    drawTri(c, a, ob, b, ma, ob, mb);
  }
}
/* Scale an area about its centre (k > 1 enlarges). */
export const scaleAbout = (center, k) => (pt) => [center[0] + (pt[0] - center[0]) * k, center[1] + (pt[1] - center[1]) * k];

/* ---------- face swap ---------- */
/* Delaunay triangulation (Bowyer-Watson) of a small point set; returns index triples. */
function delaunay(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const d = Math.max(maxX - minX, maxY - minY) * 10, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
  const P = pts.concat([[mx - d, my - d], [mx, my + d], [mx + d, my - d]]), n = pts.length;
  const circ = (a, b, c) => {
    const [ax, ay] = P[a], [bx, by] = P[b], [cx, cy] = P[c];
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) || 1e-9;
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    return { a, b, c, x: ux, y: uy, r: (ax - ux) ** 2 + (ay - uy) ** 2 };
  };
  let tris = [circ(n, n + 1, n + 2)];
  for (let i = 0; i < n; i++) {
    const [x, y] = P[i], bad = [], keep = [];
    for (const t of tris) ((x - t.x) ** 2 + (y - t.y) ** 2 < t.r ? bad : keep).push(t);
    const edges = [];
    for (const t of bad) for (const e of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
      const k = edges.findIndex((f) => f[0] === e[1] && f[1] === e[0]);
      if (k >= 0) edges.splice(k, 1); else edges.push(e);
    }
    tris = keep;
    for (const [a, b] of edges) tris.push(circ(a, b, i));
  }
  return tris.filter((t) => t.a < n && t.b < n && t.c < n).map((t) => [t.a, t.b, t.c]);
}

// face outline (every other point) plus eye, brow, nose and mouth landmarks
const SWAP_IDS = [10, 297, 284, 389, 454, 361, 397, 379, 400, 152, 176, 150, 172, 132, 234, 162, 54, 67,
  33, 133, 159, 145, 263, 362, 386, 374, 105, 334, 6, 1, 61, 291, 0, 17];
const swapCan = document.createElement('canvas'), swapCtx = swapCan.getContext('2d');
const maskCan = document.createElement('canvas'), maskCtx = maskCan.getContext('2d');
/* Paint face `src` onto face `dst` (both poses), feathered at the edge. Call snapshot() first. */
export function swapFace(c, src, dst) {
  for (const cv of [swapCan, maskCan]) if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const S = SWAP_IDS.map((i) => src.pts[i]), D = SWAP_IDS.map((i) => dst.pts[i]);
  swapCtx.clearRect(0, 0, W, H);
  for (const [a, b, k] of delaunay(D)) drawTri(swapCtx, S[a], S[b], S[k], D[a], D[b], D[k]);
  // feathered oval mask: the outline's shadow, blurred, with the shape itself pushed off-canvas
  maskCtx.clearRect(0, 0, W, H);
  maskCtx.save();
  maskCtx.shadowColor = '#000'; maskCtx.shadowBlur = dst.fw * 0.12; maskCtx.shadowOffsetX = W * 2;
  maskCtx.beginPath();
  dst.oval.forEach(([x, y], i) => {
    const X = dst.c[0] + (x - dst.c[0]) * 0.9 - W * 2, Y = dst.c[1] + (y - dst.c[1]) * 0.9;
    if (i) maskCtx.lineTo(X, Y); else maskCtx.moveTo(X, Y);
  });
  maskCtx.fill();
  maskCtx.restore();
  swapCtx.globalCompositeOperation = 'destination-in';
  swapCtx.drawImage(maskCan, 0, 0);
  swapCtx.globalCompositeOperation = 'source-over';
  c.drawImage(swapCan, 0, 0);
}
