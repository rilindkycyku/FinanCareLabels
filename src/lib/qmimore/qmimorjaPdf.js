// Çmimorja (etiketat e rafteve dhe posterat e çmimeve) në A4. Vetëm vizatimi: flamujt (PNG) dhe
// fontet (base64) i përgatit thirrësi, sepse ngarkimi i tyre kërkon shfletuesin.
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import { emriShtetit } from "./origjina";
import { rrjetaEShabllonit, vizatoShabllonin } from "./shablloniQmimores";
import { argumentetBardhEZi } from "./bardhEZi";

// Margjina e fletës A4 kur rrjeta e shabllonit s'e mbush faqen (shih fundin e vizatoQmimoren).
const MARGJINA = 5;

// Rreshti i /Faturat/shfaqTeDhenatKalkulimit si etiketë.
export const etiketaNgaKalkulimi = (k) => {
  // Vetëm zbritja aktive e produktit (api: RabatiZbritjes) - rabati i rreshtit te kalkulimi është ai i furnitorit.
  const rabati = parseFloat(k.rabatiZbritjes);
  return {
    name: k.emriProduktit,
    price: k.qmimiShites,
    wholesalePrice: k.qmimiShitesMeShumic,
    wholesaleQty: k.sasiaShumices,
    barcode: k.barkodi,
    origin: k.origjina,
    unit: k.emriNjesiaMatese,
    discount: rabati > 0 ? rabati : null,
    discountFrom: k.dataZbritjes,
    discountTo: k.dataSkadimitZbritjes,
  };
};

// Etiketa e shumicës ka kuptim vetëm kur çmimi me shumicë është më i ulët se ai për copë.
export const kaQmimShumice = (p) => {
  const shumice = parseFloat(p.wholesalePrice);
  return shumice > 0 && shumice < (parseFloat(p.price) || 0);
};

// Llogarit çmimin me zbritje. Nëse produkti nuk ka zbritje vetë, përdor rabatiDefault.
export const qmimiMeZbritje = (p, rabatiDefault = 0, aplikoPerTeGjithe = false) => {
  const qmimi = parseFloat(p.price) || 0;
  if (qmimi <= 0) return null;
  const rabati = aplikoPerTeGjithe && rabatiDefault ? rabatiDefault : (parseFloat(p.discount) || rabatiDefault || 0);
  if (!rabati || rabati <= 0) return null;
  return Math.round((qmimi - qmimi * (rabati / 100)) * 100) / 100;
};

const SKEDARET_E_FONTIT = { bold: "BarlowCondensed-SemiBold.ttf", normal: "BarlowCondensed-Medium.ttf" };
let fontetPromise = null;
// Barlow Condensed (OFL, public/fonts): shifrat e ngushta lënë çmimin të dalë shumë më i madh se me
// Helvetica. Pa të (offline pa cache) etiketat vizatohen me Helvetica.
export const ngarkoFontetEQmimores = () => {
  if (!fontetPromise) {
    const merr = async (emri) => {
      const r = await fetch(`/fonts/${emri}`);
      if (!r.ok) throw new Error(emri);
      const bajtet = new Uint8Array(await r.arrayBuffer());
      let binar = "";
      for (let i = 0; i < bajtet.length; i += 0x8000) binar += String.fromCharCode(...bajtet.subarray(i, i + 0x8000));
      return btoa(binar);
    };
    fontetPromise = Promise.all([merr(SKEDARET_E_FONTIT.bold), merr(SKEDARET_E_FONTIT.normal)])
      .then(([bold, normal]) => ({ bold, normal }))
      .catch((err) => {
        console.error("Fonti i çmimores nuk u ngarkua:", err);
        fontetPromise = null;
        return null;
      });
  }
  return fontetPromise;
};

