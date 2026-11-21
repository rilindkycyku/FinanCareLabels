// Shabllonet e çmimores: etiketa që i ndërton vetë përdoruesi te "Shabllonet e Çmimores" (ose vijnë
// të gatshme, shih shabllonetEGatshme.js). Një shabllon është JSON me përmasat e etiketës në mm dhe
// listën e elementeve; këtu janë formati, vlerat fillestare të elementeve dhe vizatimi i një etikete.
// Mjetet e vizatimit (teksti që përshtatet, çmimi, barkodi, flamuri, vula) vijnë nga vizatoQmimoren.
import QRCode from "qrcode";
const tani = () => new Date();

export const VERSIONI_I_SHABLLONIT = 1;
const MARGJINA = 5;
// minH/maxH: lartësia e etiketës termike - etiketa rafti marketi, jo poster.
export const KUFIJTE = { minH: 20, maxH: 60, minElement: 1.5 };

// Letrat që mbështeten: printeri termik i kuponëve (gjerësia e etiketës = zona e printimit, 72 mm te
// letra 80 mm dhe 48 mm te 58 mm; lartësia sa një etiketë rafti) ose fleta A4 me rrjetë fikse.
export const LETRAT = {
  termik80: { emri: "Printer termik 80 mm", w: 72, h: 35, lartesite: [25, 30, 35, 40, 50] },
  termik58: { emri: "Printer termik 58 mm", w: 48, h: 30, lartesite: [20, 25, 30, 35, 40] },
  a4: { emri: "Fletë A4" },
};

// Rrjetat e A4 (kolona × rreshta, faqe në këmbë): etiketa e merr qelizën e plotë brenda margjinës 5 mm.
const poshte = (v) => Math.floor(v * 10) / 10;
export const RRJETAT_A4 = [
  [1, 1],
  [1, 2],
  [2, 2],
  [2, 3],
  [3, 3],
  [2, 4],
  [2, 5],
  [3, 4],
  [3, 5],
  [3, 7],
  [3, 8],
  [4, 10],
  [5, 10],
  [5, 13],
].map(([kolonat, rreshtat]) => ({
  celesi: `${kolonat}x${rreshtat}`,
  kolonat,
  rreshtat,
  perFaqe: kolonat * rreshtat,
  w: poshte((210 - MARGJINA * 2) / kolonat),
  h: poshte((297 - MARGJINA * 2) / rreshtat),
}));
const RRJETA_PARAZGJEDHUR = "3x7";
// Etiketa me madhësi fikse (jo të llogaritura nga A4): 58,5×28,5, 71,5×40,8 dhe 67×100 mm.
RRJETAT_A4.push(
  { celesi: "3x10-585", kolonat: 3, rreshtat: 10, perFaqe: 30, w: 58.5, h: 28.5 },
  { celesi: "2x7-715", kolonat: 2, rreshtat: 7, perFaqe: 14, w: 71.5, h: 40.8 },
  { celesi: "3x2-670", kolonat: 3, rreshtat: 2, perFaqe: 6, w: 67, h: 100 },
);
const gjejRrjeten = (celesi) => RRJETAT_A4.find((r) => r.celesi === celesi) || null;

export const shablloniTermik = (sh) => Boolean(sh) && sh.letra !== "a4";
export const pershkrimiLetres = (sh) =>
  shablloniTermik(sh) ? `${LETRAT[sh.letra].emri} · ${sh.w} × ${sh.h} mm` : `${gjejRrjeten(sh.rrjeta)?.perFaqe} për fletë A4 · ${sh.w} × ${sh.h} mm`;

// Fushat që zëvendësohen brenda tekstit: "{emri}" → emri i produktit.
export const FUSHAT_E_TEKSTIT = [
  ["emri", "Emri i produktit"],
  ["qmimi", "Çmimi (tekst)"],
  ["qmimiVjeter", "Çmimi i vjetër (tekst)"],
  ["zbritja", "Zbritja në %"],
  ["qmimiShumices", "Çmimi i shumicës (tekst)"],
  ["sasiaShumices", "Sasia e shumicës"],
  ["barkodi", "Barkodi (numri)"],
  ["shifra", "Shifra e produktit"],
  ["njesia", "Njësia matëse"],
  ["shteti", "Shteti i origjinës"],
  ["data", "Data / periudha e ofertës"],
  ["dyqani", "Emri i biznesit"],
  ["viti", "Viti (sot)"],
];

