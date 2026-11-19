// Historiku i printimeve (printimet.json te dosja e të dhënave): gjurma SHA-256 e çdo etikete dhe e gjithë punës, që
// programi të paralajmërojë kur e njëjta çmimore (i njëjti shabllon, opsione dhe produkte) printohet përsëri.
const MAKS_PUNE = 1000;

const lexoSkedarin = async () => {
  try {
    const v = window.labels ? await window.labels.lexo("printimet") : JSON.parse(localStorage.getItem("labels.printimet") || "null");
    return Array.isArray(v?.punet) ? v.punet : [];
  } catch {
    return [];
  }
};

const shkruajSkedarin = (punet) =>
  window.labels ? window.labels.ruaj("printimet", { punet }) : localStorage.setItem("labels.printimet", JSON.stringify({ punet }));

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const sha256 = async (tekst) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tekst)));

// Vetëm ajo që del në letër: shablloni, opsionet e shfaqjes dhe fushat e produktit (jo zgjedhjet e tabelës).
const fushatEProduktit = (p) => [p.name, p.code, p.barcode, p.price, p.qmimiPasZbritjes, p.discount, p.origin, p.unit];

/**
 * Gjurmët e një pune printimi.
 * @returns { puna: hash i gjithë punës (radha e etiketave përfshihet), etiketat: [hash për çdo produkt] }
 */
export const gjurmetEPunes = async (shablloni, opsionet, produktet) => {
  const baza = await sha256(JSON.stringify([shablloni, opsionet]));
  const etiketat = await Promise.all(produktet.map((p) => sha256(JSON.stringify([baza, fushatEProduktit(p)]))));
  return { puna: await sha256(etiketat.join("|")), etiketat };
};

export const lexoHistorikun = lexoSkedarin;

// Regjistron një punë të kryer: { puna, etiketat, fleta, shablloni (emri), numri, menyra ("printim" | "pdf" | "jashte"), koha }
export const regjistroPunen = async (puna) => {
  const punet = await lexoSkedarin();
  const iRi = [...punet, { ...puna, koha: new Date().toISOString() }].slice(-MAKS_PUNE);
  await shkruajSkedarin(iRi);
  return iRi;
};

// Indekset për kontrollin: puna → regjistrimi i fundit, etiketa → regjistrimi i fundit.
export const indeksoHistorikun = (punet) => {
  const sipasPunes = new Map();
  const sipasEtiketes = new Map();
  for (const p of punet) {
    sipasPunes.set(p.puna, p);
    for (const e of p.etiketat || []) sipasEtiketes.set(e, p);
  }
  return { sipasPunes, sipasEtiketes };
};

export const dataShqip = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
};
