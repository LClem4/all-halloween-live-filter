/* Giga Chad, modelled on a low-key studio portrait (images/gigachad.jpg): black backdrop, dark
   contrasty black and white, hard light from one side, deep-set eyes under heavy dark brows,
   hollow cheeks, a shadowed jawline with stubble. No face warping (it looked melted): the
   sculpting is light, shadow and texture. Raise an eyebrow, even slightly, for the meme moment:
   slow punch-in, a little shake and a glint in the eye. */
import { W, H, clamp, drawVideo } from '../core.js';
import { tracks } from '../face.js';
import { desaturate, vignette, drawStar, facePt, softSpot, eyeGeom } from '../fx.js';
import { snapshot } from '../warp.js';
import { personReady, drawPerson } from '../segment.js';

const BROWS = [[70, 63, 105, 66, 107], [300, 293, 334, 296, 336]];
const LIPS_OUT = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const browI = (p) => clamp((Math.max(p.bs.browOuterUpLeft, p.bs.browOuterUpRight, p.bs.browInnerUp) - 0.12) / 0.28, 0, 1);
const biggest = () => { let p = null; for (const q of tracks) if (!p || q.fw > p.fw) p = q; return p; };
let zoom = 0, stubble = null;

function stubblePattern(c) {
  const t = document.createElement('canvas'); t.width = t.height = 48;
  const s = t.getContext('2d');
  for (let i = 0; i < 420; i++) {
    s.fillStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.3})`;
    s.beginPath(); s.arc(Math.random() * 48, Math.random() * 48, 0.35 + Math.random() * 0.45, 0, Math.PI * 2); s.fill();
  }
  return c.createPattern(t, 'repeat');
}

export default {
  name: 'Giga Chad',
  hint: 'Raise an eyebrow',
  segment: 'mask',
  base(c) {
    // black studio backdrop, a faint pool of light behind the head, then the person on top
    c.fillStyle = '#050505'; c.fillRect(0, 0, W, H);
    const p = biggest();
    if (p) softSpot(c, ...facePt(p, 0, 0.2), p.fw * 2, p.fw * 2, 0, '75,75,75', 0.9);
    if (personReady()) drawPerson(c); else drawVideo(c);
    desaturate(c, 1);
    // darken the mid-tones, then add contrast by laying the picture over itself
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(200,200,200)'; c.fillRect(0, 0, W, H); c.restore();
    const s = snapshot();
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.7; c.drawImage(s, 0, 0); c.restore();
  },
  face(c, p) {
    const P = p.pts, u = p.up, fw = p.fw, fh = p.fh, ang = p.ang;
    // key light from the right: a smooth falloff into shadow across the left of the face and body
    const [x0, y0] = facePt(p, -0.75, 0), [x1, y1] = facePt(p, 0.25, 0);
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0.65)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    softSpot(c, ...facePt(p, 0.18, 0.1), fw * 0.25, fh * 0.35, ang, '255,255,255', 0.1, 'screen');
    // stubble over the jaw, chin and upper lip (not the lips)
    if (!stubble) stubble = stubblePattern(c);
    c.save();
    c.beginPath();
    p.oval.slice(8, 29).forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q)));
    c.lineTo(...facePt(p, -0.34, -0.06)); c.lineTo(...P[2]); c.lineTo(...facePt(p, 0.34, -0.06)); c.closePath();
    LIPS_OUT.forEach((i, k) => (k ? c.lineTo(...P[i]) : c.moveTo(...P[i]))); c.closePath();
    c.clip('evenodd');
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.4;
    c.fillStyle = stubble; c.fillRect(0, 0, W, H);
    c.restore();
    // heavy, slightly lowered brows
    c.save();
    c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = fw * 0.045; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const ids of BROWS) {
      c.beginPath();
      ids.forEach((i, k) => { const q = [P[i][0] - u[0] * fh * 0.01, P[i][1] - u[1] * fh * 0.01]; if (k) c.lineTo(...q); else c.moveTo(...q); });
      c.stroke();
    }
    c.restore();
    // deep-set eyes, hollow cheeks, lit cheekbones and nose bridge
    for (const e of eyeGeom(p)) softSpot(c, e.c[0] + u[0] * fh * 0.03, e.c[1] + u[1] * fh * 0.03, e.w * 0.95, e.w * 0.55, ang, '0,0,0', 0.35, 'multiply');
    for (const sd of [-1, 1]) {
      softSpot(c, ...facePt(p, sd * 0.32, -0.17), fw * 0.17, fh * 0.07, ang - sd * 0.55, '0,0,0', 0.3, 'multiply');
      softSpot(c, ...facePt(p, sd * 0.28, 0.02), fw * 0.1, fh * 0.035, ang - sd * 0.4, '255,255,255', 0.1, 'screen');
    }
    softSpot(c, ...P[6], fw * 0.03, fh * 0.12, ang, '255,255,255', 0.1, 'screen');
    // a hard jawline: shadow along the jaw and under it onto the neck
    c.save();
    c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = fw * 0.05;
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = fw * 0.05; c.lineCap = 'round';
    c.beginPath(); p.oval.slice(11, 26).forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.stroke();
    c.restore();
    softSpot(c, ...facePt(p, 0, -0.74), fw * 0.6, fh * 0.16, ang, '0,0,0', 0.5, 'multiply');
  },
  overlay(c, t) {
    const p = biggest();
    const target = p ? browI(p) : 0;
    zoom += (target - zoom) * (target > zoom ? 0.25 : 0.08);
    if (p && zoom > 0.01) {
      const z = 1 + zoom * 0.14, [cx, cy] = p.c;
      const jx = (Math.random() - 0.5) * p.fw * 0.025 * zoom, jy = (Math.random() - 0.5) * p.fw * 0.025 * zoom;
      c.drawImage(snapshot(), cx - cx * z + jx, cy - cy * z + jy, W * z, H * z);
      const eye = p.bs.browOuterUpLeft > p.bs.browOuterUpRight ? p.eB1 : p.eA1;
      c.save(); c.globalCompositeOperation = 'lighter';
      drawStar(c, cx + (eye[0] - cx) * z + jx, cy + (eye[1] - cy) * z + jy, p.fw * 0.1 * zoom, t * 2, `rgba(255,255,255,${0.85 * zoom})`);
      c.restore();
    }
    vignette(c, '0,0,0', 0.8);
  },
};
