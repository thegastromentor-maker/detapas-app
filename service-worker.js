const CACHE_NAME = 'detapas-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.log('Error cacheando assets:', err);
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Para la web de detapasconchencho, intentar siempre obtener versión fresca
    if (url.hostname === 'www.detapasconchencho.es') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cachear si es exitoso
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Usar caché si no hay conexión
                    return caches.match(request);
                })
        );
        return;
    }

    // Para OpenStreetMap y otros recursos, usar caché con fallback
    if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('openstreetmap')) {
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                }).catch(() => {
                    return new Response('No disponible offline', { status: 503 });
                });
            })
        );
        return;
    }

    // Para otros recursos
    event.respondWith(
        caches.match(request).then(response => {
            return response || fetch(request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clone);
                    });
                }
                return response;
            }).catch(() => {
                return new Response('No disponible offline', { status: 503 });
            });
        })
    );
});

// Actualización de fondo
self.addEventListener('sync', event => {
    if (event.tag === 'update-restaurants') {
        event.waitUntil(
            fetch('https://www.detapasconchencho.es/mapa/')
                .then(response => response.text())
                .catch(err => console.log('Error actualizando datos:', err))
        );
    }
});
