# Filters: what each one does, and the decisions already made

Read this before changing or adding a filter. It is the quick reference; the code comments have the detail.

## Decisions already made (don't re-litigate)
- **Theme:** Catholic filters stay respectful (saints, clergy, angels); never devilish or mocking. Halloween and fun filters are fine alongside them. Saint filters show a gold name banner (`caption`) and usually a halo.
- **One filter per file** in `js/filters/`, default export, registered in `js/filters/index.js` (order = groups below). Removed filters go to `js/filters/_archive/` (not loaded) rather than being deleted.
- **Hooks**, drawn in this order: `base(c,t)` → `behind(c,p,t,dt)` per face → person cut-out (only if `segment: 'cutout'`) → `face(c,p,t,dt)` per face → particles → `overlay(c,t)`. A filter with a `base` must draw the camera itself (`drawVideo(c)`), or the last frame stays on screen. Optional `hint` (shown under the name), `segment`, `hands`.
- **Segmentation modes:** `'cutout'` = main.js redraws the person over whatever `base`/`behind` drew (wings, banners, background swaps, trails). `'mask'` = same data, but the filter draws the person itself or only uses the mask (outfits, ghost, outline). `'vanish'` = paint people out. It only runs while such a filter is showing.
- **Costumes cover the real body:** clothing is painted with `drawOutfit(c, p, paint, neck?, shade?)` (props.js). The costume is kept inside the person's silhouette from the neckline down, so it follows shoulders and arms, and the person's own shading is laid back over it. `shade` (default 0.3) is how much of that shading shows; lower it for very dark cloth (Priest 0.16). Never draw clothing as a fixed shape; that was tried and didn't cover the body. Needs `segment: 'mask'` (or `'cutout'`). It falls back to a yoke shape until segmentation is ready.
- **Hands:** `hands: true` loads MediaPipe HandLandmarker on first use (hands.js). `hands` = palms with 21 points; `heartGestures()` finds two hands making a heart. Used by Cop and St. Valentine only.
- **Placement:** use `facePt(p, a, b)` (a = face widths across, + = screen right; b = face heights up from the face centre). Never hard-code pixels. Scale strokes with `p.fw`.
- **Shared code (reuse before writing new):**
  - `fx.js`: `softSpot`, `eyeGeom`, `headDir`, `caption`, `drawCandy`, and particles. `burst` emits from the mouth (sparkle, feather, ember, confetti, candy, coin, note, tear); `rain` drops from the sky (rose, shamrock).
  - `props.js`: `glasses(c, p, style)` (`'wayfarer'`, `'aviator'`, `'nerd'`, `'hippie'`) and `glassesFrame`, `key` (St. Peter, Vatican flag), `mustache`, `drawOutfit` + `fillBody`, `armorPaint`, `mitre` (colourable), `veil`, `habit`, `beard`, `wings`, `heartPath`, `yokePath`.
  - `warp.js`: warps and face swap.
