// Leximi i QmimePerRaft.xlsx (ose çdo Excel-i me të njëjtat kolona). Çdo fletë ka një rresht titujsh
// (Shifra, Barcodi, Emertimi, Sasia, Cmimi ...) diku në krye; kolonat kërkohen sipas emrit, jo pozitës.
// Vlerat e formulave (Origjina, CmimiRregullt) merren siç i ka ruajtur Excel-i herën e fundit.
import * as XLSX from "xlsx";
import { EMRAT_E_SHTETEVE } from "./qmimore/emratEShteteve";
import { origjinaNgaBarkodi } from "./qmimore/origjina";

const normalizo = (v) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ë/g, "e")
    .replace(/[^a-z0-9]/g, "");

// Titulli i kolonës si fjalë të pastra: "CmimiZbritje" → "cmimi zbritje", "Çmimi (me TVSH)" → "cmimi me tvsh".
export const celes = (v) =>
  String(v ?? "")
    .replace(/([a-zë])([A-ZË])/g, "$1 $2")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ë/g, "e")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Fushat e etiketës → sinonimet e titullit (si te FinanCare Migrator). Edhe Excel-at që s'janë shablloni ynë
// (eksporte nga programe të tjera, lista furnitorësh) njihen sipas titujve; kur s'ka tituj, sipas përmbajtjes.
export const FUSHAT = [
  { key: "emri", emri: "Emri i produktit", kerkohet: true, sinonime: ["emertimi", "emri", "produkti", "emri i produktit", "emertimi i artikullit", "artikulli", "artikull", "pershkrimi", "pershkrim", "malli", "naziv", "naziv artikla", "name", "product", "product name", "description", "item", "item name"] },
  { key: "qmimi", emri: "Çmimi", kerkohet: true, sinonime: ["cmimi", "cmim", "qmimi", "qmim", "cmimi shites", "cmimi i shitjes", "cmimi shitjes", "cmimi me tvsh", "cmimi pakice", "cmimi me pakice", "pcmimi", "mpc", "price", "sale price", "retail price", "unit price", "cena", "cijena", "prodajna cena"] },
  { key: "qmimiZbritje", emri: "Çmimi me zbritje", sinonime: ["cmimi zbritje", "cmimi me zbritje", "cmim ri", "cmimi ri", "cmimi i ri", "qmimi zbritje", "qmim ri", "qmimi ri", "cmimi aksion", "cmimi promo", "promo", "akcija", "akcijska cena", "discount price", "new price", "sale"] },
  { key: "qmimiRregullt", emri: "Çmimi i rregullt / i vjetër", sinonime: ["cmimi rregullt", "cmimi i rregullt", "cmimi vjeter", "cmimi i vjeter", "qmimi rregullt", "qmimi vjeter", "regular price", "old price", "stara cena", "redovna cena"] },
  { key: "barkodi", emri: "Barkodi", sinonime: ["barcodi", "barkodi", "barcode", "bar code", "bar kodi", "barkod", "ean", "ean13", "ean 13", "gtin"] },
  { key: "shifra", emri: "Shifra / kodi", sinonime: ["shifra", "kodi", "plu", "sku", "kodi i artikullit", "shifra e artikullit", "sifra", "sifra artikla", "code", "item code", "art nr", "nr artikullit"] },
  { key: "origjina", emri: "Origjina (shteti)", sinonime: ["origjina", "shteti", "vendi", "vendi i origjines", "country", "origin", "zemlja porekla", "poreklo"] },
  { key: "njesia", emri: "Njësia", sinonime: ["njesia", "njesia matese", "njm", "unit", "uom", "jm", "jedinica mere"] },
  { key: "kopje", emri: "Kopje (sa etiketa)", sinonime: ["kopje", "kopjet", "copies", "nr etiketave", "etiketa"] },
  { key: "sasia", emri: "Sasia", sinonime: ["sasia", "qty", "quantity", "kolicina", "stoku", "stock"] },
  { key: "kaZbritje", emri: "Ka zbritje", sinonime: ["ka zbritje"] },
];
const FUSHAT_E_QMIMIT = ["qmimi", "qmimiZbritje", "qmimiRregullt"];

// Fletët ndihmëse (tabela e kodeve GS1) nuk janë lista produktesh.
const FLETET_E_ANASHKALUARA = new Set(["gs1codes"]);