// "€/kg" vetëm për mallin që shitet me peshë, vëllim ose gjatësi; për copë mjafton "€".
const NJESITE_E_SHKURTRA = [
  [/kilogram|^kg$/i, "kg"],
  [/^lit[eë]r|^l$/i, "l"],
  [/metër linear|^m$/i, "m"],
  [/^m2$/i, "m²"],
  [/^m3$/i, "m³"],
];
const njesiaShkurt = (emri) => NJESITE_E_SHKURTRA.find(([re]) => re.test(emri || ""))?.[1] || "";

// Modulet e barkodit ("1" = vijë). EAN/UPC kur kodi i kalon kontrollit të shifrës, ndryshe CODE128.
const modulatEBarkodit = (kodi) => {
  const sipasGjatesise = { 8: "EAN8", 12: "UPC", 13: "EAN13" };
  const formatet = [/^\d+$/.test(kodi) && sipasGjatesise[kodi.length], "CODE128"].filter(Boolean);
  for (const format of formatet) {
    try {
      const te = {};
      JsBarcode(te, kodi, { format, flat: true });
      return te.encodings.map((e) => e.data).join("");
    } catch {
      // shifra e kontrollit s'përputhet - provo formatin tjetër
    }
  }
  return null;
};

const NGJYRA = {
  zi: [0, 0, 0],
  teksti: [15, 23, 42],
  gri: [100, 116, 139],
  vija: [203, 213, 225],
  verdhe: [255, 217, 102],
  verdheLehte: [255, 238, 186],
  kuqe: [230, 36, 41],
  tekstiNeKuqe: [255, 236, 0],
  bardhe: [255, 255, 255],
};

const perqindja = (rabati) => `-${parseFloat(Number(rabati || 0).toFixed(1))}%`;

/**
 * @param products  [{ name, price, wholesalePrice, wholesaleQty, barcode, origin, unit, discount }]
 * @param opsionet.shablloni  shablloni i etiketës (i detyrueshëm - shabllonetEGatshme/ ose i përdoruesit)
 * @param opsionet.stiliQmimit  "centet" (39⁹³ €) ose "dhjetore" (39.93 €)
 * @param opsionet.tekstet      { data } - periudha e ofertës për {data}
 * @param opsionet.flamujtPng   { XK: "data:image/png;...", ... }
 * @param opsionet.fontet       { bold, normal } base64 nga ngarkoFontetEQmimores()
 * @param opsionet.vetemNjeEtikete  faqja = vetë etiketa e parë (për parapamjen)
 * @param opsionet.faqePerEtikete  çdo etiketë në faqen e vet, sa etiketa (për printerin termik: të gjitha
 *                              në një dokument, fontet futen vetëm një herë)
 * @param opsionet.shablloni    shabllon i përdoruesit (shih shablloniQmimores.js); zëvendëson dizajnin
 *                              dhe madhësinë
 * @param opsionet.emriBiznesit  për fushën "{dyqani}" te shabllonet
 * @returns jsPDF
 */
