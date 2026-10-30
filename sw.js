/* Service worker: keeps the mirror working with no internet. Everything the app loads (its own
   files, the MediaPipe library and its WebAssembly, the face, body and hand models, the font) is
   kept in a cache. The app's own files come from the cache straight away and are refreshed in the
   background, so a new deploy shows up on the next reload; the library and models never change at
   their URLs, so they come only from the cache once saved. The first visit happens before this
   worker is in control, so the page also sends it the list of everything it loaded (main.js). */
const CACHE = 'mirror-v1';
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
const MODELS = 'https://storage.googleapis.com/mediapipe-models';
const PRECACHE = [
  './', './index.html',
  VISION, `${VISION}/wasm/vision_wasm_internal.js`, `${VISION}/wasm/vision_wasm_internal.wasm`,
  `${MODELS}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
  `${MODELS}/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite`,
  `${MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,   // only loaded by Cop and St. Valentine, so fetch it now
];

/* Save any of these URLs not saved yet. For the Google Fonts stylesheet, also the font files it
   points at, which the page may not have needed yet. */
async function save(cache, urls) {
  await Promise.all(urls.map(async (u) => {
    if (!(await cache.match(u))) await cache.add(u).catch(() => {});
    if (u.includes('fonts.googleapis.com/css')) {
      const res = await cache.match(u), css = res ? await res.text() : '';
      await save(cache, css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"\s]+/g) || []);
    }
  }));
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => save(c, PRECACHE)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  if (e.data && Array.isArray(e.data.cache)) e.waitUntil(caches.open(CACHE).then((c) => save(c, e.data.cache)));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const own = new URL(req.url).origin === location.origin;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const fresh = () => fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; });
    const hit = await cache.match(req, { ignoreSearch: own });
    if (hit) {
      if (own) e.waitUntil(fresh().catch(() => {}));
      return hit;
    }
    try { return await fresh(); }
    catch (err) {
      if (req.mode === 'navigate') { const page = (await cache.match('./')) || (await cache.match('./index.html')); if (page) return page; }
      throw err;
    }
  })());
});
