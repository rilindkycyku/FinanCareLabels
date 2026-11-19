// Mjete dhe paraqitje të përbashkëta për shabllonet e gatshme që zëvendësuan dizajnet e vjetra të
// qmimorjaPdf.js (DIZAJNET). Ngjyrat janë ato të vizatimit të vjetër (NGJYRA), që etiketat të duken njësoj.
import { ZI, KUQE, VERDHE, GRI, emri, tekst, qmimi } from "./baza";

export const VERDHE_KOKE = "#ffd966"; // koka e verdhë e posterave
export const VERDHE_LEHTE = "#ffeeba"; // rreshti i titujve te shumica
export const VIJA = "#cbd5e1"; // vija gri e hollë
export const BARDHE = "#ffffff";

export const barkod = (x, y, w, h, shtese = {}) => ({ lloji: "barkod", meShifra: true, x, y, w, h, ...shtese });
export const flamur = (x, y, w, h, rreshtimi = "left", shtese = {}) => ({ lloji: "flamur", rreshtimi, x, y, w, h, ...shtese });
export const vije = (x, y, w, h, shtese = {}) => ({ lloji: "vije", vija: VIJA, trashesia: 0.2, meNderprerje: false, x, y, w, h, ...shtese });
export const kuti = (x, y, w, h, shtese = {}) => ({ lloji: "kuti", mbushja: "", vija: "", trashesia: 0, rrezja: 0, x, y, w, h, ...shtese });
export const vule = (x, y, ana, shtese = {}) => ({ lloji: "vule", x, y, w: ana, h: ana, ...shtese });
export const korniza = (w, h, shtese = {}) => kuti(0, 0, w, h, { vija: ZI, trashesia: 0.35, ...shtese });

// Shiriti i kuq me "ZBRITJE -20%" (te etiketat e raftit me zbritje, në vend të vulës me yje).
const shiritiIZbritjes = (x, y, w, h) => [
  kuti(x, y, w, h, { mbushja: KUQE, rrezja: Math.min(w, h) * 0.12, kushti: "zbritje" }),
  tekst("ZBRITJE", x + w * 0.05, y + h * 0.1, w * 0.9, h * 0.38, { ngjyra: BARDHE, kushti: "zbritje" }),
  tekst("{zbritja}", x + w * 0.05, y + h * 0.48, w * 0.9, h * 0.44, { ngjyra: VERDHE, kushti: "zbritje" }),
];

// ---- Paraqitjet e raftit (66.6 × 41 mm - qeliza 3x7 e A4), secila me kushtin e vet ----

// Klasike: emri, vija, origjina (flamur + shteti), barkodi dhe çmimi djathtas.
export const raftKlasik = (kushti = "gjithmone") => [
  emri(1.8, 1.3, 63, 11, { madhesia: 15, kushti }),
  vije(1.8, 12.4, 63, 1.5, { kushti }),
  flamur(1.8, 15.2, 7.5, 5, "left", { kushti }),
  tekst("{shteti}", 10.2, 14.9, 19, 5.6, { rreshtimi: "left", madhesia: 14, kushti }),
  barkod(1.8, 25.5, 26, 13.5, { kushti }),
  qmimi("aktual", 30, 14.4, 34.8, 25, { kushti }),
];

// Me zbritje (raft): emri majtas, çmimi i vjetër i prerë lart djathtas, shiriti i kuq "ZBRITJE -x%",
// çmimi i ri i madh, barkodi dhe shteti poshtë.
export const raftMeZbritje = (kushti = "zbritje") => [
  emri(1.8, 2, 40, 11.5, { madhesia: 15, kushti }),
  // Çmimi i vjetër larg skajit të sipërm (vija e prerjes s'del jashtë) dhe ~3 mm mbi çmimin e ri.
  qmimi("vjeter", 45, 3.5, 19.8, 7, { ngjyra: GRI, iPrere: true, kushti }),
  ...shiritiIZbritjes(1.8, 16.5, 21, 11.5).map((el) => ({ ...el, kushti })),
  qmimi("aktual", 25, 13.5, 40, 19, { kushti }),
  barkod(1.8, 30.8, 24, 9.2, { kushti }),
  tekst("{shteti}", 38, 34.6, 27, 5.2, { rreshtimi: "right", madhesia: 12, kushti }),
];