export const KUSHTET = [
  ["gjithmone", "Gjithmonë"],
  ["zbritje", "Vetëm kur produkti ka zbritje"],
  ["paZbritje", "Vetëm kur s'ka zbritje"],
  ["shumice", "Vetëm kur ka çmim shumice"],
  ["paShumice", "Vetëm kur s'ka çmim shumice"],
  ["klasike", "Vetëm pa zbritje dhe pa shumicë"],
  ["shumicePaZbritje", "Vetëm me shumicë, pa zbritje"],
];

export const BURIMET_E_QMIMIT = [
  ["aktual", "Çmimi që paguhet (me zbritje, nëse ka)"],
  ["vjeter", "Çmimi i vjetër (vetëm kur ka zbritje)"],
  ["rregullt", "Çmimi i rregullt (gjithmonë)"],
  ["shumice", "Çmimi i shumicës"],
];

// Llojet e elementeve me vlerat fillestare; përmasat (pjesë e etiketës) i vendos elementIRi.
export const LLOJET = {
  tekst: { emri: "Tekst", fillestare: { teksti: "TEKST", ngjyra: "#0f172a", rreshtimi: "center", rreshta: 1, trashe: true } },
  qmimi: { emri: "Çmimi", fillestare: { burimi: "aktual", ngjyra: "#000000", rreshtimi: "right", meNjesi: true } },
  barkod: { emri: "Barkodi", fillestare: { meShifra: true } },
  qr: { emri: "Kodi QR", fillestare: { teksti: "{barkodi}" } },
  flamur: { emri: "Flamuri", fillestare: { rreshtimi: "left" } },
  kuti: { emri: "Kuti", fillestare: { mbushja: "", vija: "#000000", trashesia: 0.4, rrezja: 0 } },
  vije: { emri: "Vijë", fillestare: { vija: "#000000", trashesia: 0.4, meNderprerje: false } },
  elips: { emri: "Rreth", fillestare: { mbushja: "#e62429", vija: "", trashesia: 0.4 } },
  vule: { emri: "Vula e zbritjes", fillestare: {} },
  shigjete: { emri: "Shigjeta", fillestare: { teksti: "ZBRITJE {zbritja}" } },
  imazh: { emri: "Imazh / logo", fillestare: { imazhi: "", raporti: 1 } },
};

let numeruesi = 0;
export const idERe = () => `e${Date.now().toString(36)}${(numeruesi++).toString(36)}`;

const rrumbullako = (v) => Math.round(v * 10) / 10;

// Element i ri në mes të etiketës, me përmasa sipas llojit.
export const elementIRi = (lloji, sh, shtese = {}) => {
  const pjesa = {
    tekst: [0.7, 0.2],
    qmimi: [0.55, 0.4],
    barkod: [0.45, 0.28],
    qr: [0.3, 0.3],
    flamur: [0.18, 0.18],
    kuti: [0.5, 0.4],
    vije: [0.8, 0.04],
    elips: [0.3, 0.3],
    vule: [0.3, 0.3],
    shigjete: [0.5, 0.2],
    imazh: [0.3, 0.3],
  }[lloji] || [0.4, 0.3];
  const katror = lloji === "qr" || lloji === "elips" || lloji === "vule" || lloji === "imazh";
  let w = sh.w * pjesa[0];
  let h = sh.h * pjesa[1];
  if (katror) w = h = Math.min(w, h, sh.w * 0.9, sh.h * 0.9);
  if (lloji === "flamur") w = h * 1.5;
  if (lloji === "vije") h = Math.max(h, 2);
  w = rrumbullako(Math.max(w, KUFIJTE.minElement));
  h = rrumbullako(Math.max(h, KUFIJTE.minElement));
  return {
    id: idERe(),
    lloji,
    x: rrumbullako((sh.w - w) / 2),
    y: rrumbullako((sh.h - h) / 2),
    w,
    h,
    kushti: "gjithmone",
    ...LLOJET[lloji].fillestare,
    ...shtese,
  };
};

