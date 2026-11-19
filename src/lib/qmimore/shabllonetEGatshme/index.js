// Shabllonet e gatshme të çmimores: vijnë me programin, nuk ndryshohen e nuk fshihen. Përdoruesi i
// zgjedh te shtypja ose i kopjon te "Shabllonet e Çmimores" dhe e ndryshon kopjen.
// Të ndara sipas kategorive (tab-et te zgjedhja dhe te editori); çdo kategori në skedarin e vet.
import raft from "./raft";
import zbritje from "./zbritje";
import postera from "./postera";
import termik from "./termik";
import festive, { GRUPET_E_FESTAVE } from "./festive";
import excel from "./excel";

export const KATEGORITE_E_SHABLLONEVE = [
  { celesi: "excel", emri: "Fletët e Excel-it" },
  { celesi: "raft", emri: "Rafti" },
  { celesi: "zbritje", emri: "Zbritje & Oferta" },
  { celesi: "postera", emri: "Postera A4" },
  { celesi: "termik", emri: "Printer termik" },
  { celesi: "festive", emri: "Festive", nenkategorite: GRUPET_E_FESTAVE },
];

// Nënkategoritë e një kategorie (çipat poshtë tab-it), vetëm ato që kanë shabllone; [] = pa nënkategori.
export const nenkategoriteE = (kategoria, shabllonet = SHABLLONET_E_GATSHME) => {
  const k = KATEGORITE_E_SHABLLONEVE.find((x) => x.celesi === kategoria);
  return (k?.nenkategorite || []).filter((n) => shabllonet.some((s) => s.kategoria === kategoria && s.nenkategoria === n));
};

const meKategori = (kategoria, lista) => lista.map((s) => ({ ...s, kategoria }));

export const SHABLLONET_E_GATSHME = [
  ...meKategori("excel", excel),
  ...meKategori("raft", raft),
  ...meKategori("zbritje", zbritje),
  ...meKategori("postera", postera),
  ...meKategori("termik", termik),
  ...meKategori("festive", festive),
];
