import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faArrowsRotate, faCheck, faClockRotateLeft, faEraser, faDownload, faFileExcel, faFilePdf, faFolderOpen, faPen, faPenToSquare, faPlus, faRotateLeft, faTableColumns, faTags, faTrash } from "@fortawesome/free-solid-svg-icons";
import PdfPamja, { PdfKanvasi } from "./components/PdfPamja";
import LidhKolonat from "./components/LidhKolonat";
import { FUSHAT, celesiIHartes, lexoExcelin, meNdryshime, shablloniISugjeruar, shkronjaEKolones } from "./lib/excel";
import { opsionetEOrigjines } from "./lib/qmimore/origjina";
import { eshteDesktop, lexoProduktet, listaEShablloneve, ruajProduktet } from "./lib/ruajtja";
import { PRINTERI_I_SHFLETUESIT, fshiExcelin, lexoExcelinERuajtur, ruajExcelin } from "./lib/shfletuesi";
import { kalibrimiI } from "./lib/kalibrimi";
import { dataShqip, gjurmetEPunes, indeksoHistorikun, lexoHistorikun, regjistroPunen } from "./lib/historiku";
import { normalizoShabllonin, pergatitImazhet, pershkrimiLetres, rrjetaEShabllonit, shablloniKaZbritje, shablloniTermik } from "./lib/qmimore/shablloniQmimores";
import { KATEGORITE_E_SHABLLONEVE, SHABLLONET_E_GATSHME, nenkategoriteE } from "./lib/qmimore/shabllonetEGatshme";
import { emriShtetit, flamuriSiDataUrl, flamuriSiPng, ngarkoFlamujt } from "./lib/qmimore/origjina";
import { fletaEParazgjedhur, ngarkoFontetEQmimores, planiFletes, vizatoQmimoren } from "./lib/qmimore/qmimorjaPdf";

const TE_MIAT = "temiat";

// Termikët (80/58 mm) mbeten te FinanCare-i: këtu printohet vetëm në A4 nga printeri i Windows-it.
const GATI = SHABLLONET_E_GATSHME.filter((g) => !shablloniTermik(g.shablloni));
const SHABLLONET_GATI = Object.fromEntries(
  GATI.map((g) => [`gati:${g.celesi}`, { emri: g.emri, pershkrimi: g.pershkrimi, shablloni: g.shablloni, kategoria: g.kategoria, nenkategoria: g.nenkategoria }])
);

const perdorFushen = (sh, fusha) => sh.elementet.some((el) => new RegExp(`\\{${fusha}\\}`).test(el.teksti || ""));
const dataESotme = () => new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

const NGJYRAT_E_SKICES = { qmimi: "#0f172a", barkod: "#475569", qr: "#475569", vule: "#e62429", shigjete: "#e62429", flamur: "#f59e0b", imazh: "#8b5cf6" };
const SkicaShabllonit = ({ shablloni }) => {
  const shkalla = Math.min(42 / shablloni.w, 40 / shablloni.h);
  return (
    <div className="ql-skica" style={{ width: shablloni.w * shkalla, height: shablloni.h * shkalla, margin: `0 ${(42 - shablloni.w * shkalla) / 2}px`, background: shablloni.sfondi || "#fff" }}>
      {shablloni.elementet.map((el, i) => (
        <span
          key={i}
          style={{
            left: el.x * shkalla,
            top: el.y * shkalla,
            width: Math.max(1, el.w * shkalla),
            height: Math.max(1, el.h * shkalla),
            borderRadius: el.lloji === "elips" || el.lloji === "vule" ? "50%" : 1,
            background: el.mbushja || el.sfondi || NGJYRAT_E_SKICES[el.lloji] || "#94a3b8",
            opacity: el.lloji === "qmimi" ? 0.85 : 0.55,
          }}
        />
      ))}
    </div>
  );
};

const euro = (v) => (v == null ? "-" : `${Number(v).toFixed(2)}€`);

// Fusha e redaktimit te tabela: ruan tekstin siç shkruhet ("1," / bosh), produkti rillogaritet nga ai.
const Qeliza = ({ vlera, onNdrysho, numer = false, gjeresia, ...tjera }) => (
  <Form.Control
    size="sm"
    className="lb-qeliza"
    style={gjeresia ? { width: gjeresia } : undefined}
    inputMode={numer ? "decimal" : undefined}
    value={vlera ?? ""}
    onChange={(e) => onNdrysho(e.target.value)}
    {...tjera}
  />
);
const teksti = (v) => (v == null ? "" : String(v));

// Vlera bosh të qëndrueshme (jo objekt i ri në çdo render - përndryshe useMemo/useEffect rillogariten pa fund).
const BOSH = Object.freeze({});
const LISTE_BOSH = Object.freeze([]);
const SET_BOSH = new Set();
// Fleta pa Excel: produktet e shtuara direkt te programi (ruhen te produktet.json).
const TE_MIAT_PRODUKTET = "Produktet e mia";
const HAPESIRAT = [0, 0.8, 1, 2, 3, 5];
const MAKS_KOPJE = 99;
// Marginat e fletës (mm nga skaji); 0 = deri në skaj, si te tagsprinter.com.
// Margjina minimale nga skaji (mm); rrjeta vihet në mes, ndaj margjina reale del shpesh më e madhe.
const MARGJINAT = [0, 1, 2, 3, 4, 5, 6, 8];
// Hapat e magjistarit të printimit: [emri, përshkrimi].
const HAPAT = [
  ["Produktet", "Excel-i, fleta dhe kopjet"],
  ["Dizajni", "Shablloni i etiketës"],
  ["Opsionet", "Çmimi, letra, hapësirat"],
  ["Printimi", "Kontrolli dhe PDF-ja"],
];

