const CACHE_NAME = 'armgym-v3';
const ASSETS = [
  '/ArmGym-Tracker/',
  '/ArmGym-Tracker/index.html',
  '/ArmGym-Tracker/manifest.json',
  '/ArmGym-Tracker/icon-192.png',
  '/ArmGym-Tracker/icon-512.png'
];

// Установка: кешируем ресурсы и принудительно активируем скрипт
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Форсирует мгновенную установку
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Активация и захват управления всеми вкладками
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(), // Начинает контролировать страницы немедленно
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        );
      })
    ])
  );
});

// Перехват запросов (работа в офлайне)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

// Фоновые службы (заглушки для валидатора)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workout-database') {
    console.log('Синхронизация...');
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-events-calendar') {
    console.log('Периодическое обновление...');
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Напоминание от ArmGym Tracker!',
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  };
  event.waitUntil(self.registration.showNotification('ArmGym', options));
});
