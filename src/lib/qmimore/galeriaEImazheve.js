// Galeria e imazheve të FinanCare-s për editorin e çmimores: vizatimet e festave (public/img/qmimore/festive/)
// që përdoren te shabllonet e gatshme, që kushdo t'i vendosë edhe te dizajni i vet pa i ngarkuar.
// Ruhen si adresë (jo base64) - shablloniQmimores.pergatitImazhet i kthen në PNG para vizatimit.
// raporti = gjerësia / lartësia e imazhit.
const DOSJA = "/img/qmimore/festive/";

export const GALERIA_E_IMAZHEVE = [
  { emri: "Xhamia me vijë", skedari: "xhamia.png", raporti: 1800 / 491 },
  { emri: "Xhamia me dashin", skedari: "kurbanBajrami.png", raporti: 560 / 161 },
  { emri: "Xhamia mbi valë", skedari: "xhamiaVale.png", raporti: 900 / 626 },
  { emri: "Dashi me fanarët", skedari: "dashi.png", raporti: 899 / 900 },
  { emri: "Babagjyshi", skedari: "babagjyshi.svg", raporti: 1644.71 / 1757.8 },
  { emri: "Tulipanët", skedari: "tulipanet.png", raporti: 855 / 1000 },
  { emri: "Torta e ditëlindjes", skedari: "torta.png", raporti: 1000 / 971 },
  { emri: "Flamuri i Kosovës", skedari: "kosova.svg", raporti: 640 / 480 },
  { emri: "Flamuri i Shqipërisë", skedari: "shqiperia.svg", raporti: 640 / 480 },
  { emri: "Ofertë speciale", skedari: "ofertaSpeciale.svg", raporti: 1.5 },
].map((i) => ({ ...i, adresa: DOSJA + i.skedari }));