// Pakicë + shumicë (raft): koka e verdhë me emrin, dy kolona me titujt dhe çmimet, barkodi poshtë.
export const raftMeShumice = (kushti = "shumice") => [
  kuti(0, 0, 66.6, 8.5, { mbushja: VERDHE_KOKE, kushti }),
  emri(1.5, 0.6, 63.6, 7.3, { rreshtimi: "center", rreshta: 1, madhesia: 14, kushti }),
  kuti(0, 8.5, 66.6, 5, { mbushja: VERDHE_LEHTE, kushti }),
  vije(0, 7.8, 66.6, 1.5, { vija: ZI, trashesia: 0.25, kushti }),
  tekst("Çmimi për copë", 1.5, 9.1, 30, 3.8, { kushti }),
  tekst("Me shumicë nga {sasiaShumices}", 34.8, 9.1, 30.4, 3.8, { kushti }),
  vije(32.6, 8.5, 1.5, 24, { vija: ZI, trashesia: 0.25, kushti }),
  qmimi("aktual", 1.5, 14.5, 30, 17.5, { rreshtimi: "center", kushti }),
  qmimi("shumice", 35, 14.5, 30, 17.5, { rreshtimi: "center", kushti }),
  vije(0, 32, 66.6, 1.5, { kushti }),
  barkod(1.8, 34, 24, 6.3, { kushti }),
  tekst("{shteti}", 38, 35.2, 27, 4.2, { rreshtimi: "right", madhesia: 10, kushti }),
];

// ---- Postera (100 × 143.5 mm - qeliza 2x2 e A4) ----

const kokaEPosterit = () => [kuti(0, 0, 100, 22.9, { mbushja: VERDHE_KOKE }), vije(0, 22.15, 100, 1.5, { vija: ZI, trashesia: 0.4 })];

// Koka e ofertës: titulli + data në të verdhë, pastaj emri në rreshtin e vet.
const kokaEOfertes = (titulli) => [
  kuti(0, 0, 100, 12.4, { mbushja: VERDHE_KOKE }),
  tekst(titulli, 3, 0.9, 94, 7, {}),
  tekst("{data}", 3, 7.9, 94, 4, { trashe: false }),
  vije(0, 11.65, 100, 1.5, { vija: ZI, trashesia: 0.4 }),
  emri(3, 13.6, 94, 9.4, { rreshtimi: "center", madhesia: 26 }),
  vije(0, 23.55, 100, 1.5, { vija: ZI, trashesia: 0.4 }),
];

const fundiIPosterit = () => [
  barkod(2.5, 131.5, 34, 10),
  tekst("{shteti}", 58, 133.5, 39, 7, { rreshtimi: "right", madhesia: 16 }),
];

// Vula me yje, çmimi i vjetër i prerë dhe çmimi i ri - pjesa e çmimit te posterat me zbritje.
const qmimetMeZbritje = (yLart) => [
  vule(2.5, yLart, 33),
  qmimi("vjeter", 44, yLart + 1, 46, 28, { ngjyra: ZI, iPrere: true }),
  qmimi("aktual", 6, yLart + 38, 90, 62, {}),
];

export const posterKlasik = () => [
  korniza(100, 143.5),
  ...kokaEPosterit(),
  emri(3, 1.5, 94, 19.9, { rreshtimi: "center", madhesia: 34 }),
  qmimi("aktual", 6, 38, 90, 78, {}),
  ...fundiIPosterit(),
];

export const posterMeZbritje = () => [
  korniza(100, 143.5),
  ...kokaEPosterit(),
  emri(3, 1.5, 94, 19.9, { rreshtimi: "center", madhesia: 34 }),
  ...qmimetMeZbritje(27),
  ...fundiIPosterit(),
];

export const posterOferte = (titulli) => [korniza(100, 143.5), ...kokaEOfertes(titulli), ...qmimetMeZbritje(28), ...fundiIPosterit()];

export const posterGratis = (titulli, promo) => [
  korniza(100, 143.5),
  ...kokaEOfertes(titulli),
  tekst(promo, 3, 26.5, 94, 13.5, {}),
  vije(0, 41.4, 100, 1.5, { vija: ZI, trashesia: 0.4 }),
  qmimi("aktual", 6, 52, 90, 70, {}),
  ...fundiIPosterit(),
];
