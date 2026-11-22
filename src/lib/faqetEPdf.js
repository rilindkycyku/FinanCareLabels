// Faqet e PDF-së si imazhe (pdf.js) + madhësia e faqes në mm, për printimin: te Electron-i shkojnë te dritarja e
// fshehur e printimit (data URL), në shfletues te printimi brenda faqes (blob URL, më pak memorie në celular).
import { pdfjsLib } from "./pdfjs";

const PT_NE_MM = 25.4 / 72;

export const faqetPerPrintim = async (blob, neProgres, { dpi = 300, siBlob = false } = {}) => {
  const doc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
  try {
    const faqet = [];
    let permasat = null;
    for (let n = 1; n <= doc.numPages; n++) {
      neProgres?.(n, doc.numPages);
      const faqja = await doc.getPage(n);
      const baza = faqja.getViewport({ scale: 1 });
      if (!permasat) permasat = { w: baza.width * PT_NE_MM, h: baza.height * PT_NE_MM };
      const viewport = faqja.getViewport({ scale: dpi / 72 });
      const c = document.createElement("canvas");
      c.width = Math.round(viewport.width);
      c.height = Math.round(viewport.height);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await faqja.render({ canvasContext: ctx, viewport }).promise;
      faqet.push(siBlob ? URL.createObjectURL(await new Promise((ok) => c.toBlob(ok, "image/png"))) : c.toDataURL("image/png"));
      c.width = 0;
    }
    return { faqet, ...permasat };
  } finally {
    doc.destroy();
  }
};

// Printimi në grupe (desktop): PDF-ja hapet një herë dhe faqet kthehen në grupe (p.sh. 20 faqe) - grupi i parë shkon te
// printeri pas pak sekondash, ndërsa të tjerat përgatiten ndërkohë (me qindra faqe, pritja e të gjitha zgjaste minuta
// dhe mbante qindra imazhe 300 dpi në memorie njëherësh).
export async function* faqetNeGrupe(blob, madhesiaEGrupit, neProgres, { dpi = 300 } = {}) {
  const doc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
  try {
    let grupi = [];
    let permasat = null;
    for (let n = 1; n <= doc.numPages; n++) {
      neProgres?.(n, doc.numPages);
      const faqja = await doc.getPage(n);
      const baza = faqja.getViewport({ scale: 1 });
      if (!permasat) permasat = { w: baza.width * PT_NE_MM, h: baza.height * PT_NE_MM };
      const viewport = faqja.getViewport({ scale: dpi / 72 });
      const c = document.createElement("canvas");
      c.width = Math.round(viewport.width);
      c.height = Math.round(viewport.height);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await faqja.render({ canvasContext: ctx, viewport }).promise;
      grupi.push(c.toDataURL("image/png"));
      c.width = 0;
      faqja.cleanup();
      if (grupi.length >= madhesiaEGrupit || n === doc.numPages) {
        yield { faqet: grupi, ...permasat, gjithsej: doc.numPages, deri: n };
        grupi = [];
      }
    }
  } finally {
    doc.destroy();
  }
}
