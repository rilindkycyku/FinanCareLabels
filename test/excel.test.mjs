// Testet e leximit të Excel-it (npm test): titujt e shabllonit tonë, tituj të huaj, pa tituj dhe lidhja me dorë.
import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { celesiIHartes, lexoExcelin, piket } from "../src/lib/excel.js";
import { llogaritKalibrimin } from "../src/lib/kalibrimi.js";

const excel = (rreshtat, emri = "Fleta") => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rreshtat), emri);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
};

test("Excel-i i përdoruesit: titulli sipër, rreshti i titujve në rreshtin 3, hapësirat e dyfishta", () => {
  const { fletet } = lexoExcelin(
    excel([["Artikujt ne excel"], [], ["Shifra", "Barcodi", "Emertimi", "Sasia", "Cmimi"], [], [603, 3838977013382, "Sallam EXTRA  350GR", 575, 1.59]])
  );
  const [p] = fletet[0].produktet;
  assert.equal(p.name, "Sallam EXTRA 350GR");
  assert.equal(p.price, 1.59);
  assert.equal(p.barcode, "3838977013382");
  assert.equal(p.origin, "SI");
  assert.equal(p.nr, 5);
});

test("tituj të huaj (anglisht, serbisht)", () => {
  let p = lexoExcelin(excel([["Item code", "EAN", "Description", "Qty", "Retail price (EUR)"], [1, "4014500510385", "Zot monte", 4, 0.39]])).fletet[0].produktet[0];
  assert.deepEqual([p.name, p.price, p.barcode], ["Zot monte", 0.39, "4014500510385"]);
  p = lexoExcelin(excel([["Sifra", "Naziv artikla", "Barkod", "MPC", "Akcijska cena"], [1, "Jaffa", 8600114000002, 1.2, 1.0]])).fletet[0].produktet[0];
  assert.deepEqual([p.name, p.price, p.qmimiPasZbritjes, p.discount], ["Jaffa", 1.2, 1, 16.7]);
});

test("CamelCase dhe zbritja: CmimiZbritje + CmimiRregullt", () => {
  const p = lexoExcelin(excel([["Emertimi", "CmimiZbritje", "CmimiRregullt"], ["Kos", 0.79, 0.95]])).fletet[0].produktet[0];
  assert.deepEqual([p.price, p.qmimiPasZbritjes], [0.95, 0.79]);
});

test("pa tituj: kolonat sipas përmbajtjes", () => {
  const f = lexoExcelin(excel([["3838977013382", "Sallam EXTRA 350GR", 12, "1,59"], ["5301000171901", "Pepsi 1 liter", 3, 0.99]])).fletet[0];
  assert.equal(f.titujt.menyra, "permbajtja");
  assert.deepEqual(f.produktet.map((p) => [p.name, p.price, p.barcode]), [["Sallam EXTRA 350GR", 1.59, "3838977013382"], ["Pepsi 1 liter", 0.99, "5301000171901"]]);
});

test("kolonat e panjohura: fleta kthehet pa produkte; lidhja me dorë sipas titujve", () => {
  const rreshtat = [["Artikulli X", "Vlera Y"], ["Molla", 1.2]];
  const pa = lexoExcelin(excel([["a", "b"], ["c", "d"]])).fletet[0];
  assert.equal(pa.titujt, null);
  const f = lexoExcelin(excel(rreshtat)).fletet[0];
  const celesi = celesiIHartes(f.emri, { rreshti: 0 }, f.mostra);
  const me = lexoExcelin(excel(rreshtat, "Tjeter"), { [celesi]: { fillimi: 1, kolonat: { emri: 0, qmimi: 1 } } }).fletet[0];
  assert.equal(me.titujt.menyra, "dore");
  assert.deepEqual(me.produktet.map((p) => [p.name, p.price]), [["Molla", 1.2]]);
});

test("pikët e sinonimeve", () => {
  assert.equal(piket("cmimi", "cmimi"), 100);
  assert.equal(piket("cmimizbritje", "cmimi zbritje"), 95);
  assert.ok(piket("cmimi shites me tvsh", "cmimi shites") >= 70);
});

test("kalibrimi nga matjet", () => {
  const k = llogaritKalibrimin({ x: 0, y: 0, shkalla: 100 }, { majtas: 12.5, lart: 9, gjatesia: 147 });
  assert.deepEqual(k, { x: -2.5, y: 1, shkalla: 102 });
});

test("zbritja: më i larti është gjithmonë origjinali, më i ulëti me zbritje - pavarësisht kolonave dhe radhës", () => {
  const raste = [
    [["Emertimi", "CmimiZbritje", "CmimiRregullt"], ["A", 1.99, 2.35]],
    [["Emertimi", "CmimiZbritje", "CmimiRregullt"], ["A", 2.35, 1.99]], // të ndërruara (radha e shabllonit tonë)
    [["Emertimi", "Cmimi", "Cmimi i rregullt"], ["A", 1.99, 2.35]],
    [["Emertimi", "Cmimi", "Cmimi me zbritje"], ["A", 2.35, 1.99]],
    [["Emertimi", "Cmimi", "Cmimi me zbritje"], ["A", 1.99, 2.35]],
    [["Emertimi", "CmimRi", "CmimiVjeter"], ["A", 1.99, 2.35]],
  ];
  for (const r of raste) {
    const p = lexoExcelin(excel(r)).fletet[0].produktet[0];
    assert.deepEqual([p.price, p.qmimiPasZbritjes, p.discount], [2.35, 1.99, 15.3], JSON.stringify(r[0]) + JSON.stringify(r[1]));
  }
});

test("dy çmime të barabarta: pa zbritje; çmimi i blerjes s'bëhet zbritje", () => {
  let p = lexoExcelin(excel([["Emertimi", "CmimiZbritje", "CmimiRregullt"], ["A", 1.99, 1.99]])).fletet[0].produktet[0];
  assert.deepEqual([p.price, p.qmimiPasZbritjes], [1.99, null]);
  p = lexoExcelin(excel([["Emertimi", "Cmimi blerjes", "Cmimi shitjes"], ["A", 1.2, 1.99]])).fletet[0].produktet[0];
  assert.deepEqual([p.price, p.qmimiPasZbritjes], [1.99, null]);
});

test("njësia nga emri: 'kg' pas numrit është paketimi (copë), 'kg' i vetëm është mall me peshë", () => {
  const { produktet } = lexoExcelin(
    excel([["Shifra", "Barcodi", "Emertimi", "Sasia", "Cmimi"], [1, 3903976460106, "Sheqer kristall premium 5 kg", 150, 3.84], [2, "", "Oriz 0,5kg", 1, 1], [3, "", "Mollë KG", 1, 0.8]])
  ).fletet[0];
  assert.deepEqual(produktet.map((p) => p.unit), ["", "", "kg"]);
});
