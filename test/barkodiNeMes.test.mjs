// "Barkodi në mes pa flamur": te produktet pa origjinë barkodi lëviz në mes të vendit të flamurit/shtetit - poshtë kur
// flamuri është nën barkod ("Raft - 21"), lart kur është mbi të ("Klasike"). Të dhëna dummy, pa shfletues.
import test from "node:test";
import assert from "node:assert/strict";
import { vizatoQmimoren } from "../src/lib/qmimore/qmimorjaPdf.js";
import { SHABLLONET_E_GATSHME } from "../src/lib/qmimore/shabllonetEGatshme/index.js";

const shabllon = (celesi) => SHABLLONET_E_GATSHME.find((g) => g.celesi === celesi).shablloni;
const pdf = (sh, produkt, barkodiNeMes) =>
  vizatoQmimoren([produkt], { shablloni: sh, barkodiNeMes, vetemNjeEtikete: true })
    .output()
    // Koha e krijimit dhe ID-ja ndryshojnë në çdo PDF - s'krahasohen.
    .replace(/\/CreationDate \([^)]*\)/g, "")
    .replace(/\/ID \[[^\]]*\]/g, "");
const paOrigjine = { name: "Qorapa per meshkuj", price: 1252.07, barcode: "8568545876945" };

for (const celesi of ["klasike", "raft"]) {
  test(`${celesi}: pa origjinë barkodi lëviz kur opsioni është i ndezur`, () => {
    assert.notEqual(pdf(shabllon(celesi), paOrigjine, true), pdf(shabllon(celesi), paOrigjine, false));
  });
  test(`${celesi}: me origjinë barkodi s'lëviz`, () => {
    const meOrigjine = { ...paOrigjine, origin: "TR" };
    assert.equal(pdf(shabllon(celesi), meOrigjine, true), pdf(shabllon(celesi), meOrigjine, false));
  });
}