// Sa mirë i përshtatet një titull një sinonimi (0-100) - i njëjti algoritëm si te Migratori.
export const piket = (titulli, sinonimi) => {
  if (!titulli || !sinonimi) return 0;
  if (titulli === sinonimi) return 100;
  if (titulli.replace(/ /g, "") === sinonimi.replace(/ /g, "")) return 95;
  const fjaletT = titulli.split(" ");
  const fjaletS = sinonimi.split(" ");
  const permban = (gjate, shkurt) => ` ${gjate.join(" ")} `.includes(` ${shkurt.join(" ")} `);
  if (permban(fjaletT, fjaletS)) return 70 + Math.min(20, fjaletS.length * 6) - Math.min(15, (fjaletT.length - fjaletS.length) * 3);
  if (permban(fjaletS, fjaletT) && titulli.length >= 3) return 55 + Math.min(15, fjaletT.length * 5);
  const teperbashketa = fjaletS.filter((f) => f.length > 2 && fjaletT.includes(f)).length;
  return teperbashketa > 0 ? Math.round((40 * teperbashketa) / Math.max(fjaletS.length, fjaletT.length)) : 0;
};

const PRAGU = 55;

// Lidh qelizat e një rreshti me fushat: çdo kolonë dhe çdo fushë vetëm një herë, çiftet më të mira të parat.
const hartaERreshtit = (rreshti) => {
  const ciftet = [];
  (rreshti || []).forEach((qeliza, kolona) => {
    if (typeof qeliza !== "string") return;
    const t = celes(qeliza);
    if (!t || t.length > 40) return;
    for (const f of FUSHAT) {
      const p = Math.max(...f.sinonime.map((s) => piket(t, s)));
      if (p >= PRAGU) ciftet.push({ fusha: f.key, kolona, piket: p });
    }
  });
  ciftet.sort((a, b) => b.piket - a.piket || a.kolona - b.kolona);
  const kolonat = {};
  const zena = new Set();
  let gjithsej = 0;
  for (const c of ciftet) {
    if (kolonat[c.fusha] !== undefined || zena.has(c.kolona)) continue;
    kolonat[c.fusha] = c.kolona;
    zena.add(c.kolona);
    gjithsej += c.piket;
  }
  return { kolonat, gjithsej };
};

const kaQmim = (kolonat) => FUSHAT_E_QMIMIT.some((k) => kolonat[k] !== undefined);

// Rreshti i titujve: ai me pikët më të larta mes 30 të parëve që ka emrin dhe një çmim.
const gjejTitujt = (rreshtat) => {
  let mira = null;
  for (let i = 0; i < Math.min(rreshtat.length, 30); i++) {
    const { kolonat, gjithsej } = hartaERreshtit(rreshtat[i]);
    if (kolonat.emri === undefined || !kaQmim(kolonat)) continue;
    if (!mira || gjithsej > mira.gjithsej) mira = { rreshti: i, fillimi: i + 1, kolonat, gjithsej, menyra: "titujt" };
  }
  return mira;
};

const numer = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "").replace(/[\s€]/g, "").replace(/eur$/i, "");
  // "1.234,56" → 1234.56; "1,59" → 1.59
  const n = parseFloat(/,\d{1,3}$/.test(s) && s.includes(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(",", "."));
  return Number.isFinite(n) && /^-?[\d.,]+$/.test(s) ? n : null;
};

const tekst = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());

// Barkodi si numër (3902751020757) mbetet i saktë deri 15 shifra; si tekst merret ashtu siç është.
const barkodi = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v.toFixed(0) : String(v)) : tekst(v).replace(/\s/g, ""));

const ngjanBarkod = (v) => /^\d{7,14}$/.test(barkodi(v));

