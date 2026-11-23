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

// Excel-at e hapur: [{ emri, bajtet: Uint8Array, koha }] (versionet e vjetra ruanin një objekt të vetëm).
export const ruajExcelat = (lista) => veprim("readwrite", (s) => s.put(lista, "exceli")).catch(() => {});
export const lexoExcelatERuajtur = () =>
  veprim("readonly", (s) => s.get("exceli"))
    .then((r) => (Array.isArray(r) ? r : r?.bajtet ? [r] : []).filter((x) => x?.bajtet))
    .catch(() => []);
export const fshiExcelin = () => veprim("readwrite", (s) => s.delete("exceli")).catch(() => {});

export const eshteCelular = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

// Printimi në shfletues: faqet e PDF-së bëhen imazhe brenda vetë faqes (të fshehura në ekran) dhe thirret print() -
// del dritarja e vërtetë e printimit e pajisjes (në Android ajo e sistemit, me printerin dhe "Ruaj si PDF"; në
// kompjuter ajo e shfletuesit). S'varet nga lexuesi i PDF-ve. @page jep madhësinë dhe orientimin (A4 portret/peisazh).
//
// Përgatitja (imazhet) bëhet PARA prekjes së "Printo": celulari (Chrome Android, Safari) e lejon print() vetëm
// drejtpërdrejt nga prekja - pas disa sekondash përgatitjeje e injoronte. pergatitPrintimin() kthen { printo, pastro };
// printo() thirret sinkron te klikimi.
export const pergatitPrintimin = async (blob, neProgres) => {
  const { faqet, w, h } = await faqetPerPrintim(blob, neProgres, { dpi: eshteCelular() ? 200 : 300, siBlob: true });
  const afer = (a, b) => Math.abs(a - b) < 1.5;
  const letra = afer(w, 297) && afer(h, 210) ? "A4 landscape" : afer(w, 210) && afer(h, 297) ? "A4 portrait" : `${w.toFixed(1)}mm ${h.toFixed(1)}mm`;
  const id = `lb-printimi-${Date.now().toString(36)}`;
  const stili = document.createElement("style");
  const mbajtesi = document.createElement("div");
  mbajtesi.id = id;
  mbajtesi.className = "lb-printimi";
  const imazhet = faqet.map((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    mbajtesi.appendChild(img);
    return img;
  });
  await Promise.all(imazhet.map((img) => img.decode().catch(() => {})));
  let pastruar = false;
  return {
    // true kur u hap dritarja e printimit; false kur shfletuesi s'e hap (p.sh. shfletuesi brenda WhatsApp/Instagram).
    printo: () =>
      new Promise((ok) => {
        if (pastruar) return ok(false);
        // Vetëm ky printim është aktiv: @page dhe imazhet e tij.
        document.querySelectorAll(".lb-printimi, .lb-printimi-stili").forEach((el) => el !== mbajtesi && el !== stili && el.remove());
        stili.className = "lb-printimi-stili";
        stili.textContent = `
          .lb-printimi { display: none; }
          @page { size: ${letra}; margin: 0; }
          @media print {
            html, body { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; background: #fff !important; }
            body > *:not(#${id}) { display: none !important; }
            #${id} { display: block !important; }
            #${id} img { display: block; width: ${w.toFixed(2)}mm; height: ${(h - 0.5).toFixed(2)}mm; break-after: page; page-break-after: always; }
            #${id} img:last-child { break-after: auto; page-break-after: auto; }
          }`;
        if (!stili.isConnected) document.head.appendChild(stili);
        if (!mbajtesi.isConnected) document.body.appendChild(mbajtesi);
        let uHap = false;
        const hapur = () => {
          uHap = true;
        };
        window.addEventListener("beforeprint", hapur, { once: true });
        const fillimi = Date.now();
        try {
          window.print();
        } catch {
          /* s'mbështetet */
        }
        // Në kompjuter print() pret mbylljen e dritares (zgjat > 0.5 s); në celular "beforeprint" vjen menjëherë.
        const priti = Date.now() - fillimi > 500;
        setTimeout(() => {
          window.removeEventListener("beforeprint", hapur);
          ok(uHap || priti);
        }, 1200);
      }),
    pastro: () => {
      if (pastruar) return;
      pastruar = true;
      mbajtesi.remove();
      stili.remove();
      faqet.forEach((u) => URL.revokeObjectURL(u));
    },
  };
};

export const MESAZHI_PA_PRINTIM =
  "Ky shfletues s'e hapi dritaren e printimit (p.sh. kur faqja hapet brenda WhatsApp, Instagram ose TikTok). Hapeni faqen në Chrome ose Safari, ose përdorni \"Ndaj\" / \"Ruaj PDF\".";

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
