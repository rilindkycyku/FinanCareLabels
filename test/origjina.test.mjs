// Origjina nga barkodi: vetëm barkodet e vërteta GS1 marrin shtet; kodet e brendshme (PLU) jo.
import test from "node:test";
import assert from "node:assert/strict";
import { origjinaNgaBarkodi } from "../src/lib/qmimore/origjina.js";

const kodi = (b) => origjinaNgaBarkodi(b)?.kodi ?? null;

test("kodet e shkurtra të brendshme s'kanë shtet (1200 s'është më SHBA)", () => {
  for (const b of ["1200", "1255", "1258", "123", "00123", "2700106", "339072735"]) assert.equal(kodi(b), null, b);
});

test("barkodet e vërteta GS1", () => {
  assert.equal(kodi("3838977013382"), "SI");
  assert.equal(kodi("4014500510385"), "DE");
  assert.equal(kodi("8600114000002"), "RS");
  assert.equal(kodi("5449000000028"), "BE");
  assert.equal(kodi("036000291452"), "US"); // UPC-A
  assert.equal(kodi("03838977013382"), "SI"); // GTIN-14
});

test("shifra e kontrollit e gabuar (si te shumë produkte në dyqan) e mban shtetin; shkronjat dhe EAN-8 i dyqanit jo", () => {
  assert.equal(kodi("3838977013383"), "SI");
  assert.equal(kodi("3900167230055"), "XK");
  assert.equal(kodi("38389770133A2"), null);
  assert.equal(kodi("20123451"), null);
});
