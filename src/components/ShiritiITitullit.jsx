import { useEffect } from "react";

// Shiriti i titullit i aplikacionit desktop (si te FinanCare): dritarja s'ka title bar native - Windows-i vizaton
// vetëm butonat minimizo/maksimizo/mbyll (titleBarOverlay), pjesën tjetër ky komponent. Në shfletues s'shfaqet.
export default function ShiritiITitullit({ tema, faqja }) {
  const api = window.labels?.titlebar;

  useEffect(() => {
    if (!api) return undefined;
    document.documentElement.classList.add("ka-shiritin");
    return () => document.documentElement.classList.remove("ka-shiritin");
  }, [api]);

  useEffect(() => {
    api?.tema(tema).catch(() => {});
  }, [api, tema]);

  if (!api) return null;

  return (
    <div className="tb-shiriti">
      <div className="tb-permbajtja">
        <img className="tb-logo" src="/logo-shenja.svg" alt="" draggable={false} />
        <span className="tb-emri">FinanCare Labels</span>
        <div className="tb-titulli">{faqja}</div>
      </div>
    </div>
  );
}
