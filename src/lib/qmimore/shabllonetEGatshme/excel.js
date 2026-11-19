// Shabllonet që i përgjigjen fletëve të QmimePerRaft.xlsx që FinanCare s'i ka (9 dhe 2 për fletë A4).
// Vetëm te FinanCare Labels; kategoria "excel" vendoset te index.js.
import { KUQE, GRI, shabllon, emri, tekst, qmimi } from "./baza";
import { barkod, flamur, vije, kuti } from "./ndihmes";
import postera from "./postera";

const NENTE = { letra: "a4", rrjeta: "3x3" };

const posterOferte = postera.find((s) => s.celesi === "posterOferte").shablloni;

export default [
  {
    celesi: "nente",
    emri: "Raft - 9 për fletë A4",
    pershkrimi: "Emri i madh, origjina, çmimi dhe barkodi (fleta \"9Cop\")",
    shablloni: shabllon(66.6, 95.6, NENTE, [
      emri(3, 3, 60.6, 24, { madhesia: 24, rreshta: 3, rreshtimi: "center" }),
      vije(3, 28, 60.6, 2),
      flamur(3, 32, 9, 6),
      tekst("{shteti}", 14, 32, 49.6, 6, { rreshtimi: "left", madhesia: 12, trashe: false }),
      qmimi("aktual", 3, 40, 60.6, 36, { rreshtimi: "center" }),
      barkod(13.3, 79, 40, 14),
    ]),
  },
  {
    celesi: "nenteVaga",
    emri: "Peshore - 9 për fletë A4",
    pershkrimi: "Shifra e peshores e madhe, emri dhe çmimi për kg (fleta \"9CopVaga\")",
    shablloni: shabllon(66.6, 95.6, NENTE, [
      emri(3, 3, 60.6, 22, { madhesia: 24, rreshta: 2, rreshtimi: "center" }),
      vije(3, 26, 60.6, 2),
      kuti(3, 30, 24, 26, { vija: KUQE, trashesia: 0.6, rrezja: 2 }),
      tekst("PESHORE", 4, 31.5, 22, 5, { ngjyra: GRI, madhesia: 9 }),
      tekst("{shifra}", 4, 37, 22, 17, { ngjyra: KUQE }),
      qmimi("aktual", 29, 30, 34.6, 26, { rreshtimi: "right" }),
      vije(3, 66, 60.6, 2),
      barkod(13.3, 72, 40, 18),
    ]),
  },
  {
    celesi: "dyZbritje",
    emri: "Zbritje - 2 për fletë A4",
    pershkrimi: "Titulli \"ZBRITJE\", vula, çmimi i vjetër i prerë dhe i riu (fleta \"2CopZbritje\")",
    shablloni: {
      ...posterOferte,
      elementet: posterOferte.elementet.map((el) => (el.teksti === "OFERTË" ? { ...el, teksti: "ZBRITJE" } : el)),
    },
  },
];
