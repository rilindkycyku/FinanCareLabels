// Bardh e zi: flamujt me gri të ndara qartë dhe ngjyrat e shablloneve në të zezë / gri / të bardhë.
import test from "node:test";
import assert from "node:assert/strict";
import { argumentetBardhEZi, flamuriNeBardhEZi, ngjyraBardhEZi } from "../src/lib/qmimore/bardhEZi.js";

const flamur = (pjeset) => {
  // pjeset: [[r, g, b, sa piksela], ...]
  const data = [];
  for (const [r, g, b, n] of pjeset) for (let i = 0; i < n; i++) data.push(r, g, b, 255);
  return new Uint8ClampedArray(data);
};
const gri = (d, i) => d[i * 4];

test("Shqipëria: e kuqja del e bardhë, shqiponja e zezë mbetet e zezë", () => {
  const d = flamuriNeBardhEZi(flamur([[228, 30, 32, 850], [0, 0, 0, 150]]));
  assert.equal(gri(d, 0), 255);
  assert.equal(gri(d, 900), 0);
});

test("Kosova: blu e zezë, harta gri, yjet të bardhë", () => {
  const d = flamuriNeBardhEZi(flamur([[36, 74, 165, 800], [208, 167, 43, 150], [255, 255, 255, 50]]));
  assert.deepEqual([gri(d, 0), gri(d, 850), gri(d, 980)], [0, 128, 255]);
});

test("Italia: e gjelbra dhe e kuqja (ndriçim i ngjashëm) dalin të ndryshme", () => {
  const d = flamuriNeBardhEZi(flamur([[0, 146, 70, 333], [255, 255, 255, 334], [206, 43, 55, 333]]));
  assert.notEqual(gri(d, 0), gri(d, 700));
});

test("ngjyrat e shablloneve", () => {
  assert.equal(ngjyraBardhEZi(230, 36, 41), 0); // vula e kuqe → e zezë
  assert.equal(ngjyraBardhEZi(255, 236, 0), 255); // teksti i verdhë mbi të → i bardhë
  assert.equal(ngjyraBardhEZi(148, 163, 184), 110); // gri e çelët → gri (s'zhduket)
  assert.equal(ngjyraBardhEZi(100, 116, 139), 110); // çmimi i vjetër (gri) mbetet gri - vija e prerjes dallohet
  assert.equal(ngjyraBardhEZi(15, 23, 42), 0); // teksti → i zi
  assert.equal(ngjyraBardhEZi(242, 201, 76), 255); // data e artë mbi kokë → e bardhë
  assert.equal(ngjyraBardhEZi(224, 40, 127), 0); // koka rozë e Ditëlindjes → e zezë (teksti i bardhë mbi të)
  assert.equal(ngjyraBardhEZi(203, 213, 225, true), 110); // vija e çelët → gri, jo e bardhë
  assert.deepEqual(argumentetBardhEZi(["#ffd966"], false), [255, 255, 255]);
  assert.deepEqual(argumentetBardhEZi([0.5], false), [0.5]);
});
