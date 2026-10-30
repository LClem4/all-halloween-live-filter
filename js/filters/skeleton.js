/* Skeleton: a bone-white skull over the face (sockets, nose cavity, cheekbones, teeth that part
   when you open your mouth) and a black bodysuit with ribs, collarbones, shoulders and arm bones,
   fitted to the body by segmentation. */
import { drawVideo } from '../core.js';
import { jawI } from '../face.js';
import { desaturate, vignette, softSpot, eyeGeom, facePt } from '../fx.js';
import { drawOutfit, fillBody } from '../props.js';

const BONE = '#ecebe3';
const LIPS_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

function bones(o, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw;
  o.strokeStyle = BONE; o.fillStyle = BONE; o.lineCap = 'round';
  const line = (w, ...pts) => { o.lineWidth = fw * w; o.beginPath(); o.moveTo(...P(...pts[0])); for (const q of pts.slice(1)) o.lineTo(...P(...q)); o.stroke(); };
  for (const s of [-1, 1]) {
    line(0.07, [s * 0.1, -0.95], [s * 0.6, -0.92], [s * 1.05, -1.0]);                  // collarbone
    o.beginPath(); o.arc(...P(s * 1.15, -1.08), fw * 0.11, 0, Math.PI * 2); o.fill();   // shoulder
    line(0.1, [s * 1.2, -1.15], [s * 1.32, -2.6]);                                      // upper arm
    o.beginPath(); o.arc(...P(s * 1.33, -2.65), fw * 0.08, 0, Math.PI * 2); o.fill();   // elbow
    line(0.06, [s * 1.3, -2.7], [s * 1.25, -3.9]); line(0.06, [s * 1.4, -2.7], [s * 1.38, -3.9]);   // forearm
    for (let i = 0; i < 7; i++) {                                                       // ribs, shorter towards the bottom
      const y = -1.15 - i * 0.18, out = 0.85 - i * 0.04;
      o.lineWidth = fw * 0.055;
      o.beginPath(); o.moveTo(...P(s * 0.06, y)); o.quadraticCurveTo(...P(s * out * 0.8, y + 0.08), ...P(s * out, y - 0.28)); o.stroke();
    }
  }
  line(0.1, [0, -1.0], [0, -2.35]);                                                     // sternum
  for (let i = 0; i < 6; i++) { o.beginPath(); o.ellipse(...P(0, -2.55 - i * 0.2), fw * 0.08, fw * 0.05, p.ang, 0, Math.PI * 2); o.fill(); }   // spine
}

function skull(c, p) {
  const P = (a, b) => facePt(p, a, b), fw = p.fw, fh = p.fh, ang = p.ang;
  c.save();
  c.beginPath();
  c.moveTo(...P(0, 0.66));
  c.bezierCurveTo(...P(0.42, 0.68), ...P(0.6, 0.4), ...P(0.56, 0.08));     // cranium to temple
  c.quadraticCurveTo(...P(0.52, -0.08), ...P(0.42, -0.18));                  // cheekbone
  c.quadraticCurveTo(...P(0.36, -0.32), ...P(0.33, -0.46));                  // under the cheekbone
  c.quadraticCurveTo(...P(0.22, -0.6), ...P(0, -0.6));                       // jaw to chin
  c.quadraticCurveTo(...P(-0.22, -0.6), ...P(-0.33, -0.46));
  c.quadraticCurveTo(...P(-0.36, -0.32), ...P(-0.42, -0.18));
  c.quadraticCurveTo(...P(-0.52, -0.08), ...P(-0.56, 0.08));
  c.bezierCurveTo(...P(-0.6, 0.4), ...P(-0.42, 0.68), ...P(0, 0.66));
  c.closePath();
  const [gx, gy] = P(-0.1, 0.3);
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, fw * 0.75);
  g.addColorStop(0, 'rgba(246,244,236,0.95)'); g.addColorStop(1, 'rgba(200,195,180,0.95)');
  c.fillStyle = g; c.fill();
  c.restore();
  for (const s of [-1, 1]) {
    softSpot(c, ...P(s * 0.47, 0.28), fw * 0.12, fh * 0.14, ang, '60,55,50', 0.35, 'multiply');      // temples
    softSpot(c, ...P(s * 0.3, -0.27), fw * 0.14, fh * 0.12, ang - s * 0.3, '25,25,28', 0.75, 'multiply');   // hollow cheeks
  }
  // eye sockets: big, dark and soft-edged; the real eyes glint through faintly
  for (const e of eyeGeom(p)) {
    softSpot(c, e.c[0], e.c[1], e.w * 1.15, e.w * 1.0, ang, '5,5,7', 0.98);
    c.fillStyle = 'rgba(5,5,7,0.85)'; c.beginPath(); c.ellipse(e.c[0], e.c[1], e.w * 0.78, e.w * 0.68, ang, 0, Math.PI * 2); c.fill();
  }
  // nose cavity: an upside-down heart
  const [nx, ny] = p.pts[4], ns = fw * 0.09;
  c.save(); c.translate(nx, ny); c.rotate(ang);
  c.fillStyle = '#060607';
  c.beginPath(); c.moveTo(0, -ns * 1.0);
  c.bezierCurveTo(-ns * 0.3, -ns * 0.5, -ns * 1.0, 0, -ns * 0.5, ns * 0.45); c.quadraticCurveTo(-ns * 0.2, ns * 0.6, 0, ns * 0.3);
  c.quadraticCurveTo(ns * 0.2, ns * 0.6, ns * 0.5, ns * 0.45); c.bezierCurveTo(ns * 1.0, 0, ns * 0.3, -ns * 0.5, 0, -ns * 1.0);
  c.fill();
  c.restore();
  // dark open mouth, then the two rows of teeth
  if (jawI(p) > 0.05) {
    c.beginPath(); LIPS_IN.forEach((i, k) => (k ? c.lineTo(...p.pts[i]) : c.moveTo(...p.pts[i]))); c.closePath();
    c.fillStyle = '#060607'; c.fill();
  }
  const tw = fw * 0.06, th = fh * 0.075;
  for (const [anchor, dir] of [[p.mT, -1], [p.mB, 1]]) {
    c.save(); c.translate(...anchor); c.rotate(ang);
    c.fillStyle = '#f7f4ea'; c.strokeStyle = '#1a1a1a'; c.lineWidth = Math.max(1, fw * 0.008);
    for (let i = -5; i < 5; i++) {
      const h = th * (1 - Math.abs(i + 0.5) * 0.06);
      c.beginPath(); c.rect(i * tw, dir < 0 ? -h : 0, tw, h); c.fill(); c.stroke();
    }
    c.restore();
  }
  c.strokeStyle = 'rgba(20,20,20,0.8)'; c.lineWidth = Math.max(1, fw * 0.01);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...P(s * 0.3, -0.28)); c.lineTo(...P(s * 0.4, -0.24)); c.stroke(); }
}

export default {
  name: 'Skeleton',
  segment: 'mask',
  base(c) { drawVideo(c); desaturate(c, 0.85); },
  face(c, p) {
    drawOutfit(c, p, (o) => { fillBody(o, p, '#0b0b0d'); bones(o, p); });
    skull(c, p);
  },
  overlay(c) { vignette(c, '0,0,10', 0.65); },
};
