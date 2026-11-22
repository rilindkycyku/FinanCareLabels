// Versioni në shfletues (ueb / celular, pa Electron): Excel-i i fundit mbahet në IndexedDB që të mos humbet me
// rifreskimin e faqes, dhe printimi bëhet me dritaren e printimit të shfletuesit.

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

// PDF-ja te dritarja e printimit e shfletuesit. Në kompjuter: iframe i fshehur + print(); në celular (ku iframe-i
// s'printohet) ose kur s'mundet: PDF-ja hapet në skedë të re, prej nga printohet ose ndahet.
export const printoNeShfletues = (blob) =>
  new Promise((ok) => {
    const url = URL.createObjectURL(blob);
    const neSkedeTeRe = () => {
      const w = window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      ok(w ? "skede" : "bllokuar");
    };
    if (eshteCelular()) return neSkedeTeRe();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        ok("printim");
      } catch {
        neSkedeTeRe();
      }
      setTimeout(() => {
        iframe.remove();
        URL.revokeObjectURL(url);
      }, 120000);
    };
    document.body.appendChild(iframe);
  });

// Kalibrimi i printerit në shfletues: s'dihet printeri, ndaj një korrigjim i vetëm, i futur në vetë PDF-në.
export const PRINTERI_I_SHFLETUESIT = "__shfletuesi__";
