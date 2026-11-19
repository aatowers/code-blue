/* Code Blue Companion service worker.
   Bump VERSION on every release so phones fetch the new files.
   Strategy: the page loads fresh when online (falls back to the cached copy offline);
   other files serve from cache and refresh in the background. */
var VERSION = '1.0.5';
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
  if(e.request.mode==='navigate'){
    /* The page itself: newest version when online, cached copy when offline. */
    e.respondWith(fetch(e.request).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put('index.html', copy); }); }
      return res;
    }).catch(function(){ return caches.match('index.html').then(function(hit){ return hit || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(e.request, {ignoreSearch:true}).then(function(hit){
      var net = fetch(e.request).then(function(res){ if(res && res.ok) c.put(e.request, res.clone()); return res; }).catch(function(){ return hit; });
      return hit || net;
    });
  }));
});
