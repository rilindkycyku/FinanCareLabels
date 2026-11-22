// "Automatik me shabllone": ndarja e produkteve sipas rastit dhe PDF-ja me një grup për çdo shabllon (të dhëna dummy).
import test from "node:test";
import assert from "node:assert/strict";
import { ndajSipasRastit, rastiIProduktit, vizatoQmimoren, planiFletes, fletaEParazgjedhur } from "../src/lib/qmimore/qmimorjaPdf.js";
import { SHABLLONET_E_GATSHME } from "../src/lib/qmimore/shabllonetEGatshme/index.js";

const p = (nr, ekstra = {}) => ({ nr, name: `Produkt ${nr}`, barcode: "3800221033514", price: 2.5, ...ekstra });

test("rasti: zbritja ka përparësi para shumicës, përndryshe klasike", () => {
  assert.equal(rastiIProduktit(p(1)), "klasike");
  assert.equal(rastiIProduktit(p(2, { discount: 10 })), "zbritje");
  assert.equal(rastiIProduktit(p(3, { wholesalePrice: 2, wholesaleQty: 6 })), "shumice");
  assert.equal(rastiIProduktit(p(4, { discount: 10, wholesalePrice: 2 })), "zbritje");
  // Shumica më e shtrenjtë se çmimi për copë s'ka kuptim: klasike.
  assert.equal(rastiIProduktit(p(5, { wholesalePrice: 3 })), "klasike");
});

test("ndarja ruan radhën brenda çdo grupi", () => {
  const g = ndajSipasRastit([p(1), p(2, { discount: 5 }), p(3), p(4, { wholesalePrice: 1 }), p(5, { discount: 20 })]);
  assert.deepEqual(g.klasike.map((x) => x.nr), [1, 3]);
  assert.deepEqual(g.zbritje.map((x) => x.nr), [2, 5]);
  assert.deepEqual(g.shumice.map((x) => x.nr), [4]);
});

test("PDF me grupe: çdo grup nis në fletë të re me rrjetën e shabllonit të vet", () => {
  const sipasCelesit = Object.fromEntries(SHABLLONET_E_GATSHME.map((g) => [g.celesi, g.shablloni]));
  const raft = sipasCelesit.raft30 || SHABLLONET_E_GATSHME.find((g) => g.shablloni.w < 60 && planiFletes(g.shablloni))?.shablloni;
  const klasik = sipasCelesit.klasike || SHABLLONET_E_GATSHME.find((g) => g.shablloni.w > 60 && planiFletes(g.shablloni))?.shablloni;
  assert.ok(raft && klasik, "duhen dy shabllone A4 me madhësi të ndryshme");
  const fletaRaft = fletaEParazgjedhur(raft);
  const fletaKlasik = fletaEParazgjedhur(klasik);
  const perFaqeRaft = planiFletes(raft, fletaRaft.orientimi, fletaRaft.hapesiraH, fletaRaft.hapesiraV, fletaRaft.margjina).perFaqe;
  const perFaqeKlasik = planiFletes(klasik, fletaKlasik.orientimi, fletaKlasik.hapesiraH, fletaKlasik.hapesiraV, fletaKlasik.margjina).perFaqe;
  const normale = Array.from({ length: perFaqeRaft + 1 }, (_, i) => p(i + 1)); // 2 fletë
  const meZbritje = [p(100, { discount: 10 })]; // 1 fletë më vete, edhe pse ka vend në fletën e fundit
  const doc = vizatoQmimoren([...normale, ...meZbritje], {
    grupet: [
      { shablloni: raft, products: normale, ...fletaRaft },
      { shablloni: klasik, products: meZbritje, ...fletaKlasik },
      { shablloni: klasik, products: [] }, // grupi bosh s'shton fletë
    ],
  });
  assert.equal(doc.getNumberOfPages(), 3);
  assert.ok(perFaqeKlasik > 1);
});

test("PDF pa grupe mbetet si më parë", () => {
  const sh = SHABLLONET_E_GATSHME.find((g) => planiFletes(g.shablloni)).shablloni;
  const doc = vizatoQmimoren([p(1), p(2)], { shablloni: sh });
  assert.equal(doc.getNumberOfPages(), 1);
});
