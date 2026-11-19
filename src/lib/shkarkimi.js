// Shkarkimi i një shablloni si skedar (.qmimore.json) - i njëjti format që e lexon "Importo" këtu dhe te
// "Shabllonet e Çmimores" në FinanCare, që shabllonet të kalojnë në të dy drejtimet.
export const shkarkoShabllonin = (emri, shablloni) => {
  if (!shablloni) return;
  const blob = new Blob([JSON.stringify({ lloji: "financare-qmimore", emri, shablloni }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const lidhja = document.createElement("a");
  lidhja.href = url;
  lidhja.download = `${String(emri || "").replace(/[\\/:*?"<>|]+/g, "_").trim() || "shabllon"}.qmimore.json`;
  lidhja.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
