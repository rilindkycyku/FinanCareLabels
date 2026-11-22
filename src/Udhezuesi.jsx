import { useState } from "react";
import { Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileWord } from "@fortawesome/free-solid-svg-icons";
import UDHEZUESI from "./lib/udhezuesi.json";

// Udhëzuesi i përdorimit brenda programit (pa internet). E njëjta përmbajtje del edhe në Word
// (public/FinanCareLabels-Udhezuesi.docx, nga tools/udhezuesi_docx.py).
export default function Udhezuesi() {
  const [aktiv, setAktiv] = useState(UDHEZUESI.seksionet[0].id);
  const shko = (id) => {
    setAktiv(id);
    document.getElementById(`udh-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="lb-udhezuesi">
      <aside className="lb-udh-menyja">
        {UDHEZUESI.seksionet.map((s) => (
          <button key={s.id} type="button" className={aktiv === s.id ? "aktiv" : ""} onClick={() => shko(s.id)}>
            {s.titulli}
          </button>
        ))}
        <a className="btn btn-sm btn-cancel mt-3" href="/FinanCareLabels-Udhezuesi.docx" download="FinanCare Labels - Udhezuesi.docx">
          <FontAwesomeIcon icon={faFileWord} className="me-2 text-info" />
          Shkarko në Word
        </a>
      </aside>
      <div className="lb-udh-permbajtja custom-scrollbar">
        <h2 className="lb-udh-h1">{UDHEZUESI.titulli}</h2>
        <p className="text-white-50">{UDHEZUESI.hyrja}</p>
        {UDHEZUESI.seksionet.map((s) => (
          <section key={s.id} id={`udh-${s.id}`} className="ql-seksioni mb-3">
            <div className="ql-titulli-seksionit">{s.titulli}</div>
            {s.paragrafet?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.tabela && (
              <Table size="sm" variant="dark" className="sp-table mb-3">
                <thead>
                  <tr>
                    {s.tabela.koka.map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.tabela.rreshtat.map((r) => (
                    <tr key={r[0]}>
                      <td className="fw-semibold text-nowrap">{r[0]}</td>
                      <td>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {s.hapat && (
              <ol className="lb-udh-hapat">
                {s.hapat.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
