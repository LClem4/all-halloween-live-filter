/* Hand tracking (MediaPipe HandLandmarker), loaded only when a filter with `hands: true` is first
   shown. `hands` holds the current hands: { pts: 21 canvas points, c: palm centre, size: wrist to
   middle knuckle }. Landmark ids: 0 wrist, 4 thumb tip, 8 index tip, 9 middle knuckle. */
import vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
import { mapPt } from './core.js';
import { WASM } from './face.js';
const { HandLandmarker, FilesetResolver } = vision;

const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export let handLandmarker = null, handError = null;
let loading = null;
export function loadHands() {
  return loading || (loading = (async () => {
    try {
      const files = await FilesetResolver.forVisionTasks(WASM);
      const opts = (d) => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'VIDEO', numHands: 4 });
      try { handLandmarker = await HandLandmarker.createFromOptions(files, opts('GPU')); }
      catch (e) { handLandmarker = await HandLandmarker.createFromOptions(files, opts('CPU')); }
    } catch (e) { console.error(e); handError = e; }
  })());
}

export let hands = [];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/* Call once per new camera frame while a hands filter is showing. Hands that drop out for a
   frame or two are kept briefly so held props don't flicker. */
export function detectHands(video, now) {
  if (!handLandmarker) return;
  try {
    const res = handLandmarker.detectForVideo(video, now);
    const next = (res.landmarks || []).map((l) => {
      const pts = l.map(mapPt);
      const c = [0, 5, 9, 13, 17].reduce((s, i) => [s[0] + pts[i][0] / 5, s[1] + pts[i][1] / 5], [0, 0]);
      return { pts, c, size: dist(pts[0], pts[9]) || 1, ttl: 5 };
    });
    for (const h of hands) {
      if (--h.ttl > 0 && !next.some((n) => dist(n.c, h.c) < h.size)) next.push(h);
    }
    hands = next;
  } catch (e) { console.warn(e); }
}

/* Two hands (anyone's) making a heart: index fingertips touching above, thumb tips touching
   below. Returns [{ c: centre, size }]. */
export function heartGestures() {
  const out = [];
  for (let i = 0; i < hands.length; i++) {
    for (let j = i + 1; j < hands.length; j++) {
      const A = hands[i], B = hands[j], s = (A.size + B.size) / 2;
      const i8 = dist(A.pts[8], B.pts[8]), i4 = dist(A.pts[4], B.pts[4]);
      const top = [(A.pts[8][0] + B.pts[8][0]) / 2, (A.pts[8][1] + B.pts[8][1]) / 2];
      const bot = [(A.pts[4][0] + B.pts[4][0]) / 2, (A.pts[4][1] + B.pts[4][1]) / 2];
      if (i8 < s * 0.6 && i4 < s * 0.7 && top[1] < bot[1]) {
        out.push({ c: [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2], size: Math.max(dist(top, bot), s * 0.6) });
      }
    }
  }
  return out;
}