export const shabllonIRi = (letra = "a4") =>
  normalizoShabllonin({ v: VERSIONI_I_SHABLLONIT, letra, rrjeta: RRJETA_PARAZGJEDHUR, h: LETRAT[letra]?.h, vijaPrerjes: true, sfondi: "", elementet: [] });

const numer = (v, parazgjedhur) => {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
  return Number.isFinite(n) ? n : parazgjedhur;
};
const kufizo = (v, min, max) => Math.min(Math.max(v, min), max);

// Pastron një shabllon të lexuar nga baza ose nga një skedar: përmasa të vlefshme, vetëm lloje të
// njohura dhe elemente brenda etiketës. Kthen null kur nuk është shabllon.
export const normalizoShabllonin = (burimi) => {
  let sh = burimi;
  if (typeof sh === "string") {
    try {
      sh = JSON.parse(sh);
    } catch {
      return null;
    }
  }
  if (!sh || typeof sh !== "object" || !Array.isArray(sh.elementet)) return null;
  const { letra, rrjeta, w, h } = permasat(sh);
  const elementet = sh.elementet
    .filter((el) => el && typeof el === "object" && LLOJET[el.lloji])
    .slice(0, 80)
    .map((el) => {
      const ew = kufizo(numer(el.w, 10), KUFIJTE.minElement, w);
      const eh = kufizo(numer(el.h, 10), KUFIJTE.minElement, h);
      return {
        ...LLOJET[el.lloji].fillestare,
        ...el,
        ...(el.lloji === "imazh" ? { imazhi: adresaEVizatimit(el.imazhi) } : {}),
        id: typeof el.id === "string" && el.id ? el.id : idERe(),
        x: kufizo(numer(el.x, 0), 0, w - ew),
        y: kufizo(numer(el.y, 0), 0, h - eh),
        w: ew,
        h: eh,
        kushti: KUSHTET.some(([k]) => k === el.kushti) ? el.kushti : "gjithmone",
      };
    });
  return {
    v: VERSIONI_I_SHABLLONIT,
    letra,
    rrjeta,
    w,
    h,
    vijaPrerjes: sh.vijaPrerjes !== false,
    sfondi: typeof sh.sfondi === "string" ? sh.sfondi : "",
    elementet,
  };
};

// Përmasat e etiketës dalin nga letra: gjerësia e termikut ose qeliza e rrjetës A4.
const permasat = (sh) => {
  const letra = LETRAT[sh.letra] ? sh.letra : "a4";
  if (letra !== "a4") {
    const h = rrumbullako(kufizo(numer(sh.h, LETRAT[letra].h), KUFIJTE.minH, KUFIJTE.maxH));
    return { letra, rrjeta: null, w: LETRAT[letra].w, h };
  }
  const r = gjejRrjeten(sh.rrjeta) || gjejRrjeten(RRJETA_PARAZGJEDHUR);
  return { letra, rrjeta: r.celesi, w: r.w, h: r.h };
};

// Ndryshimi i letrës, i rrjetës ose i lartësisë: elementet shkallëzohen me etiketën, që dizajni të
// mbetet i njëjtë në përmasat e reja.
export const ndryshoLetren = (sh, ndryshimet) => {
  const iRi = permasat({ ...sh, ...ndryshimet });
  const rx = iRi.w / sh.w;
  const ry = iRi.h / sh.h;
  const rf = Math.min(rx, ry);
  return normalizoShabllonin({
    ...sh,
    ...ndryshimet,
    ...iRi,
    elementet: sh.elementet.map((el) => ({
      ...el,
      x: rrumbullako(el.x * rx),
      y: rrumbullako(el.y * ry),
      w: rrumbullako(el.w * rx),
      h: rrumbullako(el.h * ry),
      ...(el.madhesia > 0 ? { madhesia: Math.max(1, Math.round(el.madhesia * rf)) } : {}),
    })),
  });
};

