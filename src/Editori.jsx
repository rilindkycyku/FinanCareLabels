import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBarcode,
  faCertificate,
  faCircle,
  faCopy,
  faDownload,
  faEuroSign,
  faExpand,
  faFileExport,
  faFileImport,
  faFilePdf,
  faFlag,
  faFloppyDisk,
  faFont,
  faImage,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMinus,
  faPlus,
  faQrcode,
  faRotateLeft,
  faSquare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { pdfjsLib } from "./lib/pdfjs";
import PdfPamja from "./components/PdfPamja";
import { fshijShabllonin as fshijNgaDisku, listaEShablloneve, ruajShabllonin as ruajNeDisk } from "./lib/ruajtja";
import { shkarkoShabllonin } from "./lib/shkarkimi";
import { ngarkoFontetEQmimores, vizatoQmimoren } from "./lib/qmimore/qmimorjaPdf";
import { flamuriSiPng } from "./lib/qmimore/origjina";
import {
  BURIMET_E_QMIMIT,
  FUSHAT_E_TEKSTIT,
  eshteImazhMeAdrese,
  pergatitImazhet,
  KUFIJTE,
  KUSHTET,
  LETRAT,
  LLOJET,
  RRJETAT_A4,
  elementIRi,
  idERe,
  ndryshoLetren,
  normalizoShabllonin,
  pershkrimiLetres,
  rrjetaEShabllonit,
  shabllonIRi,
  shablloniTermik,
} from "./lib/qmimore/shablloniQmimores";
import { KATEGORITE_E_SHABLLONEVE, SHABLLONET_E_GATSHME, nenkategoriteE } from "./lib/qmimore/shabllonetEGatshme";
import { GALERIA_E_IMAZHEVE } from "./lib/qmimore/galeriaEImazheve";

const IKONAT = {
  tekst: faFont,
  qmimi: faEuroSign,
  barkod: faBarcode,
  qr: faQrcode,
  flamur: faFlag,
  kuti: faSquare,
  vije: faMinus,
  elips: faCircle,
  vule: faCertificate,
  shigjete: faArrowRight,
  imazh: faImage,
};

const DOREZAT = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const RRESHTIMET = [
  ["left", "Majtas"],
  ["center", "Në mes"],
  ["right", "Djathtas"],
];
const kap = (v) => Math.round(v * 2) / 2; // rrjeta 0.5 mm
const kufizo = (v, min, max) => Math.min(Math.max(v, min), max);
const rrumbullako = (v) => Math.round(v * 10) / 10;

// Fushë numerike që lejon shkrimin e lirë ("12." ose bosh) dhe e kalon vlerën vetëm kur është numër.
const FushaNumer = ({ vlera, onNdrysho, min = 0, max = 999, hapi = 0.5, ...tjera }) => {
  const [teksti, setTeksti] = useState(String(vlera ?? ""));
  const [neFokus, setNeFokus] = useState(false);
  useEffect(() => {
    if (!neFokus) setTeksti(String(vlera ?? ""));
  }, [vlera, neFokus]);
  return (
    <Form.Control
      size="sm"
      type="number"
      step={hapi}
      min={min}
      max={max}
      value={teksti}
      onFocus={() => setNeFokus(true)}
      onBlur={() => setNeFokus(false)}
      onChange={(e) => {
        setTeksti(e.target.value);
        const n = parseFloat(e.target.value);
        if (Number.isFinite(n)) onNdrysho(kufizo(n, min, max));
      }}
      {...tjera}
    />
  );
};

// Ngjyrë me zgjedhës; "opsionale" shton kutinë "pa ngjyrë" (vlera "").
const FushaNgjyre = ({ vlera, onNdrysho, opsionale = false, parazgjedhur = "#000000" }) => (
  <div className="eq-ngjyra">
    <input
      type="color"
      value={/^#[0-9a-f]{6}$/i.test(vlera || "") ? vlera : parazgjedhur}
      disabled={opsionale && !vlera}
      onChange={(e) => onNdrysho(e.target.value)}
    />
    {opsionale && (
      <Form.Check
        type="checkbox"
        className="small mb-0"
        label="Pa ngjyrë"
        checked={!vlera}
        onChange={(e) => onNdrysho(e.target.checked ? "" : parazgjedhur)}
      />
    )}
  </div>
);

const Fusha = ({ emri, children, gjere = false }) => (
  <div className={`eq-fusha${gjere ? " eq-fusha--gjere" : ""}`}>
    <label>{emri}</label>
    {children}
  </div>
);

const Zgjedhes = ({ vlera, onNdrysho, opsionet }) => (
  <Form.Select size="sm" value={vlera} onChange={(e) => onNdrysho(e.target.value)}>
    {opsionet.map(([celesi, emri]) => (
      <option key={celesi} value={celesi}>
        {emri}
      </option>
    ))}
  </Form.Select>
);

// Imazhi i ngarkuar zvogëlohet (deri 800px) dhe kthehet në PNG/JPEG, të vetmet që i vizaton PDF-ja.
const lexoImazhin = (skedari) =>
  new Promise((resolve, reject) => {
    const lexuesi = new FileReader();
    lexuesi.onerror = () => reject(new Error("Skedari nuk u lexua."));
    lexuesi.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Skedari nuk është imazh i vlefshëm."));
      img.onload = () => {
        const shkalla = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * shkalla));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * shkalla));
        const ctx = canvas.getContext("2d");
        const jpeg = skedari.type === "image/jpeg";
        if (jpeg) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          imazhi: jpeg ? canvas.toDataURL("image/jpeg", 0.88) : canvas.toDataURL("image/png"),
          raporti: canvas.width / canvas.height,
        });
      };
      img.src = lexuesi.result;
    };
    lexuesi.readAsDataURL(skedari);
  });

const pershkrimiElementit = (el) => {
  const emri = LLOJET[el.lloji]?.emri || el.lloji;
  if (el.lloji === "tekst" || el.lloji === "shigjete" || el.lloji === "qr") return `${emri}: ${el.teksti || ""}`;
  if (el.lloji === "qmimi") return `${emri}: ${BURIMET_E_QMIMIT.find(([k]) => k === el.burimi)?.[1].split(" (")[0] || ""}`;
  return emri;
};

