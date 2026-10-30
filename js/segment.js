/* Person segmentation (MediaPipe ImageSegmenter, selfie model), used three ways:
   - 'cutout': the camera image of just the people, so a filter can draw things behind them
     (wings, replaced backgrounds). main.js draws it after `behind`. See drawPerson().
   - 'mask': the same cut-out, but the filter draws it itself (or only uses personMask()).
   - 'vanish': people painted out of the frame (Ascended). Background pixels are learned into a
     "clean plate". The plate slides with the camera (estimated each frame from how the background
     moved) so it stays lined up while the wearer sways. Where the plate has never seen the
     background, colour is filled in from the surrounding known background at several scales
     (pull-push), so gaps blend into what's around them. All at low resolution on a work canvas
     whose alpha is the dilated mask, drawn over the full-resolution video. */
import vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
import { video, drawVideo } from './core.js';
import { WASM } from './face.js';
const { ImageSegmenter, FilesetResolver } = vision;

const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

export let segmenter = null, segError = null;
let loading = null;
/* Loads in the background after the face model; filters show plain video until it's ready. */
export function loadSegmenter() {
  return loading || (loading = (async () => {
    try {
      const files = await FilesetResolver.forVisionTasks(WASM);
      segmenter = await ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
        runningMode: 'VIDEO', outputConfidenceMasks: true, outputCategoryMask: false,
      });
    } catch (e) { console.error(e); segError = e; }
  })());
}

let lastRun = 0;
const fresh = () => performance.now() - lastRun < 500;

/* Call once per new camera frame while a filter with `segment` is showing. */
export function segmentFrame(now, mode) {
  if (!segmenter) return;
  if (now - lastRun > 2500) forget();
  lastRun = now;
  try {
    segmenter.segmentForVideo(video, now, (res) => {
      const masks = res.confidenceMasks;
      if (!masks || !masks.length) return;
      const m = masks[masks.length - 1], data = m.getAsFloat32Array();
      if (mode === 'vanish') vanish(data, m.width, m.height);
      else cutout(data, m.width, m.height);
    });
  } catch (e) { console.warn(e); }
}
/* After a pause the camera has probably moved: start over. */
function forget() {
  if (seen) seen.fill(0);
  hasRef = false; cutReady = false; vanishReady = false;
}

/* ---------- cut-out ---------- */
const mcan = document.createElement('canvas'), mctx = mcan.getContext('2d');
const cut = document.createElement('canvas'), cctx = cut.getContext('2d');
let mImg = null, mPrev = null, cutReady = false;
function cutout(data, mw, mh) {
  if (!mImg || mImg.width !== mw || mImg.height !== mh) {
    mcan.width = mw; mcan.height = mh;
    mImg = mctx.createImageData(mw, mh); mImg.data.fill(255);
    mPrev = new Float32Array(mw * mh);
  }
  const d = mImg.data, k = cutReady ? 0.65 : 1;
  for (let i = 0; i < mw * mh; i++) {
    const v = mPrev[i] = mPrev[i] * (1 - k) + data[i] * k;   // a little temporal smoothing against flicker
    d[i * 4 + 3] = (v - 0.3) * 640;                            // sharpen the edge; Uint8Clamped clamps
  }
  mctx.putImageData(mImg, 0, 0);
  const vw = video.videoWidth, vh = video.videoHeight;
  if (cut.width !== vw || cut.height !== vh) { cut.width = vw; cut.height = vh; }
  cctx.clearRect(0, 0, vw, vh);
  cctx.drawImage(video, 0, 0, vw, vh);
  cctx.globalCompositeOperation = 'destination-in';
  cctx.drawImage(mcan, 0, 0, vw, vh);
  cctx.globalCompositeOperation = 'source-over';
  cutReady = true;
}
export const personReady = () => cutReady && fresh();
/* Draw just the people (mirrored, cover-fit like the video). */
export function drawPerson(c) { if (personReady()) drawVideo(c, cut); }
/* The people as an image (camera resolution, unmirrored; draw with drawVideo), or null. */
export const personCanvas = () => (personReady() ? cut : null);
/* The person mask (alpha = person, camera resolution, unmirrored), or null. */
export const personMask = () => (personReady() ? mcan : null);

