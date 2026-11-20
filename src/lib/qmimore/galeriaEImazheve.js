// Galeria e imazheve të FinanCare-s për editorin e çmimores: vizatimet e festave (public/img/qmimore/festive/)
// që përdoren te shabllonet e gatshme, që kushdo t'i vendosë edhe te dizajni i vet pa i ngarkuar.
// Ruhen si adresë (jo base64) - shablloniQmimores.pergatitImazhet i kthen në PNG para vizatimit.
// raporti = gjerësia / lartësia e imazhit.
const DOSJA = "/img/qmimore/festive/";

export const GALERIA_E_IMAZHEVE = [
  { emri: "Xhamia me vijë", skedari: "fetare/xhamiaMeVije.png", raporti: 1800 / 491 },
  { emri: "Xhamia me dashin", skedari: "fetare/xhamiaMeDashin.png", raporti: 560 / 161 },
  { emri: "Xhamia mbi valë", skedari: "fetare/xhamiaVale.png", raporti: 900 / 626 },
  { emri: "Dashi me fanarët", skedari: "fetare/dashi.png", raporti: 899 / 900 },
  { emri: "Babagjyshi", skedari: "gjate-vitit/babagjyshi.svg", raporti: 1644.71 / 1757.8 },
  { emri: "Tulipanët", skedari: "gjate-vitit/tulipanet.png", raporti: 855 / 1000 },
  { emri: "Torta e ditëlindjes", skedari: "festime/torta.png", raporti: 1000 / 971 },
  { emri: "Flamuri i Kosovës", skedari: "kombetare/kosova.svg", raporti: 640 / 480 },
  { emri: "Flamuri i Shqipërisë", skedari: "kombetare/shqiperia.svg", raporti: 640 / 480 },
  { emri: "Ofertë speciale", skedari: "biznesi/ofertaSpeciale.svg", raporti: 1 },
].map((i) => ({ ...i, adresa: DOSJA + i.skedari }));
