import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Form, Modal, ProgressBar, Spinner, Toast, ToastContainer } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faBookOpen, faCircleDown, faDesktop, faXmark, faFileImport, faFolderOpen, faGear, faGift, faMoon, faPenRuler, faPrint, faSun } from "@fortawesome/free-solid-svg-icons";
import { Analytics } from "@vercel/analytics/react";
import Printimi from "./Printimi";
import ShiritiITitullit from "./components/ShiritiITitullit";
// Editori dhe Udhëzuesi ngarkohen kur hapen: hapja e programit lexon vetëm Printimin.
const Editori = lazy(() => import("./Editori"));
const Udhezuesi = lazy(() => import("./Udhezuesi"));
import Cilesimet from "./components/Cilesimet";
import { NDRYSHIMET, krahasoVersionet, ndryshimetMes } from "./lib/ndryshimet";
import { eshteCelular } from "./lib/shfletuesi";
import { eshteDesktop, lexoCilesimet, ruajCilesimet } from "./lib/ruajtja";

const FAQET = [
  ["printimi", "Printimi", faPrint],
  ["editori", "Editori i shablloneve", faPenRuler],
  ["udhezuesi", "Udhëzuesi", faBookOpen],
  ["cilesimet", "Cilësimet", faGear],
];

// eslint-disable-next-line no-undef
const VERSIONI = typeof __VERSIONI__ === "string" ? __VERSIONI__ : "";
const EXCEL_RE = /\.(xlsx|xlsm|xls|ods|csv)$/i;
const SHABLLON_RE = /\.json$/i;
const madhesia = (b) => `${(b / 1024 / 1024).toFixed(0)} MB`;

// Versioni në shfletues e fton përdoruesin te aplikacioni për Windows (Setup / Portable te GitHub Releases).
const SHKARKIMI_DESKTOP = "https://github.com/rilindkycyku/FinanCareLabels/releases/latest";
const PERPARESITE_E_DESKTOPIT = "printim direkt te printeri i zgjedhur me kalibrim të plotë, Excel-i që rilexohet vetë pasi e ruani, dhe punon pa shfletues";
const CELESI_I_NJOFTIMIT = "financare-labels:desktop-njoftimi-hequr";
const njoftimiIHequr = () => {
  try {
    return localStorage.getItem(CELESI_I_NJOFTIMIT) === "1";
  } catch {
    return false;
  }
};