// Pa rresht titujsh (ose me tituj të panjohur): kolonat gjenden sipas përmbajtjes - teksti më i gjatë është emri,
// numrat 7-14 shifrorë barkodi, kolona numerike më djathtas (me decimale) çmimi.
const titujtNgaPermbajtja = (rreshtat) => {
  const mostra = rreshtat.slice(0, 200).filter((r) => r && r.some((q) => q != null && q !== ""));
  if (mostra.length < 1) return null;
  const nrKolonave = Math.max(...mostra.map((r) => r.length));
  const stat = [];
  for (let k = 0; k < nrKolonave; k++) {
    let plot = 0, tekste = 0, gjatesia = 0, barkode = 0, numra = 0, decimale = 0;
    for (const r of mostra) {
      const q = r[k];
      if (q == null || q === "") continue;
      plot++;
      if (ngjanBarkod(q)) barkode++;
      else if (numer(q) != null) {
        numra++;
        if (!Number.isInteger(numer(q))) decimale++;
      } else if (/[a-zA-Zëç]{2,}/.test(String(q))) {
        tekste++;
        gjatesia += String(q).length;
      }
    }
    stat.push({ k, plot, tekste: plot ? tekste / plot : 0, gjatesia: tekste ? gjatesia / tekste : 0, barkode: plot ? barkode / plot : 0, numra: plot ? numra / plot : 0, decimale: numra ? decimale / numra : 0 });
  }
  const minPlot = Math.max(1, mostra.length * 0.3);
  const emri = stat.filter((s) => s.plot >= minPlot && s.tekste >= 0.6).sort((a, b) => b.gjatesia - a.gjatesia)[0];
  const qmimet = stat.filter((s) => s.plot >= minPlot && s.numra >= 0.6 && s.k !== emri?.k);
  const qmimi = [...qmimet].sort((a, b) => (b.decimale >= 0.3) - (a.decimale >= 0.3) || b.k - a.k)[0];
  if (!emri || !qmimi) return null;
  const kolonat = { emri: emri.k, qmimi: qmimi.k };
  const bk = stat.filter((s) => s.plot >= minPlot && s.barkode >= 0.6 && s.k !== emri.k).sort((a, b) => b.barkode - a.barkode)[0];
  if (bk) kolonat.barkodi = bk.k;
  // Fillimi: rreshti i parë me emër tekst dhe çmim numër.
  const fillimi = rreshtat.findIndex((r) => r && /[a-zA-Zëç]{2,}/.test(String(r[emri.k] ?? "")) && numer(r[qmimi.k]) != null);
  return fillimi < 0 ? null : { rreshti: null, fillimi, kolonat, gjithsej: 0, menyra: "permbajtja" };
};

const rrumbullako2 = (v) => Math.round(v * 100) / 100;

const kodiNgaEmri = (() => {
  const harta = new Map(Object.entries(EMRAT_E_SHTETEVE).map(([kodi, emri]) => [normalizo(emri), kodi]));
  // Emrat e Excel-it janë në trajtën e shquar ("Kosova", "Gjermania") - provohet edhe pa mbaresën.
  return (emri) => {
    const n = normalizo(emri);
    if (!n) return "";
    if (/^[a-z]{2}$/.test(n) && EMRAT_E_SHTETEVE[n.toUpperCase()]) return n.toUpperCase();
    return harta.get(n) || harta.get(n.replace(/a$/, "e")) || harta.get(n.replace(/a$/, "")) || "";
  };
})();

const produktiNgaRreshti = (r, kolonat, nrRreshtit) => {
  const merr = (k) => (kolonat[k] === undefined || kolonat[k] === null ? undefined : r[kolonat[k]]);
  const emri = tekst(merr("emri"));
  if (!emri) return null;

  const qmimi = numer(merr("qmimi"));
  const zbritje = numer(merr("qmimiZbritje"));
  const rregullt = numer(merr("qmimiRregullt"));
  // Rreshtat e totalit / nëntitujt (pa asnjë çmim dhe pa barkod) s'janë produkte.
  if (qmimi == null && zbritje == null && rregullt == null && !tekst(merr("barkodi")) && /^(total|gjithsej|shuma|ukupno)\b/i.test(emri)) return null;
  const p = {
    nr: nrRreshtit,
    name: emri,
    code: tekst(merr("shifra")),
    barcode: barkodi(merr("barkodi")),
    sasia: numer(merr("sasia")),
    kaZbritjeExcel: tekst(merr("kaZbritje")),
    // Sa etiketa të printohen (kolona opsionale "Kopje"); 1 kur mungon.
    kopje: Math.max(1, Math.min(99, Math.round(numer(merr("kopje")) || 1))),
    unit: tekst(merr("njesia")) || (/\bkg\b/i.test(emri) ? "kg" : ""),
    price: null,
    discount: null,
    qmimiPasZbritjes: null,
  };

  // Me zbritje: çmimi i rregullt (i vjetri, i prerë) + çmimi i ri; përqindja llogaritet nga të dy.
  if (zbritje > 0 && rregullt > zbritje) {
    p.price = rrumbullako2(rregullt);
    p.qmimiPasZbritjes = rrumbullako2(zbritje);
    p.discount = Math.round((1 - zbritje / rregullt) * 1000) / 10;
  } else if (zbritje > 0 && qmimi > zbritje && kolonat.qmimiRregullt === undefined) {
    // Kolonat "Cmimi" + "Cmimi me zbritje" (pa "i rregullt"): çmimi është i rregullti.
    p.price = rrumbullako2(qmimi);
    p.qmimiPasZbritjes = rrumbullako2(zbritje);
    p.discount = Math.round((1 - zbritje / qmimi) * 1000) / 10;
  } else {
    p.price = [zbritje, qmimi, rregullt].find((v) => v > 0) ?? null;
    if (p.price != null) p.price = rrumbullako2(p.price);
  }

  // Origjina: nga prefiksi GS1 i barkodit; kur barkodi është i brendshëm, nga kolona "Origjina".
  p.origin = origjinaNgaBarkodi(p.barcode)?.kodi || kodiNgaEmri(merr("origjina"));
  p.gabim = p.price == null ? "Pa çmim" : "";
  return p;
};