// Plani i fletës A4: sa etiketa hyjnë në çdo orientim (portret ose peisazh), pa dalë jashtë faqes (2 mm siguri
// në skaj). Hapësira mes etiketave (mm) mbetet ajo e kërkuar; kolonat dhe rreshtat llogariten prej saj.
// orientimi: "auto" = ai me më shumë etiketa (në barazim, portret), ose "portret" / "peisazh".
const SIGURIA_SKAJIT = 2;
const kapaciteti = (brenda, madhesia, hapesira) => Math.max(1, Math.floor((brenda + hapesira) / (madhesia + hapesira)));
// margjina (mm): minimumi nga skaji i letrës - etiketat s'i afrohen skajit më shumë; 0 = deri në skaj.
// Kthen edhe margjinat reale (anash, lartPoshte), sepse rrjeta vihet në mes.
export const planiFletes = (shablloni, orientimi = "auto", reqH = 0, reqV = 0, margjina = SIGURIA_SKAJIT) => {
  const m = Math.max(0, Math.min(Number(margjina) || 0, 30));
  const r = shablloni ? rrjetaEShabllonit(shablloni) : null;
  if (!r || r.veqmas) return null;
  const { w, h } = shablloni;
  const gH = Math.max(0, Math.min(Number(reqH) || 0, 10));
  const gV = Math.max(0, Math.min(Number(reqV) || 0, 10));
  const opsionet = orientimi === "peisazh" ? ["l"] : orientimi === "portret" ? ["p"] : ["p", "l"];
  let zgjedhur = null;
  for (const o of opsionet) {
    const [fw, fh] = o === "l" ? [297, 210] : [210, 297];
    const kolonat = kapaciteti(fw - 2 * m, w, gH);
    const rreshtat = kapaciteti(fh - 2 * m, h, gV);
    const perFaqe = kolonat * rreshtat;
    if (!zgjedhur || perFaqe > zgjedhur.perFaqe) {
      // Rrjeta vihet në mes: pjesa e mbetur ndahet njësoj në të dy anët, që etiketat të jenë sa më larg skajit
      // (mbrojtja më e mirë nga prerja e printerit). Margjina e zgjedhur është minimumi, kjo është ajo reale.
      const anash = (fw - (kolonat * w + (kolonat - 1) * gH)) / 2;
      const lartPoshte = (fh - (rreshtat * h + (rreshtat - 1) * gV)) / 2;
      zgjedhur = { orientimi: o, kolonat, rreshtat, perFaqe, gH, gV, margjina: m, anash, lartPoshte };
    }
  }
  return zgjedhur;
};

// Rregullimet e fletës të parazgjedhura për një shabllon: ato që nxënë më shumë etiketa në A4 me margjinë 2 mm.
// Provohen hapësirat 0.8 mm (prerje më e lehtë) dhe 0 (etiketat ngjitur, një vijë e përbashkët prerjeje); fiton ajo me
// më shumë etiketa, në barazim 0.8 mm. Shablloni mund t'i japë vetë (shablloni.fleta = { hapesiraH, hapesiraV,
// margjina, orientimi }), p.sh. kur fleta e printerit ka përmasa të njohura.
export const FLETA_PARAZGJEDHUR = { hapesiraH: 0.8, hapesiraV: 0.8, margjina: SIGURIA_SKAJIT, orientimi: "auto" };
export const fletaEParazgjedhur = (shablloni) => {
  if (!shablloni) return FLETA_PARAZGJEDHUR;
  if (shablloni.fleta && typeof shablloni.fleta === "object") return { ...FLETA_PARAZGJEDHUR, ...shablloni.fleta };
  let mira = FLETA_PARAZGJEDHUR;
  let sa = planiFletes(shablloni, "auto", 0.8, 0.8, SIGURIA_SKAJIT)?.perFaqe ?? 0;
  const ngjitur = planiFletes(shablloni, "auto", 0, 0, SIGURIA_SKAJIT)?.perFaqe ?? 0;
  if (ngjitur > sa) {
    mira = { ...FLETA_PARAZGJEDHUR, hapesiraH: 0, hapesiraV: 0 };
    sa = ngjitur;
  }
  return mira;
};

