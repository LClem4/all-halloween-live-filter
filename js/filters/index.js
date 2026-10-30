/* Filter order as shown on the mirror (see FILTERS.md for what each one does). Each filter is
   { name, hint?, segment?, hands?, ...optional hooks }, drawn in this order:
     base(c, t)           replaces the plain video draw
     behind(c, p, t, dt)  per face, drawn behind the person (needs segment: 'cutout')
     [person cut-out]     when segment === 'cutout' (see segment.js)
     face(c, p, t, dt)    per face
     overlay(c, t)        once, on top
   segment: 'cutout' | 'mask' | 'vanish' runs person segmentation each frame.
   hands: true runs hand tracking (hands.js) each frame.
   hint: a short line shown under the name when the filter comes up. */
import halo from './halo.js';
import saintIcon from './saint-icon.js';
import angel from './angel.js';
import fire from './fire.js';
import nun from './nun.js';
import priest from './priest.js';
import bishop from './bishop.js';
import swissguard from './swissguard.js';
import heaven from './heaven.js';
import cathedral from './cathedral.js';
import stMichael from './st-michael.js';
import stPeter from './st-peter.js';
import stFrancis from './st-francis.js';
import stAnthony from './st-anthony.js';
import stTherese from './st-therese.js';
import stLucy from './st-lucy.js';
import stCecilia from './st-cecilia.js';
import stPatrick from './st-patrick.js';
import stNicholas from './st-nicholas.js';
import stValentine from './st-valentine.js';
import stJoan from './st-joan.js';
import stIsidore from './st-isidore.js';
import stFrancisXavier from './st-francis-xavier.js';
import jackolantern from './jackolantern.js';
import ghost from './ghost.js';
import skeleton from './skeleton.js';
import darkeyes from './darkeyes.js';
import ascended from './ascended.js';
import apocalypse from './apocalypse.js';
import bigeyes from './bigeyes.js';
import crying from './crying.js';
import puppy from './puppy.js';
import cat from './cat.js';
import makeup from './makeup.js';
import sunglasses from './sunglasses.js';
import nerd from './nerd.js';
import mustache from './mustache.js';
import cop from './cop.js';
import royalty from './royalty.js';
import disco from './disco.js';
import football from './football.js';
import doctor from './doctor.js';
import outline from './outline.js';
import timewarp from './timewarp.js';
import trail from './trail.js';
import faceswap from './faceswap.js';
import birthday from './birthday.js';
import candyland from './candyland.js';
import comic from './comic.js';
import fruitcatch from './fruitcatch.js';
import gobbler from './gobbler.js';
import copyface from './copyface.js';

export const FILTERS = [
  // saints and the Church
  halo, saintIcon, angel, fire, nun, priest, bishop, swissguard, heaven, cathedral,
  stMichael, stPeter, stFrancis, stAnthony, stTherese, stLucy, stCecilia, stPatrick, stNicholas, stValentine, stJoan, stIsidore, stFrancisXavier,
  // spooky
  jackolantern, ghost, skeleton, darkeyes, ascended, apocalypse,
  // faces and costumes
  bigeyes, crying, puppy, cat, makeup, sunglasses, nerd, mustache, cop, royalty, disco, football, doctor,
  // effects and games
  outline, timewarp, trail, faceswap, birthday, candyland, comic, fruitcatch, gobbler, copyface,
];