// Nënshkrimi i rreshtit të titujve: lidhja e ruajtur me dorë vlen për çdo Excel me të njëjtat tituj (p.sh. eksporti
// i përjavshëm nga i njëjti program), edhe kur fleta quhet ndryshe.
export const nenshkrimiIRreshtit = (rreshti) => (rreshti || []).map((q) => celes(q)).join("|").replace(/\|+$/, "");
export const celesiIHartes = (fleta, titujt, rreshtat) =>
  titujt.rreshti != null ? `t:${nenshkrimiIRreshtit(rreshtat[titujt.rreshti])}` : `f:${fleta}`;

// Lidhja e ruajtur me dorë (hartat = { "<çelësi>": { rreshti, fillimi, kolonat } }) për këtë fletë, nëse ka.
const hartaERuajtur = (hartat, fleta, rreshtat) => {
  if (!hartat) return null;
  for (let i = 0; i < Math.min(rreshtat.length, 30); i++) {
    const h = hartat[`t:${nenshkrimiIRreshtit(rreshtat[i])}`];
    if (h && rreshtat[i]?.some((q) => q != null && q !== "")) return { ...h, rreshti: i, fillimi: i + 1, menyra: "dore" };
  }
  const h = hartat[`f:${fleta}`];
  return h ? { ...h, rreshti: null, menyra: "dore" } : null;
};

const shfaqQelizen = (q) => (q == null ? "" : typeof q === "number" ? (Number.isInteger(q) ? q.toFixed(0) : String(q)) : String(q));

/**
 * Kthen { fletet: [{ emri, produktet, kolonat, titujt, mostra, nrKolonave }] }. Fletët që s'kanë kolonat e njohura
 * kthehen bosh (titujt = null), që përdoruesi t'i lidhë vetë te "Lidh kolonat".
 * @param bajtet ArrayBuffer / Uint8Array e skedarit (xlsx, xls, ods, csv)
 * @param hartat lidhjet e ruajtura me dorë (cilesimet.hartatEKolonave)
 */
export const lexoExcelin = (bajtet, hartat = null) => {
  const wb = XLSX.read(bajtet, { type: "array", cellFormula: false, cellHTML: false, cellText: false, codepage: 65001 });
  const fletet = [];
  for (const emri of wb.SheetNames) {
    if (FLETET_E_ANASHKALUARA.has(normalizo(emri))) continue;
    const ws = wb.Sheets[emri];
    if (!ws || !ws["!ref"]) continue;
    // sheet_to_json nis nga fillimi i zonës së fletës (p.sh. E2), jo nga rreshti 1 - për numrin e rreshtit në Excel.
    const zona = XLSX.utils.decode_range(ws["!ref"]);
    const rreshtiIPare = zona.s.r;
    const kolonaEPare = zona.s.c;
    const rreshtat = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: true, defval: null });
    if (!rreshtat.some((r) => r?.some((q) => q != null && q !== ""))) continue;
    const titujt = hartaERuajtur(hartat, emri, rreshtat) || gjejTitujt(rreshtat) || titujtNgaPermbajtja(rreshtat);
    const produktet = [];
    if (titujt) {
      for (let i = titujt.fillimi; i < rreshtat.length; i++) {
        const p = produktiNgaRreshti(rreshtat[i] || [], titujt.kolonat, rreshtiIPare + i + 1);
        if (p) produktet.push(p);
      }
    }
    const nrKolonave = Math.min(40, Math.max(0, ...rreshtat.slice(0, 200).map((r) => r?.length || 0)));
    fletet.push({
      emri,
      produktet,
      kolonat: titujt ? Object.keys(titujt.kolonat) : [],
      titujt,
      rreshtiIPare,
      kolonaEPare,
      nrKolonave,
      // Rreshtat e parë si tekst, për dritaren "Lidh kolonat".
      mostra: rreshtat.slice(0, 40).map((r) => Array.from({ length: nrKolonave }, (_, k) => shfaqQelizen(r?.[k]))),
    });
  }
  // Fletët pa produkte dhe pa kolona të njohura dalin në fund.
  return { fletet: [...fletet.filter((f) => f.titujt), ...fletet.filter((f) => !f.titujt)] };
};

