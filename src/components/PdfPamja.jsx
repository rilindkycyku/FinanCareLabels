import { useEffect, useRef, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faExpand, faFloppyDisk, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faPrint } from "@fortawesome/free-solid-svg-icons";
import { pdfjsLib } from "../lib/pdfjs";
import { eshteDesktop } from "../lib/ruajtja";
import { kaKalibrim, kalibrimiI, pershkrimiKalibrimit } from "../lib/kalibrimi";
import { PRINTERI_I_SHFLETUESIT, eshteCelular, printoNeShfletues } from "../lib/shfletuesi";

const PT_NE_MM = 25.4 / 72;
// Hapat e zoom-it te dritarja e PDF-së (1 = madhësia reale e letrës).
const HAPAT_E_ZOOMIT = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const DPI_PRINTIMI = 300;
// Printeri i fundit i zgjedhur - vetëm lehtësi për këtë kompjuter.
const CELESI_PRINTERIT = "financare-labels:printeri";
export const lexoPrinterin = () => {
  try {
    return localStorage.getItem(CELESI_PRINTERIT);
  } catch {
    return null;
  }
};
export const ruajPrinterin = (emri) => {
  try {
    localStorage.setItem(CELESI_PRINTERIT, emri);
  } catch {
    /* s'ka rëndësi */
  }
};
// Printerat e kuponave (termikë 58/80 mm) s'e marrin dot një fletë A4.
const eshteTermik = (emri) => /pos|thermal|termik|receipt|xp-?\d|tm-?t\d|(^|[^\d])(58|80)(c|mm)?([^\d]|$)/i.test(emri || "");
// "" = dritarja e printimit e Windows-it (për cilësime të avancuara të driverit).
const DIALOGU_WINDOWS = "";

// zoom = null: faqja përshtatet në dritare (me CSS); ndryshe madhësia reale (100% = 96 dpi) × zoom.
const aplikoZoom = (c, zoom) => {
  if (zoom && c.dataset.gjeresiaCss) {
    c.style.width = `${parseFloat(c.dataset.gjeresiaCss) * zoom}px`;
    c.style.maxWidth = "none";
    c.style.maxHeight = "none";
  } else {
    c.style.width = "";
    c.style.maxWidth = "";
    c.style.maxHeight = "";
  }
};

// Faqet e PDF-së si kanvasa (pdf.js) - njësoj kudo, pa plugin-in e PDF-ve.
export function PdfKanvasi({ blob, gjeresia = 900, emriKlases = "pdf-faqja", zoom = null }) {
  const ref = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [gabimi, setGabimi] = useState(null);
  useEffect(() => {
    if (!blob) return undefined;
    let anuluar = false;
    let doc = null;
    const mbajtesi = ref.current;
    setGabimi(null);
    (async () => {
      try {
        doc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
        if (anuluar || !mbajtesi) return;
        const kanvasat = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const faqja = await doc.getPage(n);
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = faqja.getViewport({ scale: (gjeresia / faqja.getViewport({ scale: 1 }).width) * dpr });
          const c = document.createElement("canvas");
          c.className = emriKlases;
          c.width = viewport.width;
          c.height = viewport.height;
          c.dataset.gjeresiaCss = String((faqja.getViewport({ scale: 1 }).width * 96) / 72);
          aplikoZoom(c, zoomRef.current);
          await faqja.render({ canvasContext: c.getContext("2d"), viewport }).promise;
          if (anuluar) return;
          kanvasat.push(c);
        }
        mbajtesi.replaceChildren(...kanvasat);
      } catch (err) {
        if (!anuluar) {
          console.error("PDF-ja nuk u shfaq:", err);
          setGabimi(err);
        }
      }
    })();
    return () => {
      anuluar = true;
      doc?.destroy();
    };
  }, [blob, gjeresia, emriKlases]);

  // Ndryshimi i zoom-it pa rivizatim: vetëm madhësia në ekran.
  useEffect(() => {
    ref.current?.querySelectorAll("canvas").forEach((c) => aplikoZoom(c, zoom));
  }, [zoom]);

  if (gabimi) return <div className="text-danger small p-3">PDF-ja nuk u shfaq këtu. Përdorni "Ruaj PDF".</div>;
  if (!blob)
    return (
      <div className="text-white-50 small p-3">
        <Spinner size="sm" animation="border" className="me-2" /> Duke përgatitur...
      </div>
    );
  return <div ref={ref} />;
}

