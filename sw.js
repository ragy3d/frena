/* Service worker de Frená: la hace instalable y la deja andar sin internet
   — que es justo lo que hace falta, porque la pausa tiene que aparecer sí o
   sí. Va a la red primero para que una versión nueva llegue sola. */
const CACHE = "frena-v6";
const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./css/style.css",
  "./js/datos.js", "./js/registro.js", "./js/app.js", "./js/ui.js",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    // cache:"reload" para no guardar como versión nueva una copia vieja
    // que el navegador tenía de antes
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  /* GitHub Pages manda max-age=600: sin esto, "ir a la red" igual podía
     devolver la copia que el navegador guardó hace menos de diez minutos, y
     una versión nueva no aparecía al reabrir. Con no-cache se le pregunta
     siempre al servidor; si nada cambió contesta 304 y no se baja de nuevo.
     (Se pide por la URL y no clonando el Request: un pedido de navegación no
     se puede reconstruir con opciones.) */
  const propio = new URL(e.request.url).origin === self.location.origin;
  const pedido = propio ? fetch(e.request.url, { cache: "no-cache" }) : fetch(e.request);
  e.respondWith(
    pedido
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
