/* Entry point: on-screen text, controls, settings panel, start-up and the main loop. */
import { $, canvas, ctx, video, clamp, FONT, W, H, resize, updateFit, fit, settings, saveSettings, drawVideo } from './core.js';
import { landmarker, delegate, modelError, modelReady, tracks, detectFaces } from './face.js';
import { updateParts, drawParts, parts } from './fx.js';
import { segmenter, segError, loadSegmenter, segmentFrame, drawPerson } from './segment.js';
import { handLandmarker, handError, loadHands, detectHands } from './hands.js';
import { FILTERS } from './filters/index.js';
import { showSnapButton, startCountdown, photoCapture, drawPhotoUI, photoOpen } from './photo.js';

let cur = clamp(settings.filter | 0, 0, FILTERS.length - 1);

/* ---------- on-screen text ---------- */
let toast = null;
function showToast(text, ms = 1600, sub = '') { toast = { text, sub, until: performance.now() + ms, start: performance.now() }; }
function drawToast(c, now) {
  if (!toast || now > toast.until) return;
  const fadeIn = clamp((now - toast.start) / 250, 0, 1), fadeOut = clamp((toast.until - now) / 400, 0, 1);
  const size = Math.round(Math.min(W, H) * 0.06);
  c.save();
  c.globalAlpha = Math.min(fadeIn, fadeOut);
  c.font = `700 ${size}px ${FONT}`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = size * 0.4;
  c.fillStyle = '#ffe7a0';
  const y = H - Math.min(W, H) * (toast.sub ? 0.2 : 0.14);
  c.fillText(toast.text, W / 2, y);
  if (toast.sub) {
    c.font = `500 ${Math.round(size * 0.55)}px ${FONT}`; c.fillStyle = '#fff3c4';
    c.fillText(toast.sub, W / 2, y + size * 0.95);
  }
  c.restore();
}

const IDLE = ['Step closer...', 'Every saint deserves a halo', 'Come see your heavenly side', "Happy All Hallows' Eve"];
let noFaceSince = performance.now();
function drawIdle(c, now) {
  if (tracks.length) { noFaceSince = now; return; }
  const idle = now - noFaceSince;
  if (idle < 2500) return;
  const a = clamp((idle - 2500) / 800, 0, 1) * (0.75 + 0.25 * Math.sin(now / 600));
  const phrase = IDLE[Math.floor(idle / 4500) % IDLE.length];
  const size = Math.round(Math.min(W, H) * 0.065);
  c.save();
  c.globalAlpha = a;
  c.font = `700 ${size}px ${FONT}`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = 'rgba(255,200,90,0.9)'; c.shadowBlur = size * 0.6;
  c.fillStyle = '#fff3c4';
  c.fillText(phrase, W / 2, H * 0.5);
  c.restore();
}

/* ---------- controls ---------- */
const panel = $('#panel');
let lastSwitch = performance.now();
function setFilter(i) {
  cur = (i + FILTERS.length) % FILTERS.length;
  settings.filter = cur; saveSettings();
  lastSwitch = performance.now();
  parts.length = 0;
  showToast(FILTERS[cur].name, FILTERS[cur].hint ? 2600 : 1600, FILTERS[cur].hint);
  refreshPanel();
}
let cornerTaps = [];
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (e.clientX < 90 && e.clientY < 90) {
    const now = performance.now();
    cornerTaps = cornerTaps.filter((t) => now - t < 700);
    cornerTaps.push(now);
    if (cornerTaps.length >= 3) { cornerTaps = []; togglePanel(); }
    return;
  }
  if (!panel.hidden || photoOpen()) return;
  setFilter(cur + (e.clientX >= innerWidth / 2 ? 1 : -1));
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') setFilter(cur + 1);
  else if (e.key === 'ArrowLeft') setFilter(cur - 1);
  else if (e.key === 's' || e.key === 'S') startCountdown();
  else if (e.key === 'a' || e.key === 'A') { settings.auto = !settings.auto; saveSettings(); refreshPanel(); showToast(settings.auto ? 'Auto-cycle on' : 'Auto-cycle off'); }
});

const INTERVALS = [10, 20, 30, 60];
/* One button per filter in the panel, to jump straight to it. */
const plist = $('#plist');
FILTERS.forEach((f, i) => {
  const b = document.createElement('button');
  b.textContent = f.name;
  b.onclick = () => setFilter(i);
  plist.appendChild(b);
});
function refreshPanel() {
  $('#pauto').textContent = `Auto-cycle: ${settings.auto ? 'On' : 'Off'}`;
  $('#pint').textContent = `Every ${settings.interval}s`;
  [...plist.children].forEach((b, i) => b.classList.toggle('on', i === cur));
}
function togglePanel() { panel.hidden = !panel.hidden; refreshPanel(); }
$('#pclose').onclick = () => { panel.hidden = true; };
$('#pauto').onclick = () => { settings.auto = !settings.auto; lastSwitch = performance.now(); saveSettings(); refreshPanel(); };
$('#pint').onclick = () => {
  const i = INTERVALS.indexOf(settings.interval);
  settings.interval = INTERVALS[(i + 1) % INTERVALS.length];
  saveSettings(); refreshPanel();
};