export const vizatoQmimoren = (products, opsionet = {}) => {
  const {
    shfaqBarkodin = true,
    stiliQmimit = "centet",
    tekstet = {},
    flamujtPng = {},
    fontet = null,
    vetemNjeEtikete = false,
    faqePerEtikete = false,
    shablloni = null,
    emriBiznesit = "",
    hapesiraH = 0,
    hapesiraV = 0,
    shfaqEuro = true,
    // Flamuri dhe emri i shtetit (origjina) - si "Shfaq barkodin", fiken për të gjitha etiketat.
    shfaqFlamurin = true,
    shfaqShtetin = true,
    // Kur fiken barkodi/flamuri/shteti, çmimi dhe emri zënë vendin e tyre (shablloniQmimores.kutiteMeVendinELire).
    zmadhoNeVendinELire = true,
    // Vijat e prerjes: null = sipas shabllonit, true/false = gjithmonë / kurrë.
    vijatEPrerjes = null,
    // Korrigjimi i printerit në shfletues (mm): rrjeta zhvendoset djathtas/poshtë; në desktop e bën printimi direkt.
    zhvendosjaX = 0,
    zhvendosjaY = 0,
    // Printeri bardh e zi: çdo ngjyrë e vizatimit kthehet në të zezë / gri / të bardhë (flamujt i përgatit thirrësi).
    bardhEZi = false,
    orientimi = "auto",
    margjina = SIGURIA_SKAJIT,
  } = opsionet;
  // Çdo etiketë vizatohet nga një shabllon (të gatshmit te shabllonetEGatshme/ ose ai i përdoruesit) - dizajnet e
  // vjetra në kod (DIZAJNET) u kthyen në shabllone. Vetëm zbritjet reale të produkteve (ato që i zbaton arka).
  if (!shablloni) throw new Error("Zgjidhni një shabllon për çmimoren.");
  const rabatiDefault = 0;
  const aplikoPerTeGjithe = false;
  // Shablloni i ka përmasat e veta: rrjeta në A4 del prej tyre, ose çdo etiketë është faqe më vete.
  const rrjeta = rrjetaEShabllonit(shablloni);
  const formati = rrjeta;
  const { w, h } = shablloni;

  const faqeVeqmas = faqePerEtikete || Boolean(rrjeta?.veqmas);
  // Plani i fletës (orientimi dhe numri i etiketave) llogaritet para krijimit të PDF-së, që faqja të dalë e duhura.
  const plani = faqeVeqmas || vetemNjeEtikete ? null : planiFletes(shablloni, orientimi, hapesiraH, hapesiraV, margjina);
  const doc = vetemNjeEtikete || faqeVeqmas
    ? new jsPDF({ orientation: w > h ? "l" : "p", unit: "mm", format: [w, h] })
    : new jsPDF(plani ? plani.orientimi : "p", "mm", "a4");
  const sf = doc.internal.scaleFactor;
  if (bardhEZi) {
    for (const [metoda, vije] of [["setFillColor", false], ["setTextColor", false], ["setDrawColor", true]]) {
      const origjinali = doc[metoda].bind(doc);
      doc[metoda] = (...a) => origjinali(...argumentetBardhEZi(a, vije));
    }
  }

  const mbushFaqenBardhe = () => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  // Faqja e parë mbushet me të bardhë që të mos mbetet transparente kur printohet direkt
  mbushFaqenBardhe();

  let FONTI = "helvetica";
  let KAPITALE = 0.716;
  let BISHTI = 0.22;
  if (fontet) {
    doc.addFileToVFS(SKEDARET_E_FONTIT.bold, fontet.bold);
    doc.addFont(SKEDARET_E_FONTIT.bold, "BarlowCondensed", "bold");
    doc.addFileToVFS(SKEDARET_E_FONTIT.normal, fontet.normal);
    doc.addFont(SKEDARET_E_FONTIT.normal, "BarlowCondensed", "normal");
    FONTI = "BarlowCondensed";
    KAPITALE = 0.7;
    BISHTI = 0.2;
  }

  /* ─── Llogaritja e zbritjes për produkt ────────────────────────── */
  const merrRabatin = (p) => {
    if (aplikoPerTeGjithe && rabatiDefault > 0) return rabatiDefault;
    const ngaProdukti = parseFloat(p.discount);
    if (ngaProdukti > 0) return ngaProdukti;
    return rabatiDefault > 0 ? rabatiDefault : null;
  };

  const merrQmiminMeZbritje = (p) => {
    if (p.qmimiPasZbritjes != null) return p.qmimiPasZbritjes;
    const qmimi = parseFloat(p.price) || 0;
    const rabati = merrRabatin(p);
    if (!rabati || qmimi <= 0) return null;
    return Math.round((qmimi - qmimi * (rabati / 100)) * 100) / 100;
  };

  /* ─── Matjet e tekstit (mm) ─────────────────────────────────────── */
  const mm = (fs) => fs / sf;
  const kapitale = (fs) => mm(fs) * KAPITALE;
  const bishti = (fs) => mm(fs) * BISHTI;
  const gjeresia = (teksti, fs, stili = "bold") => {
    doc.setFont(FONTI, stili);
    return (doc.getStringUnitWidth(teksti) * fs) / sf;
  };

  const shkronjaMeEMadhe = (nxe, minFs, maxFs) => {
    if (nxe(maxFs)) return maxFs;
    if (!nxe(minFs)) return minFs;
    let poshte = minFs;
    let larte = maxFs;
    while (larte - poshte > 0.2) {
      const mes = (poshte + larte) / 2;
      if (nxe(mes)) poshte = mes;
      else larte = mes;
    }
    return poshte;
  };

  const shkurto = (teksti, maxW, fs, stili) => {
    if (gjeresia(teksti, fs, stili) <= maxW) return teksti;
    let t = teksti;
    while (t.length > 1 && gjeresia(`${t}...`, fs, stili) > maxW) t = t.slice(0, -1);
    return `${t.trimEnd()}...`;
  };

  const pershtatTekstin = (teksti, maxW, maxH, { maxFs = 72, minFs = 5, maxRreshta = 2, lh = 1.1, stili = "bold" } = {}) => {
    // Hapësirat e dyfishta ("Sallam EXTRA  350GR"), tab-at dhe rreshtat e rinj bëhen një hapësirë: përndryshe teksti i
    // ndarë s'përputhet kurrë me fjalët dhe emri del me shkronjën më të vogël.
    const t = String(teksti || "").replace(/\s+/g, " ").trim();
    const ndaj = (fs) => {
      doc.setFont(FONTI, stili);
      doc.setFontSize(fs);
      const rreshtat = doc.splitTextToSize(t, maxW);
      if (rreshtat.length < 2) return rreshtat;
      let poshte = maxW / rreshtat.length;
      let larte = maxW;
      let meIMire = rreshtat;
      for (let i = 0; i < 12; i++) {
        const mes = (poshte + larte) / 2;
        const prove = doc.splitTextToSize(t, mes);
        if (prove.length === rreshtat.length && prove.join(" ") === rreshtat.join(" ")) {
          meIMire = prove;
          larte = mes;
        } else {
          poshte = mes;
        }
      }
      return meIMire;
    };
    const lartesia = (fs, n) => kapitale(fs) + (n - 1) * mm(fs) * lh;
    const fjalet = t.split(/\s+/).join(" ");
    const nxe = (fs) => {
      const rreshtat = ndaj(fs);
      return (
        rreshtat.length <= maxRreshta &&
        rreshtat.join(" ") === fjalet &&
        lartesia(fs, rreshtat.length) + bishti(fs) * 0.6 <= maxH &&
        rreshtat.every((r) => gjeresia(r, fs, stili) <= maxW)
      );
    };
    const fs = shkronjaMeEMadhe(nxe, minFs, maxFs);
    let rreshtat = ndaj(fs);
    if (rreshtat.length > maxRreshta) {
      rreshtat = [...rreshtat.slice(0, maxRreshta - 1), rreshtat.slice(maxRreshta - 1).join(" ")];
    }
    rreshtat = rreshtat.map((r) => shkurto(r, maxW, fs, stili));
    return { fs, rreshtat, lh, stili, lartesia: lartesia(fs, rreshtat.length) };
  };

  const shkruajBllokun = (blloku, x, yLart, lart, { rreshtimi = "left", ngjyra = NGJYRA.teksti } = {}) => {
    const { fs, rreshtat, lh, stili, lartesia } = blloku;
    const baza = yLart + (lart - lartesia) / 2 + kapitale(fs);
    doc.setFont(FONTI, stili);
    doc.setFontSize(fs);
    doc.setTextColor(...ngjyra);
    rreshtat.forEach((r, i) => doc.text(r, x, baza + i * mm(fs) * lh, { align: rreshtimi }));
  };

  const tekstNeKuti = (teksti, x, y, kw, kh, opsionetTekstit = {}) => {
    const { rreshtimi = "center", ngjyra, ...pershtatja } = opsionetTekstit;
    const blloku = pershtatTekstin(teksti, kw, kh, pershtatja);
    const xTekstit = rreshtimi === "center" ? x + kw / 2 : rreshtimi === "right" ? x + kw : x;
    shkruajBllokun(blloku, xTekstit, y, kh, { rreshtimi, ngjyra });
    return blloku;
  };

  const tekstIRrotulluar = (teksti, cx, cy, fs, kendi, stili = "bold") => {
    const t = (kendi * Math.PI) / 180;
    const tw = gjeresia(teksti, fs, stili);
    const ch = kapitale(fs);
    doc.setFontSize(fs);
    doc.text(
      teksti,
      cx - (tw / 2) * Math.cos(t) + (ch / 2) * Math.sin(t),
      cy + (tw / 2) * Math.sin(t) + (ch / 2) * Math.cos(t),
      { angle: kendi }
    );
  };

  /* ─── Format bazë ─────────────────────────────────────────────── */
  const poligon = (pikat, stili) => {
    const [x0, y0] = pikat[0];
    const segmentet = pikat.slice(1).map(([px, py], i) => [px - pikat[i][0], py - pikat[i][1]]);
    doc.lines(segmentet, x0, y0, [1, 1], stili, true);
  };

  const korniza = (x, y, kw, kh, trashesia, ngjyra = NGJYRA.zi) => {
    doc.setDrawColor(...ngjyra);
    doc.setLineWidth(trashesia);
    doc.rect(x, y, kw, kh, "S");
  };

  const vizatoBarkodin = (modulet, x, y, bw, bh) => {
    const gjeresiaModulit = bw / modulet.length;
    doc.setFillColor(0, 0, 0);
    let i = 0;
    while (i < modulet.length) {
      if (modulet[i] !== "1") {
        i++;
        continue;
      }
      let j = i;
      while (j < modulet.length && modulet[j] === "1") j++;
      doc.rect(x + i * gjeresiaModulit, y, (j - i) * gjeresiaModulit, bh, "F");
      i = j;
    }
  };

  const vizatoFlamurin = (kodi, x, y, fw, fh) => {
    if (!flamujtPng[kodi]) return;
    doc.addImage(flamujtPng[kodi], "PNG", x, y, fw, fh, `flamuri-${kodi}`);
    doc.setDrawColor(...NGJYRA.vija);
    doc.setLineWidth(0.12);
    doc.rect(x, y, fw, fh, "S");
  };

  /* ─── Çmimi ───────────────────────────────────────────────────── */
  const pjesetEQmimit = (qmimi) => {
    const centet = Math.round((parseFloat(qmimi) || 0) * 100);
    return { euro: String(Math.floor(centet / 100)), cent: String(centet % 100).padStart(2, "0") };
  };

  const vizatoQmimin = (qmimi, njesia, kutia, { rreshtimi = "right", maxFs = 900, ngjyra = NGJYRA.zi } = {}) => {
    const { euro, cent } = pjesetEQmimit(qmimi);
    // Pa simbolin €: vetëm njësia (p.sh. "/kg") mbetet, që çmimi të lexohet vetëm si numër.
    const simboli = shfaqEuro ? (njesia ? `€/${njesia}` : "€") : njesia ? `/${njesia}` : "";
    const hapesira = (fs) => mm(fs) * 0.05;
    let gjeresiaQmimit;
    let lartesiaBllokut;
    let vizato;
    if (stiliQmimit === "dhjetore") {
      const teksti = `${euro}.${cent}`;
      // Pa simbol s'rezervohet vend për të: numri zë gjithë gjerësinë dhe del më i madh.
      gjeresiaQmimit = (fs) => gjeresia(teksti, fs) + (simboli ? hapesira(fs) + gjeresia(simboli, fs * 0.36) : 0);
      lartesiaBllokut = (fs) => kapitale(fs);
      vizato = (x0, baza, fs) => {
        doc.setFontSize(fs);
        doc.text(teksti, x0, baza);
        doc.setFontSize(fs * 0.36);
        doc.text(simboli, x0 + gjeresia(teksti, fs) + hapesira(fs), baza - kapitale(fs) + kapitale(fs * 0.36));
      };
    } else {
      // Pa simbol, centet zënë edhe vendin e tij poshtë: dalin më të mëdha (0,6 në vend të 0,5).
      const kCent = simboli ? 0.5 : 0.6;
      gjeresiaQmimit = (fs) =>
        gjeresia(euro, fs) + hapesira(fs) + Math.max(gjeresia(cent, fs * kCent), simboli ? gjeresia(simboli, fs * 0.3) : 0);
      lartesiaBllokut = (fs) => kapitale(fs) + (/[gjpqy]/.test(simboli) ? bishti(fs * 0.3) : 0);
      vizato = (x0, baza, fs) => {
        const xCent = x0 + gjeresia(euro, fs) + hapesira(fs);
        doc.setFontSize(fs);
        doc.text(euro, x0, baza);
        doc.setFontSize(fs * kCent);
        doc.text(cent, xCent, baza - kapitale(fs) + kapitale(fs * kCent));
        if (simboli) {
          doc.setFontSize(fs * 0.3);
          doc.text(simboli, xCent, baza);
        }
      };
    }
    const fs = shkronjaMeEMadhe(
      (f) => gjeresiaQmimit(f) <= kutia.w && lartesiaBllokut(f) <= kutia.h,
      4,
      maxFs
    );
    const gjer = gjeresiaQmimit(fs);
    const x0 =
      rreshtimi === "right" ? kutia.x + kutia.w - gjer : rreshtimi === "center" ? kutia.x + (kutia.w - gjer) / 2 : kutia.x;
    const baza = kutia.y + (kutia.h - lartesiaBllokut(fs)) / 2 + kapitale(fs);
    doc.setFont(FONTI, "bold");
    doc.setTextColor(...ngjyra);
    vizato(x0, baza, fs);
    return { x0, baza, gjeresia: gjer, lartesia: kapitale(fs), fs };
  };

  /* ─── Shenjat e zbritjes (vula + shigjeta) ─────────────────────── */
  const vizatoVulen = (cx, cy, r, rabati) => {
    const maja = 20;
    const pikat = [];
    for (let i = 0; i < maja * 2; i++) {
      const kendi = (i * Math.PI) / maja - Math.PI / 2;
      const rr = i % 2 ? r * 0.85 : r;
      pikat.push([cx + rr * Math.cos(kendi), cy + rr * Math.sin(kendi)]);
    }
    doc.setFillColor(...NGJYRA.kuqe);
    poligon(pikat, "F");

    const kendi = 14;
    doc.setTextColor(...NGJYRA.tekstiNeKuqe);
    doc.setFont(FONTI, "bold");

    if (r >= 8 && rabati) {
      const fsLart = shkronjaMeEMadhe((f) => gjeresia("ZBRITJE", f) <= r * 1.3 && kapitale(f) <= r * 0.32, 3, 200);
      const fsPoshte = shkronjaMeEMadhe((f) => gjeresia(perqindja(rabati), f) <= r * 1.15 && kapitale(f) <= r * 0.48, 3, 200);
      const hapesira = r * 0.1;
      const total = kapitale(fsLart) + hapesira + kapitale(fsPoshte);
      const t = (kendi * Math.PI) / 180;
      const d1 = -total / 2 + kapitale(fsLart) / 2;
      const d2 = total / 2 - kapitale(fsPoshte) / 2;
      tekstIRrotulluar("ZBRITJE", cx + d1 * Math.sin(t), cy + d1 * Math.cos(t), fsLart, kendi);
      tekstIRrotulluar(perqindja(rabati), cx + d2 * Math.sin(t), cy + d2 * Math.cos(t), fsPoshte, kendi);
    } else {
      const fs = shkronjaMeEMadhe((f) => gjeresia("ZBRITJE", f) <= r * 1.4 && kapitale(f) <= r * 0.55, 3, 200);
      tekstIRrotulluar("ZBRITJE", cx, cy, fs, kendi);
    }
  };

  const vizatoShigjeten = (x, y, sw, sh, teksti) => {
    const maja = Math.min(sh * 0.5, sw * 0.28);
    doc.setFillColor(...NGJYRA.kuqe);
    poligon(
      [
        [x, y],
        [x + sw - maja, y],
        [x + sw, y + sh / 2],
        [x + sw - maja, y + sh],
        [x, y + sh],
      ],
      "F"
    );
    const pad = sh * 0.14;
    tekstNeKuti(teksti, x + pad, y + pad, sw - maja * 0.55 - pad * 1.5, sh - pad * 2, {
      maxRreshta: 2,
      lh: 1.05,
      ngjyra: NGJYRA.tekstiNeKuqe,
      maxFs: 60,
      minFs: 3,
    });
  };

  /* ─── Mjetet që i jepen motorit të shablloneve ─────────────────── */
  const mjetetEShabllonit = {
    doc,
    shfaqEuro,
    FONTI,
    tekstet,
    emriBiznesit,
    shfaqBarkodin,
    shfaqFlamurin,
    shfaqShtetin,
    zmadhoNeVendinELire,
    merrRabatin,
    merrQmiminMeZbritje,
    kaQmimShumice,
    emriShtetit,
    njesiaShkurt,
    perqindja,
    modulatEBarkodit,
    gjeresia,
    kapitale,
    shkronjaMeEMadhe,
    tekstNeKuti,
    vizatoQmimin,
    vizatoBarkodin,
    vizatoFlamurin,
    vizatoVulen,
    vizatoShigjeten,
  };

  const vizatoEtiketen = (p, x, y) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, w, h, "F");
    return vizatoShabllonin(mjetetEShabllonit, shablloni, p, x, y);
  };

  if (vetemNjeEtikete) {
    if (products[0]) vizatoEtiketen(products[0], 0, 0);
    return doc;
  }

  if (faqeVeqmas) {
    products.forEach((product, i) => {
      if (i > 0) {
        doc.addPage([w, h], w > h ? "l" : "p");
        mbushFaqenBardhe();
      }
      vizatoEtiketen(product, 0, 0);
    });
    return doc;
  }

  // Orientimi dhe rrjeta zgjidhen nga planiFletes (sa më shumë etiketa me margjinën minimale të zgjedhur); rrjeta
  // vihet në mes të fletës, që etiketat të jenë sa më larg skajit. Mes etiketave ka hapësirë (mm) për prerje.
  const { kolonat, perFaqe, gH, gV } = plani;
  const xFillimi = plani.anash + (Number(zhvendosjaX) || 0);
  const yFillimi = plani.lartPoshte + (Number(zhvendosjaY) || 0);
  const meVija = vijatEPrerjes == null ? shablloni.vijaPrerjes : Boolean(vijatEPrerjes);
  products.forEach((product, i) => {
    if (i > 0 && i % perFaqe === 0) {
      doc.addPage(plani.orientimi === "l" ? [297, 210] : [210, 297], plani.orientimi);
      mbushFaqenBardhe();
    }
    const n = i % perFaqe;
    const x = xFillimi + (n % kolonat) * (w + gH);
    const y = yFillimi + Math.floor(n / kolonat) * (h + gV);
    vizatoEtiketen(product, x, y);
    if (meVija) korniza(x, y, w, h, 0.3, NGJYRA.zi); // vijë prerjeje e zezë e fortë
  });

  return doc;
};