// Sugjerimi i kolonave për një rresht titujsh (te "Lidh kolonat") dhe produktet që dalin nga rreshtat e mostrës.
export const sugjeroKolonat = (rreshti) => hartaERreshtit(rreshti).kolonat;
export const produktetNgaMostra = (mostra, fillimi, kolonat) =>
  mostra.slice(fillimi).map((r, i) => produktiNgaRreshti(r, kolonat, fillimi + i + 1)).filter(Boolean);

// Emri i kolonës si në Excel (A, B, ... AA).
export const shkronjaEKolones = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

// Shablloni i sugjeruar për çdo fletë të QmimePerRaft.xlsx (kur përdoruesi s'ka zgjedhur tjetër).
const SUGJERIMET = {
  raft: "gati:raft",
  raftmezbritje: "gati:zbritjeRaft",
  ofertaditorejavore: "gati:oferta",
  "9copvaga": "gati:nenteVaga",
  "9cop": "gati:nente",
  "2copzbritje": "gati:dyZbritje",
  "2cop11gratis": "gati:gratisDy",
  "4cop": "gati:poster",
};

export const shablloniISugjeruar = (emriFletes) => {
  const n = normalizo(emriFletes);
  if (SUGJERIMET[n]) return SUGJERIMET[n];
  if (n.includes("festive")) return "kategoria:festive";
  if (n.includes("zbritje")) return "gati:zbritjeRaft";
  return "gati:raft";
};

/**
 * Produkti me ndryshimet e bëra në program (editori te tabela) - Excel-i nuk preket.
 * @param baza produkti nga Excel-i (ose bosh për një produkt të shtuar)
 * @param n    { name, code, barcode, qmimi, qmimiRi, origjina ("" = automatike) } - tekstet e fushave; mungesa = vlera e bazës
 */
export const meNdryshime = (baza, n) => {
  if (!n) return baza;
  const name = String(n.name ?? baza.name ?? "");
  const code = String(n.code ?? baza.code ?? "");
  const barcode = String(n.barcode ?? baza.barcode ?? "").trim();
  const qmimi = numer(n.qmimi ?? baza.price);
  const qmimiRi = numer(n.qmimiRi ?? baza.qmimiPasZbritjes);
  const ngaEmri = (e) => (/\bkg\b/i.test(e) ? "kg" : "");
  const p = {
    ...baza,
    name,
    code,
    barcode,
    // Njësia e kolonës "Njesia" mbetet; ajo që vinte nga emri ("... KG") ndjek emrin e ri.
    unit: baza.unit && baza.unit !== ngaEmri(baza.name || "") ? baza.unit : ngaEmri(name),
    price: null,
    discount: null,
    qmimiPasZbritjes: null,
    ndryshuar: true,
  };
  if (qmimiRi > 0 && qmimi > qmimiRi) {
    p.price = rrumbullako2(qmimi);
    p.qmimiPasZbritjes = rrumbullako2(qmimiRi);
    p.discount = Math.round((1 - qmimiRi / qmimi) * 1000) / 10;
  } else {
    const v = qmimi > 0 ? qmimi : qmimiRi > 0 ? qmimiRi : null;
    p.price = v == null ? null : rrumbullako2(v);
  }
  // Origjina: e zgjedhur me dorë, ndryshe automatike nga prefiksi GS1 (si te leximi i Excel-it).
  p.origjinaMeDore = Boolean(n.origjina);
  p.origin = n.origjina || origjinaNgaBarkodi(barcode)?.kodi || (barcode === baza.barcode ? baza.origin || "" : "");
  p.gabim = !name.trim() ? "Pa emër" : p.price == null ? "Pa çmim" : "";
  return p;
};
