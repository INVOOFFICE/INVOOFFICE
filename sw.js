const CACHE_NAME = 'invoocache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/blogs/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/css/variables.css',
  '/assets/css/base.css',
  '/assets/css/components.css',
  '/assets/js/main.js',
  '/assets/js/modules/charts.js',
  '/assets/js/modules/faq.js',
  '/assets/js/modules/counter.js',
  '/assets/js/modules/reveal.js',
  '/assets/js/modules/navbar.js',
  '/assets/icons/icon.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/favicon-32.png',
  '/assets/icons/favicon-16.png'
];

const STATIC_ASSET_REGEX = /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot)(\?.*)?$/;
const HTML_REGEX = /\/[^.]*$/;
const GOOGLE_FONTS_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (GOOGLE_FONTS_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (STATIC_ASSET_REGEX.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (HTML_REGEX.test(url.pathname) || url.pathname.endsWith('/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}
