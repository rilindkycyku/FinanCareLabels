// Versioni në shfletues (ueb / celular, pa Electron): Excel-i i fundit mbahet në IndexedDB që të mos humbet me
// rifreskimin e faqes, dhe printimi bëhet me dritaren e printimit të shfletuesit.

import { faqetPerPrintim } from "./faqetEPdf";

const DB = "financare-labels";
const DYQANI = "skedaret";

const hapDb = () =>
  new Promise((ok, gabim) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(DYQANI);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => gabim(r.error);
  });

const veprim = async (menyra, fn) => {
  const db = await hapDb();
  try {
    return await new Promise((ok, gabim) => {
      const tx = db.transaction(DYQANI, menyra);
      const r = fn(tx.objectStore(DYQANI));
      tx.oncomplete = () => ok(r?.result);
      tx.onerror = () => gabim(tx.error);
    });
  } finally {
    db.close();
  }
};

// { emri, bajtet: Uint8Array, koha } | null
export const ruajExcelin = (emri, bajtet) => veprim("readwrite", (s) => s.put({ emri, bajtet, koha: Date.now() }, "exceli")).catch(() => {});
export const lexoExcelinERuajtur = () => veprim("readonly", (s) => s.get("exceli")).catch(() => null);
export const fshiExcelin = () => veprim("readwrite", (s) => s.delete("exceli")).catch(() => {});

export const eshteCelular = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

// Printimi në shfletues: faqet e PDF-së bëhen imazhe brenda vetë faqes (të fshehura në ekran) dhe thirret print() -
// del dritarja e vërtetë e printimit e pajisjes (në Android ajo e sistemit, me printerin dhe "Ruaj si PDF"; në
// kompjuter ajo e shfletuesit). S'varet nga lexuesi i PDF-ve: më parë celulari e hapte PDF-në në një skedë pa printim.
// @page jep madhësinë dhe orientimin e letrës (A4 portret/peisazh), pa margjina.
export const printoNeShfletues = async (blob, neProgres) => {
  const { faqet, w, h } = await faqetPerPrintim(blob, neProgres, { dpi: eshteCelular() ? 200 : 300, siBlob: true });
  const afer = (a, b) => Math.abs(a - b) < 1.5;
  const letra = afer(w, 297) && afer(h, 210) ? "A4 landscape" : afer(w, 210) && afer(h, 297) ? "A4 portrait" : `${w.toFixed(1)}mm ${h.toFixed(1)}mm`;
  document.getElementById("lb-printimi")?.remove();
  document.getElementById("lb-printimi-stili")?.remove();
  const stili = document.createElement("style");
  stili.id = "lb-printimi-stili";
  stili.textContent = `
    #lb-printimi { display: none; }
    @page { size: ${letra}; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; background: #fff !important; }
      body > *:not(#lb-printimi) { display: none !important; }
      #lb-printimi { display: block !important; }
      #lb-printimi img { display: block; width: ${w.toFixed(2)}mm; height: ${(h - 0.5).toFixed(2)}mm; break-after: page; page-break-after: always; }
      #lb-printimi img:last-child { break-after: auto; page-break-after: auto; }
    }`;
  const mbajtesi = document.createElement("div");
  mbajtesi.id = "lb-printimi";
  const imazhet = faqet.map((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    mbajtesi.appendChild(img);
    return img;
  });
  document.head.appendChild(stili);
  document.body.appendChild(mbajtesi);
  await Promise.all(imazhet.map((img) => img.decode().catch(() => {})));
  let pastruar = false;
  const pastro = () => {
    if (pastruar) return;
    pastruar = true;
    window.removeEventListener("afterprint", vonese);
    mbajtesi.remove();
    stili.remove();
    faqet.forEach((u) => URL.revokeObjectURL(u));
  };
  // Në celular print() kthehet menjëherë dhe dialogu lexon faqen më vonë: pastrohet pas "afterprint" (+ pak kohë).
  const vonese = () => setTimeout(pastro, 1500);
  window.addEventListener("afterprint", vonese);
  setTimeout(pastro, 10 * 60 * 1000);
  window.print();
  return "printim";
};

// Ndarja e PDF-së (WhatsApp, email, aplikacioni i printerit...) - kur pajisja e lejon (zakonisht celulari).
export const mundetNdarja = () => {
  try {
    return typeof navigator !== "undefined" && Boolean(navigator.canShare?.({ files: [new File([""], "a.pdf", { type: "application/pdf" })] }));
  } catch {
    return false;
  }
};
export const ndajPdf = async (blob, emri) => {
  const skedari = new File([blob], emri || "Qmimorja.pdf", { type: "application/pdf" });
  try {
    await navigator.share({ files: [skedari], title: emri });
    return "ndare";
  } catch (err) {
    return err?.name === "AbortError" ? "anuluar" : "gabim";
  }
};

// Kalibrimi i printerit në shfletues: s'dihet printeri, ndaj një korrigjim i vetëm, i futur në vetë PDF-në.
export const PRINTERI_I_SHFLETUESIT = "__shfletuesi__";