// Faqet si PNG me DPI_PRINTIMI + madhësia e faqes në mm, për dritaren e printimit.
export const faqetPerPrintim = async (blob, neProgres) => {
  const doc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
  try {
    const faqet = [];
    let permasat = null;
    for (let n = 1; n <= doc.numPages; n++) {
      neProgres?.(n, doc.numPages);
      const faqja = await doc.getPage(n);
      const baza = faqja.getViewport({ scale: 1 });
      if (!permasat) permasat = { w: baza.width * PT_NE_MM, h: baza.height * PT_NE_MM };
      const viewport = faqja.getViewport({ scale: DPI_PRINTIMI / 72 });
      const c = document.createElement("canvas");
      c.width = Math.round(viewport.width);
      c.height = Math.round(viewport.height);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await faqja.render({ canvasContext: ctx, viewport }).promise;
      faqet.push(c.toDataURL("image/png"));
      c.width = 0;
    }
    return { faqet, ...permasat };
  } finally {
    doc.destroy();
  }
};

// onUKrye(menyra): thirret kur PDF-ja printohet, ruhet ose hapet jashtë - për historikun e printimeve.
export default function PdfPamja({ pdf, titulli = "Çmimorja", onHide, onMesazh, onUKrye, kalibrimet = null }) {
  const [duke, setDuke] = useState(null); // null | "printo" | "ruaj" | "hap"
  const [progresi, setProgresi] = useState(null);
  // Zoom-i: null = përshtatur në dritare; 1 = madhësia reale. Rikthehet te përshtatja për çdo PDF të re.
  const [zoom, setZoom] = useState(null);
  useEffect(() => setZoom(null), [pdf]);

  // Printeri dhe kopjet zgjidhen këtu: dialogu i Windows-it s'ka parapamje për aplikacionin, parapamja është kjo dritare.
  const [printerat, setPrinterat] = useState(null);
  const [printeri, setPrinteri] = useState(DIALOGU_WINDOWS);
  const [kopjet, setKopjet] = useState(1);
  const [letra, setLetra] = useState(null); // { w, h } në mm, nga faqja e parë
  useEffect(() => {
    if (!pdf || !eshteDesktop || printerat) return;
    let anulo = false;
    window.labels
      .printerat()
      .then((lista) => {
        if (anulo) return;
        setPrinterat(lista);
        const iFundit = lexoPrinterin();
        const zgjedhur = lista.find((p) => p.emri === iFundit) || lista.find((p) => p.parazgjedhur) || lista[0];
        setPrinteri(iFundit === DIALOGU_WINDOWS ? DIALOGU_WINDOWS : zgjedhur?.emri ?? DIALOGU_WINDOWS);
      })
      .catch(() => !anulo && setPrinterat([]));
    return () => {
      anulo = true;
    };
  }, [pdf, printerat]);
  useEffect(() => {
    setKopjet(1);
    setLetra(null);
    if (!pdf) return;
    let anulo = false;
    (async () => {
      const doc = await pdfjsLib.getDocument({ data: await pdf.blob.arrayBuffer() }).promise;
      try {
        const v = (await doc.getPage(1)).getViewport({ scale: 1 });
        if (!anulo) setLetra({ w: Math.round(v.width * PT_NE_MM), h: Math.round(v.height * PT_NE_MM) });
      } finally {
        doc.destroy();
      }
    })().catch(() => {});
    return () => {
      anulo = true;
    };
  }, [pdf]);
  const zgjidhPrinterin = (emri) => {
    setPrinteri(emri);
    ruajPrinterin(emri);
  };
  const kalibrimi = kalibrimiI(kalibrimet, printeri);
  const paralajmerimTermik = printeri && letra && letra.w > 90 && eshteTermik(printeri);
  const zoomiAktual = zoom ?? 0.7;
  const zmadho = () => setZoom(HAPAT_E_ZOOMIT.find((z) => z > zoomiAktual + 0.01) ?? HAPAT_E_ZOOMIT[HAPAT_E_ZOOMIT.length - 1]);
  const zvogelo = () => setZoom([...HAPAT_E_ZOOMIT].reverse().find((z) => z < zoomiAktual - 0.01) ?? HAPAT_E_ZOOMIT[0]);

  const bajtet = async () => new Uint8Array(await pdf.blob.arrayBuffer());

  // Kur printimi direkt dështon (driveri, letra), PDF-ja hapet në lexuesin e Windows-it - printohet prej aty.
  const hapPasDeshtimit = async (arsyeja) => {
    const gabimi = await window.labels.hapPdf(await bajtet(), pdf.filename).catch((e) => e?.message || "gabim");
    onMesazh?.(
      "danger",
      gabimi
        ? `Printimi dështoi (${arsyeja}) dhe PDF-ja nuk u hap: ${gabimi}. Përdorni "Ruaj PDF".`
        : `Printimi direkt dështoi (${arsyeja}). PDF-ja u hap në lexuesin e PDF-ve - printojeni prej aty.`
    );
  };

  // Shfletuesi: dritarja e printimit e shfletuesit (në celular PDF-ja në skedë të re). Korrigjimi i printerit është
  // tashmë në PDF.
  const printoWeb = async () => {
    setDuke("printo");
    try {
      const r = await printoNeShfletues(pdf.blob);
      if (r === "bllokuar") onMesazh?.("danger", "Shfletuesi e bllokoi skedën e re - lejoni dritaret (pop-up) ose përdorni \"Ruaj PDF\".");
      else onUKrye?.("printim");
    } finally {
      setDuke(null);
    }
  };

  const printo = async () => {
    setDuke("printo");
    try {
      const { faqet, w, h } = await faqetPerPrintim(pdf.blob, (n, gjithsej) => setProgresi(`${n}/${gjithsej}`));
      setProgresi(null);
      const r = await window.labels.printoPdf(faqet, Math.round(w * 10) / 10, Math.round(h * 10) / 10, {
        printeri,
        kopjet,
        zhvendosjaX: kalibrimi.x,
        zhvendosjaY: kalibrimi.y,
        shkalla: kalibrimi.shkalla,
      });
      if (r?.ok) {
        onUKrye?.("printim");
        if (printeri) onMesazh?.("success", `U dërgua te ${printeri}${kopjet > 1 ? ` (${kopjet} kopje)` : ""}.`);
      }
      else if (!r?.anuluar) await hapPasDeshtimit(r?.arsyeja);
    } catch (err) {
      await hapPasDeshtimit(err?.message || String(err));
    } finally {
      setDuke(null);
      setProgresi(null);
    }
  };

  const ruaj = async () => {
    setDuke("ruaj");
    try {
      if (eshteDesktop) {
        const s = await window.labels.ruajPdf(await bajtet(), pdf.filename);
        if (s) {
          onMesazh?.("success", `U ruajt: ${s}`);
          onUKrye?.("pdf");
        }
      } else {
        const url = URL.createObjectURL(pdf.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = pdf.filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      onMesazh?.("danger", `Ruajtja dështoi: ${err?.message || err}`);
    } finally {
      setDuke(null);
    }
  };

  const hap = async () => {
    setDuke("hap");
    try {
      const gabimi = await window.labels.hapPdf(await bajtet(), pdf.filename);
      if (gabimi) onMesazh?.("danger", `PDF-ja nuk u hap: ${gabimi}`);
      else onUKrye?.("jashte");
    } finally {
      setDuke(null);
    }
  };

  return (
    <Modal show={Boolean(pdf)} onHide={onHide} size="xl" centered fullscreen="md-down" className="sp-modal">
      <Modal.Header closeButton>
        <Modal.Title>{titulli}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pdf-pamja">
        {pdf && <PdfKanvasi blob={pdf.blob} zoom={zoom} gjeresia={zoom && zoom > 1 ? Math.round(900 * Math.min(zoom, 2.5)) : 900} />}
      </Modal.Body>
      {!eshteDesktop && (
        <div className="pdf-printimi small text-white-50">
          <div>
            {eshteCelular()
              ? "\"Printo\" e hap PDF-në: printojeni ose ndajeni prej aty (p.sh. te printeri Wi-Fi). Zgjidhni A4 dhe madhësinë reale (100%), jo \"Fit\"."
              : "Te dritarja e printimit zgjidhni: Margjinat - Asnjë (None), Shkalla - 100% / Madhësia reale, jo \"Fit to page\"."}
            {kaKalibrim(kalibrimiI(kalibrimet, PRINTERI_I_SHFLETUESIT)) && (
              <span className="text-info"> Kalibrimi: {pershkrimiKalibrimit(kalibrimiI(kalibrimet, PRINTERI_I_SHFLETUESIT))}.</span>
            )}
          </div>
        </div>
      )}
      {eshteDesktop && (
        <div className="pdf-printimi">
          <Form.Group className="pdf-printimi-printeri">
            <Form.Label className="small mb-1">Printeri</Form.Label>
            <Form.Select size="sm" value={printeri} disabled={!printerat || Boolean(duke)} onChange={(e) => zgjidhPrinterin(e.target.value)}>
              {!printerat && <option value={printeri}>Duke i kërkuar printerat...</option>}
              {printerat?.map((p) => (
                <option key={p.emri} value={p.emri}>
                  {p.shfaqja}
                  {p.parazgjedhur ? " (parazgjedhur)" : ""}
                </option>
              ))}
              <option value={DIALOGU_WINDOWS}>Dritarja e printimit e Windows-it...</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="pdf-printimi-kopjet">
            <Form.Label className="small mb-1">Kopje</Form.Label>
            <Form.Control
              size="sm"
              type="number"
              min={1}
              max={99}
              value={kopjet}
              disabled={!printeri || Boolean(duke)}
              onChange={(e) => setKopjet(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 99))}
            />
          </Form.Group>
          <div className="pdf-printimi-info small">
            {letra && (
              <div>
                Letra: {letra.w === 210 && letra.h === 297 ? "A4" : `${letra.w} × ${letra.h} mm`} · pa margjina · madhësia reale (100%)
              </div>
            )}
            {printeri && kaKalibrim(kalibrimi) && <div className="text-info">Kalibrimi i printerit: {pershkrimiKalibrimit(kalibrimi)}</div>}
            {printerat?.length === 0 && <div className="text-warning">Nuk u gjet asnjë printer i instaluar.</div>}
            {paralajmerimTermik && <div className="text-warning">Ky duket printer kuponash (termik) - fleta {letra.w} mm nuk del e plotë në të.</div>}
            {printeri === DIALOGU_WINDOWS && <div className="text-white-50">Hapet dritarja e Windows-it (pa parapamje) - parapamja është kjo më sipër.</div>}
          </div>
        </div>
      )}
      <Modal.Footer>
        <div className="d-flex align-items-center gap-1 me-auto">
          <Button variant="secondary" size="sm" className="btn-cancel" title="Zvogëlo" disabled={zoom === HAPAT_E_ZOOMIT[0]} onClick={zvogelo}>
            <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
          </Button>
          <span className="small text-white-50 text-center" style={{ minWidth: 76 }}>
            {zoom ? `${Math.round(zoom * 100)}%` : "Përshtatur"}
          </span>
          <Button variant="secondary" size="sm" className="btn-cancel" title="Zmadho" disabled={zoom === HAPAT_E_ZOOMIT[HAPAT_E_ZOOMIT.length - 1]} onClick={zmadho}>
            <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
          </Button>
          <Button variant="secondary" size="sm" className="btn-cancel" title="Përshtate në dritare" disabled={!zoom} onClick={() => setZoom(null)}>
            <FontAwesomeIcon icon={faExpand} />
          </Button>
        </div>
        <Button variant="secondary" className="btn-cancel px-3" onClick={onHide}>
          Mbyll
        </Button>
        {eshteDesktop && (
          <Button variant="secondary" className="btn-cancel px-3" disabled={Boolean(duke)} onClick={hap} title="Hape në lexuesin e PDF-ve të Windows-it">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="me-2" />
            Hap jashtë
          </Button>
        )}
        <Button variant="secondary" className="btn-cancel px-3" disabled={Boolean(duke)} onClick={ruaj}>
          {duke === "ruaj" ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faFloppyDisk} className="me-2" />}
          Ruaj PDF
        </Button>
        {!eshteDesktop && (
          <Button className="btn-save px-4" disabled={Boolean(duke)} onClick={printoWeb}>
            {duke === "printo" ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faPrint} className="me-2" />}
            Printo
          </Button>
        )}
        {eshteDesktop && (
          <Button className="btn-save px-4" disabled={Boolean(duke)} onClick={printo}>
            {duke === "printo" ? <Spinner size="sm" animation="border" className="me-2" /> : <FontAwesomeIcon icon={faPrint} className="me-2" />}
            {duke === "printo" ? (progresi ? `Duke përgatitur ${progresi}...` : "Duke printuar...") : "Printo"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
