import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Form, Modal, ProgressBar, Spinner, Toast, ToastContainer } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faBookOpen, faCircleDown, faFileImport, faFolderOpen, faGear, faGift, faMoon, faPenRuler, faPrint, faSun } from "@fortawesome/free-solid-svg-icons";
import Printimi from "./Printimi";
import ShiritiITitullit from "./components/ShiritiITitullit";
// Editori dhe Udhëzuesi ngarkohen kur hapen: hapja e programit lexon vetëm Printimin.
const Editori = lazy(() => import("./Editori"));
const Udhezuesi = lazy(() => import("./Udhezuesi"));
import KalibrimiPrinterit from "./components/KalibrimiPrinterit";
import { NDRYSHIMET, krahasoVersionet, ndryshimetMes } from "./lib/ndryshimet";
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
  const [mbiDritare, setMbiDritare] = useState(false);
  const [ndryshimet, setNdryshimet] = useState(null); // lista e versioneve për "Çka ka të re"
  // Përditësimi: { versioni, shenimet, madhesia, vetvetiu, gjendja: "gati" | "shkarkim" | "shkarkuar" | "gabim", progresi, gabimi }
  const [perditesimi, setPerditesimi] = useState(null);
  const [kontrolli, setKontrolli] = useState(""); // "" | "duke" | teksti i rezultatit (Cilësimet)

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
      const skedari = e.dataTransfer.files?.[0];
      if (!skedari) return;
      if (EXCEL_RE.test(skedari.name)) {
        const shtegu = eshteDesktop ? window.labels.shteguISkedarit(skedari) : "";
        if (!shtegu) return mesazh("danger", "Skedari s'u hap - provoni me \"Hap Excel-in\".");
        setFaqja((f) => (f === "editori" && editoriNdryshuar.current ? f : "printimi"));
        if (faqjaRef.current === "editori" && editoriNdryshuar.current) return mesazh("danger", "Ruani shabllonin në editor, pastaj lëshoni Excel-in.");
        ndryshoCilesimet({ skedariExcel: shtegu });
        mesazh("success", `U hap ${skedari.name}`);
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
        <div className="lb-offline">Pa internet · {cilesimet.emriBiznesit || "pa emër biznesi"}</div>
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
        {faqja === "printimi" && <Printimi cilesimet={cilesimet} ndryshoCilesimet={ndryshoCilesimet} mesazh={mesazh} hapEditorin={() => shko("editori")} />}
        <Suspense fallback={<Spinner animation="border" size="sm" className="m-4" />}>
          {faqja === "editori" && (
            <Editori mesazh={mesazh} emriBiznesit={cilesimet.emriBiznesit} iNdryshuarRef={editoriNdryshuar} skedariPerImport={shablloniILeshuar} />
          )}
          {faqja === "udhezuesi" && <Udhezuesi />}
        </Suspense>
        {faqja === "cilesimet" && (
          <div className="ql-seksioni lb-cilesimet">
            <div className="ql-titulli-seksionit">Biznesi</div>
            <Form.Group className="mb-3">
              <Form.Label className="small text-white-50">Emri i biznesit (fusha {"{dyqani}"} te shabllonet)</Form.Label>
              <Form.Control maxLength={80} value={cilesimet.emriBiznesit} onChange={(e) => ndryshoCilesimet({ emriBiznesit: e.target.value })} />
            </Form.Group>
            <div className="ql-titulli-seksionit mt-4">Pamja</div>
            <Form.Group className="mb-3">
              <Form.Label className="small text-white-50">Tema</Form.Label>
              <Form.Select value={tema} onChange={(e) => ndryshoCilesimet({ tema: e.target.value })}>
                <option value="light">E bardhë</option>
                <option value="dark">E errët</option>
              </Form.Select>
            </Form.Group>
            <div className="ql-titulli-seksionit mt-4">Printeri</div>
            <KalibrimiPrinterit kalibrimet={cilesimet.kalibrimet} ndrysho={ndryshoCilesimet} mesazh={mesazh} />
            <div className="ql-titulli-seksionit mt-4">Përditësimet</div>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span>
                Versioni <Badge bg="success">{VERSIONI || "-"}</Badge>
              </span>
              <Form.Check
                type="switch"
                id="lb-perditesimet"
                className="small mb-0"
                label="Kontrollo vetë për versione të reja (kur ka internet)"
                checked={kontrolloAuto}
                onChange={(e) => ndryshoCilesimet({ kontrolloPerditesimet: e.target.checked })}
              />
              {eshteDesktop && (
                <Button size="sm" variant="secondary" className="btn-cancel" disabled={kontrolli === "duke"} onClick={() => kontrollo(true)}>
                  {kontrolli === "duke" ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faArrowsRotate} className="me-2" />}
                  Kontrollo tani
                </Button>
              )}
              <Button size="sm" variant="secondary" className="btn-cancel" onClick={() => setNdryshimet(NDRYSHIMET)}>
                <FontAwesomeIcon icon={faGift} className="me-2" />
                Çka ka të re
              </Button>
            </div>
            {kontrolli && kontrolli !== "duke" && <div className="small text-white-50 mt-2">{kontrolli}</div>}
            <div className="ql-titulli-seksionit mt-4">Të dhënat</div>
            <div className="text-white-50 small mb-2">
              Shabllonet, cilësimet, produktet e shtuara dhe historiku i printimeve ruhen në këtë dosje
              {menyra === "instaluar"
                ? " (programi i instaluar). Kur kaloni nga versioni portabël, merrni të dhënat e tij me butonin më poshtë."
                : ", pranë exe-së portabël. Për ta marrë programin në një kompjuter tjetër, kopjoni exe-në bashkë me këtë dosje."}{" "}
              Nuk dërgohet asgjë në internet.
            </div>
            <div className="d-flex align-items-center gap-2">
              <code className="text-info">{dosja || "localStorage (shfletuesi)"}</code>
              {eshteDesktop && (
                <Button variant="secondary" size="sm" className="btn-cancel" onClick={() => window.labels.hapDosjenETeDhenave()}>
                  <FontAwesomeIcon icon={faFolderOpen} className="me-2" />
                  Hap dosjen
                </Button>
              )}
              {menyra === "instaluar" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="btn-cancel"
                  title="Kopjo shabllonet, cilësimet, produktet dhe historikun nga dosja FinanCareLabels-Data e versionit portabël"
                  onClick={async () => {
                    try {
                      const n = await window.labels.importoNgaDosja();
                      if (n) {
                        mesazh("success", "Të dhënat e portablit u morën. Programi po rifreskohet...");
                        setTimeout(() => window.location.reload(), 1200);
                      }
                    } catch (err) {
                      mesazh("danger", String(err?.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""));
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faFileImport} className="me-2" />
                  Merr të dhënat nga portabli
                </Button>
              )}
            </div>
          </div>
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

      <Modal show={Boolean(ndryshimet)} onHide={() => setNdryshimet(null)} centered size="lg" className="sp-modal">
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
    </div>
  );
}
