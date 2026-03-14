const CACHE_NAME = "raspisanie-v1";
const SCHEDULE_URL = "/api/schedule";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/assets/images/guap-icon.png",
        "/js/main.js",
        "/js/state.js",
        "/js/constants.js",
        "/js/utils.js",
        "/js/dates.js",
        "/js/scheduleList.js",
        "/js/deadlines.js",
        "/holidayThemes.js",
      ]).catch(() => {});
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === SCHEDULE_URL && event.request.method === "GET") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  if (event.request.mode === "navigate" || (event.request.method === "GET" && event.request.destination !== "worker")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("/index.html"))
      )
    );
    return;
  }
});
