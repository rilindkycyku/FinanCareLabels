// Origjina e produktit ruhet si kod ISO 3166-1 alpha-2 (p.sh. "XK"). Emrat e shteteve në shqip vijnë
// nga tabela EMRAT_E_SHTETEVE, flamujt (SVG) nga flag-icons - secili ngarkohet vetëm kur duhet, si chunk më vete.
import { EMRAT_E_SHTETEVE } from "./emratEShteteve";

// Shtetet nga vjen zakonisht malli - dalin të parat në listë.
const SHTETET_KRYESORE = ["XK", "AL", "MK", "RS", "ME", "TR", "DE", "IT", "GR", "AT", "HR", "SI", "BA", "BG", "PL", "HU", "NL", "CN"];

export const emriShtetit = (kodi) => (kodi ? EMRAT_E_SHTETEVE[kodi] || kodi : "");

let opsionet = null;
// Opsionet për react-select: të zakonshmet sipër, pastaj të gjitha sipas alfabetit.
export const opsionetEOrigjines = () => {
  if (opsionet) return opsionet;
  const opsion = (kodi) => ({ value: kodi, label: emriShtetit(kodi) });
  const kryesore = new Set(SHTETET_KRYESORE);
  const teTjerat = Object.keys(EMRAT_E_SHTETEVE)
    .filter((k) => !kryesore.has(k))
    .map(opsion)
    .sort((a, b) => a.label.localeCompare(b.label, "sq"));
  opsionet = [
    { label: "Më të përdorurat", options: SHTETET_KRYESORE.map(opsion) },
    { label: "Të gjitha shtetet", options: teTjerat },
  ];
  return opsionet;
};

// Flamujt nga flag-icons (lipis): harta e saktë e Kosovës dhe ngjyrat zyrtare (country-flag-icons e vizatonte
// hartën si poligon të vrazhdë). Çdo flamur është chunk më vete (~9 KB) dhe ngarkohet vetëm kur duhet -
// të gjithë bashkë janë ~2.4 MB. exhaustive: pa të, Vite nuk kërkon brenda node_modules.
const BURIMET_E_FLAMUJVE = import.meta.glob("../../../node_modules/flag-icons/flags/4x3/*.svg", {
  query: "?raw",
  import: "default",
  exhaustive: true,
});
const NGARKUESIT = Object.fromEntries(
  Object.entries(BURIMET_E_FLAMUJVE).map(([shtegu, ngarko]) => [shtegu.match(/([a-z0-9-]+)\.svg$/i)[1].toUpperCase(), ngarko]),
);

// flag-icons janë 4:3 (viewBox 0 0 640 480); gjithë çmimorja/UI-ja i vizaton 3:2. Pritet brezi i mesëm 3:2
// (rreth 5% lart e poshtë - vetëm sfond; edhe flamuri zyrtar i Kosovës është 2:3), që asgjë të mos zgjatet.
function ne3me2(svg) {
  return svg.replace(/viewBox="([\d.\s-]+)"/, (_, vb) => {
    const [x, y, w, h] = vb.trim().split(/\s+/).map(Number);
    const hRe = (w * 2) / 3;
    if (!(hRe < h)) return `viewBox="${vb}"`;
    return `viewBox="${x} ${y + (h - hRe) / 2} ${w} ${hRe}"`;
  });
}

const cache = {};
const ngarkoFlamurin = (kodi) => {
  if (!cache[kodi]) {
    const ngarko = NGARKUESIT[kodi];
    cache[kodi] = ngarko
      ? ngarko().then(ne3me2).catch((err) => {
          delete cache[kodi];
          throw err;
        })
      : Promise.resolve(null);
  }
  return cache[kodi];
};

// { XK: "<svg ...>", ... } vetëm për kodet e dhëna (pa kode = të gjithë - vetëm për listën e shteteve).
export const ngarkoFlamujt = async (kodet) => {
  const lista = (kodet ?? Object.keys(NGARKUESIT)).filter(Boolean);
  const ciftet = await Promise.all([...new Set(lista)].map(async (k) => [k, await ngarkoFlamurin(k).catch(() => null)]));
  return Object.fromEntries(ciftet.filter(([, svg]) => svg));
};

