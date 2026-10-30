/* Make This Face! (mini game): a banner calls out a face to pull (open wide, big smile, eyebrows
   up, kissy face, tilt your head) with a little cartoon of it and a shrinking timer. Everyone who
   holds that face before time runs out scores 100, plus up to 100 more for being quick, and gets
   a green ring. The round ends early once everyone has it, and the rounds get quicker. Scores
   show above each head and reset when the game is switched back on. */
import { W, H, TAU, FONT, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { facePt, burst } from '../fx.js';

const avg = (a, b) => (a + b) / 2;
const FACES = [
  { say: 'OPEN WIDE!', icon: 'open', ok: (p) => p.bs.jawOpen > 0.5 },
  { say: 'BIG SMILE!', icon: 'smile', ok: (p) => avg(p.bs.mouthSmileLeft, p.bs.mouthSmileRight) > 0.55 },
  { say: 'EYEBROWS UP!', icon: 'brows', ok: (p) => Math.max(p.bs.browInnerUp, avg(p.bs.browOuterUpLeft, p.bs.browOuterUpRight)) > 0.5 },
  { say: 'KISSY FACE!', icon: 'kiss', ok: (p) => p.bs.mouthPucker > 0.5 },
  { say: 'TILT YOUR HEAD!', icon: 'tilt', ok: (p) => Math.abs(p.ang) > 0.28 },
];
const HOLD = 0.2;   // seconds the face must be held

let lastSeen = -1, lastT = 0, round = 0, phase = 'rest', clock = 0, cur = 0, dur = 3;
const by = () => Math.min(W, H) * 0.03, bh = () => Math.min(W, H) * 0.12;   // banner top and height
const pops = [];

/* A round yellow cartoon face pulling the expression. */
function icon(c, x, y, R, kind, t) {
  c.save(); c.translate(x, y);
  if (kind === 'tilt') c.rotate(Math.sin(t * 3) * 0.35);
  c.fillStyle = '#ffd23f'; c.strokeStyle = '#3b2a10'; c.lineWidth = R * 0.08;
  c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#3b2a10';
  if (kind === 'brows') {
    for (const s of [-1, 1]) {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(s * R * 0.33, -R * 0.12, R * 0.17, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#3b2a10'; c.beginPath(); c.arc(s * R * 0.33, -R * 0.1, R * 0.07, 0, TAU); c.fill();
      c.beginPath(); c.arc(s * R * 0.33, -R * 0.38, R * 0.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    }
    c.beginPath(); c.ellipse(0, R * 0.45, R * 0.1, R * 0.13, 0, 0, TAU); c.fill();
  } else {
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * R * 0.33, -R * 0.18, R * 0.1, 0, TAU); c.fill(); }
    if (kind === 'open') {
      c.beginPath(); c.ellipse(0, R * 0.4, R * 0.24, R * 0.3, 0, 0, TAU); c.fill();
      c.fillStyle = '#e05a6a'; c.beginPath(); c.ellipse(0, R * 0.56, R * 0.14, R * 0.09, 0, 0, TAU); c.fill();
    } else if (kind === 'smile') {
      c.beginPath(); c.moveTo(-R * 0.55, R * 0.15); c.quadraticCurveTo(0, R * 0.95, R * 0.55, R * 0.15); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-R * 0.4, R * 0.17, R * 0.8, R * 0.12);
    } else if (kind === 'kiss') {
      c.fillStyle = '#e0405a';
      c.beginPath(); c.ellipse(R * 0.05, R * 0.42, R * 0.13, R * 0.16, 0, 0, TAU); c.fill();
      c.fillStyle = '#9c1c33'; c.beginPath(); c.ellipse(R * 0.05, R * 0.42, R * 0.04, R * 0.06, 0, 0, TAU); c.fill();
      const hx = R * 0.75, hy = -R * 0.75 - Math.sin(t * 4) * R * 0.1, hs = R * 0.35;   // a little heart floating off
      c.fillStyle = '#ff4d6d';
      c.beginPath(); c.moveTo(hx, hy + hs * 0.35);
      c.bezierCurveTo(hx - hs * 0.6, hy - hs * 0.05, hx - hs * 0.45, hy - hs * 0.55, hx, hy - hs * 0.25);
      c.bezierCurveTo(hx + hs * 0.45, hy - hs * 0.55, hx + hs * 0.6, hy - hs * 0.05, hx, hy + hs * 0.35); c.fill();
    } else {
      c.beginPath(); c.moveTo(-R * 0.3, R * 0.4); c.lineTo(R * 0.3, R * 0.4); c.stroke();
    }
  }
  c.restore();
}

