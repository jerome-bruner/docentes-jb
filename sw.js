// ============================================================
// DOCENTES JB — service worker
//
// OJO: VERSION tiene que ser LA MISMA que la de js/config.js. Si solo
// se sube en uno de los dos, los teléfonos se quedan con la versión
// vieja y parece que los cambios no se subieron.
//
// Qué se guarda: solo la cáscara de la app (HTML, CSS, JS e íconos).
// Las llamadas a la API NUNCA se guardan: siempre van a la red, para
// que nadie entre con datos viejos.
// ============================================================

const VERSION = "1.2.0";
const CACHE = "docentes-jb-" + VERSION;

const CASCARA = [
  "./",
  "index.html",
  "css/estilos.css",
  "js/config.js",
  "js/api.js",
  "js/instalar.js",
  "js/app.js",
  "manifest.json",
  "iconos/icono-96.png",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
  "iconos/apple-touch-icon.png"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CASCARA))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((llaves) => Promise.all(
        llaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const url = new URL(ev.request.url);

  // Todo lo que no sea de esta misma carpeta (la API de Apps Script,
  // el portal) pasa derecho a la red, sin tocar la caché.
  if (url.origin !== self.location.origin) return;
  if (ev.request.method !== "GET") return;

  // Primero la red, y si no hay, lo guardado. Así una versión nueva se
  // ve en cuanto hay señal, pero la app sigue abriendo sin ella.
  ev.respondWith(
    fetch(ev.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(ev.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(ev.request).then((g) => g || caches.match("index.html")))
  );
});