function EditoriQmimores({ mesazh, emriBiznesit = "", iNdryshuarRef, skedariPerImport = null }) {

  const [shabllonet, setShabllonet] = useState([]);
  const [poNgarkohet, setPoNgarkohet] = useState(true);
  // Shablloni i hapur: { id (0 = ende i paruajtur), emri, sh }
  const [aktiv, setAktiv] = useState(null);
  const aktivRef = useRef(null);
  const [iNdryshuar, setINdryshuar] = useState(false);
  const [zgjedhur, setZgjedhur] = useState(null);
  const [zmadhimi, setZmadhimi] = useState(6); // px për mm
  const [poRuhet, setPoRuhet] = useState(false);
  const [konfirmimi, setKonfirmimi] = useState(null); // { titulli, teksti, butoni, veprimi }
  const [pdf, setPdf] = useState(null);

  const [meZbritje, setMeZbritje] = useState(true);
  const [meShumice, setMeShumice] = useState(true);
  const [emriShembullit, setEmriShembullit] = useState("Emri i produktit");

  const [fontet, setFontet] = useState(undefined);
  const [flamujtPng, setFlamujtPng] = useState({});
  // Tab-i i shablloneve të gatshme (kategoritë që kanë të paktën një shabllon).
  const kategoriteMeShabllone = useMemo(
    () => KATEGORITE_E_SHABLLONEVE.filter((k) => SHABLLONET_E_GATSHME.some((g) => g.kategoria === k.celesi)),
    []
  );
  const [kategoriaEGatshme, setKategoriaEGatshme] = useState(() => kategoriteMeShabllone[0]?.celesi || "");
  // Nënkategoria brenda kategorisë (p.sh. Festive → Fetare); "" = të gjitha.
  const [nenkategoriaEGatshme, setNenkategoriaEGatshme] = useState("");
  const nenkategoriteEGatshme = useMemo(() => nenkategoriteE(kategoriaEGatshme), [kategoriaEGatshme]);


  const historiku = useRef([]);
  const terheqja = useRef(null);
  const zmadhimiRef = useRef(zmadhimi);
  zmadhimiRef.current = zmadhimi;
  const kanvasiRef = useRef(null);
  const skenaRef = useRef(null);
  const zonaRef = useRef(null);
  const importiRef = useRef(null);
  const imazhiRef = useRef(null);

  const sh = aktiv?.sh || null;
  const elementi = sh?.elementet.find((el) => el.id === zgjedhur) || null;

  // App-i pyet para se të largohet nga editori me ndryshime të paruajtura.
  if (iNdryshuarRef) iNdryshuarRef.current = iNdryshuar;

  const ngarkoShabllonet = useCallback(async () => {
    try {
      const lista = await listaEShablloneve();
      setShabllonet(lista.map((s) => ({ ...s, sh: normalizoShabllonin(s.permbajtja) })));
    } catch (err) {
      console.error("Shabllonet e çmimores nuk u ngarkuan:", err);
      mesazh("danger", "Shabllonet nuk u ngarkuan!");
    } finally {
      setPoNgarkohet(false);
    }
  }, []);

  useEffect(() => {
    ngarkoShabllonet();
    ngarkoFontetEQmimores().then(setFontet);
    flamuriSiPng("XK", 240)
      .then((png) => png && setFlamujtPng({ XK: png }))
      .catch(() => {});
  }, [ngarkoShabllonet]);

  // Paralajmërimi i shfletuesit kur mbyllet faqja me ndryshime të paruajtura
  useEffect(() => {
    if (!iNdryshuar) return undefined;
    const paraMbylljes = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", paraMbylljes);
    return () => window.removeEventListener("beforeunload", paraMbylljes);
  }, [iNdryshuar]);

  /* ---------- Hapja, ruajtja, fshirja ---------- */

  const pershtatZmadhimin = (shablloni) => {
    const gjeresia = (zonaRef.current?.clientWidth || 700) - 48;
    const lartesia = Math.max(320, window.innerHeight - 330);
    setZmadhimi(kufizo(Math.floor(Math.min(gjeresia / shablloni.w, lartesia / shablloni.h) * 2) / 2, 1, 14));
  };

  const vendosAktivin = (iRi, ndryshuar = false) => {
    aktivRef.current = iRi;
    historiku.current = [];
    setAktiv(iRi);
    setZgjedhur(null);
    setINdryshuar(ndryshuar);
    if (iRi) pershtatZmadhimin(iRi.sh);
  };

  // Me ndryshime të paruajtura pyet para se t'i humbasë.
  const meKonfirmim = (veprimi) => {
    if (!iNdryshuar) return veprimi();
    return setKonfirmimi({
      titulli: "Ndryshime të paruajtura",
      teksti: `Shablloni "${aktivRef.current?.emri}" ka ndryshime të paruajtura. Të vazhdohet pa i ruajtur?`,
      butoni: "Vazhdo pa ruajtur",
      veprimi,
    });
  };

  const hapShabllonin = (s) =>
    meKonfirmim(() => {
      const shablloni = normalizoShabllonin(s.permbajtja);
      if (!shablloni) return mesazh("danger", `Shablloni "${s.emri}" është i dëmtuar dhe nuk hapet.`);
      return vendosAktivin({ id: s.id, emri: s.emri, sh: shablloni });
    });

  const emerILire = (baza) => {
    const emrat = new Set(shabllonet.map((s) => s.emri.toLowerCase()));
    if (!emrat.has(baza.toLowerCase())) return baza;
    for (let i = 2; ; i++) {
      const emri = `${baza} ${i}`;
      if (!emrat.has(emri.toLowerCase())) return emri;
    }
  };

  // Kopje e paruajtur: element me id të reja, që të mos përzihen me origjinalin.
  const hapSiKopje = (emri, shablloni) =>
    meKonfirmim(() => {
      const kopja = normalizoShabllonin(JSON.parse(JSON.stringify(shablloni)));
      if (!kopja) return mesazh("danger", "Shablloni nuk është i vlefshëm.");
      kopja.elementet = kopja.elementet.map((el) => ({ ...el, id: idERe() }));
      return vendosAktivin({ id: 0, emri: emerILire(emri).slice(0, 100), sh: kopja }, true);
    });

  const shabllonBosh = () =>
    meKonfirmim(() => {
      const iRi = shabllonIRi("a4");
      const { w, h } = iRi;
      iRi.elementet = [
        elementIRi("tekst", iRi, { teksti: "{emri}", rreshtimi: "left", rreshta: 2, madhesia: 15, x: 2, y: 2, w: w - 4, h: rrumbullako(h * 0.28) }),
        elementIRi("qmimi", iRi, { x: rrumbullako(w * 0.35), y: rrumbullako(h * 0.38), w: rrumbullako(w * 0.65 - 2), h: rrumbullako(h * 0.58) }),
      ];
      vendosAktivin({ id: 0, emri: emerILire("Shabllon i ri"), sh: iRi }, true);
    });

  const ruajShabllonin = async () => {
    const a = aktivRef.current;
    if (!a) return;
    const emri = a.emri.trim();
    if (!emri) return mesazh("danger", "Shënoni emrin e shabllonit.");
    const permbajtja = JSON.stringify(a.sh);
    if (permbajtja.length > 2 * 1024 * 1024) return mesazh("danger", "Shablloni është shumë i madh. Zvogëloni ose hiqni imazhet.");
    setPoRuhet(true);
    try {
      const res = await ruajNeDisk({ id: a.id, emri, permbajtja });
      const iRuajtur = { ...aktivRef.current, id: res.id, emri: res.emri };
      aktivRef.current = iRuajtur;
      setAktiv(iRuajtur);
      setINdryshuar(false);
      await ngarkoShabllonet();
      mesazh("success", `Shablloni "${emri}" u ruajt.`);
    } catch (err) {
      console.error("Ruajtja e shabllonit dështoi:", err);
      mesazh("danger", err?.message || "Ruajtja e shabllonit dështoi!");
    } finally {
      setPoRuhet(false);
    }
    return undefined;
  };

  const fshijShabllonin = (s) =>
    setKonfirmimi({
      titulli: "Fshij shabllonin",
      teksti: `Shablloni "${s.emri}" do të fshihet përgjithmonë. Ky veprim nuk mund të zhbëhet!`,
      butoni: "Fshij",
      veprimi: async () => {
        try {
          await fshijNgaDisku(s.id);
          if (aktivRef.current?.id === s.id) vendosAktivin(null);
          await ngarkoShabllonet();
        } catch (err) {
          console.error("Fshirja e shabllonit dështoi:", err);
          mesazh("danger", "Fshirja e shabllonit dështoi!");
        }
      },
    });

  /* ---------- Eksporti dhe importi ---------- */

  const eksporto = () => {
    const a = aktivRef.current;
    if (!a) return;
    shkarkoShabllonin(a.emri, a.sh);
  };

  const importo = async (e) => {
    const skedari = e.target.files?.[0];
    e.target.value = "";
    if (!skedari) return;
    if (skedari.size > 3 * 1024 * 1024) return mesazh("danger", "Skedari është shumë i madh për një shabllon.");
    try {
      const teDhenat = JSON.parse(await skedari.text());
      const shablloni = normalizoShabllonin(teDhenat?.shablloni || teDhenat);
      if (!shablloni) throw new Error("jo shabllon");
      const emri = typeof teDhenat?.emri === "string" && teDhenat.emri.trim() ? teDhenat.emri.trim() : skedari.name.replace(/(\.qmimore)?\.json$/i, "");
      hapSiKopje(emri, shablloni);
    } catch (err) {
      console.error("Importi i shabllonit dështoi:", err);
      mesazh("danger", "Skedari nuk është shabllon i vlefshëm i çmimores.");
    }
    return undefined;
  };

  // Shablloni i lëshuar në dritare (drag & drop te App.jsx) importohet si me butonin "Importo".
  const importoRef = useRef(importo);
  importoRef.current = importo;
  useEffect(() => {
    if (skedariPerImport?.skedari) importoRef.current({ target: { files: [skedariPerImport.skedari], value: "" } });
  }, [skedariPerImport]);

  /* ---------- Ndryshimet e shabllonit ---------- */

  const ndryshoSh = (fn, meHistorik = true) => {
    const a = aktivRef.current;
    if (!a) return;
    if (meHistorik) {
      historiku.current.push(a.sh);
      if (historiku.current.length > 100) historiku.current.shift();
    }
    const iRi = { ...a, sh: fn(a.sh) };
    aktivRef.current = iRi;
    setAktiv(iRi);
    setINdryshuar(true);
  };

  const zhbej = () => {
    const a = aktivRef.current;
    const paraprak = historiku.current.pop();
    if (!a || !paraprak) return;
    const iRi = { ...a, sh: paraprak };
    aktivRef.current = iRi;
    setAktiv(iRi);
    setINdryshuar(true);
  };

  const ndryshoElementin = (id, ndryshimet, meHistorik = true) =>
    ndryshoSh((s) => ({ ...s, elementet: s.elementet.map((el) => (el.id === id ? { ...el, ...ndryshimet } : el)) }), meHistorik);

  const ndryshoShabllonin = (ndryshimet) => ndryshoSh((s) => normalizoShabllonin({ ...s, ...ndryshimet }) || s);
  // Letra, rrjeta A4 ose lartësia e termikut: elementet shkallëzohen me etiketën.
  const ndryshoPermasat = (ndryshimet) => {
    ndryshoSh((s) => ndryshoLetren(s, ndryshimet) || s);
    const a = aktivRef.current;
    if (a) pershtatZmadhimin(a.sh);
  };

  const ndryshoEmrin = (emri) => {
    const a = aktivRef.current;
    if (!a) return;
    const iRi = { ...a, emri };
    aktivRef.current = iRi;
    setAktiv(iRi);
    setINdryshuar(true);
  };

  const shtoElement = (lloji) => {
    const a = aktivRef.current;
    if (!a) return;
    if (a.sh.elementet.length >= 80) return mesazh("danger", "Shablloni mund të ketë deri 80 elemente.");
    const el = elementIRi(lloji, a.sh);
    ndryshoSh((s) => ({ ...s, elementet: [...s.elementet, el] }));
    setZgjedhur(el.id);
    if (lloji === "imazh") imazhiRef.current?.click();
    return undefined;
  };

  const fshijElementin = (id) => {
    ndryshoSh((s) => ({ ...s, elementet: s.elementet.filter((el) => el.id !== id) }));
    setZgjedhur(null);
  };

  const dyfishoElementin = (id) => {
    const a = aktivRef.current;
    const el = a?.sh.elementet.find((x) => x.id === id);
    if (!el || a.sh.elementet.length >= 80) return;
    const kopja = {
      ...el,
      id: idERe(),
      x: rrumbullako(kufizo(el.x + 2, 0, a.sh.w - el.w)),
      y: rrumbullako(kufizo(el.y + 2, 0, a.sh.h - el.h)),
    };
    ndryshoSh((s) => ({ ...s, elementet: [...s.elementet, kopja] }));
    setZgjedhur(kopja.id);
  };

  // Radha në listë = radha e vizatimit: i fundit del sipër.
  const levizNeRadhe = (id, hapi) =>
    ndryshoSh((s) => {
      const i = s.elementet.findIndex((el) => el.id === id);
      const j = i + hapi;
      if (i < 0 || j < 0 || j >= s.elementet.length) return s;
      const elementet = [...s.elementet];
      [elementet[i], elementet[j]] = [elementet[j], elementet[i]];
      return { ...s, elementet };
    });

  const ngarkoImazhin = async (e) => {
    const skedari = e.target.files?.[0];
    e.target.value = "";
    const id = zgjedhur;
    if (!skedari || !id) return;
    try {
      const { imazhi, raporti } = await lexoImazhin(skedari);
      vendosImazhin(id, imazhi, raporti);
    } catch (err) {
      mesazh("danger", err.message || "Imazhi nuk u ngarkua.");
    }
  };

  // Kutia merr formën e imazhit, brenda etiketës (nga skedari ose nga galeria e FinanCare-s).
  const vendosImazhin = (id, imazhi, raporti) => {
    const a = aktivRef.current;
    const el = a?.sh.elementet.find((x) => x.id === id);
    if (!el) return;
    const h = rrumbullako(kufizo(el.w / raporti, KUFIJTE.minElement, a.sh.h));
    ndryshoElementin(id, { imazhi, raporti, h, y: rrumbullako(kufizo(el.y, 0, a.sh.h - h)) });
  };

  /* ---------- Tërheqja dhe ndryshimi i madhësisë me maus ---------- */

  const gjateTerheqjes = useCallback((e) => {
    const t = terheqja.current;
    const a = aktivRef.current;
    if (!t || !a) return;
    const dx = kap((e.clientX - t.x0) / zmadhimiRef.current);
    const dy = kap((e.clientY - t.y0) / zmadhimiRef.current);
    if (!t.levizur && dx === 0 && dy === 0) return;
    const { el0, doreza } = t;
    const min = KUFIJTE.minElement;
    let { x, y, w, h } = el0;
    if (!doreza) {
      x = kufizo(el0.x + dx, 0, a.sh.w - el0.w);
      y = kufizo(el0.y + dy, 0, a.sh.h - el0.h);
    } else {
      if (doreza.includes("e")) w = kufizo(el0.w + dx, min, a.sh.w - el0.x);
      if (doreza.includes("w")) {
        x = kufizo(el0.x + dx, 0, el0.x + el0.w - min);
        w = el0.x + el0.w - x;
      }
      if (doreza.includes("s")) h = kufizo(el0.h + dy, min, a.sh.h - el0.y);
      if (doreza.includes("n")) {
        y = kufizo(el0.y + dy, 0, el0.y + el0.h - min);
        h = el0.y + el0.h - y;
      }
    }
    const ndryshimet = { x: rrumbullako(x), y: rrumbullako(y), w: rrumbullako(w), h: rrumbullako(h) };
    // Vetëm lëvizja e parë hyn në historik: e gjithë tërheqja zhbëhet me një hap.
    if (!t.levizur) {
      historiku.current.push(a.sh);
      if (historiku.current.length > 100) historiku.current.shift();
      t.levizur = true;
    }
    const iRi = { ...a, sh: { ...a.sh, elementet: a.sh.elementet.map((el) => (el.id === t.id ? { ...el, ...ndryshimet } : el)) } };
    aktivRef.current = iRi;
    setAktiv(iRi);
    setINdryshuar(true);
  }, []);

  const perfundoTerheqjen = useCallback(() => {
    terheqja.current = null;
    window.removeEventListener("pointermove", gjateTerheqjes);
    window.removeEventListener("pointerup", perfundoTerheqjen);
    window.removeEventListener("pointercancel", perfundoTerheqjen);
  }, [gjateTerheqjes]);

  useEffect(() => perfundoTerheqjen, [perfundoTerheqjen]);

  const filloTerheqjen = (e, el, doreza = null) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    skenaRef.current?.focus({ preventScroll: true });
    setZgjedhur(el.id);
    terheqja.current = { id: el.id, doreza, x0: e.clientX, y0: e.clientY, el0: { x: el.x, y: el.y, w: el.w, h: el.h }, levizur: false };
    window.addEventListener("pointermove", gjateTerheqjes);
    window.addEventListener("pointerup", perfundoTerheqjen);
    window.addEventListener("pointercancel", perfundoTerheqjen);
  };

  const tastiera = (e) => {
    if (!sh || e.target.closest("input, textarea, select")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      zhbej();
      return;
    }
    if (e.key === "Escape") {
      setZgjedhur(null);
      return;
    }
    if (!elementi) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      fshijElementin(elementi.id);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      dyfishoElementin(elementi.id);
    } else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const hapi = e.shiftKey ? 5 : 0.5;
      const dx = e.key === "ArrowLeft" ? -hapi : e.key === "ArrowRight" ? hapi : 0;
      const dy = e.key === "ArrowUp" ? -hapi : e.key === "ArrowDown" ? hapi : 0;
      ndryshoElementin(elementi.id, {
        x: rrumbullako(kufizo(elementi.x + dx, 0, sh.w - elementi.w)),
        y: rrumbullako(kufizo(elementi.y + dy, 0, sh.h - elementi.h)),
      });
    }
  };

  /* ---------- Parapamja: e njëjta PDF që shtypet, e vizatuar në kanvas ---------- */

  const shembulli = useMemo(
    () => ({
      name: emriShembullit || "Emri i produktit",
      price: 2.99,
      wholesalePrice: meShumice ? 2.49 : 2.99,
      wholesaleQty: meShumice ? 6 : 0,
      barcode: "3800000000005",
      origin: "XK",
      unit: "Copë",
      discount: meZbritje ? 20 : null,
    }),
    [emriShembullit, meZbritje, meShumice]
  );

  // Vizatimet me adresë (SVG te public/, p.sh. shabllonet festive) kthehen në PNG para vizatimit.
  const [shVizatimi, setShVizatimi] = useState(null);
  useEffect(() => {
    let aktiv = true;
    if (!sh) {
      setShVizatimi(null);
      return undefined;
    }
    pergatitImazhet(sh)
      .then((x) => aktiv && setShVizatimi(x))
      .catch(() => aktiv && setShVizatimi(sh));
    return () => {
      aktiv = false;
    };
  }, [sh]);

  const opsionetEVizatimit = useMemo(
    () => ({ shablloni: shVizatimi || sh, emriBiznesit, fontet, flamujtPng }),
    [shVizatimi, sh, emriBiznesit, fontet, flamujtPng]
  );

  useEffect(() => {
    if (!sh || fontet === undefined) return undefined;
    let anuluar = false;
    const t = setTimeout(async () => {
      let dokumenti = null;
      try {
        const doc = vizatoQmimoren([shembulli], { ...opsionetEVizatimit, vetemNjeEtikete: true });
        dokumenti = await pdfjsLib.getDocument({ data: doc.output("arraybuffer") }).promise;
        const faqja = await dokumenti.getPage(1);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = faqja.getViewport({ scale: (sh.w * zmadhimi * dpr) / faqja.getViewport({ scale: 1 }).width });
        // Vizatohet jashtë ekranit dhe kopjohet në fund, që kanvasi të mos zbrazet gjatë tërheqjes.
        const perkohshem = document.createElement("canvas");
        perkohshem.width = Math.round(viewport.width);
        perkohshem.height = Math.round(viewport.height);
        const ctx = perkohshem.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, perkohshem.width, perkohshem.height);
        await faqja.render({ canvasContext: ctx, viewport }).promise;
        const kanvasi = kanvasiRef.current;
        if (anuluar || !kanvasi) return;
        kanvasi.width = perkohshem.width;
        kanvasi.height = perkohshem.height;
        kanvasi.getContext("2d").drawImage(perkohshem, 0, 0);
      } catch (err) {
        if (!anuluar) console.error("Parapamja e shabllonit dështoi:", err);
      } finally {
        dokumenti?.destroy();
      }
    }, 30);
    return () => {
      anuluar = true;
      clearTimeout(t);
    };
  }, [sh, zmadhimi, shembulli, opsionetEVizatimit, fontet]);

  // Fleta e provës: një faqe e plotë me shembuj, siç del nga printeri.
  const provoPdf = () => {
    if (!sh) return;
    try {
      const rrjeta = rrjetaEShabllonit(sh);
      const doc = vizatoQmimoren(Array(rrjeta.veqmas ? 1 : rrjeta.perFaqe).fill(shembulli), opsionetEVizatimit);
      setPdf({ blob: doc.output("blob"), filename: `${aktiv.emri || "Shabllon"}.pdf` });
    } catch (err) {
      console.error("Fleta e provës dështoi:", err);
      mesazh("danger", "Fleta e provës nuk u gjenerua.");
    }
  };

  const rrjeta = sh ? rrjetaEShabllonit(sh) : null;

  /* ---------- Paneli i vetive ---------- */

  const vetiteEElementit = () => {
    const el = elementi;
    const ndrysho = (ndryshimet) => ndryshoElementin(el.id, ndryshimet);
    const indeksi = sh.elementet.findIndex((x) => x.id === el.id);
    return (
      <>
        <div className="eq-paneli-titulli">
          <span>
            <FontAwesomeIcon icon={IKONAT[el.lloji]} className="me-2" />
            {LLOJET[el.lloji].emri}
          </span>
          <span className="eq-veprimet">
            <button type="button" title="Sill përpara" disabled={indeksi === sh.elementet.length - 1} onClick={() => levizNeRadhe(el.id, 1)}>
              <FontAwesomeIcon icon={faArrowUp} />
            </button>
            <button type="button" title="Dërgo prapa" disabled={indeksi === 0} onClick={() => levizNeRadhe(el.id, -1)}>
              <FontAwesomeIcon icon={faArrowDown} />
            </button>
            <button type="button" title="Dyfisho (Ctrl+D)" onClick={() => dyfishoElementin(el.id)}>
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button type="button" title="Fshij (Delete)" className="eq-rrezik" onClick={() => fshijElementin(el.id)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </span>
        </div>

        <div className="eq-rrjeta">
          <Fusha emri="X (mm)">
            <FushaNumer vlera={el.x} min={0} max={rrumbullako(sh.w - el.w)} onNdrysho={(x) => ndrysho({ x })} />
          </Fusha>
          <Fusha emri="Y (mm)">
            <FushaNumer vlera={el.y} min={0} max={rrumbullako(sh.h - el.h)} onNdrysho={(y) => ndrysho({ y })} />
          </Fusha>
          <Fusha emri="Gjerësia (mm)">
            <FushaNumer vlera={el.w} min={KUFIJTE.minElement} max={rrumbullako(sh.w - el.x)} onNdrysho={(w) => ndrysho({ w })} />
          </Fusha>
          <Fusha emri="Lartësia (mm)">
            <FushaNumer vlera={el.h} min={KUFIJTE.minElement} max={rrumbullako(sh.h - el.y)} onNdrysho={(h) => ndrysho({ h })} />
          </Fusha>
        </div>

        {(el.lloji === "tekst" || el.lloji === "shigjete" || el.lloji === "qr") && (
          <Fusha emri={el.lloji === "qr" ? "Përmbajtja e kodit QR" : "Teksti"} gjere>
            <Form.Control
              size="sm"
              as="textarea"
              rows={2}
              maxLength={300}
              value={el.teksti || ""}
              onChange={(e) => ndrysho({ teksti: e.target.value })}
            />
            <div className="eq-fushat">
              {FUSHAT_E_TEKSTIT.map(([celesi, emri]) => (
                <button key={celesi} type="button" title={`Shto {${celesi}}`} onClick={() => ndrysho({ teksti: `${el.teksti || ""}{${celesi}}` })}>
                  {emri}
                </button>
              ))}
            </div>
          </Fusha>
        )}

        {el.lloji === "qmimi" && (
          <Fusha emri="Cili çmim" gjere>
            <Zgjedhes vlera={el.burimi} onNdrysho={(burimi) => ndrysho({ burimi })} opsionet={BURIMET_E_QMIMIT} />
          </Fusha>
        )}

        {(el.lloji === "tekst" || el.lloji === "qmimi") && (
          <>
            <div className="eq-rrjeta">
              <Fusha emri="Ngjyra">
                <FushaNgjyre vlera={el.ngjyra} onNdrysho={(ngjyra) => ndrysho({ ngjyra })} />
              </Fusha>
              <Fusha emri="Rreshtimi">
                <Zgjedhes vlera={el.rreshtimi} onNdrysho={(rreshtimi) => ndrysho({ rreshtimi })} opsionet={RRESHTIMET} />
              </Fusha>
              <Fusha emri="Madhësia maks. (pt)">
                <FushaNumer vlera={el.madhesia || 0} min={0} max={900} hapi={1} onNdrysho={(madhesia) => ndrysho({ madhesia })} />
              </Fusha>
              {el.lloji === "tekst" && (
                <Fusha emri="Rreshta (deri)">
                  <FushaNumer vlera={el.rreshta || 1} min={1} max={6} hapi={1} onNdrysho={(rreshta) => ndrysho({ rreshta: Math.round(rreshta) })} />
                </Fusha>
              )}
            </div>
            <div className="eq-ndihme">Teksti mbush kutinë vetë; "Madhësia maks." e kufizon (0 = pa kufi).</div>
            <div className="eq-kutite">
              {el.lloji === "tekst" && (
                <>
                  <Form.Check type="checkbox" id="eq-trashe" label="I trashë" checked={el.trashe !== false} onChange={(e) => ndrysho({ trashe: e.target.checked })} />
                  <Form.Check type="checkbox" id="eq-kapitale" label="Shkronja të mëdha" checked={Boolean(el.kapitale)} onChange={(e) => ndrysho({ kapitale: e.target.checked })} />
                </>
              )}
              {el.lloji === "qmimi" && (
                <Form.Check type="checkbox" id="eq-njesia" label="Me njësinë (/kg, /l)" checked={el.meNjesi !== false} onChange={(e) => ndrysho({ meNjesi: e.target.checked })} />
              )}
              <Form.Check type="checkbox" id="eq-prere" label="I prerë (çmim i vjetër)" checked={Boolean(el.iPrere)} onChange={(e) => ndrysho({ iPrere: e.target.checked })} />
            </div>
          </>
        )}

        {el.lloji === "tekst" && (
          <div className="eq-rrjeta">
            <Fusha emri="Sfondi i tekstit">
              <FushaNgjyre vlera={el.sfondi} opsionale parazgjedhur="#e62429" onNdrysho={(sfondi) => ndrysho({ sfondi })} />
            </Fusha>
            <Fusha emri="Rrezja e këndeve">
              <FushaNumer vlera={el.rrezja || 0} min={0} max={50} onNdrysho={(rrezja) => ndrysho({ rrezja })} />
            </Fusha>
          </div>
        )}

        {el.lloji === "barkod" && (
          <div className="eq-kutite">
            <Form.Check type="checkbox" id="eq-shifrat" label="Me numrin poshtë" checked={el.meShifra !== false} onChange={(e) => ndrysho({ meShifra: e.target.checked })} />
          </div>
        )}

        {el.lloji === "flamur" && (
          <Fusha emri="Rreshtimi" gjere>
            <Zgjedhes vlera={el.rreshtimi} onNdrysho={(rreshtimi) => ndrysho({ rreshtimi })} opsionet={RRESHTIMET} />
          </Fusha>
        )}

        {(el.lloji === "kuti" || el.lloji === "elips") && (
          <div className="eq-rrjeta">
            <Fusha emri="Mbushja">
              <FushaNgjyre vlera={el.mbushja} opsionale parazgjedhur="#e62429" onNdrysho={(mbushja) => ndrysho({ mbushja })} />
            </Fusha>
            <Fusha emri="Vija">
              <FushaNgjyre vlera={el.vija} opsionale onNdrysho={(vija) => ndrysho({ vija })} />
            </Fusha>
            <Fusha emri="Trashësia e vijës">
              <FushaNumer vlera={el.trashesia || 0} min={0} max={10} hapi={0.1} onNdrysho={(trashesia) => ndrysho({ trashesia })} />
            </Fusha>
            {el.lloji === "kuti" && (
              <Fusha emri="Rrezja e këndeve">
                <FushaNumer vlera={el.rrezja || 0} min={0} max={50} onNdrysho={(rrezja) => ndrysho({ rrezja })} />
              </Fusha>
            )}
          </div>
        )}

        {el.lloji === "vije" && (
          <>
            <div className="eq-rrjeta">
              <Fusha emri="Ngjyra">
                <FushaNgjyre vlera={el.vija} onNdrysho={(vija) => ndrysho({ vija })} />
              </Fusha>
              <Fusha emri="Trashësia">
                <FushaNumer vlera={el.trashesia || 0.4} min={0.1} max={10} hapi={0.1} onNdrysho={(trashesia) => ndrysho({ trashesia })} />
              </Fusha>
            </div>
            <div className="eq-kutite">
              <Form.Check type="checkbox" id="eq-nderprerje" label="Me ndërprerje" checked={Boolean(el.meNderprerje)} onChange={(e) => ndrysho({ meNderprerje: e.target.checked })} />
            </div>
            <div className="eq-ndihme">Vija është horizontale kur kutia është më e gjerë se e lartë, ndryshe vertikale.</div>
          </>
        )}

        {el.lloji === "vule" && <div className="eq-ndihme">Ylli i kuq "ZBRITJE -x%". Del vetëm te produktet me zbritje.</div>}
        {el.lloji === "flamur" && <div className="eq-ndihme">Flamuri i shtetit të origjinës; pa origjinë nuk del asgjë.</div>}
        {el.lloji === "barkod" && <div className="eq-ndihme">Barkodi i produktit. Te shtypja mund të fiket me "Shfaq barkodin".</div>}

        {el.lloji === "imazh" && (
          <Fusha emri="Imazhi (PNG ose JPG)" gjere>
            <Button size="sm" className="btn-cancel" onClick={() => imazhiRef.current?.click()}>
              <FontAwesomeIcon icon={faImage} className="me-2" />
              {el.imazhi ? "Ndrysho imazhin" : "Zgjidh imazhin"}
            </Button>
            {/* Vizatimet e shablloneve të gatshme ruhen si adresë (SVG te public/) - mbeten ashtu kur kopjohet. */}
            {eshteImazhMeAdrese(el.imazhi) && <div className="eq-ndihme mt-1">Vizatim i FinanCare-s ({el.imazhi.split("/").pop()})</div>}
          </Fusha>
        )}
        {el.lloji === "imazh" && (
          <Fusha emri="Ose zgjidh nga galeria e FinanCare-s" gjere>
            <div className="eq-galeria">
              {GALERIA_E_IMAZHEVE.map((g) => (
                <button
                  key={g.skedari}
                  type="button"
                  className={`eq-galeria-imazhi${el.imazhi === g.adresa ? " aktiv" : ""}`}
                  title={g.emri}
                  onClick={() => vendosImazhin(el.id, g.adresa, g.raporti)}
                >
                  <img src={g.adresa} alt={g.emri} loading="lazy" />
                </button>
              ))}
            </div>
          </Fusha>
        )}

        <Fusha emri="Kur shfaqet" gjere>
          <Zgjedhes vlera={el.kushti} onNdrysho={(kushti) => ndrysho({ kushti })} opsionet={KUSHTET} />
        </Fusha>
      </>
    );
  };

  const vetiteEShabllonit = () => (
    <>
      <div className="eq-paneli-titulli">
        <span>Etiketa</span>
      </div>
      <Fusha emri="Emri i shabllonit" gjere>
        <Form.Control size="sm" maxLength={100} value={aktiv.emri} onChange={(e) => ndryshoEmrin(e.target.value)} />
      </Fusha>
      <Fusha emri="Letra" gjere>
        <Zgjedhes
          vlera={sh.letra}
          onNdrysho={(letra) => ndryshoPermasat({ letra, h: LETRAT[letra].h })}
          opsionet={Object.entries(LETRAT).map(([celesi, l]) => [celesi, l.emri])}
        />
      </Fusha>
      {shablloniTermik(sh) ? (
        <>
          <Fusha emri="Lartësia e etiketës (mm)" gjere>
            <FushaNumer vlera={sh.h} min={KUFIJTE.minH} max={KUFIJTE.maxH} hapi={1} onNdrysho={(h) => ndryshoPermasat({ h })} />
          </Fusha>
          <div className="eq-fushat">
            {LETRAT[sh.letra].lartesite.map((h) => (
              <button key={h} type="button" className={sh.h === h ? "aktiv" : ""} onClick={() => ndryshoPermasat({ h })}>
                {h} mm
              </button>
            ))}
          </div>
          <div className="eq-ndihme">
            Etiketë rafti: gjerësia {sh.w} mm është zona e printimit të letrës, lartësia {KUFIJTE.minH}-{KUFIJTE.maxH} mm. Çdo etiketë
            printohet veç, me prerje sipas zgjedhjes te shtypja.
          </div>
        </>
      ) : (
        <>
          <Fusha emri="Etiketa për fletë" gjere>
            <div className="eq-fushat">
              {RRJETAT_A4.map((r) => (
                <button
                  key={r.celesi}
                  type="button"
                  className={sh.rrjeta === r.celesi ? "aktiv" : ""}
                  title={`${r.kolonat} për rresht × ${r.rreshtat} rreshta · ${r.w} × ${r.h} mm`}
                  onClick={() => ndryshoPermasat({ rrjeta: r.celesi })}
                >
                  {r.perFaqe} ({r.kolonat} × {r.rreshtat})
                </button>
              ))}
            </div>
          </Fusha>
          <div className="eq-ndihme">
            {rrjeta.perFaqe} etiketa për fletë A4: {rrjeta.kolonat} për rresht × {rrjeta.rreshtat} rreshta, secila {sh.w} × {sh.h} mm.
          </div>
        </>
      )}
      {!shablloniTermik(sh) && (
        <div className="eq-kutite">
          <Form.Check type="checkbox" id="eq-prerja" label="Vijë e hollë prerjeje rreth etiketës" checked={sh.vijaPrerjes} onChange={(e) => ndryshoShabllonin({ vijaPrerjes: e.target.checked })} />
        </div>
      )}
      <Fusha emri="Sfondi i etiketës" gjere>
        <FushaNgjyre vlera={sh.sfondi} opsionale parazgjedhur="#ffec00" onNdrysho={(sfondi) => ndryshoShabllonin({ sfondi })} />
      </Fusha>
    </>
  );

  return (
    <>
      <div>

        <Modal show={Boolean(konfirmimi)} onHide={() => setKonfirmimi(null)} centered className="sp-modal">
          <Modal.Header closeButton>
            <Modal.Title>{konfirmimi?.titulli}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center py-4">
            <p className="text-white-50 mb-0">{konfirmimi?.teksti}</p>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-center gap-2">
            <Button variant="secondary" className="btn-cancel px-4" onClick={() => setKonfirmimi(null)}>
              Anulo
            </Button>
            <Button
              variant="danger"
              className="btn-save px-4"
              onClick={() => {
                const { veprimi } = konfirmimi;
                setKonfirmimi(null);
                veprimi();
              }}
            >
              {konfirmimi?.butoni}
            </Button>
          </Modal.Footer>
        </Modal>

        <input ref={importiRef} type="file" accept=".json,application/json" hidden onChange={importo} />
        <input ref={imazhiRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={ngarkoImazhin} />

        <div className="text-white-50 small opacity-75 mb-3">
          Ndërtoni etiketat tuaja: tërhiqni elementet, ndryshoni madhësinë dhe ruajeni shabllonin. Shabllonet e ruajtura dalin te
          "Printimi" nën "Të miat". Me <FontAwesomeIcon icon={faDownload} /> shkarkohet shablloni si skedar (.qmimore.json), që
          hapet me "Importo" këtu, në një kompjuter tjetër ose te FinanCare.
        </div>

        <div className="eq-faqja">
          {/* Lista e shablloneve */}
          <aside className="eq-lista">
            <div className="d-flex gap-2 mb-3">
              <Button size="sm" className="btn-save flex-fill" onClick={shabllonBosh}>
                <FontAwesomeIcon icon={faPlus} className="me-1" /> Shabllon i ri
              </Button>
              <Button size="sm" className="btn-cancel" title="Importo një shabllon nga skedari (.json)" onClick={() => importiRef.current?.click()}>
                <FontAwesomeIcon icon={faFileImport} />
              </Button>
            </div>

            <div className="eq-lista-titulli">Shabllonet e mia</div>
            {poNgarkohet ? (
              <div className="text-white-50 small py-2">
                <Spinner size="sm" animation="border" className="me-2" /> Duke ngarkuar...
              </div>
            ) : shabllonet.length === 0 ? (
              <div className="eq-ndihme">Ende asnjë. Krijoni një të ri ose kopjoni një të gatshëm.</div>
            ) : (
              shabllonet.map((s) => (
                <div key={s.id} className={`eq-rreshti${aktiv?.id === s.id ? " aktiv" : ""}`}>
                  <button type="button" className="eq-rreshti-emri" onClick={() => hapShabllonin(s)}>
                    {s.emri}
                    {s.sh && <small>{pershkrimiLetres(s.sh)}</small>}
                  </button>
                  <button type="button" title="Shkarko si skedar (.json)" disabled={!s.sh} onClick={() => shkarkoShabllonin(s.emri, s.sh)}>
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                  <button type="button" title="Kopjo" onClick={() => hapSiKopje(`${s.emri} (kopje)`, normalizoShabllonin(s.permbajtja))}>
                    <FontAwesomeIcon icon={faCopy} />
                  </button>
                  <button type="button" title="Fshij" className="eq-rrezik" onClick={() => fshijShabllonin(s)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))
            )}

            <div className="eq-lista-titulli mt-3">Të gatshme (kopjo dhe ndrysho)</div>
            <div className="eq-tabet" role="tablist">
              {kategoriteMeShabllone.map((k) => (
                <button
                  key={k.celesi}
                  type="button"
                  role="tab"
                  aria-selected={kategoriaEGatshme === k.celesi}
                  className={kategoriaEGatshme === k.celesi ? "aktiv" : ""}
                  onClick={() => {
                    setKategoriaEGatshme(k.celesi);
                    setNenkategoriaEGatshme("");
                  }}
                >
                  {k.emri}
                </button>
              ))}
            </div>
            {nenkategoriteEGatshme.length > 0 && (
              <div className="eq-tabet eq-tabet--nen" role="tablist" aria-label="Nënkategoria">
                {["", ...nenkategoriteEGatshme].map((n) => (
                  <button
                    key={n || "te-gjitha"}
                    type="button"
                    role="tab"
                    aria-selected={nenkategoriaEGatshme === n}
                    className={nenkategoriaEGatshme === n ? "aktiv" : ""}
                    onClick={() => setNenkategoriaEGatshme(n)}
                  >
                    {n || "Të gjitha"}
                  </button>
                ))}
              </div>
            )}
            {SHABLLONET_E_GATSHME.filter(
              (g) => g.kategoria === kategoriaEGatshme && (!nenkategoriaEGatshme || g.nenkategoria === nenkategoriaEGatshme)
            ).map((g) => (
              <div key={g.celesi} className="eq-rreshti">
                <button type="button" className="eq-rreshti-emri" title={g.pershkrimi} onClick={() => hapSiKopje(g.emri, g.shablloni)}>
                  {g.emri}
                  <small>{g.pershkrimi}</small>
                </button>
                <button type="button" title="Shkarko si skedar (.json)" onClick={() => shkarkoShabllonin(g.emri, g.shablloni)}>
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </div>
            ))}
          </aside>

          {!sh ? (
            <div className="eq-bosh">
              Zgjidhni një shabllon nga lista, krijoni një të ri ose kopjoni një të gatshëm për ta ndryshuar.
            </div>
          ) : (
            <>
              {/* Skena */}
              <section className="eq-qendra" ref={zonaRef}>
                <div className="eq-shiriti">
                  <div className="eq-shto">
                    {Object.entries(LLOJET).map(([lloji, { emri }]) => (
                      <button key={lloji} type="button" title={`Shto: ${emri}`} onClick={() => shtoElement(lloji)}>
                        <FontAwesomeIcon icon={IKONAT[lloji]} />
                        <span>{emri}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="eq-shiriti eq-shiriti--mjetet">
                  <div className="d-flex align-items-center gap-1">
                    <button type="button" className="eq-mjet" title="Zhbëj (Ctrl+Z)" disabled={historiku.current.length === 0} onClick={zhbej}>
                      <FontAwesomeIcon icon={faRotateLeft} />
                    </button>
                    <button type="button" className="eq-mjet" title="Zvogëlo" onClick={() => setZmadhimi((z) => kufizo(z - 1, 1, 14))}>
                      <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                    </button>
                    <button type="button" className="eq-mjet" title="Zmadho" onClick={() => setZmadhimi((z) => kufizo(z + 1, 1, 14))}>
                      <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                    </button>
                    <button type="button" className="eq-mjet" title="Përshtate në ekran" onClick={() => pershtatZmadhimin(sh)}>
                      <FontAwesomeIcon icon={faExpand} />
                    </button>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <span className="text-white-50 small">Shembulli:</span>
                    <Form.Control
                      size="sm"
                      style={{ width: 170 }}
                      maxLength={80}
                      value={emriShembullit}
                      placeholder="Emri i produktit"
                      onChange={(e) => setEmriShembullit(e.target.value)}
                    />
                    <Form.Check type="switch" id="eq-me-zbritje" className="small mb-0" label="Me zbritje" checked={meZbritje} onChange={(e) => setMeZbritje(e.target.checked)} />
                    <Form.Check type="switch" id="eq-me-shumice" className="small mb-0" label="Me shumicë" checked={meShumice} onChange={(e) => setMeShumice(e.target.checked)} />
                  </div>
                </div>

                <div className="eq-skena-mbajtesi" tabIndex={0} ref={skenaRef} onKeyDown={tastiera} onPointerDown={() => setZgjedhur(null)}>
                  <div className="eq-skena" style={{ width: sh.w * zmadhimi, height: sh.h * zmadhimi }}>
                    <canvas ref={kanvasiRef} />
                    {sh.elementet.map((el) => (
                      <div
                        key={el.id}
                        className={`eq-element${el.id === zgjedhur ? " zgjedhur" : ""}`}
                        style={{ left: el.x * zmadhimi, top: el.y * zmadhimi, width: el.w * zmadhimi, height: el.h * zmadhimi }}
                        onPointerDown={(e) => filloTerheqjen(e, el)}
                      >
                        {el.lloji === "imazh" && !el.imazhi && <span className="eq-element-shenim">Imazh</span>}
                        {el.id === zgjedhur &&
                          DOREZAT.map((d) => <span key={d} className={`eq-doreza eq-doreza--${d}`} onPointerDown={(e) => filloTerheqjen(e, el, d)} />)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="eq-ndihme text-center">
                  {pershkrimiLetres(sh)} · tërhiqni për të lëvizur, kapni pikat për madhësinë · shigjetat lëvizin 0.5 mm (Shift = 5 mm) · Delete
                  fshin · Ctrl+D dyfishon · Ctrl+Z zhbën
                </div>
              </section>

              {/* Vetitë */}
              <aside className="eq-paneli">
                <div className="eq-veprimet-kryesore">
                  <Button size="sm" className="btn-save flex-fill" onClick={ruajShabllonin} disabled={poRuhet || (!iNdryshuar && aktiv.id > 0)}>
                    {poRuhet ? <Spinner size="sm" animation="border" className="me-1" /> : <FontAwesomeIcon icon={faFloppyDisk} className="me-1" />}
                    {aktiv.id > 0 ? "Ruaj" : "Ruaj si të ri"}
                  </Button>
                  <Button size="sm" className="btn-cancel" title="Fletë prove në PDF" onClick={provoPdf}>
                    <FontAwesomeIcon icon={faFilePdf} />
                  </Button>
                  <Button size="sm" className="btn-cancel" title="Eksporto shabllonin si skedar (.json)" onClick={eksporto}>
                    <FontAwesomeIcon icon={faFileExport} />
                  </Button>
                </div>
                {iNdryshuar && <div className="eq-paruajtur">Ka ndryshime të paruajtura</div>}

                {elementi ? vetiteEElementit() : vetiteEShabllonit()}

                <div className="eq-paneli-titulli mt-3">
                  <span>Elementet ({sh.elementet.length})</span>
                </div>
                {sh.elementet.length === 0 && <div className="eq-ndihme">Shtoni elemente nga shiriti sipër etiketës.</div>}
                {[...sh.elementet].reverse().map((el) => (
                  <button
                    key={el.id}
                    type="button"
                    className={`eq-shtresa${el.id === zgjedhur ? " aktiv" : ""}`}
                    onClick={() => setZgjedhur(el.id === zgjedhur ? null : el.id)}
                  >
                    <FontAwesomeIcon icon={IKONAT[el.lloji]} fixedWidth />
                    <span>{pershkrimiElementit(el)}</span>
                  </button>
                ))}
              </aside>
            </>
          )}
        </div>
      </div>

      <PdfPamja pdf={pdf} titulli="Fleta e provës" onHide={() => setPdf(null)} onMesazh={mesazh} />
    </>
  );
}

export default EditoriQmimores;
