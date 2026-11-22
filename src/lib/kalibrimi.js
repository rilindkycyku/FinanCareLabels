// Kalibrimi i printerit: shumë printera (sidomos me driver-in e Windows-it) e zhvendosin faqen disa mm ose e
// zvogëlojnë pak ("fit to printable area"), ndaj etiketat s'bien në vend edhe kur margjinat në program janë të sakta.
// Fleta e kalibrimit ka vija në largësi të njohura nga skaji; përdoruesi i mat me vizore dhe programi llogarit
// korrigjimin (zhvendosja X/Y në mm dhe shkalla në %), që ruhet për çdo printer dhe zbatohet te printimi direkt.
import { jsPDF } from "jspdf";

export const LARGESIA = 10; // mm nga skaji te korniza
export const GJATESIA = 150; // mm, vija e matjes së shkallës

export const KALIBRIMI_BOSH = Object.freeze({ x: 0, y: 0, shkalla: 100 });

export const kalibrimiI = (kalibrimet, printeri) => {
  const k = printeri && kalibrimet?.[printeri];
  if (!k) return KALIBRIMI_BOSH;
  const nr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return { x: kufizo(nr(k.x, 0), -20, 20), y: kufizo(nr(k.y, 0), -20, 20), shkalla: kufizo(nr(k.shkalla, 100), 80, 120) };
};

const kufizo = (v, min, max) => Math.min(Math.max(v, min), max);

export const kaKalibrim = (k) => Boolean(k) && (k.x !== 0 || k.y !== 0 || k.shkalla !== 100);

export const pershkrimiKalibrimit = (k) => {
  const shenja = (v) => (v > 0 ? `+${v}` : String(v));
  return `${shenja(k.x)} mm horizontalisht · ${shenja(k.y)} mm vertikalisht · ${k.shkalla}%`;
};

// Korrigjimi i ri nga matjet në letër (me kalibrimin aktual të zbatuar gjatë printimit).
// majtas / lart: mm nga skaji i letrës te vija e kornizës; gjatesia: mm të vijës së gjatë.
export const llogaritKalibrimin = (aktual, { majtas, lart, gjatesia }) => {
  const r1 = (v) => Math.round(v * 10) / 10;
  const iRi = { ...aktual };
  if (gjatesia > 0) iRi.shkalla = r1(kufizo((aktual.shkalla * GJATESIA) / gjatesia, 80, 120));
  if (Number.isFinite(majtas)) iRi.x = r1(kufizo(aktual.x + (LARGESIA - majtas), -20, 20));
  if (Number.isFinite(lart)) iRi.y = r1(kufizo(aktual.y + (LARGESIA - lart), -20, 20));
  return iRi;
};

// Fleta A4 e kalibrimit (PDF). zhvendosja { x, y } (mm): në shfletues korrigjimi futet në vetë PDF-në, ndaj edhe
// fleta e kalibrimit vizatohet e zhvendosur (shenjat 1-6 mm te skajet jo - ato matin skajin e printerit).
export const fletaEKalibrimit = (printeri = "", zhvendosja = null) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const H = 297;
  const L = LARGESIA;
  const dx = Number(zhvendosja?.x) || 0;
  const dy = Number(zhvendosja?.y) || 0;
  const X = (v) => v + dx;
  const Y = (v) => v + dy;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);

  // Korniza 10 mm nga çdo skaj.
  doc.setLineWidth(0.3);
  doc.rect(X(L), Y(L), W - 2 * L, H - 2 * L, "S");

  // Shigjetat e matjes te skaji i majtë dhe i sipërm.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("A", X(L + 2), Y(H / 2 - 2));
  doc.text("B", X(W / 2 + 2), Y(L + 4));
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(0, Y(H / 2), X(L), Y(H / 2));
  doc.line(X(W / 2), 0, X(W / 2), Y(L));
  doc.setLineDashPattern([], 0);

  // Vija e gjatë 150 mm me shenja çdo 10 mm.
  const x0 = (W - GJATESIA) / 2;
  const y0 = 120;
  doc.setLineWidth(0.4);
  doc.line(X(x0), Y(y0), X(x0 + GJATESIA), Y(y0));
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (let i = 0; i <= GJATESIA; i += 10) {
    const h = i % 50 === 0 ? 5 : 3;
    doc.line(X(x0 + i), Y(y0 - h), X(x0 + i), Y(y0));
    if (i % 50 === 0) doc.text(String(i), X(x0 + i), Y(y0 - 6), { align: "center" });
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("C", X(x0 + GJATESIA + 3), Y(y0 + 1));

  // Zona që printeri s'e printon: shenja 1-6 mm nga skaji, në të katër këndet e anëve.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setLineWidth(0.15);
  for (let mm = 1; mm <= 6; mm++) {
    doc.line(mm, 30, mm, 40); // majtas
    doc.line(W - mm, 30, W - mm, 40); // djathtas
    doc.line(30, mm, 40, mm); // lart
    doc.line(30, H - mm, 40, H - mm); // poshtë
  }
  doc.text("1-6 mm", 8, 36);
  doc.text("1-6 mm", W - 8, 36, { align: "right" });
  doc.text("1-6 mm", 42, 5);
  doc.text("1-6 mm", 42, H - 3);

  // Udhëzimet.
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FinanCare Labels - Fleta e kalibrimit", W / 2, 35, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const rreshtat = [
    `Printeri: ${printeri || "-"}`,
    "",
    "Mateni me vizore (në mm) dhe shënojini te Cilësimet -> Printeri:",
    `A = nga skaji i MAJTË i letrës deri te vija e kornizës (duhet ${L} mm)`,
    `B = nga skaji i SIPËRM i letrës deri te vija e kornizës (duhet ${L} mm)`,
    `C = gjatësia e vijës së gjatë më poshtë (duhet ${GJATESIA} mm)`,
    "",
    "Shenjat e vogla 1-6 mm te skajet tregojnë sa afër skajit printon printeri:",
    "vija e parë që shihet = margjina minimale që duhet zgjedhur te Opsionet.",
  ];
  rreshtat.forEach((r, i) => doc.text(r, W / 2, 50 + i * 5.5, { align: "center" }));
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Pas korrigjimit printojeni sërish fletën: A dhe B duhet të dalin 10 mm, C 150 mm.", W / 2, 150, { align: "center" });
  return doc;
};
