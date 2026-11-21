// Vendos nisësin tonë të exe-së portabël (build/nsis/portable.nsi) në vend të atij të electron-builder-it, që
// programi të mos shpaketohet në çdo hapje (shih komentin në krye të build/nsis/portable.nsi). Thirret para paketimit
// nga "npm run dist" dhe build.ps1; është idempotent.
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const dosja = path.join(path.dirname(require.resolve("app-builder-lib/package.json")), "templates", "nsis");
const synimi = path.join(dosja, "portable.nsi");
const burimi = new URL("../build/nsis/portable.nsi", import.meta.url);
if (!existsSync(dosja)) throw new Error(`Mungon ${dosja} - npm install`);
if (!existsSync(synimi) || readFileSync(synimi, "utf8") !== readFileSync(burimi, "utf8")) {
  copyFileSync(burimi, synimi);
  console.log("Nisësi portabël i FinanCare Labels u vendos.");
}
