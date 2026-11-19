// Zbritje & oferta: shfaqen vetëm me zbritjen reale të produktit (Zbritjet e Produkteve).
// Çdo shabllon: { celesi (unik, i qëndrueshëm - ruhet te preferencat), emri, pershkrimi, shablloni }.
// Kategoria (tab-i te zgjedhja) vendoset te index.js. Çelësat "zbritje", "oferta" dhe "gratis" janë ata të
// dizajneve të vjetra (DIZAJNET). Titujt ("OFERTA JAVORE", "1+1 GRATIS") ndryshohen te kopja në editor.
import { KUQE, VERDHE, GRI, shabllon, emri, tekst, qmimi } from "./baza";
import { raftMeZbritje, posterMeZbritje, posterOferte, posterGratis } from "./ndihmes";

const KATER = { letra: "a4", rrjeta: "2x2" };

export default [
  {
    celesi: "zbritje",
    emri: "Me zbritje - 4 për fletë A4",
    pershkrimi: "Vula e zbritjes, çmimi i vjetër i prerë dhe i riu",
    shablloni: shabllon(100, 143.5, KATER, posterMeZbritje()),
  },
  {
    celesi: "zbritjeRaft",
    emri: "Me zbritje - raft, 21 për fletë A4",
    pershkrimi: "Shiriti \"ZBRITJE -x%\", çmimi i vjetër i prerë dhe i riu",
    // "gjithmone": çmimi i ri del edhe pa zbritje; shiriti dhe çmimi i vjetër vetëm me zbritje.
    shablloni: shabllon(66.6, 41, { letra: "a4", rrjeta: "3x7" }, raftMeZbritje("gjithmone").map((el) =>
      el.lloji === "kuti" || (el.lloji === "tekst" && el.teksti !== "{emri}" && el.teksti !== "{shteti}") ? { ...el, kushti: "zbritje" } : el
    )),
  },
  {
    celesi: "aksion",
    emri: "Aksion - 21 për fletë A4",
    pershkrimi: "Shirit i kuq, çmimi i vjetër i prerë, vula dhe çmimi i ri",
    shablloni: shabllon(70, 45, { letra: "a4", rrjeta: "3x7" }, [
      { lloji: "kuti", mbushja: KUQE, vija: "", trashesia: 0, rrezja: 0, x: 0, y: 0, w: 70, h: 8 },
      tekst("AKSION", 2, 1.2, 34, 5.6, { ngjyra: VERDHE, rreshtimi: "left" }),
      tekst("{data}", 36, 1.8, 32, 4.4, { ngjyra: "#ffffff", rreshtimi: "right", madhesia: 9 }),
      emri(2, 9.5, 66, 10.5, { madhesia: 15 }),
      { lloji: "vule", x: 2, y: 22, w: 20, h: 20 },
      qmimi("vjeter", 40, 20.5, 28, 6, { ngjyra: GRI, iPrere: true }),
      qmimi("aktual", 24, 29.5, 44, 14, { ngjyra: KUQE }),
    ]),
  },
  {
    celesi: "oferta",
    emri: "Oferta - 4 për fletë A4",
    pershkrimi: "Titulli i ofertës me datë, vula dhe çmimet",
    shablloni: shabllon(100, 143.5, KATER, posterOferte("OFERTA JAVORE")),
  },
  {
    celesi: "ofertaA4",
    emri: "Oferta - A4 e plotë",
    pershkrimi: "Oferta në gjithë fletën A4",
    shablloni: shabllon(100, 143.5, { letra: "a4", rrjeta: "1x1" }, posterOferte("OFERTA JAVORE")),
  },
  {
    celesi: "gratis",
    emri: "1+1 Gratis - 4 për fletë A4",
    pershkrimi: "Shirit promocioni mbi çmim",
    shablloni: shabllon(100, 143.5, KATER, posterGratis("OFERTA SPECIALE", "1+1 GRATIS")),
  },
  {
    celesi: "gratisDy",
    emri: "1+1 Gratis - 2 për fletë A4",
    pershkrimi: "Shiriti i kuq, rrethi \"1+1 GRATIS\", emri i madh dhe çmimi",
    shablloni: shabllon(200, 143, { letra: "a4", rrjeta: "1x2" }, [
      { lloji: "kuti", mbushja: "", vija: "#0f172a", trashesia: 0.35, rrezja: 0, x: 0, y: 0, w: 200, h: 143 },
      { lloji: "kuti", mbushja: KUQE, vija: "", trashesia: 0, rrezja: 0, x: 0, y: 0, w: 200, h: 24 },
      tekst("OFERTA SPECIALE", 6, 4, 108, 16, { ngjyra: VERDHE, rreshtimi: "left" }),
      tekst("{data}", 120, 7, 74, 10, { ngjyra: "#ffffff", rreshtimi: "right" }),
      emri(8, 28, 184, 30, { rreshtimi: "center", madhesia: 56 }),
      { lloji: "elips", mbushja: KUQE, vija: "", trashesia: 0, x: 8, y: 61, w: 58, h: 58 },
      tekst("1+1", 14, 70, 46, 24, { ngjyra: "#ffffff" }),
      tekst("GRATIS", 14, 95, 46, 13, { ngjyra: VERDHE }),
      qmimi("aktual", 72, 62, 120, 56, {}),
      { lloji: "vije", vija: "#cbd5e1", trashesia: 0.4, meNderprerje: false, x: 6, y: 121, w: 188, h: 2 },
      { lloji: "barkod", meShifra: true, x: 8, y: 125, w: 60, h: 15 },
      tekst("{shteti}", 110, 127, 66, 10, { rreshtimi: "right" }),
      { lloji: "flamur", rreshtimi: "right", x: 178, y: 127, w: 15, h: 10 },
    ]),
  },
  {
    // Zbritje 71,5 × 40,8 mm (14 për fletë): emri lart, shigjeta ZBRITJE, çmimi i vjetër i prerë dhe i riu.
    celesi: "zbritje715",
    emri: "Zbritje - 14 për fletë A4 (71.5 × 40.8 mm)",
    pershkrimi: "Emri lart, shigjeta ZBRITJE, çmimi i vjetër i prerë dhe i riu",
    shablloni: shabllon(71.5, 40.8, { letra: "a4", rrjeta: "2x7-715" }, [
      emri(2, 2, 40, 12, { rreshta: 2, rreshtimi: "left", madhesia: 18 }),
      { lloji: "shigjete", teksti: "ZBRITJE", x: 2, y: 17, w: 24, h: 11, kushti: "zbritje" },
      qmimi("vjeter", 44, 17, 26, 11, { ngjyra: GRI, iPrere: true, rreshtimi: "right", kushti: "zbritje" }),
      qmimi("aktual", 26, 16, 44, 19, { rreshtimi: "center" }),
      tekst("{barkodi}", 2, 32, 30, 5, { rreshtimi: "left", madhesia: 9, trashe: false }),
      tekst("{shteti}", 36, 31, 33, 6, { rreshtimi: "right", madhesia: 11 }),
    ]),
  },
  {
    // Zbritje 67 × 100 mm (6 për fletë): emri lart, shigjeta ZBRITJE, çmimi i madh, barkodi poshtë.
    celesi: "zbritje670",
    emri: "Zbritje - 6 për fletë A4 (67 × 100 mm)",
    pershkrimi: "Emri lart, shigjeta ZBRITJE, çmimi i madh dhe barkodi poshtë",
    shablloni: shabllon(67, 100, { letra: "a4", rrjeta: "3x2-670" }, [
      emri(3, 4, 61, 22, { rreshta: 2, rreshtimi: "center", madhesia: 30 }),
      { lloji: "shigjete", teksti: "ZBRITJE", x: 3, y: 33, w: 34, h: 12, kushti: "zbritje" },
      qmimi("vjeter", 40, 33, 24, 12, { ngjyra: GRI, iPrere: true, rreshtimi: "right", kushti: "zbritje" }),
      qmimi("aktual", 4, 50, 59, 36, { rreshtimi: "center" }),
      tekst("{barkodi}", 10, 90, 47, 6, { rreshtimi: "center", madhesia: 14, trashe: false }),
    ]),
  },
];
