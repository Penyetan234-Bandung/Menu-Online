// Nama cache unik. Naikkan versi menjadi v2.
const CACHE_NAME = 'penyetan-menu-cache-v2';

// Daftar lengkap file yang disesuaikan dengan folder favicon di screenshot
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'style.css',
  
  // File JavaScript
  'js/main.js',
  'js/config.js',
  'js/data.js',
  'js/ui.js',
  'js/utils.js',
  
  // File dari folder 'favicon' (Sudah disesuaikan dengan gambar)
  'favicon/apple-touch-icon.png',
  'favicon/favicon-96x96.png',
  'favicon/favicon.ico',
  'favicon/favicon.svg',
  'favicon/site.webmanifest',
  'favicon/web-app-manifest-192x192.png',
  'favicon/web-app-manifest-512x512.png',
  
  // Gambar Utama
  'images/logo/logo-header.png',

  // File eksternal (CDN)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Event 'install': Menyimpan file ke cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('Cache dibuka, menambahkan file inti aplikasi');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Event 'fetch': Menyajikan file dari cache jika offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
    .then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Event 'activate': Membersihkan cache lama.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