export default function App() {
  const [faqja, setFaqja] = useState("printimi");
  const [cilesimet, setCilesimet] = useState(null);
  const [toast, setToast] = useState(null);
  const [dosja, setDosja] = useState("");
  const [menyra, setMenyra] = useState(""); // "portabel" | "instaluar" | "zhvillim"
  const [largimi, setLargimi] = useState(null); // faqja ku do të shkohet pas konfirmimit
  const editoriNdryshuar = useRef(false);
  // Shablloni .qmimore.json i lëshuar në dritare, për importin te Editori.
  const [shablloniILeshuar, setShablloniILeshuar] = useState(null);
  // Shfletuesi: Excel-i i lëshuar në dritare (s'ka shteg skedari) shkon te Printimi si File.
  const [excelILeshuar, setExcelILeshuar] = useState(null);
  const [mbiDritare, setMbiDritare] = useState(false);
  const [hapjaEPare, setHapjaEPare] = useState(false); // konfigurimi i parë (Cilësimet si magjistar, mund të kalohet)
  const [ndryshimet, setNdryshimet] = useState(null); // lista e versioneve për "Çka ka të re"
  // Përditësimi: { versioni, shenimet, madhesia, vetvetiu, gjendja: "gati" | "shkarkim" | "shkarkuar" | "gabim", progresi, gabimi }
  const [perditesimi, setPerditesimi] = useState(null);
  const [kontrolli, setKontrolli] = useState(""); // "" | "duke" | teksti i rezultatit (Cilësimet)
  // Shfletuesi në kompjuter: njoftimi "Shkarko për Windows" (fshihet me ×, mbahet mend në këtë pajisje).
  const [njoftimiDesktop, setNjoftimiDesktop] = useState(() => !eshteDesktop && !eshteCelular() && !njoftimiIHequr());
  const hiqNjoftimin = () => {
    setNjoftimiDesktop(false);
    try {
      localStorage.setItem(CELESI_I_NJOFTIMIT, "1");
    } catch {
      /* s'ka rëndësi */
    }
  };

  useEffect(() => {
    lexoCilesimet().then(setCilesimet);
    if (eshteDesktop) {
      window.labels.dosjaETeDhenave().then(setDosja);
      window.labels.menyra().then(setMenyra).catch(() => {});
    }
  }, []);

  // Tema e çelët është parazgjedhja; "light-mode" vendoset te <html> dhe <body> si te FinanCare
  const tema = cilesimet?.tema === "dark" ? "dark" : "light";
  useEffect(() => {
    for (const el of [document.documentElement, document.body]) el.classList.toggle("light-mode", tema === "light");
  }, [tema]);

  const mesazh = useCallback((tipi, teksti) => setToast({ tipi, teksti, id: Date.now() }), []);

  /* ---------- Çka ka të re: pas çdo përditësimi ---------- */
  const uKontrolluaVersioni = useRef(false);
  useEffect(() => {
    if (!cilesimet || uKontrolluaVersioni.current || !VERSIONI) return;
    uKontrolluaVersioni.current = true;
    // Para 1.0.2 versioni s'ruhej: cilësimet ekzistuese = përdorues i 1.0.1 që sapo përditësoi.
    const kaPerdorur = cilesimet.emriBiznesit || cilesimet.skedariExcel || Object.keys(cilesimet.shabllonetSipasFletes || {}).length;
    const iFundit = cilesimet.versioniIFundit || (kaPerdorur ? "1.0.1" : "");
    // Hapja e parë fare: programi hapet te Cilësimet si konfigurim (Biznesi, Pamja, Printeri...), që mund të kalohet.
    if (!iFundit) {
      setHapjaEPare(true);
      setFaqja("cilesimet");
    }
    if (iFundit !== VERSIONI) {
      // Hapja e parë fare s'ka "të reja"; pas përditësimit shfaqen versionet që s'janë parë.
      if (iFundit && krahasoVersionet(VERSIONI, iFundit) > 0) setNdryshimet(ndryshimetMes(iFundit, VERSIONI));
      ndryshoCilesimet({ versioniIFundit: VERSIONI });
    }
  }, [cilesimet]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Përditësimi automatik (GitHub Releases) ---------- */
  const apiP = eshteDesktop ? window.labels.perditesimi : null;
  const kontrollo = useCallback(
    async (meDore = false) => {
      if (!apiP) return;
      if (meDore) setKontrolli("duke");
      try {
        const r = await apiP.kontrollo();
        if (r.iRi) {
          setPerditesimi((p) => (p && p.versioni === r.versioni ? p : { versioni: r.versioni, shenimet: r.shenimet, madhesia: r.madhesia, vetvetiu: r.vetvetiu, gjendja: "gati" }));
          if (meDore) setKontrolli(`Versioni ${r.versioni} është gati - shihni njoftimin lart.`);
        } else if (meDore) setKontrolli(`Keni versionin më të ri (${r.aktual}).`);
      } catch (err) {
        if (meDore) setKontrolli(`Kontrolli s'u bë (pa internet?): ${err?.message || err}`);
      }
    },
    [apiP]
  );
  const kontrolloAuto = cilesimet?.kontrolloPerditesimet !== false;
  useEffect(() => {
    if (!apiP || !cilesimet || !kontrolloAuto) return undefined;
    const t = setTimeout(() => kontrollo(false), 6000);
    const i = setInterval(() => kontrollo(false), 6 * 60 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [apiP, Boolean(cilesimet), kontrolloAuto, kontrollo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => apiP?.neProgres((v) => setPerditesimi((p) => (p ? { ...p, progresi: v } : p))), [apiP]);
  const shkarko = async () => {
    setPerditesimi((p) => ({ ...p, gjendja: "shkarkim", progresi: null, gabimi: "" }));
    try {
      const r = await apiP.shkarko();
      if (r?.hapurFaqja) setPerditesimi(null);
      else setPerditesimi((p) => ({ ...p, gjendja: "shkarkuar" }));
    } catch (err) {
      setPerditesimi((p) => ({ ...p, gjendja: "gabim", gabimi: err?.message || String(err) }));
    }
  };
  const instalo = async () => {
    if (faqja === "editori" && editoriNdryshuar.current) {
      mesazh("danger", "Ruani shabllonin në editor para përditësimit.");
      return;
    }
    const ok = await apiP.instalo();
    if (!ok) mesazh("danger", "Përditësimi s'u nis. Mbyllni programin dhe hapeni përsëri.");
  };

  /* ---------- Tërhiq dhe lësho: Excel-i / CSV-ja hapet, shablloni importohet ---------- */
  useEffect(() => {
    let thellesia = 0;
    const kaSkedare = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const hyn = (e) => {
      if (!kaSkedare(e)) return;
      e.preventDefault();
      thellesia++;
      setMbiDritare(true);
    };
    const del = (e) => {
      if (!kaSkedare(e)) return;
      thellesia = Math.max(0, thellesia - 1);
      if (!thellesia) setMbiDritare(false);
    };
    const siper = (e) => {
      if (!kaSkedare(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    const leshim = (e) => {
      if (!kaSkedare(e)) return;
      e.preventDefault();
      thellesia = 0;
      setMbiDritare(false);
      const skedaret = Array.from(e.dataTransfer.files || []);
      const skedari = skedaret[0];
      if (!skedari) return;
      // Disa Excel-a njëherësh: hapen të gjithë (fletët e secilit dalin veç e veç).
      const excelat = skedaret.filter((f) => EXCEL_RE.test(f.name));
      if (excelat.length && !eshteDesktop) {
        if (faqjaRef.current === "editori" && editoriNdryshuar.current) return mesazh("danger", "Ruani shabllonin në editor, pastaj lëshoni Excel-in.");
        setFaqja("printimi");
        setExcelILeshuar({ skedaret: excelat, id: Date.now() });
        return undefined;
      }
      if (excelat.length) {
        const shtigjet = excelat.map((f) => window.labels.shteguISkedarit(f)).filter(Boolean);
        if (!shtigjet.length) return mesazh("danger", "Skedari s'u hap - provoni me \"Hap Excel-in\".");
        setFaqja((f) => (f === "editori" && editoriNdryshuar.current ? f : "printimi"));
        if (faqjaRef.current === "editori" && editoriNdryshuar.current) return mesazh("danger", "Ruani shabllonin në editor, pastaj lëshoni Excel-in.");
        ndryshoCilesimet({ skedaretExcel: shtigjet, skedariExcel: shtigjet[0] });
        mesazh("success", excelat.length > 1 ? `U hapën ${excelat.length} Excel-a` : `U hap ${skedari.name}`);
      } else if (SHABLLON_RE.test(skedari.name)) {
        setFaqja("editori");
        setShablloniILeshuar({ skedari, id: Date.now() });
      } else {
        mesazh("danger", "Lëshoni një Excel (xlsx, xls, ods, csv) ose një shabllon (.qmimore.json).");
      }
      return undefined;
    };
    window.addEventListener("dragenter", hyn);
    window.addEventListener("dragleave", del);
    window.addEventListener("dragover", siper);
    window.addEventListener("drop", leshim);
    return () => {
      window.removeEventListener("dragenter", hyn);
      window.removeEventListener("dragleave", del);
      window.removeEventListener("dragover", siper);
      window.removeEventListener("drop", leshim);
    };
  }, [mesazh]); // eslint-disable-line react-hooks/exhaustive-deps
  const faqjaRef = useRef(faqja);
  faqjaRef.current = faqja;

  const ndryshoCilesimet = useCallback((ndryshimet) => {
    setCilesimet((c) => {
      const iRi = { ...c, ...ndryshimet };
      ruajCilesimet(iRi).catch((err) => console.error("Cilësimet nuk u ruajtën:", err));
      return iRi;
    });
  }, []);

  const shko = (f) => {
    if (f === faqja) return;
    if (faqja === "editori" && editoriNdryshuar.current) return setLargimi(f);
    return setFaqja(f);
  };

  if (!cilesimet) return null;

  return (
    <div className="lb-app">
      <ShiritiITitullit tema={tema} faqja={FAQET.find(([c]) => c === faqja)?.[1]} />
      <header className="lb-koka">
        <div className="lb-marka">
          <img src="/logo-shenja.svg" alt="" width={28} height={28} />
          {/* Fjala "FinanCare" me fontin e logos (FinanCare Logo/vector/isolated-monochrome-*), si te Migratori. */}
          <img className="lb-marka-fjala" src={tema === "dark" ? "/logo-financare-bardhe.svg" : "/logo-financare-zi.svg"} alt="FinanCare" />
          <strong>Labels</strong>
        </div>
        <nav className="lb-nav">
          {FAQET.map(([celesi, emri, ikona]) => (
            <button key={celesi} type="button" className={faqja === celesi ? "aktiv" : ""} onClick={() => shko(celesi)}>
              <FontAwesomeIcon icon={ikona} className="me-2" />
              {emri}
            </button>
          ))}
        </nav>
        <div className="lb-offline">
          {eshteDesktop ? "Pa internet" : "Në shfletues · të dhënat mbeten në këtë pajisje"} · {cilesimet.emriBiznesit || "pa emër biznesi"}
        </div>
        <button
          type="button"
          className="lb-tema-btn"
          title={tema === "dark" ? "Kalo në temën e çelët" : "Kalo në temën e errët"}
          aria-label={tema === "dark" ? "Kalo në temën e çelët" : "Kalo në temën e errët"}
          onClick={() => ndryshoCilesimet({ tema: tema === "dark" ? "light" : "dark" })}
        >
          <FontAwesomeIcon icon={tema === "dark" ? faSun : faMoon} />
        </button>
      </header>

      {njoftimiDesktop && (
        <div className="lb-perditesimi lb-desktop-njoftimi">
          <FontAwesomeIcon icon={faDesktop} className="text-success" />
          <span>
            <b>FinanCare Labels për Windows</b> është më i mirë për punën e përditshme: {PERPARESITE_E_DESKTOPIT}.
          </span>
          <a className="btn btn-sm btn-save text-nowrap" href={SHKARKIMI_DESKTOP} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faCircleDown} className="me-2" />
            Shkarko
          </a>
          <button type="button" className="btn btn-link btn-sm p-0 ms-auto text-white-50" title="Mos e shfaq më" aria-label="Mos e shfaq më" onClick={hiqNjoftimin}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {perditesimi && (
        <div className="lb-perditesimi">
          <FontAwesomeIcon icon={faCircleDown} className="text-success" />
          {perditesimi.gjendja === "gati" && (
            <>
              <span>
                Versioni i ri <b>{perditesimi.versioni}</b> është gati{perditesimi.madhesia ? ` (${madhesia(perditesimi.madhesia)})` : ""}.
              </span>
              <Button size="sm" className="btn-save" onClick={shkarko}>
                {perditesimi.vetvetiu ? "Shkarko" : "Hap faqen e shkarkimit"}
              </Button>
            </>
          )}
          {perditesimi.gjendja === "shkarkim" && (
            <>
              <span>Duke shkarkuar versionin {perditesimi.versioni}...</span>
              <ProgressBar now={perditesimi.progresi?.gjithsej ? (perditesimi.progresi.marre / perditesimi.progresi.gjithsej) * 100 : 0} variant="success" />
              {perditesimi.progresi?.gjithsej ? <span className="text-white-50">{Math.round((perditesimi.progresi.marre / perditesimi.progresi.gjithsej) * 100)}%</span> : <Spinner size="sm" animation="border" />}
            </>
          )}
          {perditesimi.gjendja === "shkarkuar" && (
            <>
              <span>
                Versioni <b>{perditesimi.versioni}</b> u shkarkua. Programi mbyllet, përditësohet dhe hapet vetë (të dhënat mbeten).
              </span>
              <Button size="sm" className="btn-save" onClick={instalo}>
                <FontAwesomeIcon icon={faArrowsRotate} className="me-2" />
                Rinis dhe përditëso
              </Button>
            </>
          )}
          {perditesimi.gjendja === "gabim" && (
            <>
              <span className="text-danger">Shkarkimi dështoi: {perditesimi.gabimi}</span>
              <Button size="sm" variant="secondary" className="btn-cancel" onClick={shkarko}>
                Provo përsëri
              </Button>
            </>
          )}
          {perditesimi.shenimet && perditesimi.gjendja === "gati" && (
            <button type="button" className="btn btn-link btn-sm p-0 text-info" onClick={() => setNdryshimet([{ versioni: perditesimi.versioni, shenimetGithub: perditesimi.shenimet }])}>
              Çka ka të re?
            </button>
          )}
          {perditesimi.gjendja !== "shkarkim" && (
            <button type="button" className="btn btn-link btn-sm p-0 ms-auto text-white-50" onClick={() => setPerditesimi(null)}>
              Më vonë
            </button>
          )}
        </div>
      )}

      <main className="lb-permbajtja">
        {faqja === "printimi" && <Printimi cilesimet={cilesimet} ndryshoCilesimet={ndryshoCilesimet} mesazh={mesazh} hapEditorin={() => shko("editori")} excelILeshuar={excelILeshuar} />}
        <Suspense fallback={<Spinner animation="border" size="sm" className="m-4" />}>
          {faqja === "editori" && (
            <Editori mesazh={mesazh} emriBiznesit={cilesimet.emriBiznesit} iNdryshuarRef={editoriNdryshuar} skedariPerImport={shablloniILeshuar} />
          )}
          {faqja === "udhezuesi" && <Udhezuesi />}
        </Suspense>
        {faqja === "cilesimet" && cilesimet && (
          <Cilesimet
            cilesimet={cilesimet}
            ndryshoCilesimet={ndryshoCilesimet}
            tema={tema}
            mesazh={mesazh}
            versioni={VERSIONI}
            kontrolli={kontrolli}
            kontrollo={kontrollo}
            kontrolloAuto={kontrolloAuto}
            hapNdryshimet={() => setNdryshimet(NDRYSHIMET)}
            dosja={dosja}
            menyra={menyra}
            hapjaEPare={hapjaEPare}
            perfundo={() => {
              setHapjaEPare(false);
              shko("printimi");
            }}
            shkarkimiDesktop={SHKARKIMI_DESKTOP}
            perparesiteEDesktopit={PERPARESITE_E_DESKTOPIT}
          />
        )}
      </main>

      {mbiDritare && (
        <div className="lb-leshimi">
          <div>
            <FontAwesomeIcon icon={faFileImport} className="me-2 text-success" />
            Lëshojeni këtu: Excel / CSV për printim, ose shabllon .qmimore.json
          </div>
        </div>
      )}

      <Modal show={Boolean(ndryshimet)} onHide={() => setNdryshimet(null)} centered size="lg" fullscreen="sm-down" className="sp-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faGift} className="me-2 text-success" />
            Çka ka të re
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="lb-ndryshimet custom-scrollbar" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {ndryshimet?.map((v) => (
            <div key={v.versioni} className="mb-3">
              <h6>
                Versioni {v.versioni}
                {v.data && <span className="text-white-50 fw-normal ms-2 small">{v.data}</span>}
              </h6>
              {v.shenimetGithub ? (
                <div style={{ whiteSpace: "pre-wrap" }} className="small">
                  {v.shenimetGithub}
                </div>
              ) : (
                <ul className="mb-0">
                  {v.pikat.map(([lloji, teksti], i) => (
                    <li key={i}>
                      <Badge bg={lloji === "Rregullim" ? "secondary" : "success"} className="me-2">
                        {lloji}
                      </Badge>
                      {teksti}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-save px-4" onClick={() => setNdryshimet(null)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(largimi)} onHide={() => setLargimi(null)} centered className="sp-modal">
        <Modal.Header closeButton>
          <Modal.Title>Ndryshime të paruajtura</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-white-50">Shablloni në editor ka ndryshime të paruajtura. Të largohemi pa i ruajtur?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="btn-cancel px-4" onClick={() => setLargimi(null)}>
            Anulo
          </Button>
          <Button
            variant="danger"
            className="btn-save px-4"
            onClick={() => {
              editoriNdryshuar.current = false;
              setFaqja(largimi);
              setLargimi(null);
            }}
          >
            Largohu pa ruajtur
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000, marginTop: "calc(64px + var(--tb-h))" }}>
        {toast && (
          <Toast key={toast.id} bg={toast.tipi === "success" ? "success" : "danger"} onClose={() => setToast(null)} delay={5000} autohide>
            <Toast.Body className="text-white">{toast.teksti}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>
      <Analytics />
    </div>
  );
}
