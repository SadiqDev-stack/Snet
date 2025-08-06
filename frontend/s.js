
const CACHE_NAME = "snet-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/style.css",
  "/main.js",
  "/socket.io.js",
  "/protect.js",
  "/manifest.json",
  "/message.html",
  "/register.html",
  "/reset.html",
  "/setting.html",
  "/start.html",
  "/template.html",
  "/user_dashboard.html",
  "/verify.html",
  "/offline.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(res =>
          res || caches.match("/offline.html")
        )
      )
  );
});
