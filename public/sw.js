// Local Bandi Multi Services Service Worker
const CACHE_NAME = 'localbandi-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/vendor.html',
  '/delivery.html',
  '/branch-admin.html',
  '/admin.html',
  '/partner.html',
  '/franchise.html',
  '/manifest.json',
  '/manifest-vendor.json',
  '/manifest-delivery.json',
  '/manifest-branch.json',
  '/manifest-admin.json',
  '/manifest-partner.json',
  '/manifest-franchise.json',
  '/favicon.svg',
  '/favicon.png',
  '/icon-48.png',
  '/icon-96.png',
  '/icon-144.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching partial fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET and API / Firebase Firestore requests directly to network
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate: Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // If offline and navigating, return corresponding fallback entry
        if (event.request.mode === 'navigate') {
          const url = event.request.url;
          if (url.includes('/vendor')) return caches.match('/vendor.html');
          if (url.includes('/delivery') || url.includes('/rider')) return caches.match('/delivery.html');
          if (url.includes('/branch') || url.includes('/franchise')) return caches.match('/branch-admin.html');
          if (url.includes('/admin')) return caches.match('/admin.html');
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Push notification support across all five standalone apps
self.addEventListener('push', (event) => {
  let data = {
    title: 'Local Bandi Alert',
    body: 'You have a new real-time update!',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    url: '/'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-96.png',
      data: data.url || '/',
      vibrate: [200, 100, 200],
      tag: 'localbandi-push',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
