/* Shared basics: the stage canvas, camera video, sizing, cover-fit mapping and settings. */
export const $ = (s) => document.querySelector(s);
export const canvas = $('#stage');
export const ctx = canvas.getContext('2d');
export const video = $('#cam');
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const FONT = 'Cinzel, Georgia, serif';

export let W = 0, H = 0, DPR = 1;
export function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = Math.round(innerWidth * DPR);
  H = Math.round(innerHeight * DPR);
  canvas.width = W; canvas.height = H;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  updateFit();
}

/* ---------- settings (per-device, optional) ---------- */
export const settings = { auto: false, interval: 20, filter: 0 };
try { Object.assign(settings, JSON.parse(localStorage.getItem('mirror-settings') || '{}')); } catch (e) {}
export function saveSettings() { try { localStorage.setItem('mirror-settings', JSON.stringify(settings)); } catch (e) {} }

/* ---------- video placement (cover fit, mirrored) ---------- */
export const fit = { dw: 0, dh: 0, ox: 0, oy: 0, vw: 0, vh: 0 };
export function updateFit() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh || !W) return;
  const s = Math.max(W / vw, H / vh);
  fit.vw = vw; fit.vh = vh;
  fit.dw = vw * s; fit.dh = vh * s;
  fit.ox = (W - fit.dw) / 2; fit.oy = (H - fit.dh) / 2;
}
/* Draws the camera (or any image with the camera's aspect ratio) cover-fit and mirrored. */
export function drawVideo(c, src = video) {
  c.save();
  c.translate(W, 0); c.scale(-1, 1);
  c.drawImage(src, fit.ox, fit.oy, fit.dw, fit.dh);
  c.restore();
}
export function mapPt(l) { return [W - (fit.ox + l.x * fit.dw), fit.oy + l.y * fit.dh]; }
