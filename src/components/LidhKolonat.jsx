import { useEffect, useMemo, useState } from "react";
import { Button, Form, Modal, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableColumns, faRotateLeft, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FUSHAT, celesiIHartes, produktetNgaMostra, shkronjaEKolones, sugjeroKolonat } from "../lib/excel";

const ASNJE = "";

// "Lidh kolonat": për Excel-at që s'janë shablloni ynë - përdoruesi zgjedh rreshtin e titujve dhe cila kolonë është
// emri, çmimi, barkodi... (si te FinanCare Migrator). Lidhja ruhet sipas titujve, ndaj vlen edhe për Excel-at e
// ardhshëm me të njëjtat kolona.
export default function LidhKolonat({ fleta, kaHarteTeRuajtur, onRuaj, onHiq, onHide }) {
  const [rreshti, setRreshti] = useState(null); // indeksi i rreshtit të titujve te mostra, ose null
  const [fillimi, setFillimi] = useState(0);
  const [kolonat, setKolonat] = useState({});

  useEffect(() => {
    if (!fleta) return;
    const t = fleta.titujt;
    setRreshti(t?.rreshti ?? null);
    setFillimi(t?.fillimi ?? 0);
    setKolonat(t?.kolonat ? { ...t.kolonat } : {});
  }, [fleta]);

  const mostra = fleta?.mostra || [];
  const nrKolonave = fleta?.nrKolonave || 0;
  const emriKolones = (k) => {
    const shkronja = shkronjaEKolones((fleta?.kolonaEPare || 0) + k);
    const titulli = rreshti != null ? mostra[rreshti]?.[k] : mostra.slice(fillimi).find((r) => r[k])?.[k];
    return titulli ? `${shkronja} · ${String(titulli).slice(0, 30)}` : shkronja;
  };
  const fushaEKolones = useMemo(() => Object.fromEntries(Object.entries(kolonat).map(([f, k]) => [k, f])), [kolonat]);

  const zgjidhRreshtin = (v) => {
    if (v === "") {
      setRreshti(null);
      return;
    }
    const i = Number(v);
    setRreshti(i);
    setFillimi(i + 1);
    const sugjerimi = sugjeroKolonat(mostra[i]);
    if (Object.keys(sugjerimi).length) setKolonat(sugjerimi);
  };
  const lidh = (fusha, v) =>
    setKolonat((t) => {
      const iRi = Object.fromEntries(Object.entries(t).filter(([f, k]) => f !== fusha && String(k) !== v));
      if (v !== ASNJE) iRi[fusha] = Number(v);
      return iRi;
    });

  const produktet = useMemo(() => (kolonat.emri === undefined ? [] : produktetNgaMostra(mostra, fillimi, kolonat)), [mostra, fillimi, kolonat]);
  const meQmim = produktet.filter((p) => !p.gabim);
  const kaQmim = ["qmimi", "qmimiZbritje", "qmimiRregullt"].some((f) => kolonat[f] !== undefined);
  const gati = kolonat.emri !== undefined && kaQmim;
  const nrRreshtit = (i) => (fleta?.rreshtiIPare || 0) + i + 1;

  const ruaj = () => onRuaj(celesiIHartes(fleta.emriNeExcel ?? fleta.emri, { rreshti }, mostra), { fillimi, kolonat });

  return (
    <Modal show={Boolean(fleta)} onHide={onHide} size="xl" centered fullscreen="md-down" className="sp-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faTableColumns} className="me-2 text-info" />
          Lidh kolonat · {fleta?.emri}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-white-50 small mb-3">
          Për Excel-at që s'janë shablloni i FinanCare Labels: zgjidhni rreshtin me titujt dhe cila kolonë është emri, çmimi, barkodi... Lidhja
          ruhet dhe vlen vetë për çdo Excel me të njëjtat tituj (p.sh. eksporti i përjavshëm nga programi tjetër).
        </p>
        <div className="lb-lidh">
          <div className="lb-lidh-fushat">
            <Form.Group className="mb-2">
              <Form.Label className="small mb-1">Rreshti i titujve</Form.Label>
              <Form.Select size="sm" value={rreshti ?? ""} onChange={(e) => zgjidhRreshtin(e.target.value)}>
                <option value="">Pa rresht titujsh (vetëm të dhëna)</option>
                {mostra.slice(0, 30).map((r, i) =>
                  r.some(Boolean) ? (
                    <option key={i} value={i}>
                      Rreshti {nrRreshtit(i)}: {r.filter(Boolean).slice(0, 4).join(", ").slice(0, 60)}
                    </option>
                  ) : null
                )}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small mb-1">Produktet nisin nga rreshti</Form.Label>
              <Form.Select size="sm" value={fillimi} onChange={(e) => setFillimi(Number(e.target.value))}>
                {mostra.map((_, i) => (
                  <option key={i} value={i} disabled={rreshti != null && i <= rreshti}>
                    {nrRreshtit(i)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {FUSHAT.filter((f) => f.key !== "kaZbritje").map((f) => (
              <Form.Group key={f.key} className="mb-2 d-flex align-items-center gap-2">
                <Form.Label className="small mb-0 flex-shrink-0" style={{ width: 170 }}>
                  {f.emri}
                  {f.kerkohet && <span className="text-danger"> *</span>}
                </Form.Label>
                <Form.Select size="sm" value={kolonat[f.key] ?? ASNJE} onChange={(e) => lidh(f.key, e.target.value)}>
                  <option value={ASNJE}>— Asnjë —</option>
                  {Array.from({ length: nrKolonave }, (_, k) => (
                    <option key={k} value={k}>
                      {emriKolones(k)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            ))}
            <div className="small text-white-50 mt-2">
              * Duhet emri dhe të paktën një çmim. Me "Çmimi me zbritje" + "Çmimi" ose "Çmimi i rregullt", etiketa del me zbritje.
            </div>
          </div>
          <div className="lb-lidh-mostra">
            <div className="sp-table-container custom-scrollbar" style={{ maxHeight: 360, overflow: "auto" }}>
              <Table size="sm" variant="dark" className="sp-table mb-0 lb-lidh-tabela">
                <thead>
                  <tr>
                    <th />
                    {Array.from({ length: nrKolonave }, (_, k) => (
                      <th key={k} className={fushaEKolones[k] ? "lb-lidh-e-lidhur" : ""}>
                        {shkronjaEKolones((fleta?.kolonaEPare || 0) + k)}
                        {fushaEKolones[k] && <div className="lb-lidh-fusha">{FUSHAT.find((f) => f.key === fushaEKolones[k])?.emri}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mostra.slice(0, 25).map((r, i) => (
                    <tr key={i} className={i === rreshti ? "lb-lidh-titujt" : i < fillimi ? "opacity-50" : ""}>
                      <td className="text-white-50">{nrRreshtit(i)}</td>
                      {r.map((q, k) => (
                        <td key={k} className={fushaEKolones[k] ? "lb-lidh-e-lidhur" : ""}>
                          {String(q).slice(0, 40)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="small mt-2">
              {gati ? (
                <>
                  <span className="text-success">
                    {meQmim.length} produkte me çmim te {Math.max(0, mostra.length - fillimi)} rreshtat e parë
                  </span>
                  {meQmim.length > 0 && <span className="text-white-50"> · p.sh. {meQmim.slice(0, 3).map((p) => `${p.name} (${p.price?.toFixed(2)} €)`).join(", ")}</span>}
                </>
              ) : (
                <span className="text-warning">Lidhni emrin dhe çmimin.</span>
              )}
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {kaHarteTeRuajtur && (
          <Button variant="secondary" className="btn-cancel me-auto" title="Fshi lidhjen e ruajtur dhe kthehu te njohja automatike" onClick={onHiq}>
            <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
            Njohja automatike
          </Button>
        )}
        <Button variant="secondary" className="btn-cancel px-4" onClick={onHide}>
          Anulo
        </Button>
        <Button className="btn-save px-4" disabled={!gati} onClick={ruaj}>
          <FontAwesomeIcon icon={faWandMagicSparkles} className="me-2" />
          Ruaj lidhjen
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
