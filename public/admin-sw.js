const CACHE_NAME = 'admin-carta-v1';
const urlsToCache = [
  '/admin',
  '/admin-manifest.json'
];

// Instalação do service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Receber notificações push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || '📱 Nova Atividade';
  const options = {
    body: data.body || 'Alguém interagiu com a carta',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'notification',
    requireInteraction: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/admin')
  );
});

// Fetch (network first, cache fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