export default function Printimi({ cilesimet, ndryshoCilesimet, mesazh, hapEditorin, excelILeshuar = null }) {
  const [excel, setExcel] = useState(null); // { fletet } | null
  const [poLexohet, setPoLexohet] = useState(false);
  const [gabimiExcel, setGabimiExcel] = useState("");
  const [fletaAktive, setFletaAktive] = useState("");
  // Rreshtat e hequr nga printimi, sipas fletës: { "<fleta>": Set(nr) }
  const [teHequrat, setTeHequrat] = useState({});
  const [kerkimi, setKerkimi] = useState("");
  // Editori te tabela - vetëm në program, Excel-i s'preket. Sipas fletës:
  // ndryshimet { "<fleta>": { <nr>: { name, code, barcode, qmimi, qmimiRi, origjina } } }, teShtuarat { "<fleta>": [nr...] }
  const [redaktim, setRedaktim] = useState(false);
  const [ndryshimet, setNdryshimet] = useState({});
  const [teShtuarat, setTeShtuarat] = useState({});
  // Kopjet për printim sipas fletës: { "<fleta>": { <nr>: "3" } } - teksti i fushës, ruhet me produktet.
  const [kopjet, setKopjet] = useState({});

  const [shabllonetEMia, setShabllonetEMia] = useState({});
  const [fontet, setFontet] = useState(undefined);
  const [flamujt, setFlamujt] = useState({});
  const [flamujtPng, setFlamujtPng] = useState({});
  const [data, setData] = useState(dataESotme);
  const [parapamja, setParapamja] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [poGjenerohet, setPoGjenerohet] = useState(false);
  const [tabi, setTabi] = useState("");
  const [nenTabi, setNenTabi] = useState("");
  const [hapi, setHapi] = useState(0);

  // Në shfletues (ueb / celular) s'ka shteg skedari: Excel-i zgjidhet ose lëshohet, bajtet mbahen në IndexedDB.
  const [webExcel, setWebExcel] = useState(null); // { emri, bajtet, koha }
  const webExcelRef = useRef(null);
  webExcelRef.current = webExcel;
  const skedari = eshteDesktop ? cilesimet.skedariExcel : webExcel?.emri || "";
  const emriSkedarit = skedari ? skedari.split(/[\\/]/).pop() : "";
  const inputiExcel = useRef(null);
  // Lidhjet e kolonave të ruajtura me dorë ("Lidh kolonat"), për Excel-at që s'janë shablloni ynë.
  const hartat = cilesimet.hartatEKolonave || BOSH;
  const hartatRef = useRef(hartat);
  hartatRef.current = hartat;
  const [lidhja, setLidhja] = useState(null); // fleta që po lidhet

  /* ---------- Excel-i ---------- */

  const lexoSkedarin = useCallback(
    async (shtegu, { heshtur = false } = {}) => {
      if (!shtegu) return;
      if (!heshtur) setPoLexohet(true);
      try {
        const bajtet = eshteDesktop ? await window.labels.lexoExcel(shtegu) : webExcelRef.current?.bajtet;
        if (!bajtet) throw new Error("Skedari nuk u gjet. Zgjidheni përsëri.");
        if (bajtet.gabim) throw new Error(bajtet.gabim);
        const iRi = lexoExcelin(bajtet, hartatRef.current);
        if (!iRi.fletet.length) throw new Error("Excel-i është bosh: asnjë fletë me të dhëna.");
        setExcel(iRi);
        setGabimiExcel("");
        setFletaAktive((f) => (iRi.fletet.some((x) => x.emri === f) ? f : (iRi.fletet.find((x) => x.produktet.length) || iRi.fletet[0]).emri));
      } catch (err) {
        if (!heshtur) {
          setExcel(null);
          setGabimiExcel(err?.message || String(err));
        }
      } finally {
        if (!heshtur) setPoLexohet(false);
      }
    },
    []
  );

  const webKoha = webExcel?.koha;
  useEffect(() => {
    lexoSkedarin(skedari);
  }, [skedari, webKoha, lexoSkedarin]);

  // Shfletuesi: Excel-i i fundit rikthehet pas rifreskimit të faqes.
  useEffect(() => {
    if (eshteDesktop) return;
    lexoExcelinERuajtur().then((r) => r?.bajtet && setWebExcel((x) => x || r));
  }, []);
  const hapSkedarinWeb = useCallback(async (skedariI) => {
    if (!skedariI) return;
    if (!/\.(xlsx|xlsm|xls|ods|csv)$/i.test(skedariI.name)) {
      setGabimiExcel("Zgjidhni një Excel (xlsx, xls, ods) ose CSV.");
      return;
    }
    const bajtet = new Uint8Array(await skedariI.arrayBuffer());
    setTeHequrat({});
    setWebExcel({ emri: skedariI.name, bajtet, koha: Date.now() });
    ruajExcelin(skedariI.name, bajtet);
  }, []);
  // Excel-i i lëshuar në dritare (App.jsx) në shfletues.
  useEffect(() => {
    if (excelILeshuar?.skedari && !eshteDesktop) hapSkedarinWeb(excelILeshuar.skedari);
  }, [excelILeshuar, hapSkedarinWeb]);
  // Lidhja e re e kolonave: i njëjti Excel rilexohet me të.
  const hartatEPara = useRef(hartat);
  useEffect(() => {
    if (hartatEPara.current === hartat) return;
    hartatEPara.current = hartat;
    lexoSkedarin(skedari, { heshtur: true });
  }, [hartat, skedari, lexoSkedarin]);

  const ruajLidhjen = (celesi, harta) => {
    ndryshoCilesimet({ hartatEKolonave: { ...hartat, [celesi]: harta } });
    setLidhja(null);
    mesazh("success", "Lidhja e kolonave u ruajt - vlen edhe për Excel-at e tjerë me të njëjtat tituj.");
  };
  const hiqLidhjen = (f) => {
    const { [celesiIHartes(f.emri, f.titujt, f.mostra)]: _hequr, ...tjerat } = hartat;
    ndryshoCilesimet({ hartatEKolonave: tjerat });
    setLidhja(null);
  };

  // Kthimi nga Excel-i (pas ruajtjes) e rilexon vetë listën.
  useEffect(() => {
    if (!skedari || !eshteDesktop) return undefined;
    const neFokus = () => lexoSkedarin(skedari, { heshtur: true });
    window.addEventListener("focus", neFokus);
    return () => window.removeEventListener("focus", neFokus);
  }, [skedari, lexoSkedarin]);

  const zgjidhSkedarin = async () => {
    if (!eshteDesktop) return inputiExcel.current?.click();
    const s = await window.labels.zgjidhExcel();
    if (!s) return;
    setTeHequrat({});
    if (s === skedari) lexoSkedarin(s);
    else ndryshoCilesimet({ skedariExcel: s });
  };

  // Fletët e Excel-it + "Produktet e mia" (gjithmonë, edhe pa Excel).
  const fletet = useMemo(() => [...(excel?.fletet || []), { emri: TE_MIAT_PRODUKTET, produktet: LISTE_BOSH, eMia: true }], [excel]);
  useEffect(() => {
    if (!fletet.some((f) => f.emri === fletaAktive)) setFletaAktive(fletet[0].emri);
  }, [fletet, fletaAktive]);

  // Produktet e shtuara dhe ndryshimet ruhen në disk; ngarkohen një herë, ruhen pak pas çdo ndryshimi.
  const uNgarkuanProduktet = useRef(false);
  useEffect(() => {
    lexoProduktet().then((v) => {
      setNdryshimet(v.ndryshimet);
      setTeShtuarat(v.teShtuarat);
      setKopjet(v.kopjet);
      uNgarkuanProduktet.current = true;
    });
  }, []);
  useEffect(() => {
    if (!uNgarkuanProduktet.current) return undefined;
    const t = setTimeout(() => ruajProduktet({ ndryshimet, teShtuarat, kopjet }).catch((err) => console.error("Produktet nuk u ruajtën:", err)), 400);
    return () => clearTimeout(t);
  }, [ndryshimet, teShtuarat, kopjet]);

  const fleta = fletet.find((f) => f.emri === fletaAktive) || null;
  const teHequrat_ = teHequrat[fletaAktive] || SET_BOSH;
  const ndryshimetEFletes = ndryshimet[fletaAktive] || BOSH;
  const teShtuaratEFletes = teShtuarat[fletaAktive] || LISTE_BOSH;
  const produktetEFletes = useMemo(() => {
    // Rreshtat e Excel-it të fshirë këtu ({ fshire: true }) s'shfaqen; rikthehen me "Rikthe si në Excel".
    const ngaExceli = (fleta?.produktet || []).filter((p) => !ndryshimetEFletes[p.nr]?.fshire).map((p) => meNdryshime(p, ndryshimetEFletes[p.nr]));
    const shtuar = teShtuaratEFletes.map((nr) => meNdryshime({ nr, iShtuar: true, name: "", code: "", barcode: "", price: null }, ndryshimetEFletes[nr] || {}));
    return [...ngaExceli, ...shtuar];
  }, [fleta, ndryshimetEFletes, teShtuaratEFletes]);
  const numriINdryshimeve = Object.keys(ndryshimetEFletes).length + teShtuaratEFletes.length;

  const ndryshoFushen = (p, fusha, vlera) =>
    setNdryshimet((t) => {
      const eFletes = t[fletaAktive] || {};
      const iProduktit = eFletes[p.nr] || {
        name: p.name,
        code: p.code,
        barcode: p.barcode,
        qmimi: teksti(p.price),
        qmimiRi: teksti(p.qmimiPasZbritjes),
        origjina: p.origjinaMeDore ? p.origin : "",
      };
      return { ...t, [fletaAktive]: { ...eFletes, [p.nr]: { ...iProduktit, [fusha]: vlera } } };
    });
  // Vlera e fushës në editor: teksti i shkruar, ndryshe ajo nga Excel-i.
  const fusha = (p, emri, ngaProdukti) => ndryshimetEFletes[p.nr]?.[emri] ?? ngaProdukti;

  const shtoProdukt = () => {
    const nr = `s${Date.now().toString(36)}`;
    setTeShtuarat((t) => ({ ...t, [fletaAktive]: [...(t[fletaAktive] || []), nr] }));
    setRedaktim(true);
    setKerkimi("");
  };
  const fshijTeShtuarin = (nr) => {
    setTeShtuarat((t) => ({ ...t, [fletaAktive]: (t[fletaAktive] || []).filter((x) => x !== nr) }));
    setNdryshimet((t) => {
      const { [nr]: _hequr, ...tjera } = t[fletaAktive] || {};
      return { ...t, [fletaAktive]: tjera };
    });
  };
  const riktheNgaExceli = (nr) =>
    setNdryshimet((t) => {
      const { [nr]: _hequr, ...tjera } = t[fletaAktive] || {};
      return { ...t, [fletaAktive]: tjera };
    });
  // Fshirja e produktit nga lista (i shtuari fshihet krejt, rreshti i Excel-it shënohet { fshire: true } - Excel-i
  // s'preket) dhe rikthimi si në Excel - në të dyja pamjet e tabelës (edhe pa "Ndrysho").
  const fshiProduktin = (p) =>
    p.iShtuar
      ? fshijTeShtuarin(p.nr)
      : setNdryshimet((t) => ({ ...t, [fletaAktive]: { ...(t[fletaAktive] || {}), [p.nr]: { fshire: true } } }));
  const veprimetERreshtit = (p) => (
    <span className="d-inline-flex gap-2">
      {!p.iShtuar && ndryshimetEFletes[p.nr] && (
        <button type="button" className="btn btn-link p-0 text-info" title="Rikthe si në Excel" aria-label="Rikthe si në Excel" onClick={() => riktheNgaExceli(p.nr)}>
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
      )}
      <button
        type="button"
        className="btn btn-link p-0 text-danger"
        title={p.iShtuar ? "Fshije këtë produkt të shtuar" : "Fshije nga lista (Excel-i s'preket; rikthehet me \"Rikthe si në Excel\")"}
        aria-label="Fshije produktin"
        onClick={() => fshiProduktin(p)}
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </span>
  );
  const hiqTeGjithaNdryshimet = () => {
    setNdryshimet((t) => ({ ...t, [fletaAktive]: {} }));
    setTeShtuarat((t) => ({ ...t, [fletaAktive]: [] }));
  };
  const origjinat = useMemo(() => opsionetEOrigjines(), []);

  // Prek për ta ndryshuar: një qelizë bëhet fushë; Enter / klikim jashtë e mbyll, Esc e kthen siç ishte.
  const [qelizaAktive, setQelizaAktive] = useState(null); // { nr, fusha, fillimi, kishte }
  const eshteAktive = (p, emri) => qelizaAktive?.nr === p.nr && qelizaAktive?.fusha === emri;
  const hapQelizen = (p, emri, vlera) => setQelizaAktive({ nr: p.nr, fusha: emri, fillimi: vlera, kishte: Boolean(ndryshimetEFletes[p.nr]) });
  const mbyllQelizen = () => setQelizaAktive(null);
  const anuloQelizen = (p) => {
    const q = qelizaAktive;
    if (q) {
      if (q.kishte) ndryshoFushen(p, q.fusha, q.fillimi);
      else riktheNgaExceli(p.nr);
    }
    setQelizaAktive(null);
  };
  const tastetEQelizes = (p) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      mbyllQelizen();
    } else if (e.key === "Escape") {
      e.preventDefault();
      anuloQelizen(p);
    }
  };
  const qelizaPrek = (p, emri, vlera, shfaqja, { gjeresia, numer = false, klasa = "", tdKlasa = "" } = {}) => (
    <td
      className={`lb-prek ${tdKlasa}`}
      title={eshteAktive(p, emri) ? undefined : "Kliko për ta ndryshuar"}
      onClick={() => !eshteAktive(p, emri) && hapQelizen(p, emri, fusha(p, emri, vlera))}
    >
      {eshteAktive(p, emri) ? (
        <Qeliza
          autoFocus
          numer={numer}
          gjeresia={gjeresia}
          className={`lb-qeliza ${klasa}`}
          vlera={fusha(p, emri, vlera)}
          onNdrysho={(v) => ndryshoFushen(p, emri, v)}
          onFocus={(e) => e.target.select()}
          onBlur={mbyllQelizen}
          onKeyDown={tastetEQelizes(p)}
        />
      ) : (
        shfaqja
      )}
    </td>
  );
  const opsionetEOrigjinesPer = (p) => (
    <>
      <option value="">Automatike{!p.origjinaMeDore && p.origin ? ` (${emriShtetit(p.origin)})` : ""}</option>
      {origjinat.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
  const produktet = useMemo(() => produktetEFletes.filter((p) => !p.gabim && !teHequrat_.has(p.nr)), [produktetEFletes, teHequrat_]);
  // Kopjet: fusha "Kopje" e rreshtit, ndryshe kolona "Kopje" e Excel-it, ndryshe 1. Çdo kopje = një etiketë më shumë.
  const kopjetEFletes = kopjet[fletaAktive] || BOSH;
  const kopjaE = useCallback(
    (p) => {
      const v = parseInt(kopjetEFletes[p.nr], 10);
      return Number.isFinite(v) && v > 0 ? Math.min(v, MAKS_KOPJE) : p.kopje || 1;
    },
    [kopjetEFletes]
  );
  const produktetPerPrintim = useMemo(() => produktet.flatMap((p) => Array(kopjaE(p)).fill(p)), [produktet, kopjaE]);
  const ndryshoKopjet = (nr, vlera) =>
    setKopjet((t) => ({
      ...t,
      [fletaAktive]: { ...(t[fletaAktive] || {}), [nr]: vlera === "" ? "" : String(Math.max(1, Math.min(MAKS_KOPJE, parseInt(vlera, 10) || 1))) },
    }));
  const teDukshmit = useMemo(() => {
    const k = kerkimi.trim().toLowerCase();
    return k ? produktetEFletes.filter((p) => `${p.name} ${p.barcode} ${p.code}`.toLowerCase().includes(k)) : produktetEFletes;
  }, [produktetEFletes, kerkimi]);

  const ndryshoZgjedhjen = (nr, zgjedhur) =>
    setTeHequrat((t) => {
      const s = new Set(t[fletaAktive] || []);
      if (zgjedhur) s.delete(nr);
      else s.add(nr);
      return { ...t, [fletaAktive]: s };
    });
  const zgjidhTeGjitha = (zgjedhur) =>
    setTeHequrat((t) => {
      const s = new Set(t[fletaAktive] || []);
      teDukshmit.forEach((p) => (zgjedhur ? s.delete(p.nr) : s.add(p.nr)));
      return { ...t, [fletaAktive]: s };
    });

  // Pastro: si në fillim, pa Excel - mbyllet skedari (s'kujtohet më), fshihen produktet e shtuara këtu (edhe
  // "Produktet e mia"), ndryshimet, kopjet dhe zgjedhjet. Skedari i Excel-it në disk s'preket.
  const [pastrimi, setPastrimi] = useState(false);
  const kaShtuaraOseNdryshime =
    Object.values(teShtuarat).some((l) => l?.length) || Object.values(ndryshimet).some((n) => n && Object.keys(n).length);
  const pastroGjithcka = () => {
    setPastrimi(false);
    ndryshoCilesimet({ skedariExcel: "" });
    if (!eshteDesktop) {
      setWebExcel(null);
      fshiExcelin();
    }
    setExcel(null);
    setGabimiExcel("");
    setTeShtuarat({});
    setNdryshimet({});
    setKopjet({});
    setTeHequrat({});
    setKerkimi("");
    setRedaktim(false);
  };

  /* ---------- Shabllonet ---------- */

  useEffect(() => {
    let aktiv = true;
    listaEShablloneve().then((lista) => {
      if (!aktiv) return;
      const teMiat = {};
      lista.forEach((s) => {
        const sh = normalizoShabllonin(s.permbajtja);
        if (sh && !shablloniTermik(sh)) teMiat[`sh:${s.id}`] = { emri: s.emri, pershkrimi: `${pershkrimiLetres(sh)} · shabllon i juaji`, shablloni: sh };
      });
      setShabllonetEMia(teMiat);
    });
    ngarkoFontetEQmimores().then((f) => aktiv && setFontet(f));
    return () => {
      aktiv = false;
    };
  }, []);

  const shabllonet = useMemo(() => ({ ...SHABLLONET_GATI, ...shabllonetEMia }), [shabllonetEMia]);
  const tabet = useMemo(() => {
    const lista = KATEGORITE_E_SHABLLONEVE.map((k) => ({
      ...k,
      celesat: Object.keys(SHABLLONET_GATI).filter((c) => SHABLLONET_GATI[c].kategoria === k.celesi),
    })).filter((k) => k.celesat.length > 0);
    lista.push({ celesi: TE_MIAT, emri: "Të miat", celesat: Object.keys(shabllonetEMia) });
    return lista;
  }, [shabllonetEMia]);

  // Shablloni i fletës: zgjedhja e ruajtur, ndryshe sugjerimi sipas emrit të fletës.
  const celesiAktiv = useMemo(() => {
    const iRuajtur = cilesimet.shabllonetSipasFletes?.[fletaAktive];
    if (shabllonet[iRuajtur]) return iRuajtur;
    const s = shablloniISugjeruar(fletaAktive);
    if (s.startsWith("kategoria:")) return tabet.find((t) => t.celesi === s.slice(10))?.celesat[0] || Object.keys(shabllonet)[0];
    return shabllonet[s] ? s : Object.keys(shabllonet)[0];
  }, [cilesimet.shabllonetSipasFletes, fletaAktive, shabllonet, tabet]);

  // Rregullimet e fletës (hapësirat, margjina, orientimi) ruhen për çdo shabllon: parazgjedhja e shabllonit
  // (fletaEParazgjedhur - sa më shumë etiketa në A4) + ndryshimet e përdoruesit te fletaSipasShabllonit.
  const ndryshimetERregullimit = cilesimet.fletaSipasShabllonit?.[celesiAktiv] || null;
  const ndryshoRregullimin = (n) =>
    ndryshoCilesimet({
      fletaSipasShabllonit: { ...(cilesimet.fletaSipasShabllonit || {}), [celesiAktiv]: { ...(ndryshimetERregullimit || {}), ...n } },
    });
  const riktheRregullimin = () => {
    const { [celesiAktiv]: _hiqet, ...tjerat } = cilesimet.fletaSipasShabllonit || {};
    ndryshoCilesimet({ fletaSipasShabllonit: tjerat });
  };

  const zgjidhShabllonin = (celesi) =>
    ndryshoCilesimet({ shabllonetSipasFletes: { ...(cilesimet.shabllonetSipasFletes || {}), [fletaAktive]: celesi } });

  const tabiAktiv = tabet.find((t) => t.celesi === tabi) || tabet.find((t) => t.celesat.includes(celesiAktiv)) || tabet[0];
  const nenkategorite = tabiAktiv && tabiAktiv.celesi !== TE_MIAT ? nenkategoriteE(tabiAktiv.celesi) : [];
  const celesatETabit = (tabiAktiv?.celesat || []).filter((c) => !nenTabi || !nenkategorite.includes(nenTabi) || shabllonet[c]?.nenkategoria === nenTabi);

  const shablloniAktiv = shabllonet[celesiAktiv]?.shablloni || null;
  const [shablloniGati, setShablloniGati] = useState(null);
  useEffect(() => {
    let aktiv = true;
    setShablloniGati(null);
    if (!shablloniAktiv) return undefined;
    pergatitImazhet(shablloniAktiv)
      .then((sh) => aktiv && setShablloniGati(sh))
      .catch(() => aktiv && setShablloniGati(shablloniAktiv));
    return () => {
      aktiv = false;
    };
  }, [shablloniAktiv]);

  const meDate = shablloniAktiv ? perdorFushen(shablloniAktiv, "data") : false;
  const meZbritje = shablloniAktiv ? shablloniKaZbritje(shablloniAktiv) : false;
  const formati = shablloniAktiv ? rrjetaEShabllonit(shablloniAktiv) : { kolonat: 1, rreshtat: 1 };
  // Plani i fletës sipas orientimit dhe hapësirave të zgjedhura (numri i etiketave për fletë del nga ai).
  const rregullimi = { ...fletaEParazgjedhur(shablloniAktiv), ...(ndryshimetERregullimit || {}) };
  const plani = shablloniAktiv ? planiFletes(shablloniAktiv, rregullimi.orientimi || "auto", Number(rregullimi.hapesiraH) || 0, Number(rregullimi.hapesiraV) || 0, Number(rregullimi.margjina) || 0) : null;
  const perFaqe = plani ? plani.perFaqe : formati.kolonat * formati.rreshtat;
  const numriMeZbritje = produktet.filter((p) => p.discount > 0).length;

  /* ---------- Flamujt ---------- */

  const kodet = useMemo(() => [...new Set(produktetEFletes.map((p) => p.origin).filter(Boolean))].sort().join(","), [produktetEFletes]);
  useEffect(() => {
    if (!kodet) return undefined;
    let aktiv = true;
    const lista = kodet.split(",");
    ngarkoFlamujt(lista).then((f) => aktiv && setFlamujt((x) => ({ ...x, ...f })));
    Promise.all(lista.map(async (k) => [k, await flamuriSiPng(k, 240).catch(() => null)])).then(
      (c) => aktiv && setFlamujtPng((x) => ({ ...x, ...Object.fromEntries(c.filter(([, png]) => png)) }))
    );
    return () => {
      aktiv = false;
    };
  }, [kodet]);

  const opsionet = useMemo(
    () => ({
      shfaqBarkodin: cilesimet.shfaqBarkodin !== false,
      shfaqEuro: cilesimet.shfaqEuro !== false,
      shfaqFlamurin: cilesimet.shfaqFlamurin !== false,
      shfaqShtetin: cilesimet.shfaqShtetin !== false,
      zmadhoNeVendinELire: cilesimet.zmadhoNeVendinELire !== false,
      vijatEPrerjes: cilesimet.vijatEPrerjes === true || cilesimet.vijatEPrerjes === false ? cilesimet.vijatEPrerjes : null,
      stiliQmimit: cilesimet.stiliQmimit === "dhjetore" ? "dhjetore" : "centet",
      tekstet: { data },
      flamujtPng,
      fontet,
      shablloni: shablloniGati || shablloniAktiv,
      emriBiznesit: cilesimet.emriBiznesit || "",
      hapesiraH: Number(rregullimi.hapesiraH) || 0,
      hapesiraV: Number(rregullimi.hapesiraV) || 0,
      orientimi: rregullimi.orientimi || "auto",
      margjina: Number(rregullimi.margjina) || 0,
      // Shfletuesi: korrigjimi i printerit futet në PDF (në desktop e bën printimi direkt).
      ...(eshteDesktop ? {} : { zhvendosjaX: kalibrimiI(cilesimet.kalibrimet, PRINTERI_I_SHFLETUESIT).x, zhvendosjaY: kalibrimiI(cilesimet.kalibrimet, PRINTERI_I_SHFLETUESIT).y }),
    }),
    [cilesimet.shfaqBarkodin, cilesimet.shfaqEuro, cilesimet.shfaqFlamurin, cilesimet.shfaqShtetin, cilesimet.zmadhoNeVendinELire, cilesimet.vijatEPrerjes, cilesimet.stiliQmimit, cilesimet.emriBiznesit, rregullimi.hapesiraH, rregullimi.hapesiraV, rregullimi.orientimi, rregullimi.margjina, cilesimet.kalibrimet, data, flamujtPng, fontet, shablloniGati, shablloniAktiv]
  );

  /* ---------- Historiku i printimeve: e njëjta çmimore s'printohet dy herë pa e ditur ---------- */

  const [historiku, setHistoriku] = useState([]);
  useEffect(() => {
    lexoHistorikun().then(setHistoriku);
  }, []);
  const indeksi = useMemo(() => indeksoHistorikun(historiku), [historiku]);
  // Gjurma varet vetëm nga ajo që del në letër (jo nga fontet/flamujt që ngarkohen).
  const opsionetEGjurmes = useMemo(
    () => ({ b: opsionet.shfaqBarkodin, e: opsionet.shfaqEuro, f: opsionet.shfaqFlamurin, sh: opsionet.shfaqShtetin, zv: opsionet.zmadhoNeVendinELire, vp: opsionet.vijatEPrerjes, s: opsionet.stiliQmimit, d: opsionet.tekstet.data, n: opsionet.emriBiznesit, h: opsionet.hapesiraH, v: opsionet.hapesiraV, o: opsionet.orientimi, m: opsionet.margjina }),
    [opsionet]
  );
  const [gjurmet, setGjurmet] = useState(null); // { puna, etiketat } për produktet aktuale
  useEffect(() => {
    let aktiv = true;
    if (!shablloniAktiv || !produktet.length) {
      setGjurmet(null);
      return undefined;
    }
    const t = setTimeout(() => {
      gjurmetEPunes(shablloniAktiv, opsionetEGjurmes, produktet)
        .then((g) => aktiv && setGjurmet(g))
        .catch(() => aktiv && setGjurmet(null));
    }, 200);
    return () => {
      aktiv = false;
      clearTimeout(t);
    };
  }, [shablloniAktiv, opsionetEGjurmes, produktet]);
  const teprinturat = useMemo(() => {
    if (!gjurmet || gjurmet.etiketat.length !== produktet.length) return [];
    return produktet.map((p, i) => ({ p, rec: indeksi.sipasEtiketes.get(gjurmet.etiketat[i]) })).filter((x) => x.rec);
  }, [gjurmet, produktet, indeksi]);
  const iFundit = teprinturat.reduce((m, x) => (!m || x.rec.koha > m.koha ? x.rec : m), null);
  const hiqTePrinturat = () =>
    setTeHequrat((t) => {
      const s = new Set(t[fletaAktive] || []);
      teprinturat.forEach(({ p }) => s.add(p.nr));
      return { ...t, [fletaAktive]: s };
    });

  const [konfirmimi, setKonfirmimi] = useState(null); // { rec, vazhdo } kur e njëjta punë është printuar më parë
  const uRegjistrua = useRef(false);
  const regjistro = async (menyra) => {
    if (!pdf?.puna || uRegjistrua.current) return;
    uRegjistrua.current = true;
    try {
      setHistoriku(await regjistroPunen({ ...pdf.puna, menyra }));
    } catch (err) {
      console.error("Printimi nuk u regjistrua:", err);
    }
  };

  const produktiParapamjes = useMemo(() => {
    if (!produktet.length) return { name: "Emri i produktit", price: 2.99, barcode: "3800000000005", origin: "XK", discount: meZbritje ? 20 : null };
    return (meZbritje && produktet.find((p) => p.discount > 0)) || produktet[0];
  }, [produktet, meZbritje]);

  useEffect(() => {
    if (fontet === undefined || !opsionet.shablloni) return undefined;
    const t = setTimeout(() => {
      try {
        setParapamja(vizatoQmimoren([produktiParapamjes], { ...opsionet, vetemNjeEtikete: true }).output("blob"));
      } catch (err) {
        console.error("Parapamja dështoi:", err);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [fontet, produktiParapamjes, opsionet]);

  const gjeneroPdf = async () => {
    setPoGjenerohet(true);
    try {
      const g = await gjurmetEPunes(shablloniAktiv, opsionetEGjurmes, produktet);
      const krijo = async () => {
        const doc = vizatoQmimoren(produktetPerPrintim, { ...opsionet, shablloni: await pergatitImazhet(shablloniAktiv) });
        uRegjistrua.current = false;
        setPdf({
          blob: doc.output("blob"),
          filename: `${fletaAktive || "Qmimorja"} ${new Date().toISOString().slice(0, 10)}.pdf`,
          puna: { puna: g.puna, etiketat: g.etiketat, fleta: fletaAktive, shablloni: shabllonet[celesiAktiv]?.emri || "", numri: produktetPerPrintim.length },
        });
      };
      const rec = indeksi.sipasPunes.get(g.puna);
      if (rec) setKonfirmimi({ rec, vazhdo: krijo });
      else await krijo();
    } catch (err) {
      console.error("Gjenerimi i PDF-së dështoi:", err);
      mesazh("danger", "PDF-ja nuk u gjenerua.");
    } finally {
      setPoGjenerohet(false);
    }
  };

  /* ---------- Pamja: magjistar me hapa (si Migratori / Konfigurimi i FinanCare-s) ---------- */

  const kaEtiketa = produktetPerPrintim.length > 0 && Boolean(shablloniAktiv);
  const arsyeja = !produktetPerPrintim.length ? "Zgjidhni të paktën një produkt me çmim." : !shablloniAktiv ? "Zgjidhni një shabllon." : "";
  const parapamjaPamja = (
              <div className="ql-parapamja">
                <div className="ql-titulli-seksionit">Parapamja</div>
                <div className="ql-parapamja-kanvasi">
                  <PdfKanvasi blob={parapamja} gjeresia={600} emriKlases="ql-parapamja-faqe" />
                </div>
                <div className="ql-parapamja-info">
                  {shablloniAktiv ? (plani && !formati.veqmas ? `${shablloniAktiv.w} × ${shablloniAktiv.h} mm · ${plani.perFaqe} për fletë (${plani.orientimi === "l" ? "peisazh" : "portret"})` : pershkrimiLetres(shablloniAktiv)) : ""} · {produktetPerPrintim.length} etiketa · {Math.ceil(produktetPerPrintim.length / perFaqe) || 0} faqe
                  {fontet === null && <div className="mt-1 text-warning">Fonti nuk u ngarkua: etiketat dalin me Helvetica.</div>}
                </div>
              </div>
  );

  return (
    <div className="lb-printimi">
      <div className="lb-wizard">
        <aside className="lb-wizard-rail">
          <div className="lb-rail-titulli">
            <div className="lb-rail-ikona">
              <FontAwesomeIcon icon={faTags} />
            </div>
            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
              <span className="lb-eyebrow">Çmimorja</span>
              <h2 className="lb-rail-h2 text-truncate">Printimi i etiketave</h2>
            </div>
          </div>
          <div className="lb-stepper">
            {HAPAT.map(([emri, pershkrimi], i) => {
              const kryer = i < hapi;
              const mundet = i !== hapi && (i === 0 || kaEtiketa);
              return (
                <button key={emri} type="button" className={`lb-step${i === hapi ? " on" : ""}${kryer ? " done" : ""}`} disabled={!mundet} onClick={() => mundet && setHapi(i)}>
                  <span className="n">{kryer ? <FontAwesomeIcon icon={faCheck} /> : i + 1}</span>
                  <span className="txt">
                    <b>{emri}</b>
                    <span>{pershkrimi}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="lb-rail-foot">
            <span className="lb-rail-label">Burimi</span>
            <b className="text-truncate" title={skedari || ""}>
              {emriSkedarit || "Pa Excel"}
            </b>
            <span className="text-white-50 small text-truncate">
              Fleta "{fletaAktive}" · {produktetPerPrintim.length} etiketa
            </span>
            {shablloniAktiv && <span className="text-white-50 small text-truncate">{shabllonet[celesiAktiv]?.emri}</span>}
          </div>
        </aside>

        <div className="lb-wizard-main">
          <div className="lb-wizard-body">
            {hapi === 0 && (
              <>
      <div className="lb-excel">
        <FontAwesomeIcon icon={faFileExcel} className="text-success fs-4" />
        <div className="lb-excel-emri">
          {skedari ? (
            <>
              <div className="fw-semibold">{emriSkedarit}</div>
              <div className="text-white-50 small text-truncate">{eshteDesktop ? skedari : "Ruhet në këtë pajisje - zgjidheni përsëri pasi ta ndryshoni"}</div>
            </>
          ) : (
            <div className="text-white-50">Zgjidhni Excel-in me çmimet (p.sh. QmimePerRaft.xlsx).</div>
          )}
        </div>
        <input
          ref={inputiExcel}
          type="file"
          hidden
          accept=".xlsx,.xls,.xlsm,.ods,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          onChange={(e) => {
            hapSkedarinWeb(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button size="sm" className="btn-save" onClick={zgjidhSkedarin}>
          <FontAwesomeIcon icon={faFolderOpen} className="me-2" />
          {skedari ? "Ndrysho" : "Hap Excel-in"}
        </Button>
        <a className="btn btn-sm btn-cancel text-nowrap" href="/QmimePerRaft-bosh.xlsx" download="QmimePerRaft.xlsx" title="Shablloni i Excel-it pa produkte - plotësojeni dhe hapeni këtu">
          <FontAwesomeIcon icon={faDownload} className="me-2" />
          Excel bosh
        </a>
        <a className="btn btn-sm btn-cancel text-nowrap" href="/QmimePerRaft-shembuj.xlsx" download="QmimePerRaft-shembuj.xlsx" title="Shablloni i Excel-it me produkte shembull në çdo fletë">
          <FontAwesomeIcon icon={faDownload} className="me-2" />
          Me shembuj
        </a>
        {(skedari || kaShtuaraOseNdryshime) && (
          <Button variant="secondary" size="sm" className="btn-cancel text-nowrap" title="Mbyll Excel-in dhe fshi produktet e shtuara e ndryshimet - si në fillim (skedari në disk s'preket)" onClick={() => setPastrimi(true)}>
            <FontAwesomeIcon icon={faEraser} className="me-2" />
            Pastro
          </Button>
        )}
        {skedari && eshteDesktop && (
          <>
            <Button variant="secondary" size="sm" className="btn-cancel" title="Rilexo (pasi e keni ruajtur në Excel)" onClick={() => lexoSkedarin(skedari)}>
              <FontAwesomeIcon icon={faArrowsRotate} />
            </Button>
            <Button variant="secondary" size="sm" className="btn-cancel" title="Hape në Excel për ta ndryshuar" onClick={() => window.labels.hapExcel(skedari)}>
              <FontAwesomeIcon icon={faPenToSquare} className="me-2" />
              Ndrysho në Excel
            </Button>
          </>
        )}
      </div>
      {poLexohet && (
        <div className="text-white-50 small my-3">
          <Spinner size="sm" animation="border" className="me-2" /> Duke lexuar Excel-in...
        </div>
      )}
      {gabimiExcel && <div className="ql-shenim my-3">{gabimiExcel}</div>}
          <div className="ql-chips my-3" role="tablist">
            {fletet.map((f) => (
              <button
                key={f.emri}
                type="button"
                role="tab"
                aria-selected={f.emri === fletaAktive}
                className={`ql-chip${f.emri === fletaAktive ? " aktiv" : ""}`}
                onClick={() => {
                  setFletaAktive(f.emri);
                  setTabi("");
                  setNenTabi("");
                  setKerkimi("");
                }}
              >
                {f.eMia && <FontAwesomeIcon icon={faPlus} className="me-1" />}
                {f.emri}
                <span className="text-white-50 ms-2">{f.produktet.filter((p) => !p.gabim).length + (teShtuarat[f.emri]?.length || 0)}</span>
              </button>
            ))}
          </div>
          {fleta && !fleta.eMia && (
            <div className={`ql-shenim ${fleta.titujt && fleta.titujt.menyra !== "permbajtja" ? "ql-shenim--info" : ""} d-flex justify-content-between align-items-center gap-2 mb-3`}>
              <span className="small">
                {!fleta.titujt ? (
                  <>Kolonat e fletës "{fleta.emri}" nuk u njohën (s'ka emër dhe çmim). Lidhini vetë - lidhja ruhet për herët e tjera.</>
                ) : (
                  <>
                    {fleta.titujt.menyra === "permbajtja"
                      ? "Pa tituj të njohur - kolonat u gjetën sipas përmbajtjes, kontrollojini: "
                      : fleta.titujt.menyra === "dore"
                        ? "Kolonat sipas lidhjes suaj: "
                        : "Kolonat u njohën: "}
                    {FUSHAT.filter((f) => fleta.titujt.kolonat[f.key] !== undefined && f.key !== "kaZbritje")
                      .map((f) => {
                        const k = fleta.titujt.kolonat[f.key];
                        const titulli = fleta.titujt.rreshti != null ? fleta.mostra[fleta.titujt.rreshti]?.[k] : "";
                        return `${f.emri} ← ${shkronjaEKolones(fleta.kolonaEPare + k)}${titulli ? ` "${titulli}"` : ""}`;
                      })
                      .join(" · ")}
                  </>
                )}
              </span>
              <Button size="sm" variant="secondary" className={fleta.titujt ? "btn-cancel text-nowrap" : "btn-save text-nowrap"} onClick={() => setLidhja(fleta)}>
                <FontAwesomeIcon icon={faTableColumns} className="me-2" />
                Lidh kolonat
              </Button>
            </div>
          )}
              <div className="ql-seksioni">
                <div className="ql-titulli-seksionit d-flex justify-content-between align-items-center gap-2">
                  <span>
                    Produktet e fletës "{fletaAktive}" · <Badge bg="primary">{produktetPerPrintim.length}</Badge> etiketa për printim
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control size="sm" style={{ maxWidth: 180 }} placeholder="Kërko..." value={kerkimi} onChange={(e) => setKerkimi(e.target.value)} />
                    <Button size="sm" variant="secondary" className={redaktim ? "btn-cancel lb-aktiv" : "btn-cancel"} title="Ndrysho produktet këtu (vetëm për printim - Excel-i s'preket)" onClick={() => setRedaktim((r) => !r)}>
                      <FontAwesomeIcon icon={faPen} className="me-1" />
                      {redaktim ? "Mbaro" : "Ndrysho"}
                    </Button>
                    <Button variant="secondary" size="sm" className="btn-cancel text-nowrap" title="Shto një produkt që s'është në Excel" onClick={shtoProdukt}>
                      <FontAwesomeIcon icon={faPlus} className="me-1" />
                      Shto produkt
                    </Button>
                  </div>
                </div>
                {numriINdryshimeve > 0 && (
                  <div className="ql-shenim ql-shenim--info d-flex justify-content-between align-items-center gap-2 mb-2">
                    <span>
                      {numriINdryshimeve} produkte të ndryshuara ose të shtuara këtu - vlejnë vetëm për printim, Excel-i mbetet siç është.
                    </span>
                    <button type="button" className="btn btn-link p-0 text-info lb-lidhje text-nowrap" onClick={hiqTeGjithaNdryshimet}>
                      Rikthe si në Excel
                    </button>
                  </div>
                )}
                <div className="sp-table-container custom-scrollbar" style={{ maxHeight: "calc(100vh - 330px)", minHeight: 240, overflowY: "auto" }}>
                  <Table hover variant="dark" size="sm" className="sp-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}>
                          <Form.Check
                            type="checkbox"
                            title="Zgjidh / hiq të gjitha"
                            checked={teDukshmit.length > 0 && teDukshmit.every((p) => p.gabim || !teHequrat_.has(p.nr))}
                            onChange={(e) => zgjidhTeGjitha(e.target.checked)}
                          />
                        </th>
                        <th className="text-center" style={{ width: 76 }} title="Sa etiketa të printohen për këtë produkt">
                          Kopje
                        </th>
                        <th>Rr.</th>
                        <th>Shifra</th>
                        <th>Produkti</th>
                        <th>Barkodi</th>
                        <th>Origjina</th>
                        <th className="text-end">Çmimi</th>
                        <th className="text-end">Zbritja</th>
                        <th className="text-end">Çmimi i ri</th>
                        <th style={{ width: 52 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {teDukshmit.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-white-50 py-4">
                            {fleta?.eMia ? 'Shtoni produkte direkt me "Shto produkt" - ruhen në program, pa Excel.' : "Fleta nuk ka produkte."}
                          </td>
                        </tr>
                      ) : (
                        teDukshmit.map((p) => (
                          <tr key={p.nr} className={`${p.gabim && !redaktim ? "opacity-50" : ""}${p.ndryshuar ? " lb-ndryshuar" : ""}`} title={p.gabim || undefined}>
                            <td>
                              <Form.Check type="checkbox" disabled={Boolean(p.gabim)} checked={!p.gabim && !teHequrat_.has(p.nr)} onChange={(e) => ndryshoZgjedhjen(p.nr, e.target.checked)} />
                            </td>
                            <td>
                              <Form.Control
                                size="sm"
                                type="number"
                                min={1}
                                max={MAKS_KOPJE}
                                className="lb-qeliza text-center"
                                style={{ width: 64 }}
                                title="Sa etiketa të printohen për këtë produkt"
                                disabled={Boolean(p.gabim) || teHequrat_.has(p.nr)}
                                value={kopjetEFletes[p.nr] ?? String(p.kopje || 1)}
                                onChange={(e) => ndryshoKopjet(p.nr, e.target.value)}
                                onBlur={(e) => e.target.value === "" && ndryshoKopjet(p.nr, "1")}
                              />
                            </td>
                            <td className="text-white-50">{p.iShtuar ? "+" : p.nr}</td>
                            {redaktim ? (
                              <>
                                <td>
                                  <Qeliza gjeresia={70} vlera={fusha(p, "code", p.code)} onNdrysho={(v) => ndryshoFushen(p, "code", v)} />
                                </td>
                                <td>
                                  <Qeliza gjeresia={210} vlera={fusha(p, "name", p.name)} placeholder="Emri i produktit" maxLength={120} onNdrysho={(v) => ndryshoFushen(p, "name", v)} />
                                </td>
                                <td>
                                  <Qeliza gjeresia={135} vlera={fusha(p, "barcode", p.barcode)} maxLength={30} onNdrysho={(v) => ndryshoFushen(p, "barcode", v)} />
                                </td>
                                <td>
                                  <Form.Select
                                    size="sm"
                                    className="lb-qeliza"
                                    style={{ width: 140 }}
                                    title="Automatike = nga prefiksi i barkodit"
                                    value={fusha(p, "origjina", p.origjinaMeDore ? p.origin : "")}
                                    onChange={(e) => ndryshoFushen(p, "origjina", e.target.value)}
                                  >
                                    <option value="">Automatike{!p.origjinaMeDore && p.origin ? ` (${emriShtetit(p.origin)})` : ""}</option>
                                    {origjinat.map((g) => (
                                      <optgroup key={g.label} label={g.label}>
                                        {g.options.map((o) => (
                                          <option key={o.value} value={o.value}>
                                            {o.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </Form.Select>
                                </td>
                                <td>
                                  <Qeliza numer gjeresia={80} className="lb-qeliza text-end" vlera={fusha(p, "qmimi", teksti(p.price))} placeholder="0.00" onNdrysho={(v) => ndryshoFushen(p, "qmimi", v)} />
                                </td>
                                <td className="text-end">{p.discount > 0 ? <span className="badge bg-danger">-{p.discount}%</span> : <span className="text-white-50">-</span>}</td>
                                <td>
                                  <Qeliza
                                    numer
                                    gjeresia={80}
                                    className="lb-qeliza text-end"
                                    vlera={fusha(p, "qmimiRi", teksti(p.qmimiPasZbritjes))}
                                    placeholder="pa zbritje"
                                    title="Çmimi me zbritje - kur është më i ulët se çmimi, etiketa del me zbritje"
                                    onNdrysho={(v) => ndryshoFushen(p, "qmimiRi", v)}
                                  />
                                </td>
                                <td>{veprimetERreshtit(p)}</td>
                              </>
                            ) : (
                              <>
                            {qelizaPrek(p, "code", p.code, p.code || <span className="lb-bosh">-</span>, { gjeresia: 80, tdKlasa: "text-white-50" })}
                            {qelizaPrek(p, "name", p.name, p.name || <span className="lb-bosh">Emri i produktit</span>, { gjeresia: 260, tdKlasa: "fw-semibold" })}
                            {qelizaPrek(p, "barcode", p.barcode, p.barcode ? <code className="text-info">{p.barcode}</code> : <span className="lb-bosh">-</span>, { gjeresia: 150 })}
                            <td
                              className="text-nowrap lb-prek"
                              title={eshteAktive(p, "origjina") ? undefined : "Kliko për ta ndryshuar"}
                              onClick={() => !eshteAktive(p, "origjina") && hapQelizen(p, "origjina", fusha(p, "origjina", p.origjinaMeDore ? p.origin : ""))}
                            >
                              {eshteAktive(p, "origjina") ? (
                                <Form.Select
                                  autoFocus
                                  size="sm"
                                  className="lb-qeliza"
                                  style={{ width: 160 }}
                                  value={fusha(p, "origjina", p.origjinaMeDore ? p.origin : "")}
                                  onChange={(e) => {
                                    ndryshoFushen(p, "origjina", e.target.value);
                                    mbyllQelizen();
                                  }}
                                  onBlur={mbyllQelizen}
                                  onKeyDown={tastetEQelizes(p)}
                                >
                                  {opsionetEOrigjinesPer(p)}
                                </Form.Select>
                              ) : p.origin ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  {flamujt[p.origin] && <img src={flamuriSiDataUrl(flamujt[p.origin])} alt="" width={20} height={13} style={{ borderRadius: 2 }} />}
                                  {emriShtetit(p.origin)}
                                </span>
                              ) : (
                                <span className="lb-bosh">-</span>
                              )}
                            </td>
                            {qelizaPrek(
                              p,
                              "qmimi",
                              teksti(p.price),
                              <span className={p.discount > 0 ? "text-decoration-line-through text-white-50" : p.gabim ? "lb-bosh" : "text-success fw-bold"}>{p.gabim || euro(p.price)}</span>,
                              { numer: true, gjeresia: 90, klasa: "text-end", tdKlasa: "text-end text-nowrap" }
                            )}
                            <td className="text-end">{p.discount > 0 ? <span className="badge bg-danger">-{p.discount}%</span> : <span className="text-white-50">-</span>}</td>
                            {qelizaPrek(
                              p,
                              "qmimiRi",
                              teksti(p.qmimiPasZbritjes),
                              p.discount > 0 ? <span className="text-success fw-bold">{euro(p.qmimiPasZbritjes)}</span> : <span className="lb-bosh">+ zbritje</span>,
                              { numer: true, gjeresia: 90, klasa: "text-end", tdKlasa: "text-end text-nowrap" }
                            )}
                            <td>{veprimetERreshtit(p)}</td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
                <div className="small text-white-50 mt-2">
                  Kliko një qelizë (shifra, emri, barkodi, origjina, çmimet) për ta ndryshuar direkt · Enter ruan, Esc anulon. Ndryshimet vlejnë vetëm për
                  printim - Excel-i s'preket.
                </div>
              </div>
              </>
            )}

            {hapi === 1 && (
              <Row className="g-4">
                <Col xl={7}>
              <div className="ql-seksioni">
                <div className="ql-titulli-seksionit d-flex justify-content-between align-items-center">
                  <span>Dizajni i etiketave</span>
                  <button type="button" className="btn btn-link p-0 text-info lb-lidhje" onClick={hapEditorin}>
                    Krijo shabllonin tuaj
                  </button>
                </div>
                <div className="ql-chips mb-2" role="tablist">
                  {tabet.map((t) => (
                    <button
                      key={t.celesi}
                      type="button"
                      role="tab"
                      aria-selected={tabiAktiv?.celesi === t.celesi}
                      className={`ql-chip ql-chip--vogel${tabiAktiv?.celesi === t.celesi ? " aktiv" : ""}`}
                      onClick={() => {
                        setTabi(t.celesi);
                        setNenTabi("");
                      }}
                    >
                      {t.emri}
                      <span className="text-white-50 ms-1">{t.celesat.length}</span>
                    </button>
                  ))}
                </div>
                {nenkategorite.length > 0 && (
                  <div className="ql-chips mb-2" role="tablist">
                    {["", ...nenkategorite].map((n) => (
                      <button key={n || "te-gjitha"} type="button" className={`ql-chip ql-chip--vogel${nenTabi === n ? " aktiv" : ""}`} onClick={() => setNenTabi(n)}>
                        {n || "Të gjitha"}
                      </button>
                    ))}
                  </div>
                )}
                <div className="ql-dizajnet lb-dizajnet">
                  {celesatETabit.map((c) => (
                    <button key={c} type="button" className={`ql-zgjedhja${c === celesiAktiv ? " aktiv" : ""}`} onClick={() => zgjidhShabllonin(c)}>
                      <SkicaShabllonit shablloni={shabllonet[c].shablloni} />
                      <div>
                        <div className="ql-zgjedhja-emri">{shabllonet[c].emri}</div>
                        <div className="ql-zgjedhja-pershkrimi">{shabllonet[c].pershkrimi}</div>
                      </div>
                    </button>
                  ))}
                  {tabiAktiv?.celesi === TE_MIAT && tabiAktiv.celesat.length === 0 && (
                    <div className="text-white-50 small py-2">Ende asnjë shabllon i juaji. Krijoni një te "Editori".</div>
                  )}
                </div>
              </div>
                </Col>
                <Col xl={5}>{parapamjaPamja}</Col>
              </Row>
            )}

            {hapi === 2 && (
              <Row className="g-4">
                <Col xl={7}>
              <div className="ql-seksioni">
                <div className="ql-titulli-seksionit">Opsionet</div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="ql-chips">
                    {[
                      ["centet", <>39<sup>93</sup> €</>],
                      ["dhjetore", "39.93 €"],
                    ].map(([celesi, shembulli]) => (
                      <button key={celesi} type="button" className={`ql-chip ql-chip--vogel${opsionet.stiliQmimit === celesi ? " aktiv" : ""}`} onClick={() => ndryshoCilesimet({ stiliQmimit: celesi })}>
                        {shembulli}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lb-celesat mt-3">
                  {[
                    ["shfaqBarkodin", "Barkodi", "Vijat dhe numri i barkodit"],
                    ["shfaqEuro", "Simboli €", "Pa €, çmimi del më i madh"],
                    ["shfaqFlamurin", "Flamuri", "Flamuri i shtetit të origjinës"],
                    ["shfaqShtetin", "Shteti", "Emri i shtetit të origjinës (p.sh. Holandë)"],
                    ["zmadhoNeVendinELire", "Zmadho çmimin në vendin e lirë", "Kur fikni barkodin, flamurin ose shtetin, çmimi dhe emri zënë vendin e tyre"],
                  ].map(([celesi, emri, shpjegimi]) => (
                    <Form.Check
                      key={celesi}
                      type="switch"
                      id={`lb-${celesi}`}
                      className="small mb-0"
                      title={shpjegimi}
                      label={emri}
                      checked={opsionet[celesi]}
                      onChange={(e) => ndryshoCilesimet({ [celesi]: e.target.checked })}
                    />
                  ))}
                  {!formati.veqmas && (
                    <Form.Select
                      size="sm"
                      style={{ width: "auto" }}
                      title="Vijat e zeza rreth etiketave, për prerje me gërshërë"
                      value={opsionet.vijatEPrerjes == null ? "" : opsionet.vijatEPrerjes ? "po" : "jo"}
                      onChange={(e) => ndryshoCilesimet({ vijatEPrerjes: e.target.value === "" ? null : e.target.value === "po" })}
                    >
                      <option value="">Vijat e prerjes: sipas shabllonit</option>
                      <option value="po">Vijat e prerjes: po</option>
                      <option value="jo">Vijat e prerjes: jo</option>
                    </Form.Select>
                  )}
                </div>
                <div>
                  {!formati.veqmas && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span className="small text-white-50">Orientimi i fletës:</span>
                      <Form.Select size="sm" style={{ width: "auto" }} value={rregullimi.orientimi || "auto"} onChange={(e) => ndryshoRregullimin({ orientimi: e.target.value })}>
                        <option value="auto">Automatik (më shumë etiketa)</option>
                        <option value="portret">Portret</option>
                        <option value="peisazh">Peisazh</option>
                      </Form.Select>
                      {/* Rregullimet e fletës ruhen për këtë shabllon; pa ndryshime vlen parazgjedhja e tij. */}
                      {ndryshimetERregullimit ? (
                        <button type="button" className="ql-chip ql-chip--vogel" title="Hapësirat, margjina dhe orientimi të parazgjedhura për këtë shabllon (sa më shumë etiketa në A4)" onClick={riktheRregullimin}>
                          Rikthe parazgjedhjen e shabllonit
                        </button>
                      ) : (
                        <span className="small text-white-50">parazgjedhja e shabllonit</span>
                      )}
                    </div>
                  )}
                </div>
                {plani && !formati.veqmas && Math.min(plani.anash, plani.lartPoshte) < 4 && (
                  <div className="ql-shenim small mt-2">
                    Etiketat dalin {Math.min(plani.anash, plani.lartPoshte).toFixed(1)} mm nga skaji i letrës. Shumica e printerave s'printojnë 3-5 mm te
                    skaji, ndaj rreshti/kolona e skajit mund të pritet: zgjidhni margjinë 4-5 mm, ose kalibroni printerin te Cilësimet → Printeri.
                  </div>
                )}
                {meDate && (
                  <Form.Control className="mt-2" size="sm" value={data} maxLength={60} placeholder="Periudha e ofertës, p.sh. 01.10 – 07.10.2026" onChange={(e) => setData(e.target.value)} />
                )}
                {!formati.veqmas && (
                  <div className="mt-2">
                    {[
                      ["hapesiraH", "Hapësira horizontale", "mes kolonave"],
                      ["hapesiraV", "Hapësira vertikale", "mes rreshtave"],
                      ["margjina", "Margjina minimale", "nga skaji i letrës", MARGJINAT],
                    ].map(([celesi, emri, shpjegimi, vlerat]) => (
                      <div key={celesi} className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="small text-white-50" style={{ minWidth: 150 }} title={shpjegimi}>
                          {emri}:
                        </span>
                        <div className="ql-chips">
                          {(vlerat || HAPESIRAT).map((mm) => (
                            <button
                              key={mm}
                              type="button"
                              title={
                                celesi === "margjina"
                                  ? mm
                                    ? `Të paktën ${mm} mm ${shpjegimi} në çdo anë - zgjidhet orientimi me më shumë etiketa dhe rrjeta vihet në mes`
                                    : "Etiketat mund të shkojnë deri në skaj të letrës - nxë më shumë, por shumica e printerave s'printojnë 3-4 mm te skaji"
                                  : mm
                                    ? `${mm} mm bosh ${shpjegimi} - çdo etiketë mbetet me përmasat e veta`
                                    : `Etiketat ngjitur ${shpjegimi}`
                              }
                              className={`ql-chip ql-chip--vogel${opsionet[celesi] === mm ? " aktiv" : ""}`}
                              onClick={() => ndryshoRregullimin({ [celesi]: mm })}
                            >
                              {mm ? `${mm} mm` : celesi === "margjina" ? "Pa margjina" : "Pa hapësirë"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                </Col>
                <Col xl={5}>{parapamjaPamja}</Col>
              </Row>
            )}

            {hapi === 3 && (
              <Row className="g-4">
                <Col xl={7}>
                  <div className="ql-seksioni">
                    <div className="ql-titulli-seksionit">Përmbledhja</div>
                    <dl className="lb-permbledhja">
                      <dt>Fleta</dt>
                      <dd>{fletaAktive}</dd>
                      <dt>Etiketa</dt>
                      <dd>
                        {produktetPerPrintim.length}
                        {produktetPerPrintim.length !== produktet.length ? ` (${produktet.length} produkte, me kopjet)` : ""}
                      </dd>
                      <dt>Shablloni</dt>
                      <dd>{shabllonet[celesiAktiv]?.emri || "-"}</dd>
                      <dt>Letra</dt>
                      <dd>
                        {shablloniAktiv && plani && !formati.veqmas
                          ? `${shablloniAktiv.w} × ${shablloniAktiv.h} mm · ${plani.perFaqe} për fletë A4 (${plani.orientimi === "l" ? "peisazh" : "portret"})`
                          : shablloniAktiv
                            ? pershkrimiLetres(shablloniAktiv)
                            : "-"}
                      </dd>
                      <dt>Faqe</dt>
                      <dd>{Math.ceil(produktetPerPrintim.length / perFaqe) || 0}</dd>
                      <dt>Çmimi</dt>
                      <dd>
                        {opsionet.stiliQmimit === "dhjetore" ? "39.93" : "39⁹³"} · {opsionet.shfaqEuro ? "me €" : "pa €"} ·{" "}
                        {opsionet.shfaqBarkodin ? "me barkod" : "pa barkod"} · {opsionet.shfaqFlamurin ? "me flamur" : "pa flamur"} ·{" "}
                        {opsionet.shfaqShtetin ? "me shtet" : "pa shtet"}
                      </dd>
                      {!formati.veqmas && (
                        <>
                          <dt>Hapësirat</dt>
                          <dd>
                            {opsionet.hapesiraH} mm horizontale · {opsionet.hapesiraV} mm vertikale · margjina min. {opsionet.margjina} mm
                            {plani && ` (reale: ${plani.anash.toFixed(1)} mm anash, ${plani.lartPoshte.toFixed(1)} mm lart/poshtë)`}
                          </dd>
                        </>
                      )}
                    </dl>
                {teprinturat.length > 0 && (
                  <div className="ql-shenim mt-2 d-flex justify-content-between align-items-center gap-2">
                    <span>
                      <FontAwesomeIcon icon={faClockRotateLeft} className="me-2" />
                      {teprinturat.length === produktet.length ? "Të gjitha" : `${teprinturat.length} nga ${produktet.length}`} etiketat janë
                      printuar njësoj më parë{iFundit ? ` (e fundit ${dataShqip(iFundit.koha)}, "${iFundit.fleta}")` : ""}.
                    </span>
                    {teprinturat.length < produktet.length && (
                      <button type="button" className="btn btn-link p-0 text-info lb-lidhje text-nowrap" onClick={hiqTePrinturat}>
                        Hiqi nga printimi
                      </button>
                    )}
                  </div>
                )}
                {meZbritje && (
                  <div className="text-white-50 small mt-2">
                    {numriMeZbritje > 0
                      ? `${numriMeZbritje} nga ${produktet.length} produkte kanë zbritje (çmimi i ri më i ulët se i rregullti).`
                      : "Asnjë produkt i kësaj flete s'ka zbritje: etiketat dalin me çmimin e rregullt."}
                  </div>
                )}
                  </div>
                </Col>
                <Col xl={5}>{parapamjaPamja}</Col>
              </Row>
            )}
          </div>

          <div className="lb-wizard-foot">
            <Button variant="secondary" className="btn-cancel" disabled={hapi === 0} onClick={() => setHapi((h) => Math.max(0, h - 1))}>
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Mbrapa
            </Button>
            {arsyeja && <span className="text-white-50 small">{arsyeja}</span>}
            <div className="ms-auto">
              {hapi < HAPAT.length - 1 ? (
                <Button className="btn-save px-4" disabled={!kaEtiketa} onClick={() => setHapi((h) => h + 1)}>
                  {["Vazhdo te dizajni", "Vazhdo te opsionet", "Vazhdo te printimi"][hapi]}
                  <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              ) : (
              <Button className="btn-save px-4" disabled={!produktet.length || poGjenerohet || !shablloniAktiv} onClick={gjeneroPdf}>
                {poGjenerohet ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faFilePdf} className="me-2" />}
                Gjenero çmimoren ({produktetPerPrintim.length})
              </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <LidhKolonat
        fleta={lidhja}
        kaHarteTeRuajtur={lidhja?.titujt?.menyra === "dore"}
        onRuaj={ruajLidhjen}
        onHiq={() => hiqLidhjen(lidhja)}
        onHide={() => setLidhja(null)}
      />

      <PdfPamja pdf={pdf} kalibrimet={cilesimet.kalibrimet} titulli={`Çmimorja · ${fletaAktive}`} onHide={() => setPdf(null)} onMesazh={mesazh} onUKrye={regjistro} />

      <Modal show={pastrimi} onHide={() => setPastrimi(false)} centered className="sp-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEraser} className="me-2 text-warning" />
            Të pastrohet gjithçka?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            Aplikacioni kthehet si në fillim, pa Excel{skedari ? <> - mbyllet <strong>{emriSkedarit}</strong></> : ""}.
            {kaShtuaraOseNdryshime && <> Produktet e shtuara këtu, ndryshimet dhe kopjet <strong>fshihen</strong>.</>}
          </p>
          <div className="text-white-50 small">Skedari i Excel-it në disk s'preket - e hapni përsëri kur të doni.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="btn-cancel px-4" onClick={() => setPastrimi(false)}>
            Anulo
          </Button>
          <Button className="btn-save px-4" onClick={pastroGjithcka}>
            <FontAwesomeIcon icon={faEraser} className="me-2" />
            Pastro
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(konfirmimi)} onHide={() => setKonfirmimi(null)} centered className="sp-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faClockRotateLeft} className="me-2 text-warning" />
            E njëjta çmimore është printuar më parë
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {konfirmimi && (
            <>
              <p className="mb-2">
                Këto {konfirmimi.rec.numri} etiketa - i njëjti shabllon, të njëjtat çmime dhe produkte - janë{" "}
                {konfirmimi.rec.menyra === "printim" ? "printuar" : "nxjerrë si PDF"} më <strong>{dataShqip(konfirmimi.rec.koha)}</strong>.
              </p>
              <div className="text-white-50 small">
                Fleta "{konfirmimi.rec.fleta}" · shablloni "{konfirmimi.rec.shablloni}". Të printohen përsëri?
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="btn-cancel px-4" onClick={() => setKonfirmimi(null)}>
            Anulo
          </Button>
          <Button
            className="btn-save px-4"
            onClick={async () => {
              const { vazhdo } = konfirmimi;
              setKonfirmimi(null);
              try {
                await vazhdo();
              } catch (err) {
                console.error("Gjenerimi i PDF-së dështoi:", err);
                mesazh("danger", "PDF-ja nuk u gjenerua.");
              }
            }}
          >
            OK, printo përsëri
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
