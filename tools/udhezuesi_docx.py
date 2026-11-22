"""Udhëzuesi në Word (public/FinanCareLabels-Udhezuesi.docx) nga src/lib/udhezuesi.json - e njëjta përmbajtje si
faqja "Udhëzuesi" brenda programit. Pas ndryshimit të JSON-it: python tools/udhezuesi_docx.py (kërkon python-docx)."""
import json
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor

RRENJA = Path(__file__).resolve().parent.parent
GJELBER = RGBColor(0x05, 0x96, 0x69)


def hije(qeliza, ngjyra):
    tcPr = qeliza._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), ngjyra)
    tcPr.append(shd)


def main():
    u = json.loads((RRENJA / "src/lib/udhezuesi.json").read_text(encoding="utf-8"))
    doc = Document()
    stili = doc.styles["Normal"]
    stili.font.name = "Calibri"
    stili.font.size = Pt(11)
    for emri in ("Title", "Heading 1"):
        doc.styles[emri].font.color.rgb = GJELBER

    if (RRENJA / "build/icon.png").exists():
        doc.add_picture(str(RRENJA / "build/icon.png"), width=Pt(48))
    doc.add_heading(u["titulli"], level=0)
    doc.add_paragraph(u["hyrja"])

    for s in u["seksionet"]:
        doc.add_heading(s["titulli"], level=1)
        for p in s.get("paragrafet", []):
            doc.add_paragraph(p)
        if s.get("tabela"):
            t = s["tabela"]
            tab = doc.add_table(rows=1, cols=len(t["koka"]))
            tab.style = "Table Grid"
            tab.alignment = WD_TABLE_ALIGNMENT.CENTER
            for i, k in enumerate(t["koka"]):
                q = tab.rows[0].cells[i]
                q.text = ""
                r = q.paragraphs[0].add_run(k)
                r.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                hije(q, "059669")
            for rr in t["rreshtat"]:
                qq = tab.add_row().cells
                qq[0].text = ""
                qq[0].paragraphs[0].add_run(rr[0]).bold = True
                qq[1].text = rr[1]
            doc.add_paragraph()
        # Numrat me dorë: "List Number" i python-docx s'e rinis numërimin në çdo kapitull.
        for i, h in enumerate(s.get("hapat", []), 1):
            p = doc.add_paragraph(style="List Paragraph")
            p.paragraph_format.left_indent = Pt(18)
            p.paragraph_format.first_line_indent = Pt(-14)
            p.add_run(f"{i}. ").bold = True
            p.add_run(h)

    dalja = RRENJA / "public/FinanCareLabels-Udhezuesi.docx"
    doc.save(dalja)
    print(f"U krijua {dalja}")


if __name__ == "__main__":
    main()
