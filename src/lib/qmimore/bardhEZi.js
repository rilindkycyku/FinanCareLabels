// Printimi bardh e zi: shumica e printerave në dyqane janë lazer bardh e zi. Ngjyrat që ndryshojnë vetëm nga toni
// (p.sh. e kuqja dhe e zeza e flamurit shqiptar) dalin gri pothuajse njësoj dhe shqiponja humbet. Këtu:
// - flamujt: ngjyrat kryesore të çdo flamuri renditen sipas ndriçimit dhe marrin gri të ndara qartë (2 ngjyra: e zezë
//   dhe e bardhë; 3: e zezë, gri, e bardhë...) - Shqipëria del shqiponjë e zezë në të bardhë;
// - ngjyrat e shablloneve: të errëtat të zeza, të mesmet gri, të çelëtat të bardha (vula e kuqe me tekst të verdhë del
//   e zezë me tekst të bardhë).

const ndricimi = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// Ngjyra e shabllonit (mbushje / tekst) ose e vijës në bardh e zi. Vijat s'bëhen kurrë të bardha (do të zhdukeshin).
export const ngjyraBardhEZi = (r, g, b, vije = false) => {
  const l = ndricimi(r, g, b);
  // 110: e kuqja e vulës (≈95) dhe kokat rozë/blu të festave (≈105) dalin të zeza (teksti i bardhë dallohet), gria e
  // çmimit të vjetër (≈114) mbetet gri - vija e prerjes dallohet mbi të.
  if (l < 110) return 0;
  // 190: datat dhe titujt e artë/të verdhë mbi kokat e festave (≈199) dalin të bardha mbi të zezën.
  if (vije || l < 190) return 110;
  return 255;
};

const GRI_PER_NGJYRA = (n) => (n <= 1 ? [0] : Array.from({ length: n }, (_, i) => Math.round((255 * i) / (n - 1))));

// ImageData e flamurit (RGBA) në gri me kontrast: ngjyrat kryesore (≥ 2% e pikselave, deri në 5) gjenden me
// kuantizim, renditen sipas ndriçimit dhe secila merr një gri të barabartë larg tjetrës; çdo piksel merr grinë e
// ngjyrës kryesore më të afërt (edhe skajet e zbutura).
export const flamuriNeBardhEZi = (data) => {
  const numri = new Map();
  const shuma = new Map();
  let gjithsej = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    numri.set(k, (numri.get(k) || 0) + 1);
    const s = shuma.get(k) || [0, 0, 0];
    s[0] += data[i];
    s[1] += data[i + 1];
    s[2] += data[i + 2];
    shuma.set(k, s);
    gjithsej++;
  }
  if (!gjithsej) return data;
  let kryesoret = [...numri.entries()]
    .filter(([, n]) => n >= gjithsej * 0.02)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => {
      const s = shuma.get(k);
      return [s[0] / n, s[1] / n, s[2] / n];
    });
  // Bashkohen ngjyrat shumë të afërta (dy kova të së njëjtës ngjyrë).
  kryesoret = kryesoret.filter((c, i) => !kryesoret.slice(0, i).some((d) => Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) < 40));
  if (!kryesoret.length) return data;
  kryesoret.sort((a, b) => ndricimi(...a) - ndricimi(...b));
  // Një ngjyrë e vetme (flamur njëngjyrësh): ruhet ndriçimi i saj.
  const grite = kryesoret.length === 1 ? [Math.round(ndricimi(...kryesoret[0]))] : GRI_PER_NGJYRA(kryesoret.length);
  for (let i = 0; i < data.length; i += 4) {
    let mira = 0;
    let largesia = Infinity;
    for (let j = 0; j < kryesoret.length; j++) {
      const c = kryesoret[j];
      const d = (data[i] - c[0]) ** 2 + (data[i + 1] - c[1]) ** 2 + (data[i + 2] - c[2]) ** 2;
      if (d < largesia) {
        largesia = d;
        mira = j;
      }
    }
    data[i] = data[i + 1] = data[i + 2] = grite[mira];
  }
  return data;
};

// PNG (data URL) e flamurit → PNG bardh e zi (shfletuesi / Electron).
export const flamuriPngBardhEZi = async (dataUrl) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  flamuriNeBardhEZi(d.data);
  ctx.putImageData(d, 0, 0);
  return c.toDataURL("image/png");
};

// Imazhet e shabllonit (vizatimet e festave: flamuri shqiptar, i Kosovës, lulet...) në bardh e zi, si flamujt.
// Shablloni duhet të jetë i përgatitur (pergatitImazhet: imazhet si data URL PNG/JPEG). Memoria sipas imazhit.
const memoriaEImazheve = new Map();
export const shablloniBardhEZi = async (sh) => {
  if (!sh?.elementet?.some((el) => el.lloji === "imazh" && /^data:image\/(png|jpe?g)/i.test(el.imazhi || ""))) return sh;
  const elementet = await Promise.all(
    sh.elementet.map(async (el) => {
      if (el.lloji !== "imazh" || !/^data:image\/(png|jpe?g)/i.test(el.imazhi || "")) return el;
      if (!memoriaEImazheve.has(el.imazhi)) memoriaEImazheve.set(el.imazhi, flamuriPngBardhEZi(el.imazhi).catch(() => el.imazhi));
      return { ...el, imazhi: await memoriaEImazheve.get(el.imazhi) };
    })
  );
  return { ...sh, elementet };
};

// Ngjyrat e jsPDF-së (setFillColor / setTextColor / setDrawColor) në bardh e zi: (r, g, b) ose "#rrggbb".
export const argumentetBardhEZi = (argumentet, vije) => {
  let rgb = null;
  if (argumentet.length >= 3 && argumentet.slice(0, 3).every((v) => typeof v === "number")) rgb = argumentet.slice(0, 3);
  else if (typeof argumentet[0] === "string") {
    const m = /^#?([0-9a-f]{6})$/i.exec(argumentet[0].trim());
    if (m) {
      const n = parseInt(m[1], 16);
      rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
  }
  if (!rgb) return argumentet;
  const g = ngjyraBardhEZi(rgb[0], rgb[1], rgb[2], vije);
  return [g, g, g];
};