export default {
  name: 'Make This Face!',
  hint: 'Copy the face on the banner, fast!',
  base(c, t) {
    if (t - lastSeen > 0.5) { round = 0; phase = 'rest'; clock = 0; pops.length = 0; for (const p of tracks) { p.copyScore = 0; p.matched = false; } }
    lastSeen = t;
    drawVideo(c);
  },
  face(c, p, t, dt) {
    if (p.copyScore === undefined) p.copyScore = 0;
    if (phase === 'go' && !p.matched) {
      p.hold = FACES[cur].ok(p) ? (p.hold || 0) + dt : 0;
      if (p.hold >= HOLD) {
        const pts = 100 + Math.round(100 * Math.max(0, 1 - clock / dur));
        p.copyScore += pts; p.matched = true;
        const [x, y] = facePt(p, 0.6, 0.1);
        pops.push({ x, y, life: 1.1, text: `+${pts}` });
        burst(p, 'sparkle', 1, 0.2, facePt(p, 0, 0.5));
      }
    }
    if (p.matched && round > 0) {   // green ring round everyone who got it
      c.save();
      c.strokeStyle = 'rgba(110,255,140,0.9)'; c.lineWidth = Math.max(3, p.fw * 0.03);
      c.shadowColor = 'rgba(80,255,120,0.9)'; c.shadowBlur = p.fw * 0.1;
      c.beginPath(); c.ellipse(...facePt(p, 0, 0.05), p.fw * 0.62, p.fh * 0.7, p.ang, 0, TAU); c.stroke();
      c.restore();
    }
  },
  overlay(c, t) {
    const dt = Math.min(0.05, Math.max(0, t - lastT)), m = Math.min(W, H);
    lastT = t;
    if (tracks.length) clock += dt;   // wait for players
    if (phase === 'rest' && clock > (round === 0 ? 1.8 : 1.1)) {
      let k = (Math.random() * (FACES.length - 1)) | 0;
      if (round > 0 && k >= cur) k++;   // never the same face twice in a row
      cur = round === 0 ? (Math.random() * FACES.length) | 0 : k;
      dur = Math.max(1.6, 3.4 - round * 0.12); round++; phase = 'go'; clock = 0;
      for (const p of tracks) { p.matched = false; p.hold = 0; }
    } else if (phase === 'go' && (clock > dur || (tracks.length && tracks.every((p) => p.matched)))) {
      phase = 'rest'; clock = 0;
    }

    // the banner: cartoon face, what to do, and the timer
    const size = Math.round(m * 0.06), go = phase === 'go';
    const text = go ? FACES[cur].say : round === 0 ? 'GET READY!' : 'NEXT FACE...';
    c.save();
    c.font = `700 ${size}px ${FONT}`;
    const R = size * 0.9, tw = c.measureText(text).width, bw = tw + R * 2 + size * 1.6, bx = W / 2 - bw / 2;
    const by0 = by(), bh0 = bh();
    c.fillStyle = 'rgba(40,14,60,0.88)'; c.strokeStyle = '#ff9a1f'; c.lineWidth = size * 0.1;
    c.beginPath(); c.roundRect ? c.roundRect(bx, by0, bw, bh0, size * 0.4) : c.rect(bx, by0, bw, bh0); c.fill(); c.stroke();
    icon(c, bx + size * 0.6 + R, by0 + bh0 / 2, R, go ? FACES[cur].icon : 'none', t);
    c.fillStyle = '#fff3c4'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = size * 0.2;
    c.fillText(text, bx + size * 1.0 + R * 2, by0 + bh0 / 2 + size * 0.05);
    if (go) {
      const left = Math.max(0, 1 - clock / dur);
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(bx, by0 + bh0 + size * 0.2, bw, size * 0.18);
      c.fillStyle = `hsl(${left * 120},90%,55%)`; c.fillRect(bx, by0 + bh0 + size * 0.2, bw * left, size * 0.18);
    }
    c.restore();

    // scores above each head and the points as they're won
    const ss = Math.round(m * 0.045);
    c.save();
    c.font = `700 ${ss}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = ss * 0.35;
    for (const p of tracks) {
      const [x, y] = facePt(p, 0, 0.85);
      c.fillStyle = '#fff3c4'; c.fillText(`${p.copyScore || 0}`, x, Math.max(y, by() + bh() + ss * 1.6));   // kept below the banner
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const q = pops[i];
      q.life -= dt; q.y -= m * 0.08 * dt;
      if (q.life <= 0) { pops.splice(i, 1); continue; }
      c.globalAlpha = Math.min(1, q.life); c.fillStyle = '#7CFC00'; c.fillText(q.text, q.x, q.y);
    }
    c.restore();
  },
};