// Shablloni tregon çmimin e vjetër, vulën ose përqindjen: te shtypja shfaqen zgjedhjet e zbritjes.
export const shablloniKaZbritje = (sh) =>
  Boolean(sh) &&
  sh.elementet.some(
    (el) =>
      el.lloji === "vule" ||
      el.kushti === "zbritje" ||
      (el.lloji === "qmimi" && el.burimi === "vjeter") ||
      /\{(zbritja|qmimiVjeter)\}/.test(el.teksti || "")
  );

// Si vendosen etiketat në letër. A4: rrjeta e zgjedhur në faqe në këmbë; termik: çdo etiketë është
// faqe më vete me përmasat e saj (në printer shkon si imazh me gjerësinë e letrës).
export const rrjetaEShabllonit = (sh) => {
  const r = !shablloniTermik(sh) && gjejRrjeten(sh.rrjeta);
  if (!r) return { orientimi: "p", kolonat: 1, rreshtat: 1, perFaqe: 1, veqmas: true };
  return { orientimi: "p", kolonat: r.kolonat, rreshtat: r.rreshtat, perFaqe: r.perFaqe, veqmas: false };
};

export const ngjyraRgb = (hex, parazgjedhur = [0, 0, 0]) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return parazgjedhur;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const formatoQmimin = (v, meEuro = true) => `${(parseFloat(v) || 0).toFixed(2)}${meEuro ? " €" : ""}`;

// Gjendja e produktit për një etiketë: çmimet, zbritja dhe vlerat e fushave të tekstit.
const gjendjaEProduktit = (m, p) => {
  const qmimi = parseFloat(p.price) || 0;
  const rabati = m.merrRabatin(p);
  const iRi = m.merrQmiminMeZbritje(p);
  const kaZbritje = rabati > 0 && iRi != null;
  const kaShumice = m.kaQmimShumice(p);
  const aktual = kaZbritje ? iRi : qmimi;
  const sasia = parseFloat(p.wholesaleQty);
  return {
    qmimi,
    rabati,
    kaZbritje,
    kaShumice,
    aktual,
    vlerat: {
      emri: String(p.name || ""),
      qmimi: formatoQmimin(aktual, m.shfaqEuro !== false),
      qmimiVjeter: kaZbritje ? formatoQmimin(qmimi, m.shfaqEuro !== false) : "",
      zbritja: kaZbritje ? m.perqindja(rabati) : "",
      qmimiShumices: kaShumice ? formatoQmimin(p.wholesalePrice, m.shfaqEuro !== false) : "",
      sasiaShumices: kaShumice && sasia > 0 ? String(sasia) : "",
      barkodi: String(p.barcode || "").trim(),
      shifra: String(p.code ?? "").trim(),
      njesia: String(p.unit || ""),
      shteti: m.shfaqShtetin === false ? "" : m.emriShtetit(p.origin),
      data: String(m.tekstet?.data || "").trim() || new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }),
      dyqani: String(m.emriBiznesit || ""),
      viti: String(tani().getFullYear()),
    },
  };
};

// Teksti me fushat e zëvendësuara; "" kur të gjitha fushat e tij dalin bosh (p.sh. "Nga {sasiaShumices}
// copë" te një produkt pa shumicë), që elementi të mos vizatohet gjysmak.
const zevendeso = (teksti, vlerat) => {
  let fusha = 0;
  let tePlota = 0;
  const t = String(teksti || "").replace(/\{(\w+)\}/g, (gjithe, celesi) => {
    if (!(celesi in vlerat)) return gjithe;
    fusha++;
    if (vlerat[celesi]) tePlota++;
    return vlerat[celesi];
  });
  return fusha > 0 && tePlota === 0 ? "" : t.trim();
};

