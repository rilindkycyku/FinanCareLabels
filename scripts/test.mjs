// Testet pa shfletues: esbuild i paketon (importet pa prapashtesë si te Vite), pastaj node --test.
import { build } from "esbuild";
import { readdirSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const dalja = "test/.dist";
rmSync(dalja, { recursive: true, force: true });
mkdirSync(dalja, { recursive: true });
const skedaret = readdirSync("test").filter((f) => f.endsWith(".test.mjs"));
await build({
  entryPoints: skedaret.map((f) => `test/${f}`),
  outdir: dalja,
  bundle: true,
  platform: "node",
  format: "esm",
  outExtension: { ".js": ".mjs" },
  external: ["xlsx", "jspdf", "qrcode"],
  logLevel: "error",
  // import.meta.glob është i Vite-s (flamujt) - në teste s'duhet.
  define: { "import.meta.glob": "globalThis.__glob" },
  banner: { js: "globalThis.__glob = () => ({});" },
});
const r = spawnSync(process.execPath, ["--test", ...skedaret.map((f) => `${dalja}/${f.replace(/\.mjs$/, ".mjs")}`)], { stdio: "inherit" });
process.exit(r.status ?? 1);
