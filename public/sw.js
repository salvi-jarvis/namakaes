/* Nā Maka — service worker. Sin dependencias.
 * Política (ver classify): solo se guarda lo público y estático. Nunca se cachean /api, peticiones con
 * Authorization, ni dominios externos (Google, Supabase). Los datos de usuario viven en localStorage y
 * el service worker no los toca, así que actualizar la app no puede borrarlos. */
const VERSION = "nama-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

/** Decide qué hacer con una petición. Pura y exportada para poder probarla. */
function classify(url, method, mode, hasAuth, origin) {
  if (method !== "GET") return "pass";
  if (hasAuth) return "pass";
  if (url.origin !== origin) return "pass";
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_server") || url.pathname.startsWith("/auth") || url.pathname.startsWith("/oauth") || url.pathname.startsWith("/.well-known")) return "pass";
  if (mode === "navigate") return "navigate"; // red primero; no se guarda HTML de páginas
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") return "static"; // archivos con hash o públicos
  return "pass";
}

function cacheableResponse(response) {
  if (!response.ok || response.type !== "basic") return false;
  const cacheControl = response.headers.get("cache-control") || "";
  return !/(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl) && !response.headers.has("set-cookie");
}

if (typeof self !== "undefined" && self.addEventListener) {
  self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
  });
  self.addEventListener("activate", (e) => {
    e.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("nama-") && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
    );
  });
  self.addEventListener("notificationclick", (e) => {
    e.notification.close();
    const target = new URL("/plan", self.location.origin).href;
    e.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        const existing = clients.find((client) => client.url.startsWith(self.location.origin));
        if (existing) return existing.navigate(target).then((client) => (client || existing).focus());
        return self.clients.openWindow(target);
      }),
    );
  });
  self.addEventListener("fetch", (e) => {
    const r = e.request;
    const kind = classify(new URL(r.url), r.method, r.mode, r.headers.has("authorization"), self.location.origin);
    if (kind === "pass") return;
    if (kind === "navigate") {
      e.respondWith(
        fetch(r).catch(async () => (await caches.match(OFFLINE_URL)) || new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })),
      );
      return;
    }
    e.respondWith(
      caches.match(r).then((hit) => hit || fetch(r).then((res) => {
        if (cacheableResponse(res)) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(r, copy)); }
        return res;
      })),
    );
  });
}
if (typeof module !== "undefined") module.exports = { classify, cacheableResponse, VERSION, PRECACHE };
