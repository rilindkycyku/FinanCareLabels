// Etiketat e raftit (A4).
// Çdo shabllon: { celesi (unik, i qëndrueshëm - ruhet te preferencat), emri, pershkrimi, shablloni }.
// Kategoria (tab-i te zgjedhja) vendoset te index.js. Çelësat "klasike", "auto", "flamurMadh", "iRi" dhe
// "shumice" janë ata të dizajneve të vjetra (DIZAJNET), që zgjedhjet e ruajtura të gjejnë shabllonin.
import { ZI, GRI, shabllon, emri, tekst, qmimi } from "./baza";
import { barkod, flamur, vije, kuti, raftKlasik, raftMeZbritje, raftMeShumice, VERDHE_KOKE, VERDHE_LEHTE } from "./ndihmes";

const RAFT = { letra: "a4", rrjeta: "3x7" };

export default [
  {
    celesi: "klasike",
    emri: "Klasike",
    pershkrimi: "Rafti: emri, barkodi, flamuri dhe çmimi - 40 për fletë A4",
    shablloni: shabllon(50, 28.7, { letra: "a4", rrjeta: "4x10" }, [
      emri(1.5, 0.8, 47, 7.4, { madhesia: 10.5 }),
      vije(1.5, 8.6, 47, 1.5),
      flamur(1.5, 11.4, 6, 4),
      tekst("{shteti}", 8.3, 11.2, 14, 4.4, { rreshtimi: "left", madhesia: 10 }),
      barkod(1.5, 17.2, 20, 10.3),
      qmimi("aktual", 23.5, 11, 25, 17),
    ]),
  },
  {
    celesi: "raft",
    emri: "Raft - 21 për fletë A4",
    pershkrimi: "Emri, barkodi, origjina dhe çmimi",
    shablloni: shabllon(70, 38, RAFT, [
      emri(2, 2, 66, 11, { madhesia: 15 }),
      { lloji: "vije", vija: "#cbd5e1", trashesia: 0.3, x: 2, y: 13.5, w: 66, h: 2 },
      { lloji: "barkod", meShifra: true, x: 2, y: 16.5, w: 30, h: 13 },
      { lloji: "flamur", rreshtimi: "left", x: 2, y: 31.5, w: 7.5, h: 5 },
      tekst("{shteti}", 10.5, 31.5, 22, 5, { rreshtimi: "left", madhesia: 9 }),
      qmimi("aktual", 34, 16, 34, 20),
    ]),
  },
  {
    // Automatik: e njëjta etiketë zgjedh vetë paraqitjen sipas produktit - me zbritje (çmimi i vjetër i
    // prerë + i riu), pakicë + shumicë kur ka çmim shumice, përndryshe klasike.
    celesi: "auto",
    emri: "Automatik",
    pershkrimi: "Sipas produktit: zbritje, shumicë ose klasike",
    shablloni: shabllon(66.6, 41, RAFT, [...raftMeZbritje("zbritje"), ...raftMeShumice("shumicePaZbritje"), ...raftKlasik("klasike")]),
  },
  {
    celesi: "flamurMadh",
    emri: "Me Flamur të Madh",
    pershkrimi: "Origjina në fokus: flamur i madh dhe shteti",
    shablloni: shabllon(66.6, 41, RAFT, [
      emri(1.8, 1.3, 63, 10.5, { madhesia: 15 }),
      vije(1.8, 11.6, 63, 1.5),
      flamur(4, 14.2, 25, 13, "center"),
      tekst("{shteti}", 1.8, 28.4, 29.5, 6.5, { madhesia: 22 }),
      tekst("{barkodi}", 1.8, 36.3, 29.5, 3, { ngjyra: GRI, trashe: false, madhesia: 6 }),
      qmimi("aktual", 33, 14, 31.8, 25.5),
    ]),
  },
  {
    celesi: "iRi",
    emri: "Produkt i ri",
    pershkrimi: "Shigjetë e kuqe \"PRODUKT I RI\" në raft",
    shablloni: shabllon(66.6, 41, RAFT, [
      emri(1.8, 2, 63, 9.5, { rreshtimi: "center", rreshta: 1, madhesia: 18 }),
      { lloji: "shigjete", teksti: "PRODUKT I RI", x: 0, y: 16.7, w: 21.3, h: 13.2 },
      barkod(1.8, 33.8, 23, 6.3),
      tekst("{shteti}", 40, 35.4, 25, 4.4, { rreshtimi: "right", madhesia: 12 }),
      qmimi("aktual", 24, 13, 41, 19.5),
    ]),
  },
  {
    // Pakicë + shumicë: koka e verdhë me emrin, çmimi për copë dhe çmimi me shumicë krah njëri-tjetrit.
    // Pa çmim shumice: vetëm çmimi për copë, në gjithë gjerësinë.
    celesi: "shumice",
    emri: "Pakicë + Shumicë - 10 për fletë A4",
    pershkrimi: "Çmimi për copë dhe çmimi me shumicë nga sasia",
    shablloni: shabllon(100, 57.4, { letra: "a4", rrjeta: "2x5" }, [
      kuti(0, 0, 100, 11.5, { mbushja: VERDHE_KOKE }),
      emri(2, 0.8, 96, 10, { rreshtimi: "center", rreshta: 1, madhesia: 26 }),
      kuti(0, 11.5, 100, 7, { mbushja: VERDHE_LEHTE }),
      vije(0, 10.75, 100, 1.5, { vija: ZI, trashesia: 0.3 }),
      vije(0, 17.75, 100, 1.5, { vija: ZI, trashesia: 0.3 }),
      tekst("Çmimi për copë", 2, 12.3, 46, 5.4, { kushti: "shumice" }),
      tekst("Çmimi për copë", 2, 12.3, 96, 5.4, { kushti: "paShumice" }),
      vije(49.25, 11.5, 1.5, 37, { vija: ZI, trashesia: 0.3, kushti: "shumice" }),
      tekst("Çmimi me shumicë", 51.5, 12.3, 30, 5.4, { kushti: "shumice" }),
      vije(82.5, 11.5, 1.5, 7, { vija: ZI, trashesia: 0.3, kushti: "shumice" }),
      tekst("Sasia me shumicë", 84.2, 11.9, 15, 2.6, { trashe: false, kushti: "shumice" }),
      tekst("nga {sasiaShumices} copë", 84.2, 14.6, 15, 3.4, { kushti: "shumice" }),
      qmimi("aktual", 4, 20.5, 43, 27, { rreshtimi: "center", kushti: "shumice" }),
      qmimi("shumice", 53, 20.5, 43, 27, { rreshtimi: "center" }),
      qmimi("aktual", 10, 20.5, 80, 27, { rreshtimi: "center", kushti: "paShumice" }),
      vije(0, 48.4, 100, 1.5),
      barkod(1.5, 50.2, 20, 6.5),
      tekst("{shteti}", 62, 51.6, 36, 4, { rreshtimi: "right", madhesia: 10 }),
      kuti(0, 0, 100, 57.4, { vija: ZI, trashesia: 0.35 }),
    ]),
  },
  {
    // Raft 58,5 × 28,5 mm (30 për fletë): emri majtas, origjina lart, çmimi i madh, shifrat e barkodit poshtë.
    celesi: "raft585",
    emri: "Raft - 30 për fletë A4 (58.5 × 28.5 mm)",
    pershkrimi: "Emri majtas, origjina lart, çmimi i madh",
    shablloni: shabllon(58.5, 28.5, { letra: "a4", rrjeta: "3x10-585" }, [
      emri(2, 3, 23, 22, { rreshta: 3, rreshtimi: "left", madhesia: 20 }),
      // Shteti mbi çmimin me ~1 mm hapësirë: shkronjat me bisht poshtë ("j" te Gjermani, "q" te Maqedonia) s'e prekin
      // më çmimin (më parë hapësira ishte 0.2 mm).
      tekst("{shteti}", 27, 0.5, 30.5, 4.6, { rreshtimi: "center", madhesia: 14 }),
      qmimi("aktual", 26, 6.6, 31.5, 15, { rreshtimi: "center" }),
      tekst("{barkodi}", 27, 22, 30.5, 5.5, { rreshtimi: "center", madhesia: 13 }),
    ]),
  },
];
