/* Photos: tap the camera button (or press S) for a 3-2-1 countdown, a flash, then a preview with
   Save and Close. Save opens the share sheet (on iPad: "Save Image" puts it in Photos); where
   sharing files isn't supported it downloads a JPEG instead. The capture is the filter as shown,
   without on-screen text or the countdown. */
import { $, canvas, W, H, FONT, clamp } from './core.js';

const COUNT = 3000, AUTO_CLOSE = 25000;
const snapBtn = $('#snap'), sheet = $('#photo'), img = $('#photoImg');
let countdownEnd = 0, flashAt = 0, blob = null, url = null, closeTimer = 0;

export const photoOpen = () => !sheet.hidden;
export function showSnapButton() { snapBtn.hidden = false; }
export function startCountdown() {
  if (countdownEnd || photoOpen()) return;
  countdownEnd = performance.now() + COUNT;
}

/* Call each frame after the filter is drawn, before any on-screen text. */
export function photoCapture(now) {
  if (!countdownEnd || now < countdownEnd) return;
  countdownEnd = 0; flashAt = now;
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const o = out.getContext('2d');
  o.drawImage(canvas, 0, 0);
  const size = Math.round(Math.min(W, H) * 0.028);
  o.font = `700 ${size}px ${FONT}`; o.textAlign = 'right'; o.textBaseline = 'bottom';
  o.shadowColor = 'rgba(0,0,0,0.8)'; o.shadowBlur = size * 0.5; o.fillStyle = 'rgba(255,231,160,0.9)';
  o.fillText("All Hallows' Mirror · Halloween 2026", W - size, H - size);
  out.toBlob((b) => {
    if (!b) return;
    blob = b;
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(b);
    img.src = url;
    sheet.hidden = false;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closePhoto, AUTO_CLOSE);
  }, 'image/jpeg', 0.92);
}

/* Countdown numbers and the flash, drawn on top of everything. */
export function drawPhotoUI(c, now) {
  if (countdownEnd) {
    const left = countdownEnd - now, n = Math.ceil(left / 1000), k = 1 - (left % 1000) / 1000;
    const size = Math.round(Math.min(W, H) * (0.3 - 0.08 * k));
    c.save();
    c.globalAlpha = clamp(1.2 - k, 0, 1);
    c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = size * 0.2;
    c.fillStyle = '#fff3c4';
    c.fillText(String(n), W / 2, H / 2);
    c.restore();
  }
  const f = (now - flashAt) / 350;
  if (flashAt && f < 1) { c.fillStyle = `rgba(255,255,255,${1 - f})`; c.fillRect(0, 0, W, H); }
}

function closePhoto() { sheet.hidden = true; clearTimeout(closeTimer); }

async function savePhoto() {
  if (!blob) return;
  const d = new Date(), pad = (v) => String(v).padStart(2, '0');
  const name = `mirror-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
  const file = new File([blob], name, { type: 'image/jpeg' });
  clearTimeout(closeTimer);
  closeTimer = setTimeout(closePhoto, AUTO_CLOSE);
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "All Hallows' Mirror" }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

snapBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); startCountdown(); });
$('#photoSave').addEventListener('click', savePhoto);
$('#photoClose').addEventListener('click', closePhoto);
sheet.addEventListener('pointerdown', (e) => { if (e.target === sheet) closePhoto(); });