const plotesonKushtin = (kushti, g) => {
  switch (kushti) {
    case "zbritje":
      return g.kaZbritje;
    case "paZbritje":
      return !g.kaZbritje;
    case "shumice":
      return g.kaShumice;
    case "paShumice":
      return !g.kaShumice;
    case "klasike":
      return !g.kaZbritje && !g.kaShumice;
    // "Automatik": zbritja ka përparësi - pamja e shumicës vetëm kur s'ka zbritje (përndryshe mbivendosen).
    case "shumicePaZbritje":
      return g.kaShumice && !g.kaZbritje;
    default:
      return true;
  }
};

const formaMeNgjyra = (doc, el) => {
  const kaMbushje = Boolean(el.mbushja);
  const kaVije = Boolean(el.vija) && el.trashesia > 0;
  if (!kaMbushje && !kaVije) return null;
  if (kaMbushje) doc.setFillColor(...ngjyraRgb(el.mbushja));
  if (kaVije) {
    doc.setDrawColor(...ngjyraRgb(el.vija));
    doc.setLineWidth(el.trashesia);
  }
  return kaMbushje && kaVije ? "FD" : kaMbushje ? "F" : "S";
};

const vizatoElementin = (m, el, p, g, x, y) => {
  const { doc } = m;
  const { w, h } = el;
  switch (el.lloji) {
    case "tekst": {
      // "Shfaq barkodin" fik edhe numrin e barkodit kur shablloni e ka si tekst ({barkodi}), jo vetëm vijat.
      const teksti = zevendeso(el.teksti, m.shfaqBarkodin ? g.vlerat : { ...g.vlerat, barkodi: "" });
      if (!teksti) return;
      if (el.sfondi) {
        doc.setFillColor(...ngjyraRgb(el.sfondi));
        if (el.rrezja > 0) doc.roundedRect(x, y, w, h, el.rrezja, el.rrezja, "F");
        else doc.rect(x, y, w, h, "F");
      }
      const pad = el.sfondi ? Math.min(w, h) * 0.12 : 0;
      const stili = el.trashe === false ? "normal" : "bold";
      const ngjyra = ngjyraRgb(el.ngjyra, [15, 23, 42]);
      const blloku = m.tekstNeKuti(el.kapitale ? teksti.toUpperCase() : teksti, x + pad, y + pad, w - pad * 2, h - pad * 2, {
        rreshtimi: el.rreshtimi || "center",
        ngjyra,
        maxFs: el.madhesia > 0 ? el.madhesia : 400,
        minFs: 3,
        maxRreshta: kufizo(parseInt(el.rreshta) || 1, 1, 6),
        stili,
      });
      if (el.iPrere && blloku.rreshtat.length === 1) {
        const tw = m.gjeresia(blloku.rreshtat[0], blloku.fs, stili);
        const kw = w - pad * 2;
        const x0 = el.rreshtimi === "left" ? x + pad : el.rreshtimi === "right" ? x + pad + kw - tw : x + pad + (kw - tw) / 2;
        doc.setDrawColor(...ngjyra);
        doc.setLineWidth(Math.max(0.2, m.kapitale(blloku.fs) * 0.1));
        doc.line(x0, y + h / 2, x0 + tw, y + h / 2);
      }
      return;
    }
    case "qmimi": {
      const vlera =
        el.burimi === "vjeter"
          ? g.kaZbritje
            ? g.qmimi
            : null
          : el.burimi === "shumice"
            ? g.kaShumice
              ? parseFloat(p.wholesalePrice)
              : null
            : el.burimi === "rregullt"
              ? g.qmimi
              : g.aktual;
      if (vlera == null) return;
      const ngjyra = ngjyraRgb(el.ngjyra);
      const r = m.vizatoQmimin(vlera, el.meNjesi === false ? "" : m.njesiaShkurt(p.unit), { x, y, w, h }, {
        rreshtimi: el.rreshtimi || "right",
        maxFs: el.madhesia > 0 ? el.madhesia : 900,
        ngjyra,
      });
      // Çmimi i vjetër prehet me një vijë të kuqe të trashë, gjysmë të tejdukshme, pjerrtas "/" mbi gjithë
      // çmimin (nga pak poshtë bazës majtas deri pak mbi krye djathtas), me skaje të rrumbullakëta.
      if (el.iPrere) {
        const kaOpacitet = typeof doc.GState === "function" && typeof doc.setGState === "function";
        if (kaOpacitet) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ "stroke-opacity": 0.8 }));
        }
        doc.setDrawColor(230, 36, 41);
        doc.setLineWidth(Math.max(0.35, r.lartesia * 0.14));
        doc.setLineCap("round");
        // Pak përtej shifrave, jo shumë: mbi majë del vetëm 12% (më parë 30%, që te çmimet afër skajit
        // dilte jashtë etiketës).
        doc.line(
          r.x0 - r.gjeresia * 0.02,
          r.baza + r.lartesia * 0.12,
          r.x0 + r.gjeresia * 1.03,
          r.baza - r.lartesia * 1.12
        );
        doc.setLineCap("butt");
        if (kaOpacitet) doc.restoreGraphicsState();
      }
      return;
    }
    case "barkod": {
      const kodi = g.vlerat.barkodi;
      const modulet = m.shfaqBarkodin && kodi ? m.modulatEBarkodit(kodi) : null;
      if (!modulet) return;
      let lartesiaShifrave = 0;
      if (el.meShifra !== false) {
        const fs = m.shkronjaMeEMadhe((f) => m.kapitale(f) <= h * 0.2 && m.gjeresia(kodi, f) <= w, 3, 40);
        lartesiaShifrave = m.kapitale(fs) + h * 0.06;
        doc.setFont(m.FONTI, "bold");
        doc.setFontSize(fs);
        doc.setTextColor(15, 23, 42);
        doc.text(kodi, x + w / 2, y + h, { align: "center" });
      }
      const bw = Math.min(w, modulet.length * 0.5);
      m.vizatoBarkodin(modulet, x + (w - bw) / 2, y, bw, h - lartesiaShifrave);
      return;
    }
    case "qr": {
      const permbajtja = zevendeso(el.teksti || "{barkodi}", g.vlerat);
      if (!permbajtja) return;
      let qr;
      try {
        qr = QRCode.create(permbajtja, { errorCorrectionLevel: "M" });
      } catch {
        return; // teksti s'nxë në një kod QR
      }
      const n = qr.modules.size;
      const ana = Math.min(w, h);
      const moduli = ana / n;
      const x0 = x + (w - ana) / 2;
      const y0 = y + (h - ana) / 2;
      doc.setFillColor(0, 0, 0);
      for (let r = 0; r < n; r++) {
        let c = 0;
        while (c < n) {
          if (!qr.modules.data[r * n + c]) {
            c++;
            continue;
          }
          let fund = c;
          while (fund < n && qr.modules.data[r * n + fund]) fund++;
          // pak mbivendosje poshtë, që rreshtat të mos ndahen me vija të bardha kur rasterizohet
          doc.rect(x0 + c * moduli, y0 + r * moduli, (fund - c) * moduli, moduli + (r < n - 1 ? 0.02 : 0), "F");
          c = fund;
        }
      }
      return;
    }
    case "flamur": {
      if (!p.origin || m.shfaqFlamurin === false) return;
      const fh = Math.min(h, w / 1.5);
      const fw = fh * 1.5;
      const fx = el.rreshtimi === "right" ? x + w - fw : el.rreshtimi === "center" ? x + (w - fw) / 2 : x;
      m.vizatoFlamurin(p.origin, fx, y + (h - fh) / 2, fw, fh);
      return;
    }
    case "kuti": {
      const stili = formaMeNgjyra(doc, el);
      if (!stili) return;
      const rrezja = Math.min(el.rrezja || 0, w / 2, h / 2);
      if (rrezja > 0) doc.roundedRect(x, y, w, h, rrezja, rrezja, stili);
      else doc.rect(x, y, w, h, stili);
      return;
    }
    case "elips": {
      const stili = formaMeNgjyra(doc, el);
      if (stili) doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, stili);
      return;
    }
    case "vije": {
      if (!(el.trashesia > 0)) return;
      doc.setDrawColor(...ngjyraRgb(el.vija));
      doc.setLineWidth(el.trashesia);
      if (el.meNderprerje) doc.setLineDashPattern([el.trashesia * 3, el.trashesia * 2], 0);
      if (w >= h) doc.line(x, y + h / 2, x + w, y + h / 2);
      else doc.line(x + w / 2, y, x + w / 2, y + h);
      if (el.meNderprerje) doc.setLineDashPattern([], 0);
      return;
    }
    case "vule":
      if (g.kaZbritje) m.vizatoVulen(x + w / 2, y + h / 2, Math.min(w, h) / 2, g.rabati);
      return;
    case "shigjete": {
      const teksti = zevendeso(el.teksti, g.vlerat);
      if (teksti) m.vizatoShigjeten(x, y, w, h, teksti);
      return;
    }
    case "imazh": {
      const formati = /^data:image\/(png|jpe?g)/i.exec(el.imazhi || "")?.[1];
      if (!formati) return;
      const raporti = el.raporti > 0 ? el.raporti : 1;
      const iw = Math.min(w, h * raporti);
      const ih = iw / raporti;
      try {
        doc.addImage(el.imazhi, formati.toLowerCase() === "png" ? "PNG" : "JPEG", x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, `sh-${el.id}-${el.imazhi.length}`, "FAST");
      } catch (err) {
        console.error("Imazhi i shabllonit nuk u vizatua:", err);
      }
      return;
    }
    default:
  }
};

