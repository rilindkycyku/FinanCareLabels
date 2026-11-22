import { useState } from "react";
import { Badge, Button, Form, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faArrowsRotate,
  faCheck,
  faDatabase,
  faDesktop,
  faFileImport,
  faFolderOpen,
  faGear,
  faGift,
  faMoon,
  faPalette,
  faPrint,
  faStore,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import KalibrimiPrinterit from "./KalibrimiPrinterit";
import { eshteDesktop } from "../lib/ruajtja";

// Cilësimet si magjistar konfigurimi (si Printimi / Konfigurimi i FinanCare-s): hapat në të majtë, çdo hap mund të hapet
// direkt ose të kalohet - asgjë s'është e detyrueshme dhe çdo ndryshim ruhet menjëherë.
const HAPAT = [
  { celesi: "biznesi", emri: "Biznesi", pershkrimi: "Emri në etiketa", ikona: faStore },
  { celesi: "pamja", emri: "Pamja", pershkrimi: "E bardhë ose e errët", ikona: faPalette },
  { celesi: "printeri", emri: "Printeri", pershkrimi: "Kalibrimi i letrës", ikona: faPrint },
  { celesi: "perditesimet", emri: eshteDesktop ? "Përditësimet" : "Versioni", pershkrimi: eshteDesktop ? "Versionet e reja" : "Windows dhe të rejat", ikona: faArrowsRotate },
  { celesi: "tedhenat", emri: "Të dhënat", pershkrimi: "Ku ruhen", ikona: faDatabase },
];

export default function Cilesimet({
  cilesimet,
  ndryshoCilesimet,
  tema,
  mesazh,
  versioni,
  kontrolli,
  kontrollo,
  kontrolloAuto,
  hapNdryshimet,
  dosja,
  menyra,
  hapjaEPare,
  perfundo,
  shkarkimiDesktop,
  perparesiteEDesktopit,
}) {
  const [hapi, setHapi] = useState(0);
  const iFundit = hapi === HAPAT.length - 1;
  const aktivi = HAPAT[hapi];

  const merrTeDhenatNgaPortabli = async () => {
    try {
      const n = await window.labels.importoNgaDosja();
      if (n) {
        mesazh("success", "Të dhënat e portablit u morën. Programi po rifreskohet...");
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (err) {
      mesazh("danger", String(err?.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""));
    }
  };

  const titulli = (teksti, nentitulli) => (
    <div className="mb-3">
      <h3 className="lb-cil-h3">{teksti}</h3>
      {nentitulli && <div className="small text-white-50">{nentitulli}</div>}
    </div>
  );

  return (
    <div className="lb-wizard lb-cil-wizard">
      <aside className="lb-wizard-rail">
        <div className="lb-rail-titulli">
          <div className="lb-rail-ikona">
            <FontAwesomeIcon icon={faGear} />
          </div>
          <div className="d-flex flex-column" style={{ minWidth: 0 }}>
            <span className="lb-eyebrow">{hapjaEPare ? "Mirë se vini" : "Programi"}</span>
            <h2 className="lb-rail-h2 text-truncate">{hapjaEPare ? "Konfigurimi i parë" : "Cilësimet"}</h2>
          </div>
        </div>
        <div className="lb-stepper">
          {HAPAT.map((h, i) => (
            <button key={h.celesi} type="button" className={`lb-step${i === hapi ? " on" : ""}`} disabled={i === hapi} onClick={() => setHapi(i)}>
              <span className="n">
                <FontAwesomeIcon icon={h.ikona} />
              </span>
              <span className="txt">
                <b>{h.emri}</b>
                <span>{h.pershkrimi}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="lb-rail-foot">
          <span className="lb-rail-label">Versioni</span>
          <b>{versioni || "-"}</b>
          <span className="text-white-50 small">Çdo ndryshim ruhet vetë. Hapat mund t'i kaloni.</span>
        </div>
      </aside>

      <div className="lb-wizard-main">
        <div className="lb-wizard-body">
          <div className="lb-cil-permbajtja">
            {aktivi.celesi === "biznesi" && (
              <>
                {titulli("Biznesi", "Emri del te shabllonet që kanë fushën {dyqani} (p.sh. koka e çmimores). Mund ta lini bosh.")}
                <Form.Group style={{ maxWidth: 460 }}>
                  <Form.Label className="small text-white-50 mb-1">Emri i biznesit</Form.Label>
                  <Form.Control
                    autoFocus
                    maxLength={80}
                    placeholder="p.sh. Market Dukagjini"
                    value={cilesimet.emriBiznesit}
                    onChange={(e) => ndryshoCilesimet({ emriBiznesit: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && setHapi(hapi + 1)}
                  />
                </Form.Group>
              </>
            )}

            {aktivi.celesi === "pamja" && (
              <>
                {titulli("Pamja", "Zgjidhni temën e programit. Etiketat printohen njësoj me të dyja.")}
                <div className="lb-cil-temat">
                  {[
                    ["light", "E bardhë", faSun],
                    ["dark", "E errët", faMoon],
                  ].map(([vlera, emri, ikona]) => (
                    <button key={vlera} type="button" className={`lb-cil-tema lb-cil-tema-${vlera}${tema === vlera ? " aktiv" : ""}`} onClick={() => ndryshoCilesimet({ tema: vlera })}>
                      <span className="lb-cil-tema-pamja">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={tema === vlera ? faCheck : ikona} />
                        {emri}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {aktivi.celesi === "printeri" && (
              <>
                {titulli("Printeri", "Vetëm nëse etiketat s'bien saktë në letër - përndryshe kalojeni këtë hap.")}
                <KalibrimiPrinterit kalibrimet={cilesimet.kalibrimet} ndrysho={ndryshoCilesimet} mesazh={mesazh} />
              </>
            )}

            {aktivi.celesi === "perditesimet" && (
              <>
                {titulli(eshteDesktop ? "Përditësimet" : "Versioni")}
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span>
                    Versioni <Badge bg="success">{versioni || "-"}</Badge>
                  </span>
                  {!eshteDesktop && <span className="small text-white-50">Versioni në shfletues përditësohet vetë - gjithmonë i fundit.</span>}
                  {eshteDesktop && (
                    <Button size="sm" variant="secondary" className="btn-cancel" disabled={kontrolli === "duke"} onClick={() => kontrollo(true)}>
                      {kontrolli === "duke" ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faArrowsRotate} className="me-2" />}
                      Kontrollo tani
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" className="btn-cancel" onClick={hapNdryshimet}>
                    <FontAwesomeIcon icon={faGift} className="me-2" />
                    Çka ka të re
                  </Button>
                </div>
                {eshteDesktop && (
                  <Form.Check
                    type="switch"
                    id="lb-perditesimet"
                    className="small mt-3"
                    label="Kontrollo vetë për versione të reja (kur ka internet)"
                    checked={kontrolloAuto}
                    onChange={(e) => ndryshoCilesimet({ kontrolloPerditesimet: e.target.checked })}
                  />
                )}
                {kontrolli && kontrolli !== "duke" && <div className="small text-white-50 mt-2">{kontrolli}</div>}
                {!eshteDesktop && (
                  <div className="lb-cil-kartela mt-4" style={{ maxWidth: 620 }}>
                    <div className="ql-titulli-seksionit">Aplikacioni për Windows</div>
                    <div className="text-white-50 small mb-2">
                      Për punën e përditshme në kompjuter, shkarkoni FinanCare Labels për Windows: {perparesiteEDesktopit}. "Setup" instalohet (pa leje
                      administratori), "Portable" punon pa instalim nga USB. Shabllonet i merrni me shkarkimin e tyre te Editori.
                    </div>
                    <a className="btn btn-sm btn-save" href={shkarkimiDesktop} target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faDesktop} className="me-2" />
                      Shkarko për Windows
                    </a>
                  </div>
                )}
              </>
            )}

            {aktivi.celesi === "tedhenat" && (
              <>
                {titulli("Të dhënat")}
                <div className="text-white-50 small mb-3" style={{ maxWidth: 720 }}>
                  {!eshteDesktop ? (
                    <>
                      Shabllonet, cilësimet, produktet e shtuara dhe historiku i printimeve ruhen në këtë shfletues, në këtë pajisje (jo në internet). Për
                      t'i marrë në një pajisje tjetër, shkarkoni shabllonet te Editori dhe importojini atje. Pastrimi i të dhënave të shfletuesit i fshin.
                    </>
                  ) : (
                    <>
                      Shabllonet, cilësimet, produktet e shtuara dhe historiku i printimeve ruhen në këtë dosje
                      {menyra === "instaluar"
                        ? " (programi i instaluar). Kur kaloni nga versioni portabël, merrni të dhënat e tij me butonin më poshtë."
                        : ", pranë exe-së portabël. Për ta marrë programin në një kompjuter tjetër, kopjoni exe-në bashkë me këtë dosje."}{" "}
                      Nuk dërgohet asgjë në internet.
                    </>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <code className="text-info text-break">{dosja || "localStorage (shfletuesi)"}</code>
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
                      onClick={merrTeDhenatNgaPortabli}
                    >
                      <FontAwesomeIcon icon={faFileImport} className="me-2" />
                      Merr të dhënat nga portabli
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lb-wizard-foot">
          <Button variant="secondary" className="btn-cancel" disabled={hapi === 0} onClick={() => setHapi(hapi - 1)}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Mbrapa
          </Button>
          <span className="small text-white-50 me-auto">
            Hapi {hapi + 1} nga {HAPAT.length} · mund ta kaloni
          </span>
          {hapjaEPare && !iFundit && (
            <Button variant="secondary" className="btn-cancel" onClick={perfundo}>
              Kalo konfigurimin
            </Button>
          )}
          {iFundit ? (
            <Button className="btn-save" onClick={perfundo}>
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              {hapjaEPare ? "Përfundo - te Printimi" : "Mbyll - te Printimi"}
            </Button>
          ) : (
            <Button className="btn-save" onClick={() => setHapi(hapi + 1)}>
              Vazhdo / Kalo
              <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
