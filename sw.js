// Service worker de Pesca Litoral: guarda la app para que abra sin señal.
// publicar-web.bat reemplaza 20261031200430 en cada publicación, así los celulares toman la versión nueva.
const VERSION = "20261031200430";
const CACHE = "pesca-litoral-" + VERSION;
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("pesca-litoral-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // clima, ríos y datos van directo a internet
  const pagina = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (pagina) {
    // Primero internet (para tener siempre la última versión); sin señal, la copia guardada
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html").then(r => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); return res; })));
});
