# All Hallows' Mirror

A Halloween costume: an iPad (9th gen, 10.2", Lightning port, A13 chip) worn on a chest plate, screen facing out. People in front of the wearer see themselves through the iPad's front camera with face filters: Catholic-themed ones (saints, angels; keep these respectful, never devilish) plus fun ones (puppy, makeup, disco and so on), background swaps and three mini games.

**Filters: see [FILTERS.md](FILTERS.md)** for what each of the 52 filters does, the conventions and decisions already made, the `facePt` placement cheat sheet and the add-a-filter checklist. Read it before touching a filter.

## How it works
- Plain HTML/CSS/vanilla JS as native ES modules, no build step. Read only the files a task needs:
  - `index.html`: markup and CSS only; loads `js/main.js`.
  - `js/core.js`: canvas, video, `W`/`H`, cover-fit (`fit`, `drawVideo(c, src?)`, `mapPt`), `settings`.
  - `js/face.js`: FaceLandmarker, pose building, `tracks`, `detectFaces`, `jawI`.
  - `js/fx.js`: shared drawing: `facePt`, `mix`, `rng`, `desaturate`, `softSpot`, `eyeGeom`, `headDir`, `rays`, `clipHead`, `drawHalo`, `topGlow`, `vignette`, particles (`burst`).
  - `js/props.js`: wearable props: `glasses` (rigid sprites placed by `glassesFrame`), `mustache`, `drawOutfit`/`fillBody` (costumes fitted to the body via segmentation), `armorPaint`, `mitre`, `veil`, `habit`, `beard`, `wings`, `heartPath`, `yokePath`.
  - `js/hands.js`: MediaPipe HandLandmarker, loaded on first use by a `hands: true` filter; `hands`, `heartGestures()`.
  - `js/warp.js`: `snapshot()` of the stage, textured triangles (`drawTri`), `warpFace`, `warpRegion` + `scaleAbout`, `swapFace`.
  - `js/segment.js`: person segmentation, modes `'cutout'`, `'mask'`, `'vanish'`; `drawPerson`, `personMask`, `personCanvas`, `drawVanished`.
  - `js/photo.js`: camera button, countdown, capture, preview, save/share.
  - `js/filters/*.js`: one file per filter; `js/filters/index.js` sets the order and documents the hooks. `js/filters/_archive/` holds removed filters (not loaded).
  - `js/main.js`: toast/hint/idle text, controls, settings panel (with a jump-to-filter list and an Offline status line), start-up, service worker registration, main loop.
  - `sw.js`: service worker for offline use (see below).
- Face tracking: MediaPipe Tasks Vision `FaceLandmarker` 0.10.3 from jsDelivr, model `face_landmarker.task` (float16) from Google storage. VIDEO mode, up to 4 faces, blendshapes on (`jawOpen` triggers effects). GPU delegate with CPU fallback.
- Rendering: one full-screen 2D canvas. Video is drawn cover-fit and mirrored; `mapPt()` converts normalized landmarks into canvas pixels using the same mapping.
- Faces are smoothed between frames (`updateTracks`). Each pose has: `pts` (all 478 landmarks; the other points are the same arrays), `z` (each landmark's depth in the same pixel scale, smaller = nearer), `id` (increasing per new face, so the lowest id has been in view longest), `bs` (smoothed blendshapes: jawOpen, browInnerUp, browOuterUpLeft/Right, mouthSmileLeft/Right, mouthFrownLeft/Right, mouthPucker), `oval` (36 face-outline points), `fore`, `chin`, `sideA`/`sideB` (cheek edges), `mouth`, `c` (center), `up`/`right` unit vectors, `fw` (face width), `fh` (face height), `ang` (roll), `jaw`.
- Filters: hooks, segmentation modes and per-filter notes are in FILTERS.md. Frame order in `main.js`: filter drawing → particles → `overlay` → photo capture → idle/toast text → countdown/flash.
- Ascended makes people invisible (no halo or effects). In `'vanish'` mode, `segment.js` (selfie_segmenter, CPU delegate, loaded in the background after the face model) works at 256 px wide. It learns background pixels into a clean plate and estimates whole-frame camera shifts each frame from background brightness (±R px at half res), sliding the plate to match. Pull-push fills plate pixels it has never seen from surrounding known background. The result is a low-res layer, with the dilated mask as alpha, over the full-res video. It forgets the plate after a >2.5 s gap in frames. It can't show background it never saw: a person already in frame when the filter starts becomes a soft colour blur until they move.
- Controls: tap/click right half = next filter, left half = previous, camera button (bottom centre) = photo, triple-tap top-left corner = settings panel (auto-cycle, interval, FPS, jump to any filter). Keyboard: arrow keys, A toggles auto-cycle, S takes a photo.
- Photos (`photo.js`): 3-2-1 countdown, white flash, then a polaroid-style preview with Save and Close (auto-closes after 25 s). The capture is the filtered canvas without on-screen text, with a small "All Hallows' Mirror · Halloween 2026" caption. Save uses the Web Share sheet (on iPad "Save Image" goes to Photos), falling back to a JPEG download.
- Kiosk: tap-to-start screen (required for camera), Wake Lock, fullscreen, settings saved in localStorage.
- Offline (`sw.js`): a service worker caches everything the app loads: its own files, the MediaPipe bundle and WebAssembly, the three models (the hand model is fetched at install because only Cop/St. Valentine load it) and the Google Font files. The page also posts its `performance` resource list to the worker at 10/30/90 s, because the first visit loads before the worker controls it. Own files: served from cache, refreshed in the background (after a deploy, the second load shows the new version). CDN/model files: cache only once saved. The cache name `mirror-v1` is also used by `checkOffline()` in main.js; bump both to force a full refetch. Verified headless: loaded with the local server stopped and every host unresolvable, face, segmentation and hand models all started.

## Constraints
- Must run in iPad Safari. Avoid `ctx.filter` (unreliable in Safari canvas). Camera needs HTTPS or localhost.
- Keep it smooth on an A13 at about 30 fps; camera requested at 640x480.
- Party lighting is dim; the frame has a USB LED light strip around it.
- Deadline: Halloween, Saturday October 31, 2026.

## Running locally
`python3 -m http.server 8000` in this folder, then open http://localhost:8000. Deploy for the iPad via GitHub Pages. The service worker serves cached files first, so reload twice after an edit (or tick "Update on reload" in DevTools > Application).

## Testing
No test suite. Filters are checked headlessly: Edge (`msedge --headless=new --remote-debugging-port=…`) driven over the DevTools protocol from Python (`websockets`). `getUserMedia` is replaced via `Page.addScriptToEvaluateOnNewDocument` with a canvas `captureStream()` of a keyed-out portrait (MediaPipe's `business-person.png`) over a patterned "room", so faces and segmentation are real. Filters are switched by clicking `#plist` buttons; blendshapes are forced by wrapping `landmarker.detectForVideo` and overwriting the category scores in its result (writing `tracks[i].bs` directly gets averaged away by the smoothing, so thresholds are never reached); face detection sometimes finds no face in a headless run, so rerun if `tracks` is empty; gestures are faked by replacing `handLandmarker.detectForVideo` with one returning synthetic landmarks; screenshots come from `Page.captureScreenshot`. Disable the network cache (`Network.setCacheDisabled`) or edited modules won't reload. Always look at the screenshots: a filter can run error-free and still look wrong. Test portrait too (`--window-size=900,1200`): the iPad may be worn upright and backgrounds or text that fit landscape can overflow. Offline check: load once with the network so `sw.js` fills its cache, stop the local server, relaunch Edge on the same profile with `--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE localhost"` and confirm the models still load.

## Future ideas (not built yet)
- See-through mode: a Galaxy A53 on the wearer's back streams its rear camera to the iPad over WebRTC (PeerJS), via the phone's hotspot. A second page (`back.html`) would send; the mirror app would switch modes with a two-finger tap and fall back to filters if the stream drops.
- "Taken Up" filter: when two people are in frame, a countdown picks one at random, who turns into a rising golden silhouette. Would need per-person masks (MediaPipe PoseLandmarker with segmentation masks); the selfie segmenter in `segment.js` gives one mask for everyone.