export const flamuriSiDataUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// Flamuri si PNG (3:2) për jsPDF, që s'vizaton SVG. Kthen null nëse shteti s'ka flamur.
export const flamuriSiPng = async (kodi, gjeresia = 120) => {
  const svg = await ngarkoFlamurin(kodi);
  if (!svg) return null;
  const lartesia = Math.round((gjeresia * 2) / 3);
  // Pa width/height SVG-ja s'ka madhësi të brendshme dhe disa shfletues nuk e vizatojnë në canvas.
  const meMadhesi = svg.replace("<svg ", `<svg width="${gjeresia}" height="${lartesia}" preserveAspectRatio="none" `);
  const img = new Image();
  img.src = flamuriSiDataUrl(meMadhesi);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = gjeresia;
  canvas.height = lartesia;
  canvas.getContext("2d").drawImage(img, 0, 0, gjeresia, lartesia);
  return canvas.toDataURL("image/png");
};

// Brezet e prefiksave GS1 sipas organizatave anëtare (GS1 Member Organisations).
// Burimi: https://en.wikipedia.org/wiki/List_of_GS1_country_codes
export const GS1_PREFIKSET = [
  { min: 0, max: 19, kodi: "US" },
  { min: 30, max: 39, kodi: "US" },
  { min: 60, max: 139, kodi: "US" },
  { min: 300, max: 379, kodi: "FR" },
  { min: 380, max: 380, kodi: "BG" },
  { min: 381, max: 381, kodi: "XK" }, // GS1 Kosova
  { min: 383, max: 383, kodi: "SI" },
  { min: 385, max: 385, kodi: "HR" },
  { min: 387, max: 387, kodi: "BA" },
  { min: 389, max: 389, kodi: "ME" },
  { min: 390, max: 390, kodi: "XK" }, // Kosovë (para anëtarësimit zyrtar në GS1, ende e pranishme te prodhuesit vendorë)
  { min: 400, max: 440, kodi: "DE" },
  { min: 450, max: 459, kodi: "JP" },
  { min: 460, max: 469, kodi: "RU" },
  { min: 470, max: 470, kodi: "KG" },
  { min: 471, max: 471, kodi: "TW" },
  { min: 474, max: 474, kodi: "EE" },
  { min: 475, max: 475, kodi: "LV" },
  { min: 476, max: 476, kodi: "AZ" },
  { min: 477, max: 477, kodi: "LT" },
  { min: 478, max: 478, kodi: "UZ" },
  { min: 479, max: 479, kodi: "LK" },
  { min: 480, max: 480, kodi: "PH" },
  { min: 481, max: 481, kodi: "BY" },
  { min: 482, max: 482, kodi: "UA" },
  { min: 483, max: 483, kodi: "TM" },
  { min: 484, max: 484, kodi: "MD" },
  { min: 485, max: 485, kodi: "AM" },
  { min: 486, max: 486, kodi: "GE" },
  { min: 487, max: 487, kodi: "KZ" },
  { min: 488, max: 488, kodi: "TJ" },
  { min: 489, max: 489, kodi: "HK" },
  { min: 490, max: 499, kodi: "JP" },
  { min: 500, max: 509, kodi: "GB" },
  { min: 520, max: 521, kodi: "GR" },
  { min: 528, max: 528, kodi: "LB" },
  { min: 529, max: 529, kodi: "CY" },
  { min: 530, max: 530, kodi: "AL" }, // Shqipëri
  { min: 531, max: 531, kodi: "MK" }, // Maqedoni e Veriut
  { min: 535, max: 535, kodi: "MT" },
  { min: 539, max: 539, kodi: "IE" },
  { min: 540, max: 549, kodi: "BE" },
  { min: 560, max: 560, kodi: "PT" },
  { min: 569, max: 569, kodi: "IS" },
  { min: 570, max: 579, kodi: "DK" },
  { min: 590, max: 590, kodi: "PL" },
  { min: 594, max: 594, kodi: "RO" },
  { min: 599, max: 599, kodi: "HU" },
  { min: 600, max: 601, kodi: "ZA" },
  { min: 603, max: 603, kodi: "GH" },
  { min: 604, max: 604, kodi: "SN" },
  { min: 605, max: 605, kodi: "UG" },
  { min: 606, max: 606, kodi: "AO" },
  { min: 607, max: 607, kodi: "OM" },
  { min: 608, max: 608, kodi: "BH" },
  { min: 609, max: 609, kodi: "MU" },
  { min: 611, max: 611, kodi: "MA" },
  { min: 612, max: 612, kodi: "SO" },
  { min: 613, max: 613, kodi: "DZ" },
  { min: 615, max: 615, kodi: "NG" },
  { min: 616, max: 616, kodi: "KE" },
  { min: 617, max: 617, kodi: "CM" },
  { min: 618, max: 618, kodi: "CI" },
  { min: 619, max: 619, kodi: "TN" },
  { min: 620, max: 620, kodi: "TZ" },
  { min: 621, max: 621, kodi: "SY" },
  { min: 622, max: 622, kodi: "EG" },
  { min: 624, max: 624, kodi: "LY" },
  { min: 625, max: 625, kodi: "JO" },
  { min: 626, max: 626, kodi: "IR" },
  { min: 627, max: 627, kodi: "KW" },
  { min: 628, max: 628, kodi: "SA" },
  { min: 629, max: 629, kodi: "AE" },
  { min: 630, max: 630, kodi: "QA" },
  { min: 631, max: 631, kodi: "NA" },
  { min: 632, max: 632, kodi: "RW" },
  { min: 640, max: 649, kodi: "FI" },
  { min: 680, max: 681, kodi: "CN" },
  { min: 690, max: 699, kodi: "CN" },
  { min: 700, max: 709, kodi: "NO" },
  { min: 729, max: 729, kodi: "IL" },
  { min: 730, max: 739, kodi: "SE" },
  { min: 740, max: 740, kodi: "GT" },
  { min: 741, max: 741, kodi: "SV" },
  { min: 742, max: 742, kodi: "HN" },
  { min: 743, max: 743, kodi: "NI" },
  { min: 744, max: 744, kodi: "CR" },
  { min: 745, max: 745, kodi: "PA" },
  { min: 746, max: 746, kodi: "DO" },
  { min: 750, max: 750, kodi: "MX" },
  { min: 754, max: 755, kodi: "CA" },
  { min: 759, max: 759, kodi: "VE" },
  { min: 760, max: 769, kodi: "CH" },
  { min: 770, max: 771, kodi: "CO" },
  { min: 773, max: 773, kodi: "UY" },
  { min: 775, max: 775, kodi: "PE" },
  { min: 777, max: 777, kodi: "BO" },
  { min: 778, max: 779, kodi: "AR" },
  { min: 780, max: 780, kodi: "CL" },
  { min: 784, max: 784, kodi: "PY" },
  { min: 786, max: 786, kodi: "EC" },
  { min: 789, max: 790, kodi: "BR" },
  { min: 800, max: 839, kodi: "IT" },
  { min: 840, max: 849, kodi: "ES" },
  { min: 850, max: 850, kodi: "CU" },
  { min: 858, max: 858, kodi: "SK" },
  { min: 859, max: 859, kodi: "CZ" },
  { min: 860, max: 860, kodi: "RS" }, // Serbi
  { min: 865, max: 865, kodi: "MN" },
  { min: 867, max: 867, kodi: "KP" },
  { min: 868, max: 869, kodi: "TR" }, // Turqi
  { min: 870, max: 879, kodi: "NL" },
  { min: 880, max: 881, kodi: "KR" },
  { min: 883, max: 883, kodi: "MM" },
  { min: 884, max: 884, kodi: "KH" },
  { min: 885, max: 885, kodi: "TH" },
  { min: 887, max: 887, kodi: "LA" },
  { min: 888, max: 888, kodi: "SG" },
  { min: 890, max: 890, kodi: "IN" },
  { min: 893, max: 893, kodi: "VN" },
  { min: 894, max: 894, kodi: "BD" },
  { min: 896, max: 896, kodi: "PK" },
  { min: 899, max: 899, kodi: "ID" },
  { min: 900, max: 919, kodi: "AT" },
  { min: 930, max: 939, kodi: "AU" },
  { min: 940, max: 949, kodi: "NZ" },
  { min: 955, max: 955, kodi: "MY" },
  { min: 958, max: 958, kodi: "MO" },
];

/**
 * Zbulon shtetin e regjistrimit sipas prefiksit GS1 të barkodit (EAN-13, EAN-8, UPC-A).
 * Kthen { kodi: "XK", emri: "Kosovë", prefiksi: "381" } ose null nëse nuk ka përputhje.
 */
export const origjinaNgaBarkodi = (barkodi) => {
  if (!barkodi) return null;
  const shifrat = String(barkodi).replace(/\D/g, "");
  if (shifrat.length < 3) return null;

  // UPC-A (12 shifra) normalizohet me "0" përpara për t'u bërë EAN-13
  const eNormalizuar = shifrat.length === 12 ? "0" + shifrat : shifrat;
  const prefiksiNumer = parseInt(eNormalizuar.slice(0, 3), 10);
  if (isNaN(prefiksiNumer)) return null;

  const gjetur = GS1_PREFIKSET.find((p) => prefiksiNumer >= p.min && prefiksiNumer <= p.max);
  if (!gjetur) return null;

  const kodi = gjetur.kodi;
  return {
    kodi,
    emri: emriShtetit(kodi),
    prefiksi: String(prefiksiNumer).padStart(3, "0"),
  };
};
