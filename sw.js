// ArmGym Tracker — Service Worker
const CACHE_NAME = 'armgym-tracker-v2';

// 1. Список всех файлов интерфейса. 
// ВАЖНО: Убедитесь, что имена и пути к вашим файлам совпадают на 100%!
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Установка воркера и принудительное кэширование базовых ресурсов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование базовых ресурсов интерфейса');
        // Используем метод, который пропустит ошибки, если какого-то файла временно нет
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => console.warn(`[SW] Не удалось закэшировать: ${url}`, err));
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Активация и удаление старых версий кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват сетевых запросов с гарантированной защитой от аварийного завершения (TypeError: Failed to fetch)
self.addEventListener('fetch', (event) => {
  // Обрабатываем запросы только к нашему сайту (игнорируем сторонние CDN/метрики)
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Игнорируем методы, отличные от GET (например, POST запросы к бэкенду)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Стратегия: если файл есть в кэше — отдаем его СРАЗУ (мгновенный старт офлайн)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если файла нет в кэше — делаем сетевой запрос ПРАВИЛЬНО через возврат fetch
      return fetch(event.request)
        .then((networkResponse) => {
          // Если ответ от сети нормальный, можно динамически положить его в кэш
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // ЖЕСТКИЙ ПЕРЕХВАТ ОШИБКИ СЕТИ. Здесь fetch падает в офлайне, но мы гасим ошибку.
          console.warn('[SW] Ошибка сети при запросе:', event.request.url, error);

          // Если это навигационный запрос (открытие главной страницы) — принудительно отдаем корень из кэша
          if (event.request.mode === 'navigate') {
            return caches.match('/').then((rootResponse) => {
              return rootResponse || caches.match('/index.html');
            });
          }

          // Для остальных файлов возвращаем безопасную пустую заглушку вместо падения приложения
          return new Response('Офлайн режим: файл недоступен.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
    })
  );
});
