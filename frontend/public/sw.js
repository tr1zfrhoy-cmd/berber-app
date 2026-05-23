// Service Worker for Berber PWA — v16 (PWABuilder-ready)
// Strategy:
//   * App shell precached on install (offline fallback)
//   * API traffic: network-only (no caching)
//   * Navigation: network-first, falls back to cached "/" when offline
//   * Static assets (JS/CSS/img): stale-while-revalidate
const CACHE = "berber-v16";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clis = await self.clients.matchAll({ type: "window" });
    clis.forEach((c) => c.navigate(c.url));
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never touch API traffic
  if (url.pathname.startsWith("/api")) return;

  // Navigations: network-first, offline → cached "/"
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(req)))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Push notification support (basic - real payload-driven setup happens server-side)
self.addEventListener("push", (e) => {
  const data = (() => { try { return e.data?.json() || {}; } catch { return {}; } })();
  const title = data.title || "Berber";
  const options = {
    body: data.body || "لديك إشعار جديد",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "berber-push",
    data: { url: data.url || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url || "/";
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cls) => {
    for (const c of cls) {
      if ("focus" in c) { c.navigate(target); return c.focus(); }
    }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