/* ---------- vanish ---------- */
const PW = 256, LW = PW / 2, MW = 64;   // work width, motion-tracking width, mask grid width
const BG = 0.08;                         // dilated mask below this counts as background
const R = 4;                             // camera motion search range, in tracking pixels
let PH = 0, LH = 0, MH = 0;
const work = document.createElement('canvas');
const wctx = work.getContext('2d', { willReadFrequently: true });
let plate, seen, tPlate, tSeen, mHi, mLow, mTmp, lum, refLum, bgL, refBg, levels;
let hasRef = false, refAge = 0, vanishReady = false;

function alloc(vw, vh) {
  PH = Math.round((PW * vh) / vw / 2) * 2; LH = PH / 2; MH = Math.round((MW * vh) / vw);
  work.width = PW; work.height = PH;
  plate = new Uint8ClampedArray(PW * PH * 3); tPlate = new Uint8ClampedArray(PW * PH * 3);
  seen = new Uint8Array(PW * PH); tSeen = new Uint8Array(PW * PH);
  mHi = new Float32Array(PW * PH);
  mLow = new Float32Array(MW * MH); mTmp = new Float32Array(MW * MH);
  lum = new Float32Array(LW * LH); refLum = new Float32Array(LW * LH);
  bgL = new Uint8Array(LW * LH); refBg = new Uint8Array(LW * LH);
  levels = [];
  for (let w = PW, h = PH; ; w = Math.ceil(w / 2), h = Math.ceil(h / 2)) {
    levels.push({ w, h, c: new Float32Array(w * h * 3), wt: new Float32Array(w * h) });
    if (w <= 4 || h <= 4) break;
  }
  forget();
}

/* Full mask -> coarse grid (max per cell), grown a cell and softened so the cut-out covers hair
   and motion lag rather than leaving a fringe; then upsampled to the work size. */
function buildMask(data, mw, mh) {
  mLow.fill(0);
  const fx = MW / mw, fy = MH / mh, step = mw > MW * 4 ? 2 : 1;
  for (let y = 0; y < mh; y += step) {
    const row = ((y * fy) | 0) * MW, base = y * mw;
    for (let x = 0; x < mw; x += step) {
      const v = data[base + x], k = row + ((x * fx) | 0);
      if (v > mLow[k]) mLow[k] = v;
    }
  }
  for (let pass = 0; pass < 2; pass++) {   // pass 0: dilate (max), pass 1: blur (mean)
    const src = pass ? mTmp : mLow, dst = pass ? mLow : mTmp;
    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        let acc = 0, n = 0;
        for (let j = Math.max(0, y - 1); j <= Math.min(MH - 1, y + 1); j++) {
          for (let i = Math.max(0, x - 1); i <= Math.min(MW - 1, x + 1); i++) {
            const v = src[j * MW + i];
            if (pass) { acc += v; n++; } else if (v > acc) acc = v;
          }
        }
        dst[y * MW + x] = pass ? acc / n : acc;
      }
    }
  }
  const sx = MW / PW, sy = MH / PH;
  for (let y = 0; y < PH; y++) {
    const fy = Math.max(0, (y + 0.5) * sy - 0.5), y0 = Math.min(fy | 0, MH - 1), y1 = Math.min(y0 + 1, MH - 1), ty = fy - y0;
    for (let x = 0; x < PW; x++) {
      const fx = Math.max(0, (x + 0.5) * sx - 0.5), x0 = Math.min(fx | 0, MW - 1), x1 = Math.min(x0 + 1, MW - 1), tx = fx - x0;
      const top = mLow[y0 * MW + x0] * (1 - tx) + mLow[y0 * MW + x1] * tx;
      const bot = mLow[y1 * MW + x0] * (1 - tx) + mLow[y1 * MW + x1] * tx;
      mHi[y * PW + x] = top + (bot - top) * ty;
    }
  }
}