// ---- Imazhet me adresë (p.sh. "/img/qmimore/festive/xhamia.svg") ----
// Shabllonet e gatshme i mbajnë vizatimet si skedarë (SVG/PNG) te public/, jo si data URL brenda JSON-it.
// jsPDF s'vizaton SVG, prandaj para vizatimit çdo imazh me adresë kthehet në PNG (data URL) me
// pergatitImazhet(). Raporti (w / h) merret nga vetë imazhi - te SVG nga viewBox-i (SVG-ja duhet ta ketë).
const memoriaEImazheve = new Map();
// Vizatimet e festave u ndanë në nëndosje sipas grupit (fetare/, kombetare/, ...). Shabllonet e ruajtura me
// adresën e vjetër (/img/qmimore/festive/<skedari>) e marrin këtu të renë, që të mos mbeten pa vizatim.
const DOSJA_E_FESTAVE = "/img/qmimore/festive/";
const VIZATIMET_E_ZHVENDOSURA = {
  "xhamia.png": "fetare/xhamiaMeVije.png",
  "xhamia.svg": "fetare/xhamia.svg",
  "xhamiaVale.png": "fetare/xhamiaVale.png",
  "kurbanBajrami.png": "fetare/xhamiaMeDashin.png",
  "dashi.png": "fetare/dashi.png",
  "kosova.svg": "kombetare/kosova.svg",
  "shqiperia.svg": "kombetare/shqiperia.svg",
  "babagjyshi.svg": "gjate-vitit/babagjyshi.svg",
  "tulipanet.png": "gjate-vitit/tulipanet.png",
  "torta.png": "festime/torta.png",
  "ofertaSpeciale.svg": "biznesi/ofertaSpeciale.svg",
};
export const adresaEVizatimit = (v) => {
  if (typeof v !== "string" || !v.startsWith(DOSJA_E_FESTAVE)) return v;
  const i = VIZATIMET_E_ZHVENDOSURA[v.slice(DOSJA_E_FESTAVE.length)];
  return i ? DOSJA_E_FESTAVE + i : v;
};
export const eshteImazhMeAdrese = (v) => typeof v === "string" && v.length > 0 && !v.startsWith("data:");

