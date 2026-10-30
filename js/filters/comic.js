/* Comic book: flat posterised colour, clean ink outlines and a light halftone screen. To keep it
   smooth and even in dim party light the picture is auto-levelled (stretched to full contrast),
   softened before posterising (so flat areas stay flat), and only strong edges are inked. All at
   low resolution on the CPU. Open your mouth for a POW! burst. */
import { W, H, TAU, ctx, video, drawVideo } from '../core.js';
import { jawI } from '../face.js';
import { facePt } from '../fx.js';

const PW = 360, LEVELS = 5;
const work = document.createElement('canvas'), wctx = work.getContext('2d', { willReadFrequently: true });
let PH = 0, R, G, B, T, lum, dots = null;
const WORDS = ['POW!', 'WOW!', 'BAM!', 'ZAP!'];

function halftone() {
  const t = document.createElement('canvas'); t.width = t.height = 10;
  const c = t.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, 10, 10);
  c.fillStyle = '#9a9a9a'; c.beginPath(); c.arc(5, 5, 2, 0, TAU); c.fill();
  return ctx.createPattern(t, 'repeat');
}
/* 3-tap box blur of one channel, horizontally then vertically (via T). */
function blur(a) {
  for (let y = 0; y < PH; y++) for (let x = 1; x < PW - 1; x++) { const i = y * PW + x; T[i] = (a[i - 1] + a[i] + a[i + 1]) / 3; }
  for (let y = 1; y < PH - 1; y++) for (let x = 0; x < PW; x++) { const i = y * PW + x; a[i] = (T[i - PW] + T[i] + T[i + PW]) / 3; }
}

export default {
  name: 'Comic',
  hint: 'Open your mouth!',
  base(c) {
    const ph = Math.round((PW * video.videoHeight) / video.videoWidth);
    if (ph !== PH) {
      PH = ph; work.width = PW; work.height = PH;
      R = new Float32Array(PW * PH); G = new Float32Array(PW * PH); B = new Float32Array(PW * PH); T = new Float32Array(PW * PH); lum = new Float32Array(PW * PH);
    }
    wctx.drawImage(video, 0, 0, PW, PH);
    const img = wctx.getImageData(0, 0, PW, PH), d = img.data, n = PW * PH;
    // auto-levels: stretch the 2nd..98th percentile of brightness to the full range
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i++) { R[i] = d[i * 4]; G[i] = d[i * 4 + 1]; B[i] = d[i * 4 + 2]; hist[(R[i] * 0.3 + G[i] * 0.59 + B[i] * 0.11) | 0]++; }
    let lo = 0, hi = 255, acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } }
    acc = 0;
    for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.02) { hi = v; break; } }
    const k = 255 / Math.max(40, hi - lo);
    for (let pass = 0; pass < 2; pass++) { blur(R); blur(G); blur(B); }
    for (let i = 0; i < n; i++) {
      R[i] = (R[i] - lo) * k; G[i] = (G[i] - lo) * k; B[i] = (B[i] - lo) * k;
      lum[i] = R[i] * 0.3 + G[i] * 0.59 + B[i] * 0.11;
    }
    const step = 255 / (LEVELS - 1);
    for (let y = 0; y < PH; y++) {
      for (let x = 0; x < PW; x++) {
        const i = y * PW + x, o = i * 4, L = lum[i];
        if (x > 0 && y > 0 && x < PW - 1 && y < PH - 1) {
          const gx = lum[i - PW + 1] + 2 * lum[i + 1] + lum[i + PW + 1] - lum[i - PW - 1] - 2 * lum[i - 1] - lum[i + PW - 1];
          const gy = lum[i + PW - 1] + 2 * lum[i + PW] + lum[i + PW + 1] - lum[i - PW - 1] - 2 * lum[i - PW] - lum[i - PW + 1];
          if (Math.abs(gx) + Math.abs(gy) > 190) { d[o] = d[o + 1] = d[o + 2] = 25; continue; }
        }
        for (const [ch, v] of [[0, R[i]], [1, G[i]], [2, B[i]]]) {
          const s = L + (v - L) * 1.35;   // a little extra colour, then flatten to a few levels
          d[o + ch] = Math.round(Math.max(0, Math.min(255, s)) / step) * step;
        }
      }
    }
    wctx.putImageData(img, 0, 0);
    drawVideo(c, work);
    if (!dots) dots = halftone();
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.15; c.fillStyle = dots; c.fillRect(0, 0, W, H); c.restore();
  },
  face(c, p) {
    const I = jawI(p);
    if (I < 0.3) return;
    const k = Math.min(1, (I - 0.3) / 0.4), [x, y] = facePt(p, 0.95, 0.4), r = p.fw * (0.35 + 0.15 * k);
    c.save();
    c.translate(x, y); c.rotate(-0.2);
    c.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, rr = i % 2 ? r * 0.7 : r; c.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr); }
    c.closePath();
    c.fillStyle = '#ffe23a'; c.fill(); c.lineWidth = r * 0.06; c.strokeStyle = '#111'; c.stroke();
    c.font = `900 ${r * 0.55}px Impact, 'Arial Black', sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#e0202a'; c.strokeStyle = '#111'; c.lineWidth = r * 0.05;
    const word = WORDS[Math.floor(p.seed * 10) % WORDS.length];
    c.strokeText(word, 0, 0); c.fillText(word, 0, 0);
    c.restore();
  },
};
