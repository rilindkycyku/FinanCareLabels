// Printeri termik i kuponëve (80 / 58 mm).
// Çdo shabllon: { celesi (unik, i qëndrueshëm - ruhet te preferencat), emri, pershkrimi, shablloni }.
// Kategoria (tab-i te zgjedhja) vendoset te index.js. "termik" është çelësi i dizajnit të vjetër "Printer
// termik": si "Automatik" (zbritje / shumicë / klasike sipas produktit), në letrën 80 mm.
import { shabllon, emri, tekst, qmimi } from "./baza";
import { raftKlasik, raftMeZbritje, raftMeShumice } from "./ndihmes";

export default [
  {
    celesi: "termik",
    emri: "Printer termik - automatik",
    pershkrimi: "Sipas produktit (zbritje, shumicë, klasike), direkt në printerin termik 80 mm",
    // E vizatuar si etiketa e raftit 66.6 × 41 dhe e shkallëzuar te 72 × 35 mm.
    shablloni: shabllon(66.6, 41, { letra: "termik80", h: 35 }, [
      ...raftMeZbritje("zbritje"),
      ...raftMeShumice("shumicePaZbritje"),
      ...raftKlasik("klasike"),
    ]),
  },
  {
    celesi: "termik80",
    emri: "Raft - printer termik 80 mm",
    pershkrimi: "72 × 35 mm: emri, çmimi dhe barkodi",
    shablloni: shabllon(72, 35, { letra: "termik80", h: 35 }, [
      emri(1.5, 1, 69, 9.5, { madhesia: 14 }),
      { lloji: "barkod", meShifra: true, x: 1.5, y: 12, w: 30, h: 13 },
      { lloji: "flamur", rreshtimi: "left", x: 1.5, y: 27.5, w: 7, h: 4.7 },
      tekst("{shteti}", 9.5, 27.5, 22, 4.7, { rreshtimi: "left", madhesia: 9 }),
      qmimi("aktual", 33, 11, 37.5, 22),
    ]),
  },
  {
    celesi: "termik58",
    emri: "Raft - printer termik 58 mm",
    pershkrimi: "48 × 30 mm: emri, çmimi dhe barkodi",
    shablloni: shabllon(48, 30, { letra: "termik58", h: 30 }, [
      emri(1, 1, 46, 8, { rreshtimi: "center", madhesia: 12 }),
      qmimi("aktual", 1, 9.5, 46, 11, { rreshtimi: "center" }),
      { lloji: "barkod", meShifra: true, x: 6, y: 21.5, w: 36, h: 8 },
    ]),
  },
];
