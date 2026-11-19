import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Electron e shërben dist/ me protokollin app:// (shih electron/main.cjs), prandaj adresat absolute
// si "/fonts/..." dhe "/img/qmimore/..." (të motorit të çmimores) punojnë njësoj si në web.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
