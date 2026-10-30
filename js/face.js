/* Face tracking: MediaPipe FaceLandmarker -> smoothed per-face poses (see CLAUDE.md for pose fields). */
import vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
import { mapPt, clamp, fit } from './core.js';
const { FaceLandmarker, FilesetResolver } = vision;

export const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export let landmarker = null, delegate = '', modelError = null;
async function initModel() {
  const files = await FilesetResolver.forVisionTasks(WASM);
  const opts = (d) => ({
    baseOptions: { modelAssetPath: MODEL, delegate: d },
    runningMode: 'VIDEO', numFaces: 4, outputFaceBlendshapes: true,
  });
  try { landmarker = await FaceLandmarker.createFromOptions(files, opts('GPU')); delegate = 'GPU'; }
  catch (e) { landmarker = await FaceLandmarker.createFromOptions(files, opts('CPU')); delegate = 'CPU'; }
}
export const modelReady = initModel().catch((e) => { console.error(e); modelError = e; });

/* ---------- landmarks -> face pose ---------- */
const OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const KEY = { fore: 10, chin: 152, nose: 1, mT: 13, mB: 14, sideA: 234, sideB: 454, eA1: 33, eA2: 133, eB1: 263, eB2: 362 };

/* Blendshapes kept per face (smoothed), e.g. p.bs.browOuterUpLeft. */
const BS = ['jawOpen', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight', 'mouthSmileLeft', 'mouthSmileRight',
  'mouthFrownLeft', 'mouthFrownRight', 'mouthPucker'];

/* p.pts holds all 478 landmarks in canvas pixels; p.oval and the KEY points are the same arrays.
   p.z holds each landmark's depth in the same pixel scale (smaller = nearer the camera). */
function rawPose(lms, bs) {
  const pts = lms.map(mapPt);
  const p = { pts, z: lms.map((l) => l.z * fit.dw), oval: OVAL.map((i) => pts[i]), bs: {} };
  for (const k in KEY) p[k] = pts[KEY[k]];
  for (const n of BS) p.bs[n] = 0;
  if (bs && bs.categories) {
    for (const c of bs.categories) if (c.categoryName in p.bs) p.bs[c.categoryName] = c.score;
  }
  p.jaw = p.bs.jawOpen;
  return p;
}
function derive(p) {
  let cx = 0, cy = 0;
  for (const [x, y] of p.oval) { cx += x; cy += y; }
  cx /= p.oval.length; cy /= p.oval.length;
  const ux = p.fore[0] - p.chin[0], uy = p.fore[1] - p.chin[1];
  const fh = Math.hypot(ux, uy) || 1;
  const up = [ux / fh, uy / fh];
  const right = [-up[1], up[0]];
  const fw = Math.hypot(p.sideB[0] - p.sideA[0], p.sideB[1] - p.sideA[1]) || fh * 0.8;
  p.c = [cx, cy]; p.up = up; p.right = right; p.fh = fh; p.fw = fw;
  p.ang = Math.atan2(right[1], right[0]);
  p.mouth = [(p.mT[0] + p.mB[0]) / 2, (p.mT[1] + p.mB[1]) / 2];
  return p;
}

/* Smooth faces between frames so effects don't jitter. */
export let tracks = [];
let nextId = 1;   // each new face gets the next id, so the first person to arrive has the lowest
function lerpPt(a, b, t) { a[0] += (b[0] - a[0]) * t; a[1] += (b[1] - a[1]) * t; }
function updateTracks(raws) {
  const used = new Set();
  const next = [];
  for (const r of raws) {
    derive(r);
    let best = null, bd = Infinity;
    for (const tr of tracks) {
      if (used.has(tr)) continue;
      const d = Math.hypot(tr.c[0] - r.c[0], tr.c[1] - r.c[1]);
      if (d < bd) { bd = d; best = tr; }
    }
    if (best && bd < r.fw * 0.6) {
      used.add(best);
      const a = 0.6;
      for (let i = 0; i < r.pts.length; i++) { lerpPt(best.pts[i], r.pts[i], a); best.z[i] += (r.z[i] - best.z[i]) * a; }
      for (const n of BS) best.bs[n] += (r.bs[n] - best.bs[n]) * 0.5;
      best.jaw = best.bs.jawOpen;
      best.ttl = 6;
      derive(best);
      next.push(best);
    } else {
      r.ttl = 6;
      r.seed = Math.random() * 10;
      r.id = nextId++;
      next.push(r);
    }
  }
  for (const tr of tracks) {
    if (!used.has(tr) && --tr.ttl > 0) next.push(tr);
  }
  tracks = next;
}

/* Run the landmarker on a new video frame and update `tracks`. */
export function detectFaces(video, now) {
  if (!landmarker) return;
  try {
    const res = landmarker.detectForVideo(video, now);
    const raws = (res.faceLandmarks || []).map((l, i) => rawPose(l, res.faceBlendshapes && res.faceBlendshapes[i]));
    updateTracks(raws);
  } catch (e) { console.warn(e); }
}

export const jawI = (p) => clamp((p.jaw - 0.25) / 0.45, 0, 1);
