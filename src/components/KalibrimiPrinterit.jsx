import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator, faPrint, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { faqetPerPrintim, lexoPrinterin } from "./PdfPamja";
import { GJATESIA, LARGESIA, KALIBRIMI_BOSH, fletaEKalibrimit, kaKalibrim, kalibrimiI, llogaritKalibrimin, pershkrimiKalibrimit } from "../lib/kalibrimi";
import { eshteDesktop } from "../lib/ruajtja";
import { PRINTERI_I_SHFLETUESIT, printoNeShfletues } from "../lib/shfletuesi";

// Në shfletues s'dihet printeri: një korrigjim i vetëm (zhvendosja), i futur në PDF; shkallën e jep dritarja e
// printimit e shfletuesit (100%).
const SHFLETUESI = [{ emri: PRINTERI_I_SHFLETUESIT, shfaqja: "Printeri i shfletuesit (dritarja e printimit)", parazgjedhur: true }];

const numer = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// Cilësimet → Printeri: kalibrimi i çdo printeri (zhvendosja dhe shkalla), me fletën e kalibrimit dhe matjet.
export default function KalibrimiPrinterit({ kalibrimet, ndrysho, mesazh }) {
  const [printerat, setPrinterat] = useState(null);
  const [printeri, setPrinteri] = useState("");
  const [matjet, setMatjet] = useState({ majtas: "", lart: "", gjatesia: "" });
  const [duke, setDuke] = useState(false);

  useEffect(() => {
    if (!eshteDesktop) {
      setPrinterat(SHFLETUESI);
      setPrinteri(PRINTERI_I_SHFLETUESIT);
      return;
    }
    window.labels
      .printerat()
      .then((lista) => {
        setPrinterat(lista);
        const iFundit = lexoPrinterin();
        setPrinteri((lista.find((p) => p.emri === iFundit) || lista.find((p) => p.parazgjedhur) || lista[0])?.emri || "");
      })
      .catch(() => setPrinterat([]));
  }, []);

  const k = kalibrimiI(kalibrimet, printeri);
  const ruaj = (iRi) => ndrysho({ kalibrimet: { ...(kalibrimet || {}), [printeri]: iRi } });
  const fushe = (celesi, v) => ruaj({ ...k, [celesi]: numer(v) ?? (celesi === "shkalla" ? 100 : 0) });

  const printoFleten = async () => {
    setDuke(true);
    if (!eshteDesktop) {
      try {
        const r = await printoNeShfletues(fletaEKalibrimit("Shfletuesi", { x: k.x, y: k.y }).output("blob"));
        if (r === "bllokuar") mesazh("danger", "Shfletuesi e bllokoi skedën e re - lejoni dritaret (pop-up).");
      } finally {
        setDuke(false);
      }
      return;
    }
    try {
      const blob = fletaEKalibrimit(printeri).output("blob");
      const { faqet, w, h } = await faqetPerPrintim(blob);
      const r = await window.labels.printoPdf(faqet, Math.round(w * 10) / 10, Math.round(h * 10) / 10, {
        printeri,
        kopjet: 1,
        zhvendosjaX: k.x,
        zhvendosjaY: k.y,
        shkalla: k.shkalla,
      });
      if (r?.ok) mesazh("success", `Fleta e kalibrimit u dërgua te ${printeri}. Matni A, B dhe C.`);
      else if (!r?.anuluar) mesazh("danger", `Printimi dështoi: ${r?.arsyeja || "gabim"}`);
    } catch (err) {
      mesazh("danger", `Printimi dështoi: ${err?.message || err}`);
    } finally {
      setDuke(false);
    }
  };

  const llogarit = () => {
    const m = { majtas: numer(matjet.majtas), lart: numer(matjet.lart), gjatesia: numer(matjet.gjatesia) };
    if (m.majtas == null && m.lart == null && m.gjatesia == null) return;
    const iRi = llogaritKalibrimin(k, m);
    ruaj(iRi);
    setMatjet({ majtas: "", lart: "", gjatesia: "" });
    mesazh("success", `Kalibrimi u ruajt: ${pershkrimiKalibrimit(iRi)}. Printojeni fletën sërish për ta verifikuar.`);
  };

  return (
    <div className="lb-kalibrimi">
      <div className="text-white-50 small mb-3">
        Kur etiketat s'bien në vend në letër (të zhvendosura, të prera te skaji ose pak më të vogla), printeri e zhvendos ose e zvogëlon
        faqen. Printoni fletën e kalibrimit, mateni me vizore dhe shënoni matjet: korrigjimi ruhet për këtë printer dhe zbatohet vetë te çdo
        printim.
      </div>
      <Form.Group className="mb-3" style={{ maxWidth: 420 }}>
        <Form.Label className="small text-white-50">Printeri</Form.Label>
        <Form.Select value={printeri} disabled={!printerat?.length} onChange={(e) => setPrinteri(e.target.value)}>
          {!printerat && <option>Duke i kërkuar printerat...</option>}
          {printerat?.length === 0 && <option value="">Asnjë printer i instaluar</option>}
          {printerat?.map((p) => (
            <option key={p.emri} value={p.emri}>
              {p.shfaqja}
              {kaKalibrim(kalibrimiI(kalibrimet, p.emri)) ? " · i kalibruar" : ""}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      {printeri && (
        <>
          <div className="lb-kalibrimi-hapat">
            <div>
              <div className="lb-kalibrimi-nr">1</div>
              <div>
                <b>Printoni fletën e kalibrimit</b>
                <div className="small text-white-50 mb-2">A4, me korrigjimin aktual të zbatuar.</div>
                <Button size="sm" className="btn-save" disabled={duke} onClick={printoFleten}>
                  {duke ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faPrint} className="me-2" />}
                  Printo fletën e kalibrimit
                </Button>
              </div>
            </div>
            <div>
              <div className="lb-kalibrimi-nr">2</div>
              <div>
                <b>Shënoni matjet (mm)</b>
                {!eshteDesktop && (
                  <div className="small text-white-50">
                    Në shfletues: nëse C s'del 150 mm, te dritarja e printimit zgjidhni shkallën 100% / Madhësia reale (jo "Fit").
                  </div>
                )}
                <div className="d-flex gap-2 flex-wrap mt-1 align-items-end">
                  {[
                    ["majtas", "A - skaji majtas", LARGESIA],
                    ["lart", "B - skaji lart", LARGESIA],
                    ...(eshteDesktop ? [["gjatesia", "C - vija e gjatë", GJATESIA]] : []),
                  ].map(([celesi, emri, duhet]) => (
                    <Form.Group key={celesi}>
                      <Form.Label className="small mb-1">{emri}</Form.Label>
                      <Form.Control
                        size="sm"
                        inputMode="decimal"
                        style={{ width: 120 }}
                        placeholder={`duhet ${duhet}`}
                        value={matjet[celesi]}
                        onChange={(e) => setMatjet((m) => ({ ...m, [celesi]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && llogarit()}
                      />
                    </Form.Group>
                  ))}
                  <Button size="sm" variant="secondary" className="btn-cancel" onClick={llogarit}>
                    <FontAwesomeIcon icon={faCalculator} className="me-2" />
                    Llogarit dhe ruaj
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="small text-white-50 mb-1">Korrigjimi aktual (mund ta ndryshoni edhe me dorë):</div>
            <div className="d-flex gap-2 flex-wrap align-items-end">
              {[
                ["x", "Horizontalisht (mm, + = djathtas)"],
                ["y", "Vertikalisht (mm, + = poshtë)"],
                ...(eshteDesktop ? [["shkalla", "Shkalla (%)"]] : []),
              ].map(([celesi, emri]) => (
                <Form.Group key={celesi}>
                  <Form.Label className="small mb-1">{emri}</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    step={celesi === "shkalla" ? 0.1 : 0.5}
                    style={{ width: 150 }}
                    value={k[celesi]}
                    onChange={(e) => fushe(celesi, e.target.value)}
                  />
                </Form.Group>
              ))}
              <Button size="sm" variant="secondary" className="btn-cancel" disabled={!kaKalibrim(k)} onClick={() => ruaj({ ...KALIBRIMI_BOSH })}>
                <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                Pa korrigjim
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
