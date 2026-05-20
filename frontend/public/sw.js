// Service Worker for Berber PWA
// Bumping CACHE version invalidates all old caches on next load.
const CACHE = "berber-v10";

self.addEventListener("install", (e) => {
  // Activate this SW immediately, skipping waiting state.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Delete every cache not matching the current version.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    // Force reload of all open clients so they pick up new bundle
    const clis = await self.clients.matchAll({ type: "window" });
    clis.forEach((c) => c.navigate(c.url));
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache API traffic
  if (url.pathname.startsWith("/api")) return;
  // Never cache the app shell: always fetch latest HTML + JS/CSS bundles
  if (e.request.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(e.request).catch(() => caches.match("/")));
    return;
  }
  // Network-first for everything else to avoid stale bundles in dev/preview
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (e.request.method === "GET" && res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then((cls) => {
    if (cls.length) return cls[0].focus();
    return clients.openWindow("/");
  }));
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
