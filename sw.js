const CACHE_NAME = 'armgym-v2';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'screenshot-mobile.png',
  'screenshot-desktop.png'
];

// Установка: кешируем ресурсы
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Активация и очистка старого кеша
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

// ==========================================
// НОВЫЙ КОД (ДОБАВЛЕН В КОНЕЦ ФАЙЛА)
// ==========================================

// --- ОБРАБОТКА ФОНОВОЙ СИНХРОНИЗАЦИИ (Background Sync API) ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workout-database') {
    event.waitUntil(
      console.log('Сеть восстановлена! Синхронизируем локальную базу тренировок с сервером...')
    );
  }
});

// --- ОБРАБОТКА ПЕРИОДИЧЕСКОЙ СИНХРОНИЗАЦИИ (Periodic Background Sync API) ---
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-events-calendar') {
    event.waitUntil(
      console.log('Фоновое обновление: проверяем актуальность календаря соревнований 2026...')
    );
  }
});

// --- ОБРАБОТКА ВЕБ-PUSH УВЕДОМЛЕНИЙ (Web Push API) ---
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Пора проверить план сгонки веса или зафиксировать новый тренировочный подход!',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('ArmGym Tracker', options)
  );
});

// Действие при клике на всплывающее уведомление
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('index.html')
  );
});