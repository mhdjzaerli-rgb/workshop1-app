// sw.js — Service Worker لورشة الخياطة
const CACHE_NAME = 'workshop-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png'];

// ── تثبيت SW وتخزين الملفات
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(){});
    })
  );
});

// ── تفعيل SW
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// ── الاستجابة للطلبات
self.addEventListener('fetch', function(e) {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        if(response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){ return cached; });
    })
  );
});

// ── استقبال رسائل من التطبيق
self.addEventListener('message', function(e) {
  if(e.data && e.data.type === 'DAILY_REPORT') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: 'daily-report',
      renotify: true
    });
  }
});

// ── النقر على الإشعار يفتح التطبيق
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      if(cls.length) return cls[0].focus();
      return clients.openWindow('/');
    })
  );
});
navigator.serviceWorker.register('sw.js').then(reg => {
    reg.update(); // يجبر المتصفح على تحديث الملفات فوراً
    console.log('SW Registered');
});