/* Estimate how far the picture slid since the reference frame (whole tracking pixels within ±R,
   comparing background brightness only), then slide the plate to match. Small drifts build up
   against the reference until they're big enough to measure. */
function trackCamera(d) {
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      const i = 2 * y * PW + 2 * x, o = i * 4, o2 = o + PW * 4;
      lum[y * LW + x] = d[o] + d[o + 4] + d[o2] + d[o2 + 4] + (d[o + 1] + d[o + 5] + d[o2 + 1] + d[o2 + 5]) * 2;
      bgL[y * LW + x] = mHi[i] < BG && mHi[i + PW + 1] < BG ? 1 : 0;
    }
  }
  if (!hasRef || ++refAge > 90) { refLum.set(lum); refBg.set(bgL); hasRef = true; refAge = 0; return; }
  let best = Infinity, bx = 0, by = 0, zero = Infinity;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      let s = 0, n = 0;
      for (let y = R; y < LH - R; y += 2) {
        for (let x = R; x < LW - R; x += 2) {
          const j = y * LW + x, k = j - dy * LW - dx;
          if (!bgL[j] || !refBg[k]) continue;
          s += Math.abs(lum[j] - refLum[k]); n++;
        }
      }
      if (n < 150) continue;
      s /= n;
      if (!dx && !dy) zero = s;
      if (s < best) { best = s; bx = dx; by = dy; }
    }
  }
  if ((bx || by) && best < zero * 0.85) {
    shiftPlate(bx * 2, by * 2);
    refLum.set(lum); refBg.set(bgL); refAge = 0;
  }
}
function shiftPlate(sx, sy) {
  tSeen.fill(0);
  for (let y = Math.max(0, sy); y < Math.min(PH, PH + sy); y++) {
    for (let x = Math.max(0, sx); x < Math.min(PW, PW + sx); x++) {
      const j = y * PW + x, k = (y - sy) * PW + (x - sx);
      tSeen[j] = seen[k];
      tPlate[j * 3] = plate[k * 3]; tPlate[j * 3 + 1] = plate[k * 3 + 1]; tPlate[j * 3 + 2] = plate[k * 3 + 2];
    }
  }
  [plate, tPlate] = [tPlate, plate];
  [seen, tSeen] = [tSeen, seen];
}

