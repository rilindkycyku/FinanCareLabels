// Posterat A4 (1-4 për fletë).
// Çdo shabllon: { celesi (unik, i qëndrueshëm - ruhet te preferencat), emri, pershkrimi, shablloni }.
// Kategoria (tab-i te zgjedhja) vendoset te index.js. "poster" është çelësi i dizajnit të vjetër (koka e
// verdhë); posteri i kuq i ofertës (më parë "poster") tani është "posterOferte".
import { KUQE, VERDHE, GRI, shabllon, emri, tekst, qmimi } from "./baza";
import { posterKlasik } from "./ndihmes";

export default [
  {
    celesi: "poster",
    emri: "Poster - 4 për fletë A4",
    pershkrimi: "Koka e verdhë me emrin, çmimi i madh",
    shablloni: shabllon(100, 143.5, { letra: "a4", rrjeta: "2x2" }, posterKlasik()),
  },
  {
    celesi: "posterA4",
    emri: "Poster - A4 e plotë",
    pershkrimi: "Koka e verdhë me emrin, çmimi në gjithë fletën",
    shablloni: shabllon(100, 143.5, { letra: "a4", rrjeta: "1x1" }, posterKlasik()),
  },
  {
    celesi: "posterOferte",
    emri: "Poster oferte - 2 për fletë A4",
    pershkrimi: "Titulli, vula, çmimi i madh, barkodi dhe origjina",
    shablloni: shabllon(200, 143, { letra: "a4", rrjeta: "1x2" }, [
      { lloji: "kuti", mbushja: KUQE, vija: "", trashesia: 0, rrezja: 0, x: 0, y: 0, w: 200, h: 24 },
      tekst("OFERTË", 6, 4, 110, 16, { ngjyra: VERDHE, rreshtimi: "left" }),
      tekst("{data}", 120, 7, 74, 10, { ngjyra: "#ffffff", rreshtimi: "right" }),
      emri(8, 28, 184, 30, { rreshtimi: "center", madhesia: 56 }),
      { lloji: "vule", x: 8, y: 62, w: 56, h: 56 },
      qmimi("vjeter", 130, 60, 62, 14, { ngjyra: GRI, iPrere: true }),
      qmimi("aktual", 66, 79, 126, 40, { ngjyra: KUQE }),
      { lloji: "vije", vija: "#cbd5e1", trashesia: 0.4, x: 6, y: 121, w: 188, h: 2 },
      { lloji: "barkod", meShifra: true, x: 8, y: 125, w: 60, h: 15 },
      tekst("{shteti}", 110, 127, 66, 10, { rreshtimi: "right" }),
      { lloji: "flamur", rreshtimi: "right", x: 178, y: 127, w: 15, h: 10 },
    ]),
  },
];
