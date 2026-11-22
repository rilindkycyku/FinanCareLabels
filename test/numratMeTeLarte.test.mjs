// "Numrat më të lartë": vetëm shifrat e çmimit ngushtohen - shkalla horizontale (Tz) kthehet në 100% pas çmimit,
// përndryshe edhe emri, titulli dhe tekstet e tjera dilnin të ngushtuara.
import test from "node:test";
import assert from "node:assert/strict";
import { vizatoQmimoren } from "../src/lib/qmimore/qmimorjaPdf.js";
import { SHABLLONET_E_GATSHME } from "../src/lib/qmimore/shabllonetEGatshme/index.js";

test("pas çmimit të ngushtuar shkalla kthehet në 100%", () => {
  const sh = SHABLLONET_E_GATSHME.find((g) => g.celesi === "raft").shablloni;
  const doc = vizatoQmimoren([{ name: "Abc detergjent 400 gr", price: 300, barcode: "8690511170921" }], { shablloni: sh, numratMeTeLarte: true, vetemNjeEtikete: true });
  const tz = [...doc.output().matchAll(/([\d.]+) Tz/g)].map((m) => Number(m[1]));
  assert.ok(tz.some((v) => v < 100), "çmimi duhet të jetë ngushtuar në këtë shabllon");
  assert.equal(tz.at(-1), 100);
});

test("pa opsionin s'ka ngushtim fare", () => {
  const sh = SHABLLONET_E_GATSHME.find((g) => g.celesi === "raft").shablloni;
  const doc = vizatoQmimoren([{ name: "Abc", price: 300, barcode: "8690511170921" }], { shablloni: sh, vetemNjeEtikete: true });
  assert.equal(/ Tz/.test(doc.output()), false);
});