/* Fill unseen plate pixels: average known pixels into ever coarser levels, then blend back up. */
function pullPush() {
  const L0 = levels[0];
  for (let i = 0; i < PW * PH; i++) {
    const w = seen[i];
    L0.wt[i] = w;
    L0.c[i * 3] = w ? plate[i * 3] : 0; L0.c[i * 3 + 1] = w ? plate[i * 3 + 1] : 0; L0.c[i * 3 + 2] = w ? plate[i * 3 + 2] : 0;
  }
  for (let l = 1; l < levels.length; l++) {
    const F = levels[l - 1], C = levels[l];
    for (let y = 0; y < C.h; y++) {
      for (let x = 0; x < C.w; x++) {
        let sw = 0, r = 0, g = 0, b = 0;
        for (let j = 2 * y; j < Math.min(F.h, 2 * y + 2); j++) {
          for (let i = 2 * x; i < Math.min(F.w, 2 * x + 2); i++) {
            const k = j * F.w + i, w = F.wt[k];
            if (!w) continue;
            sw += w; r += F.c[k * 3] * w; g += F.c[k * 3 + 1] * w; b += F.c[k * 3 + 2] * w;
          }
        }
        const k = y * C.w + x;
        C.wt[k] = Math.min(1, sw);
        if (sw) { C.c[k * 3] = r / sw; C.c[k * 3 + 1] = g / sw; C.c[k * 3 + 2] = b / sw; }
      }
    }
  }
  // coarsest level: anything still unknown takes the average of what is known (or dark grey)
  const T = levels[levels.length - 1];
  let n = 0, r = 0, g = 0, b = 0;
  for (let k = 0; k < T.w * T.h; k++) if (T.wt[k]) { n++; r += T.c[k * 3]; g += T.c[k * 3 + 1]; b += T.c[k * 3 + 2]; }
  for (let k = 0; k < T.w * T.h; k++) {
    if (T.wt[k] >= 1) continue;
    const f = 1 - T.wt[k];
    T.c[k * 3] += ((n ? r / n : 40) - T.c[k * 3]) * f; T.c[k * 3 + 1] += ((n ? g / n : 40) - T.c[k * 3 + 1]) * f; T.c[k * 3 + 2] += ((n ? b / n : 40) - T.c[k * 3 + 2]) * f;
    T.wt[k] = 1;
  }
  for (let l = levels.length - 2; l >= 0; l--) {
    const F = levels[l], C = levels[l + 1];
    for (let y = 0; y < F.h; y++) {
      const fy = Math.max(0, (y + 0.5) / 2 - 0.5), y0 = Math.min(fy | 0, C.h - 1), y1 = Math.min(y0 + 1, C.h - 1), ty = fy - y0;
      for (let x = 0; x < F.w; x++) {
        const k = y * F.w + x, w = F.wt[k];
        if (w >= 1) continue;
        const fx = Math.max(0, (x + 0.5) / 2 - 0.5), x0 = Math.min(fx | 0, C.w - 1), x1 = Math.min(x0 + 1, C.w - 1), tx = fx - x0;
        const a = (y0 * C.w + x0) * 3, bb = (y0 * C.w + x1) * 3, cc = (y1 * C.w + x0) * 3, dd = (y1 * C.w + x1) * 3;
        for (let ch = 0; ch < 3; ch++) {
          const top = C.c[a + ch] * (1 - tx) + C.c[bb + ch] * tx, bot = C.c[cc + ch] * (1 - tx) + C.c[dd + ch] * tx;
          F.c[k * 3 + ch] = F.c[k * 3 + ch] * w + (top + (bot - top) * ty) * (1 - w);
        }
        F.wt[k] = 1;
      }
    }
  }
}

function vanish(data, mw, mh) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!plate || Math.round((PW * vh) / vw / 2) * 2 !== PH) alloc(vw, vh);
  buildMask(data, mw, mh);
  wctx.drawImage(video, 0, 0, PW, PH);
  const frame = wctx.getImageData(0, 0, PW, PH), d = frame.data;

  trackCamera(d);
  for (let i = 0; i < PW * PH; i++) {   // learn the background
    if (mHi[i] >= BG) continue;
    const o = i * 4, q = i * 3;
    if (seen[i]) { plate[q] = (plate[q] + d[o]) >> 1; plate[q + 1] = (plate[q + 1] + d[o + 1]) >> 1; plate[q + 2] = (plate[q + 2] + d[o + 2]) >> 1; }
    else { plate[q] = d[o]; plate[q + 1] = d[o + 1]; plate[q + 2] = d[o + 2]; seen[i] = 1; }
  }
  pullPush();

  const F = levels[0].c;
  for (let i = 0; i < PW * PH; i++) {   // paint the background back over the people
    const o = i * 4;
    let a = (mHi[i] - BG) * 2;
    if (a <= 0) { d[o + 3] = 0; continue; }
    if (a > 1) a = 1;
    d[o] = F[i * 3]; d[o + 1] = F[i * 3 + 1]; d[o + 2] = F[i * 3 + 2]; d[o + 3] = a * 255;
  }
  wctx.putImageData(frame, 0, 0);
  vanishReady = true;
}

/* The camera with any people painted out (plain camera until the segmenter has produced a frame). */
export function drawVanished(c) {
  drawVideo(c);
  if (vanishReady && fresh()) drawVideo(c, work);
}
