// Ruajtja lokale: në aplikacionin desktop skedarë JSON te dosja e të dhënave (shih electron/main.cjs);
// te "npm run dev" në shfletues - localStorage, vetëm për zhvillim.
const eshteDesktop = typeof window !== "undefined" && Boolean(window.labels);

const lexo = async (emri, parazgjedhur) => {
  try {
    const v = eshteDesktop ? await window.labels.lexo(emri) : JSON.parse(localStorage.getItem(`labels.${emri}`) || "null");
    return v ?? parazgjedhur;
  } catch {
    return parazgjedhur;
  }
};

const shkruaj = async (emri, vlera) => {
  if (eshteDesktop) return window.labels.ruaj(emri, vlera);
  localStorage.setItem(`labels.${emri}`, JSON.stringify(vlera));
  return true;
};

/* ---------- Shabllonet: [{ id, emri, permbajtja (JSON tekst), ndryshuar }] - si API e FinanCare-s ---------- */

export const listaEShablloneve = async () => {
  const lista = await lexo("shabllonet", []);
  return (Array.isArray(lista) ? lista : []).filter((s) => s && s.id > 0 && typeof s.emri === "string");
};

export const ruajShabllonin = async ({ id, emri, permbajtja }) => {
  const lista = await listaEShablloneve();
  const emriPastër = String(emri || "").trim().slice(0, 100);
  if (!emriPastër) throw new Error("Shënoni emrin e shabllonit.");
  if (lista.some((s) => s.id !== id && s.emri.toLowerCase() === emriPastër.toLowerCase())) {
    throw new Error(`Ekziston tashmë një shabllon me emrin "${emriPastër}".`);
  }
  const ndryshuar = new Date().toISOString();
  let iRuajtur;
  if (id > 0 && lista.some((s) => s.id === id)) {
    iRuajtur = { id, emri: emriPastër, permbajtja, ndryshuar };
    await shkruaj("shabllonet", lista.map((s) => (s.id === id ? iRuajtur : s)));
  } else {
    iRuajtur = { id: lista.reduce((m, s) => Math.max(m, s.id), 0) + 1, emri: emriPastër, permbajtja, ndryshuar };
    await shkruaj("shabllonet", [...lista, iRuajtur]);
  }
  return iRuajtur;
};

export const fshijShabllonin = async (id) => {
  const lista = await listaEShablloneve();
  await shkruaj("shabllonet", lista.filter((s) => s.id !== id));
};

/* ---------- Cilësimet ---------- */

const CILESIMET_PARAZGJEDHUR = {
  skedariExcel: "",
  emriBiznesit: "",
  stiliQmimit: "centet",
  shfaqBarkodin: true,
  shfaqEuro: true,
  // Hapësira mes etiketave për prerje (mm): 0,8 mm mjafton.
  hapesiraH: 0.8,
  hapesiraV: 0.8,
  orientimi: "auto",
  // Marginat e fletës (mm): 0 = etiketat deri në skaj, që të nxë sa më shumë (si te tagsprinter.com).
  margjina: 0,
  // "light" (parazgjedhja) ose "dark"
  tema: "light",
  // { "<emri i fletës>": "gati:<celesi>" | "sh:<id>" } - shablloni i zgjedhur për secilën fletë të Excel-it
  shabllonetSipasFletes: {},
};

export const lexoCilesimet = async () => ({ ...CILESIMET_PARAZGJEDHUR, ...(await lexo("cilesimet", {})) });

export const ruajCilesimet = (cilesimet) => shkruaj("cilesimet", cilesimet);

export { eshteDesktop };

/* ---------- Produktet e shtuara dhe ndryshimet te tabela (Excel-i s'preket) ---------- */

// { ndryshimet: { "<fleta>": { <nr>: {...} } }, teShtuarat: { "<fleta>": [nr...] } }
export const lexoProduktet = async () => {
  const v = await lexo("produktet", {});
  return { ndryshimet: v?.ndryshimet || {}, teShtuarat: v?.teShtuarat || {}, kopjet: v?.kopjet || {} };
};

export const ruajProduktet = (v) => shkruaj("produktet", v);
