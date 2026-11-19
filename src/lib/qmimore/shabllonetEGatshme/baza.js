// Mjetet e përbashkëta të shablloneve të gatshme (ngjyrat, shabllon(), emri(), tekst(), qmimi()). Elementet
// vizatohen në mm për përmasat w × h dhe shkallëzohen te letra e shabllonit (shih shablloniQmimores.js).
import { VERSIONI_I_SHABLLONIT, ndryshoLetren } from "../shablloniQmimores";

export const KUQE = "#e62429";
export const VERDHE = "#ffec00";
export const GRI = "#64748b";
export const ZI = "#0f172a";

export const shabllon = (w, h, letra, elementet) =>
  ndryshoLetren(
    {
      v: VERSIONI_I_SHABLLONIT,
      w,
      h,
      vijaPrerjes: letra.letra === "a4",
      sfondi: "",
      elementet: elementet.map((el, i) => ({ id: `g${i + 1}`, kushti: "gjithmone", ...el })),
    },
    letra
  );

export const emri = (x, y, w, h, shtese = {}) => ({ lloji: "tekst", teksti: "{emri}", ngjyra: ZI, rreshtimi: "left", rreshta: 2, trashe: true, x, y, w, h, ...shtese });
export const tekst = (teksti, x, y, w, h, shtese = {}) => ({ lloji: "tekst", teksti, ngjyra: ZI, rreshtimi: "center", rreshta: 1, trashe: true, x, y, w, h, ...shtese });
export const qmimi = (burimi, x, y, w, h, shtese = {}) => ({ lloji: "qmimi", burimi, ngjyra: "#000000", rreshtimi: "right", meNjesi: true, x, y, w, h, ...shtese });
