/* Code Blue Companion service worker.
   Bump VERSION on every release so phones fetch the new files.
   Strategy: serve from cache instantly (works offline), refresh the cache in the
   background, and the new version appears the next time the app is opened. */
var VERSION = '1.0.1';
var CACHE = 'code-blue-' + VERSION;
var FILES = ['./', 'index.html', 'jspdf.umd.min.js', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES.map(function(f){ return new Request(f, {cache:'reload'}); })); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k.indexOf('code-blue-')===0 && k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET' || new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(e.request, {ignoreSearch:true}).then(function(hit){
      var net = fetch(e.request).then(function(res){ if(res && res.ok) c.put(e.request, res.clone()); return res; }).catch(function(){ return hit; });
      return hit || net;
    });
  }));
});
