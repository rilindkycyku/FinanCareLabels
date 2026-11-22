// FinanCare Labels në shfletues: punon pa internet pas hapjes së parë. Faqja merret nga rrjeti kur ka (që versioni i ri
// të dalë menjëherë), ndryshe nga memoria; skedarët e tjerë (JS/CSS me hash, fontet, flamujt, shabllonet) nga memoria,
// dhe rifreskohen në sfond. Versioni (?v=) ndryshon me çdo release: memoria e vjetër fshihet.
const VERSIONI = new URL(self.location.href).searchParams.get("v") || "0";
const MEMORIA = `financare-labels-${VERSIONI}`;
const BAZA = ["/", "/index.html", "/manifest.webmanifest", "/logo.png", "/logo-shenja.svg", "/fonts/BarlowCondensed-SemiBold.ttf", "/fonts/BarlowCondensed-Medium.ttf", "/fonts/Inter-Regular.ttf", "/fonts/Inter-Bold.ttf"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(MEMORIA).then((c) => c.addAll(BAZA)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((celesat) => Promise.all(celesat.filter((k) => k.startsWith("financare-labels-") && k !== MEMORIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then((p) => {
          const kopja = p.clone();
          caches.open(MEMORIA).then((c) => c.put("/index.html", kopja));
          return p;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }
  e.respondWith(
    caches.open(MEMORIA).then(async (c) => {
      const ruajtur = await c.match(r);
      const ngaRrjeti = fetch(r)
        .then((p) => {
          if (p.ok) c.put(r, p.clone());
          return p;
        })
        .catch(() => ruajtur);
      return ruajtur || ngaRrjeti;
    })
  );
});
