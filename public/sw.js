// Minimal safe service worker. It NEVER caches HTML, API responses or any personal data.
// It only precaches the offline fallback page and static icons, and serves the fallback when navigation fails.
const CACHE = "schoolpulse-shell-v1";
const SHELL = ["/offline", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
  } else if (SHELL.includes(new URL(req.url).pathname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
});
