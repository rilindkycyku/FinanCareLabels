import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/PremiumTheme.css";
import "./styles/DizajniPergjithshem.css";
import "./styles/PrintLabels.css";
import "./styles/EditoriQmimores.css";
import "./styles/app.css";
// Duhet të jetë i fundit: mbishkruan rregullat e temës së çelët
import "./styles/tema-e-bardhe.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Versioni në shfletues: instalohet në ekranin kryesor dhe punon pa internet pas vizitës së parë (public/sw.js).
// Në aplikacionin desktop (window.labels) s'ka service worker.
if (!window.labels && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    // eslint-disable-next-line no-undef
    navigator.serviceWorker.register(`/sw.js?v=${typeof __VERSIONI__ === "string" ? __VERSIONI__ : "0"}`).catch(() => {});
  });
}
