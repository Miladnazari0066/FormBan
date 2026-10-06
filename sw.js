/* ══════════════════════════════════════════════════════════════════
   سی تک پارسیان — Service Worker
   ══════════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'sitak-v2';
const APP_SHELL = ['./', './index.html'];
const CDN_CACHE = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/gh/font-store/font-B-Yekan/BYekan.ttf',
  'https://cdn.jsdelivr.net/gh/mahdi-sharifimehr/persian-fonts@master/BYekan/BYekan.ttf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(APP_SHELL.map(u => cache.add(u).catch(() => {})));
      await Promise.allSettled(CDN_CACHE.map(u => cache.add(u).catch(() => {})));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(!url.protocol.startsWith('http')) return;

  if(url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) return;

  if(req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) {
        if(req.destination === 'document') {
          fetch(req).then(res => {
            if(res && res.status === 200) {
              caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
            }
          }).catch(() => {});
        }
        return cached;
      }
      return fetch(req).then(res => {
        if(res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if(req.destination === 'font') return new Response('', { status: 404 });
        return new Response('', { status: 503 });
      });
    })
  );
});