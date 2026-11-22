import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Electron e shërben dist/ me protokollin app:// (shih electron/main.cjs), prandaj adresat absolute
// si "/fonts/..." dhe "/img/qmimore/..." (të motorit të çmimores) punojnë njësoj si në web.
export default defineConfig({
  plugins: [react()],
  // Versioni i programit për "Çka ka të re" dhe Cilësimet (build.ps1 e rrit te package.json para build-it).
  define: { __VERSIONI__: JSON.stringify(pkg.version) },
  build: { outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