- **Warps** (`warpFace`, `warpRegion`) read the last `snapshot()`. Take a fresh snapshot before each warp when regions might overlap. Whole-face warps looked melted on Giga Chad (since removed), so prefer light and shadow over warping for realism.
- **Glasses**: each style's front is one sprite, drawn once, placed as a flat 3D object by `glassesFrame(p)` using the landmarks' depth (`p.z`): head axes from the eyes and forehead-chin line, 3D eye spacing for scale (doesn't shrink when the head turns), front 0.2 eye spacings ahead of the eyes, smoothed more when still and less when moving. Arms are drawn live from the hinges (`ARMS` in props.js) to the top of each ear (landmarks 127/356, nudged towards 162/389); the far arm fades out as the head turns. History: per-lens drawing with arms to the cheek edges wobbled; a flat sprite with no arms looked wrong ("weird without the ears").
- **Left/right:** the picture is mirrored, so `eyeGeom(p)[0]` and `p.sideA` are not reliably screen-left. Work out the side by projecting onto `p.right`; getting this wrong swapped the glasses' arms and crossed the tears.
- **Mouth-open effects:** only where they add something. Angel's and Nun's mouth effects were removed by request. St. Cecilia (singing) emits music notes.
- **Blendshapes** kept on each pose (`p.bs`): jawOpen, browInnerUp, browOuterUpLeft/Right, mouthSmileLeft/Right, mouthFrownLeft/Right, mouthPucker. Add a name to `BS` in face.js to get another.
- **No `ctx.filter`** (unreliable in iPad Safari). Blend modes (`multiply`, `screen`, `overlay`, `saturation`, `luminosity`, `lighter`) and `shadowBlur` are fine.
- **Performance:** target about 30 fps on an A13. Heavy filters are marked below; per-pixel CPU work stays at ≤ 360 px wide.
- **Halo** is a simple whole ring above the head; a 3D ring tucked behind the head looked like it went into the head.

## facePt cheat sheet (approximate)
| b (up) | what's there | | a (across) | what's there |
|---|---|---|---|---|
| +1.0 | top of a hat/helmet dome; bucket rim | | ±0.5 | sides of the face |
| +0.5 | hairline (landmark 10) | | ±0.6 | temples / hair edge |
| +0.35 | hat or helmet rim on the forehead | | ±0.9 | shoulder tops (perched birds) |
| +0.22 | brows | | ±1.15 | shoulder joints; things held at the side (sword, crozier, keys) |
| +0.1 | eyes | | ±0.38 at b −1.15 | shoulder blades (wing roots) |
| −0.1 | nose tip | | | |
| −0.28 | mouth | | | |
| −0.55 | chin | | | |
| −0.72 | neckline (`drawOutfit` default) | | | |
| −1.0 … −2.5 | chest (numbers, crosses, stoles) | | | |

## The filters
Heavy: **S** = segmentation, **H** = hand tracking, **W** = warps or snapshots, **CPU** = per-pixel JS.

### Saints and the Church
| Name | File | What it does | Trigger | Heavy |
|---|---|---|---|---|
| Halo | halo.js | Ring of light above the head, warm glow | Mouth: rays + sparkles | |
| Saint Icon | saint-icon.js | Gold-leaf icon look: warm tint, gilded nimbus, gold frame | Mouth: rays + sparkles | |
| Angel | angel.js | Wings from the shoulder blades behind the body; halo (no mouth effect) | | S |
| Tongues of Fire | fire.js | Pentecost flame above the head | Mouth: bigger flame, embers | |
| Nun | nun.js | Black veil, white coif, warm glow and slowly turning rays of light behind the head (always on; no mouth effect) | | |
| Priest | priest.js | Fitted near-black clerical shirt (shade 0.16), collar tab, purple confession stole (no hat) | | S |
| Bishop | bishop.js | White and gold mitre, pectoral cross | | |
| Swiss Guard | swissguard.js | Striped uniform fitted to the body, ruff, morion with plume | | S |
| Heaven | heaven.js | Background swap: golden sky, clouds; halo | | S |
| Cathedral | cathedral.js | Background swap: rose window, lancets | | S |
| St. Michael | st-michael.js | Wings, fitted plate armour, halo, flaming sword | | S |
| St. Peter | st-peter.js | Short white beard, green tunic + gold mantle, crossed gold and silver keys | | S |
| St. Francis | st-francis.js | Franciscan habit, cowl, cord; birds flying round and perched on shoulders | | S |
| St. Anthony | st-anthony.js | Habit; lost keys/phone/wallet/remote orbiting | Mouth: items glow, "Found it!" | S |
| St. Thérèse | st-therese.js | Carmelite habit and veil; shower of roses falling | | S |
| St. Lucy | st-lucy.js | Candle crown on a wreath, white gown, red sash, candlelight | | S |
| St. Cecilia | st-cecilia.js | Crown of roses, rose gown, halo | Mouth: music notes | S |
| St. Patrick | st-patrick.js | Green mitre and vestments, white beard, crozier, falling shamrocks | | S |
| St. Nicholas | st-nicholas.js | Red mitre and cope, long white beard | Mouth: gold coins | S |
| St. Valentine | st-valentine.js | Hearts drifting up; a heart made with two hands glows; with two people, a drawn St. Valentine appears above the couple ("Blessed be this love!") | Heart hands | H |
| St. Joan of Arc | st-joan.js | Fitted armour, halo, white fleur-de-lis standard waving behind | | S |
| St. Isidore | st-isidore.js | St. Isidore the Farmer: straw hat, tunic, wheat-field background, wheat swaying in front | | S |
| St. Francis Xavier | st-francis-xavier.js | Black Jesuit cassock with white collar, flaming heart on the chest, wooden cross at the side, halo; dawn-sea background with a snow-capped mountain, gulls and a ship with red-cross sails; the crab of his legend scuttles along the bottom carrying a cross. A dark beard was tried and looked like a mask | | S |

### Spooky
| Name | File | What it does | Trigger | Heavy |
|---|---|---|---|---|
| Jack-o'-Lantern | jackolantern.js | Head becomes a carved pumpkin; holes glow over the real features | Mouth: grin opens | |
| Ghost | ghost.js | Sheet over each whole body (silhouette grown and hung to the floor), eye holes | | S |
| Skeleton | skeleton.js | Full skull (sockets, nose, cheekbones, teeth) + black bodysuit with ribs, collarbones, arm bones | Mouth: teeth part | S |
| Eyes in the Dark | darkeyes.js | Near-black picture, glowing eyes that follow head direction and blink | | |
| Ascended | ascended.js | People made invisible | Walk in from out of view | S, CPU |
| End of the World | apocalypse.js | Background swap: red sky, volcanoes, mushroom clouds, crashing plane, T-rex, pterodactyls, people fleeing zombies and laser aliens; alien invasion: a mothership across the top that charges and blasts the far left horizon, a saucer at the right edge beaming someone up, two saucers strafing the ground; red-orange tint. Keep sky events near the edges, where people don't hide them | | S |

### Faces and costumes
| Name | File | What it does | Trigger | Heavy |
|---|---|---|---|---|
| Big Eyes | bigeyes.js | Eyes enlarged, mouth shrunk | | W |
| Crying | crying.js | Quivering frown, red eyes, thick tear streams down the cheeks dripping into a rising pool (no sideways tears, removed by request). Frowning (or raised inner brows) ramps up `p.sob`: thicker, faster streams, a second stream by the nose, drips falling into the pool. The pool rises per face, faster for sobbing faces (up to 38% of the screen), and drains when nobody is there | Frown | W |
| Puppy | puppy.js | Ears, nose, whisker dots | Mouth: tongue | |
| Cat | cat.js | Ears, nose, whiskers, "w" mouth | | |
| Makeup | makeup.js | Soft everyday makeup, a little stronger so it shows in dim light (blush and lips add a little plain colour on top of multiply) | | |
| Sunglasses | sunglasses.js | Dark wayfarers (3D-placed front, arms to the ears) | | |
| Nerd | nerd.js | Taped glasses, eyes magnified at the lens centres | | W |
| Mustache | mustache.js | Handlebar mustache; Paris at dusk background with sparkling Eiffel Tower | | S |
| Cop | cop.js | Peaked cap, aviators, mustache; donut-shop background with the neon sign on the back wall (behind people) and menu boards whose text is shrunk to fit (it overflowed in portrait); raised hands hold a coffee mug (left of face) or donuts (right) | Raise a hand | S, H |
| Royalty | royalty.js | First person in view (lowest `p.id`) gets the jewelled crown, everyone else a diamond tiara; palace background with gold dome, towers, purple banners, the Vatican flag (yellow/white, keys and tiara) on the left tower and a royal purple flag on the right; herald trumpets with purple banners from the bottom corners, gold-note fanfare every 8 s | | S |
| Disco | disco.js | Big afro with coloured rim light, round rose-to-amber hippie glasses that catch the light, dark club, big mirror ball (top right, clear of faces) throwing flecks of light round the room, 12 beams, two corner spotlights, roaming spots, colour wash changing on each beat (120 bpm) | | |
| Football | football.js | Helmet with face mask, eye black, fitted jersey #12 with shoulder stripes | | S |
| Doctor | doctor.js | Fitted white coat over scrubs, pens, "Dr. Mirror" badge, stethoscope, head mirror | | S |

### Effects and games
| Name | File | What it does | Trigger | Heavy |
|---|---|---|---|---|
| Outline | outline.js | Rainbow glowing outline round each body | | S |
| Time Warp | timewarp.js | Line sweeps down over 9 s freezing what's above it | Move as it passes | |
| Trail | trail.js | Tinted echoes follow each person | Move | S |
| Face Swap | faceswap.js | Two largest faces trade places | Two people | W |
| Birthday Party | birthday.js | Party hat on everyone, HAPPY BIRTHDAY pennants and a light string (behind the hats), balloons up the sides, cake with candles and presents along the bottom. Room is dimmed until a mouth opens, then the party lights up: bulbs glow, spotlights sweep, candles flare, confetti from the mouth and confetti cannons in the bottom corners | Mouth | |
| Candy Kingdom | candyland.js | Background swap: pastel sky, rainbow, cotton-candy clouds, gumdrop hills, lollipops, candy canes, peppermint path; a unicorn gallops along the rainbow, another prances over the hills. Mouth: sweets pour out, rainbow brightens, sparkles shower. (Not called "Candy Land", which is a trademarked game name) | Mouth | S |
| Comic | comic.js | Auto-levelled, softened, posterised colour, clean ink lines, light halftone | Mouth: POW! burst | CPU |
| Fruit Catch | fruitcatch.js | Game: bucket on each head, fruit falls, +100 per catch, score above each bucket; resets when re-entered | Move to catch | |
| Candy Gobbler | gobbler.js | Game: sweets float towards players' mouths from the sides; open mouth to eat (+100, glowing candy corn +300); spiders drop on threads (-200 "YUCK!"); score above each head (`p.gobble`), kept on screen | Open mouth | |
| Make This Face! | copyface.js | Game: banner calls out a face (open wide, big smile, eyebrows up, kissy face, tilt your head) with a cartoon of it and a timer; hold it 0.2 s to score 100 + speed bonus, green ring when you've got it; rounds get quicker and end early once everyone has it; score `p.copyScore` | Expressions | |

### Archived (not loaded)
- Freckles (`_archive/freckles.js`), Soldier (`_archive/soldier.js`), Giga Chad (`_archive/gigachad.js`, reference image still in `images/`), Elvis (`_archive/elvis.js`): removed by request.
- Confetti (`_archive/confetti.js`) and Candy (`_archive/candy.js`): replaced by Birthday Party and Candy Kingdom.

## Adding a filter (checklist)
1. Copy the closest existing filter; place things with `facePt` and the cheat sheet. Clothing goes through `drawOutfit`.
2. Reuse `props.js` / `fx.js` helpers; add a new shared helper only if two filters need it.
3. Register it in `js/filters/index.js` in the right group; add a `hint` if it has a trigger.
4. Add a row to this file.
5. Test headlessly (see "Testing" in CLAUDE.md) and look at the screenshot before calling it done.
