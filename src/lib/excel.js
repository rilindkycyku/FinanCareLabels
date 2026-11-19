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

// Kolona → emrat e mundshëm të titullit (të normalizuar).
const KOLONAT = {
  shifra: ["shifra", "kodi", "plu"],
  barkodi: ["barcodi", "barkodi", "barcode"],
  emri: ["emertimi", "emri", "produkti"],
  sasia: ["sasia"],
  qmimi: ["cmimi", "cmim", "qmimi", "qmim"],
  qmimiZbritje: ["cmimizbritje", "cmimri", "qmimizbritje", "qmimri"],
  qmimiRregullt: ["cmimirregullt", "cmimiiregullt", "cmimivjeter", "qmimirregullt", "qmimivjeter"],
  kaZbritje: ["kazbritje"],
  kopje: ["kopje", "kopjet", "copies"],
  origjina: ["origjina", "shteti"],
  njesia: ["njesia", "njesiamatese"],
};

// Fletët ndihmëse (tabela e kodeve GS1) nuk janë lista produktesh.
const FLETET_E_ANASHKALUARA = new Set(["gs1codes"]);

const numer = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const tekst = (v) => (v == null ? "" : String(v).trim());

// Barkodi si numër (3902751020757) mbetet i saktë deri 15 shifra; si tekst merret ashtu siç është.
const barkodi = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v.toFixed(0) : String(v)) : tekst(v));

const rrumbullako2 = (v) => Math.round(v * 100) / 100;

const kodiNgaEmri = (() => {
  const harta = new Map(Object.entries(EMRAT_E_SHTETEVE).map(([kodi, emri]) => [normalizo(emri), kodi]));
  // Emrat e Excel-it janë në trajtën e shquar ("Kosova", "Gjermania") - provohet edhe pa mbaresën.
  return (emri) => {
    const n = normalizo(emri);
    if (!n) return "";
    return harta.get(n) || harta.get(n.replace(/a$/, "e")) || harta.get(n.replace(/a$/, "")) || "";
  };
})();

const gjejTitujt = (rreshtat) => {
  for (let i = 0; i < Math.min(rreshtat.length, 20); i++) {
    const kolonat = {};
    (rreshtat[i] || []).forEach((qeliza, j) => {
      const n = normalizo(qeliza);
      for (const [celesi, emrat] of Object.entries(KOLONAT)) {
        if (kolonat[celesi] === undefined && emrat.includes(n)) kolonat[celesi] = j;
      }
    });
    const kaQmim = ["qmimi", "qmimiZbritje", "qmimiRregullt"].some((k) => kolonat[k] !== undefined);
    if (kolonat.emri !== undefined && kaQmim) return { rreshti: i, kolonat };
  }
  return null;
};

const produktiNgaRreshti = (r, kolonat, nrRreshtit) => {
  const merr = (k) => (kolonat[k] === undefined ? undefined : r[kolonat[k]]);
  const emri = tekst(merr("emri"));
  if (!emri) return null;

  const qmimi = numer(merr("qmimi"));
  const zbritje = numer(merr("qmimiZbritje"));
  const rregullt = numer(merr("qmimiRregullt"));
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
  } else {
    p.price = [zbritje, qmimi, rregullt].find((v) => v > 0) ?? null;
    if (p.price != null) p.price = rrumbullako2(p.price);
  }

  // Origjina: nga prefiksi GS1 i barkodit; kur barkodi është i brendshëm, nga kolona "Origjina".
  p.origin = origjinaNgaBarkodi(p.barcode)?.kodi || kodiNgaEmri(merr("origjina"));
  p.gabim = p.price == null ? "Pa çmim" : "";
  return p;
};

/**
 * Kthen { fletet: [{ emri, produktet, kolonat, mesazh }] } - vetëm fletët që kanë rreshtin e titujve.
 * @param bajtet ArrayBuffer / Uint8Array e skedarit
 */
export const lexoExcelin = (bajtet) => {
  const wb = XLSX.read(bajtet, { type: "array", cellFormula: false, cellHTML: false, cellText: false });
  const fletet = [];
  for (const emri of wb.SheetNames) {
    if (FLETET_E_ANASHKALUARA.has(normalizo(emri))) continue;
    const ws = wb.Sheets[emri];
    if (!ws || !ws["!ref"]) continue;
    // sheet_to_json nis nga fillimi i zonës së fletës (p.sh. E2), jo nga rreshti 1 - për numrin e rreshtit në Excel.
    const rreshtiIPare = XLSX.utils.decode_range(ws["!ref"]).s.r;
    const rreshtat = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: true, defval: null });
    const titujt = gjejTitujt(rreshtat);
    if (!titujt) continue;
    const produktet = [];
    for (let i = titujt.rreshti + 1; i < rreshtat.length; i++) {
      const p = produktiNgaRreshti(rreshtat[i] || [], titujt.kolonat, rreshtiIPare + i + 1);
      if (p) produktet.push(p);
    }
    fletet.push({ emri, produktet, kolonat: Object.keys(titujt.kolonat) });
  }
  return { fletet };
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
