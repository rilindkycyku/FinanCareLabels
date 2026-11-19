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
