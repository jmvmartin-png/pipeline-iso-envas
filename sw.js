/* ISO-ENVAS Pipeline · service worker mínimo para poder instalar la web como app (icono propio).
   No guarda datos ni cachea la aplicación: siempre carga la versión publicada. Solo atiende la navegación
   de las páginas propias; Supabase y el resto de peticiones pasan sin tocar. */
self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method !== "GET" || r.mode !== "navigate" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).catch(function(){
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title><body style="font-family:system-ui;padding:32px;color:#101A2B"><h2>Sin conexión</h2><p>El Pipeline ISO-ENVAS necesita internet. Comprueba la conexión y vuelve a intentarlo.</p><button onclick="location.reload()" style="padding:10px 16px;border:0;border-radius:8px;background:#FE6320;color:#fff;font-weight:700">Reintentar</button></body>', {headers:{"Content-Type":"text/html; charset=utf-8"}});
  }));
});
