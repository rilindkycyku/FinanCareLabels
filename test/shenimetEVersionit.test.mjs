// "Çka ka të re" nga shënimet e GitHub-it: vetëm pikat e versionit, pa udhëzimet e instalimit dhe pa Markdown.
import test from "node:test";
import assert from "node:assert/strict";
import { pikatNgaShenimet } from "../src/lib/ndryshimet.js";

const shenimet = `## FinanCare Labels 9.9.9

**Cilin ta shkarkoj?**
- \`FinanCare.Labels.Setup.9.9.9.exe\` - instaluesi.
- \`FinanCare.Labels.Portable.9.9.9.exe\` - pa instalim.

**Si ta instaloj?**
1. Hapni exe-në.
2. Klikoni **More info**.

### Çka ka të re
- **E re:** Produkti **dummy** me "thonjëza".
- **Rregullim:** Çmimi s'del më i prerë.`;

test("merr vetëm seksionin 'Çka ka të re', me llojin dhe tekstin pa **", () => {
  assert.deepEqual(pikatNgaShenimet(shenimet), [
    ["E re", 'Produkti dummy me "thonjëza".'],
    ["Rregullim", "Çmimi s'del më i prerë."],
  ]);
});

test("pa seksion: çdo pikë si 'E re'; bosh kur s'ka asgjë", () => {
  assert.deepEqual(pikatNgaShenimet("- Rregullime dhe `përmirësime`."), [["E re", "Rregullime dhe përmirësime."]]);
  assert.deepEqual(pikatNgaShenimet(""), []);
  assert.deepEqual(pikatNgaShenimet(null), []);
});