/* ---------- start-up ---------- */
let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && started) requestWakeLock(); });

function goFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (e) {}
}

const startEl = $('#start'), startBtn = $('#startBtn'), msg = $('#msg');
let started = false;
async function start() {
  if (started) return;
  started = true;
  goFullscreen();   // before any await: Safari only allows it during the tap itself
  msg.textContent = '';
  startBtn.textContent = 'Waking the saints…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    started = false;
    startBtn.textContent = 'Tap to try again';
    msg.textContent = 'Camera access is needed. Allow camera access for this site in Safari settings, then try again.';
    return;
  }
  requestWakeLock();
  await modelReady;
  updateFit();
  startEl.classList.add('gone');
  setTimeout(() => { startEl.style.display = 'none'; }, 700);
  showSnapButton();
  if (!landmarker) showToast('Face tracking unavailable. Check the internet connection and reload.', 6000);
  else showToast(FILTERS[cur].name, 2200);
}
startBtn.addEventListener('click', start);
modelReady.then(loadSegmenter);

/* ---------- offline (see sw.js) ---------- */
// Only over http(s): opened as a file, trying to register makes some embedded preview browsers
// kill the page ("render process gone") instead of just failing.
let offline = 'checking', swOn = false;
if (!location.protocol.startsWith('http')) offline = 'off (opened as a file)';
else if ('serviceWorker' in navigator) {
  swOn = true;
  navigator.serviceWorker.register('sw.js').catch((e) => { offline = 'unavailable'; console.warn(e); });
  // the first visit loads everything before the worker takes over, so hand it the list to keep
  const keepAll = () => navigator.serviceWorker.ready.then((r) => r.active && r.active.postMessage({
    cache: [location.href.split('#')[0], ...performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.startsWith('http'))],
  }));
  for (const s of [10, 30, 90]) setTimeout(keepAll, s * 1000);
} else offline = 'not supported';
/* How much is saved for offline use, shown in the settings panel. 'mirror-v1' must match sw.js. */
async function checkOffline() {
  if (!swOn || !window.caches || offline === 'unavailable') return;
  try {
    const keys = await (await caches.open('mirror-v1')).keys();
    const have = ['face_landmarker.task', 'selfie_segmenter.tflite', 'hand_landmarker.task', '.wasm'].filter((n) => keys.some((k) => k.url.includes(n))).length;
    offline = have === 4 ? `ready, ${keys.length} files saved` : `saving (${keys.length} files, ${have} of 4 models)`;
  } catch (e) { offline = 'unavailable'; }
}

/* ---------- main loop ---------- */
let lastVideoTime = -1, lastFrame = performance.now();
let fps = 0, fpsFrames = 0, fpsStart = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const t = now / 1000;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (video.readyState < 2) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    return;
  }
  if (video.videoWidth !== fit.vw || video.videoHeight !== fit.vh) updateFit();

  if (settings.auto && now - lastSwitch > settings.interval * 1000) setFilter(cur + 1);
  const f = FILTERS[cur];

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    detectFaces(video, now);
    if (f.segment) segmentFrame(now, f.segment);
    if (f.hands) { loadHands(); detectHands(video, now); }
  }

  if (f.base) f.base(ctx, t); else drawVideo(ctx);
  if (f.behind) for (const p of tracks) f.behind(ctx, p, t, dt);
  if (f.segment === 'cutout') drawPerson(ctx);
  if (f.face) for (const p of tracks) f.face(ctx, p, t, dt);
  updateParts(dt);
  drawParts(ctx);
  if (f.overlay) f.overlay(ctx, t);
  photoCapture(now);   // before any on-screen text, so photos are clean
  drawIdle(ctx, now);
  drawToast(ctx, now);
  drawPhotoUI(ctx, now);

  fpsFrames++;
  if (now - fpsStart > 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsStart));
    fpsFrames = 0; fpsStart = now;
    if (!panel.hidden) {
      checkOffline();
      $('#pinfo').textContent =
        `FPS: ${fps}\nFaces: ${tracks.length}\nTracking: ${landmarker ? delegate : modelError ? 'failed' : 'loading'}\n` +
        `Segmenter: ${segmenter ? 'ready' : segError ? 'failed' : 'loading'}\nHands: ${handLandmarker ? 'ready' : handError ? 'failed' : 'not loaded'}\nCamera: ${fit.vw}×${fit.vh}\nFilter: ${FILTERS[cur].name}\nOffline: ${offline}`;
    }
  }
}

window.addEventListener('resize', resize);
resize();
if (document.fonts && document.fonts.load) document.fonts.load(`700 40px Cinzel`).catch(() => {});
requestAnimationFrame(frame);
