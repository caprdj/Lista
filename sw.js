// Nome do cache (mude a versão quando fizer alterações grandes)
const CACHE_NAME = "rotina-fibro-v1";

// Arquivos principais para cache
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
  // Se tiver CSS/JS externos ou ícones, adicione aqui também.
];

// Instalação: pré-cache dos arquivos principais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Ativação: limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Fetch: tenta rede, se falhar usa cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