const permasatESvg = (svg) => {
  const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(svg);
  if (vb) return { w: parseFloat(vb[1]), h: parseFloat(vb[2]) };
  const w = /<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i.exec(svg);
  const h = /<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i.exec(svg);
  return w && h ? { w: parseFloat(w[1]), h: parseFloat(h[1]) } : { w: 1, h: 1 };
};

const ngarkoImazhin = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Imazhi nuk u ngarkua: ${src}`));
    img.src = src;
  });

// Kthen { imazhi: "data:image/png;base64,...", raporti } për një adresë; ana më e gjatë = madhesiaPx.
export const imazhNgaAdresa = (adresa, madhesiaPx = 800) => {
  adresa = adresaEVizatimit(adresa);
  const celesi = `${adresa}|${madhesiaPx}`;
  if (!memoriaEImazheve.has(celesi)) {
    const premtimi = (async () => {
      let img;
      let w;
      let h;
      if (/\.svg(\?|#|$)/i.test(adresa)) {
        const svg = await (await fetch(adresa)).text();
        const p = permasatESvg(svg);
        const shkalla = madhesiaPx / Math.max(p.w, p.h);
        w = Math.max(1, Math.round(p.w * shkalla));
        h = Math.max(1, Math.round(p.h * shkalla));
        // Pa width/height disa shfletues s'e vizatojnë SVG-në në kanvas.
        // Atributet ekzistuese hiqen nga etiketa <svg>, që të mos dyfishohen (XML i pavlefshëm).
        const meMadhesi = svg.replace(/<svg\b([^>]*)>/i, (_, atr) =>
          `<svg${atr.replace(/\s(width|height)\s*=\s*(["'])[^"']*\2/gi, "")} width="${w}" height="${h}">`
        );
        img = await ngarkoImazhin(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(meMadhesi)}`);
      } else {
        img = await ngarkoImazhin(adresa);
        const shkalla = madhesiaPx / Math.max(img.naturalWidth || 1, img.naturalHeight || 1);
        w = Math.max(1, Math.round((img.naturalWidth || 1) * shkalla));
        h = Math.max(1, Math.round((img.naturalHeight || 1) * shkalla));
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      return { imazhi: canvas.toDataURL("image/png"), raporti: w / h };
    })();
    premtimi.catch(() => memoriaEImazheve.delete(celesi));
    memoriaEImazheve.set(celesi, premtimi);
  }
  return memoriaEImazheve.get(celesi);
};

// Kopje e shabllonit ku çdo imazh me adresë është bërë PNG (data URL), gati për vizatoQmimoren. Shablloni pa
// imazhe me adresë kthehet ashtu siç është; imazhi që s'ngarkohet mbetet jashtë (s'vizatohet).
export const pergatitImazhet = async (sh, madhesiaPx = 800) => {
  if (!sh || !sh.elementet.some((el) => el.lloji === "imazh" && eshteImazhMeAdrese(el.imazhi))) return sh;
  const elementet = await Promise.all(
    sh.elementet.map(async (el) => {
      if (el.lloji !== "imazh" || !eshteImazhMeAdrese(el.imazhi)) return el;
      try {
        const r = await imazhNgaAdresa(el.imazhi, madhesiaPx);
        return { ...el, imazhi: r.imazhi, raporti: r.raporti };
      } catch (err) {
        console.error(err);
        return { ...el, imazhi: "" };
      }
    })
  );
  return { ...sh, elementet };
};

// Vizaton një etiketë sipas shabllonit, me këndin lart-majtas te (x, y). Elementet vizatohen sipas
// radhës në listë: i fundit del sipër.
export const vizatoShabllonin = (m, sh, p, x, y) => {
  const g = gjendjaEProduktit(m, p);
  if (sh.sfondi) {
    m.doc.setFillColor(...ngjyraRgb(sh.sfondi, [255, 255, 255]));
    m.doc.rect(x, y, sh.w, sh.h, "F");
  }
  for (const el of sh.elementet) {
    if (!plotesonKushtin(el.kushti, g)) continue;
    vizatoElementin(m, el, p, g, x + el.x, y + el.y);
  }
};
