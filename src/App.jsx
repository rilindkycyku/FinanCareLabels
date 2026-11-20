import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Modal, Toast, ToastContainer } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen, faGear, faMoon, faPenRuler, faPrint, faSun } from "@fortawesome/free-solid-svg-icons";
import Printimi from "./Printimi";
import ShiritiITitullit from "./components/ShiritiITitullit";
import Editori from "./Editori";
import { eshteDesktop, lexoCilesimet, ruajCilesimet } from "./lib/ruajtja";

const FAQET = [
  ["printimi", "Printimi", faPrint],
  ["editori", "Editori i shablloneve", faPenRuler],
  ["cilesimet", "Cilësimet", faGear],
];

export default function App() {
  const [faqja, setFaqja] = useState("printimi");
  const [cilesimet, setCilesimet] = useState(null);
  const [toast, setToast] = useState(null);
  const [dosja, setDosja] = useState("");
  const [largimi, setLargimi] = useState(null); // faqja ku do të shkohet pas konfirmimit
  const editoriNdryshuar = useRef(false);

  useEffect(() => {
    lexoCilesimet().then(setCilesimet);
    if (eshteDesktop) window.labels.dosjaETeDhenave().then(setDosja);
  }, []);

  // Tema e çelët është parazgjedhja; "light-mode" vendoset te <html> dhe <body> si te FinanCare
  const tema = cilesimet?.tema === "dark" ? "dark" : "light";
  useEffect(() => {
    for (const el of [document.documentElement, document.body]) el.classList.toggle("light-mode", tema === "light");
  }, [tema]);

  const mesazh = useCallback((tipi, teksti) => setToast({ tipi, teksti, id: Date.now() }), []);

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

      <main className="lb-permbajtja">
        {faqja === "printimi" && <Printimi cilesimet={cilesimet} ndryshoCilesimet={ndryshoCilesimet} mesazh={mesazh} hapEditorin={() => shko("editori")} />}
        {faqja === "editori" && <Editori mesazh={mesazh} emriBiznesit={cilesimet.emriBiznesit} iNdryshuarRef={editoriNdryshuar} />}
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
            <div className="ql-titulli-seksionit mt-4">Të dhënat</div>
            <div className="text-white-50 small mb-2">
              Shabllonet, cilësimet, produktet e shtuara dhe historiku i printimeve ruhen në këtë dosje, pranë exe-së portabël. Për ta marrë programin në një kompjuter tjetër, kopjoni exe-në bashkë me këtë dosje. Nuk dërgohet asgjë në internet.
            </div>
            <div className="d-flex align-items-center gap-2">
              <code className="text-info">{dosja || "localStorage (shfletuesi)"}</code>
              {eshteDesktop && (
                <Button variant="secondary" size="sm" className="btn-cancel" onClick={() => window.labels.hapDosjenETeDhenave()}>
                  <FontAwesomeIcon icon={faFolderOpen} className="me-2" />
                  Hap dosjen
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

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
