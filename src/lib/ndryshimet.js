// Çka ka të re: shfaqet vetë pas çdo përditësimi (versionet më të reja se i fundit i hapur) dhe te Cilësimet.
// Versioni i ri shtohet në krye. build.ps1 e rrit versionin e patch-it në çdo ndërtim.
export const NDRYSHIMET = [
  {
    versioni: "1.0.2",
    data: "2026-11-22",
    pikat: [
      ["E re", "Kur fikni barkodin, flamurin ose shtetin, çmimi dhe emri zmadhohen në vendin e lirë (opsioni \"Zmadho çmimin në vendin e lirë\")."],
      ["Rregullim", "Hapja e programit shumë më e shpejtë: programi shpaketohet vetëm herën e parë të çdo versioni, pranë exe-së te FinanCareLabels-Data si te ULM (me dritaren \"Duke u përgatitur\"), jo në çdo hapje; exe-ja më e vogël."],
      ["Rregullim", "Printimi s'humbet më te printeri (s'duhet shtypur \"Printo\" disa herë): punët dërgohen një nga një dhe dritarja e printimit pret derisa driveri ta marrë punën."],
      ["E re", "Kalibrimi i printerit (Cilësimet → Printeri): fleta e kalibrimit, matjet me vizore dhe korrigjimi i zhvendosjes e i shkallës për çdo printer - etiketat bien në vend edhe kur driveri e zhvendos ose e zvogëlon faqen."],
      ["E re", "Opsionet e etiketës: fik/ndiz flamurin, emrin e shtetit dhe vijat e prerjes, krahas barkodit dhe simbolit €."],
      ["E re", "Excel-at që s'janë shablloni ynë njihen sipas titujve (si te FinanCare Migrator: Emertimi, Naziv, Description, Cmimi shites, MPC, EAN...), edhe pa tituj sipas përmbajtjes; \"Lidh kolonat\" për t'i lidhur me dorë - lidhja ruhet për herët e tjera."],
      ["E re", "Tërhiq dhe lësho (drag & drop): Excel-i ose CSV-ja hapet duke e lëshuar në dritare; shablloni .qmimore.json importohet te Editori."],
      ["E re", "Hapja e CSV dhe ODS (LibreOffice), krahas xlsx/xls."],
      ["E re", "Udhëzuesi i përdorimit brenda programit dhe në Word."],
      ["E re", "Përditësimi automatik nga GitHub: programi njofton kur ka version të ri, e shkarkon dhe e zëvendëson exe-në portabël (të dhënat mbeten)."],
      ["E re", "Çka ka të re: kjo dritare, pas çdo përditësimi."],
      ["Rregullim", "Emrat me hapësira të dyfishta (p.sh. \"Sallam EXTRA  350GR\") s'dalin më me shkronja shumë të vogla."],
      ["Rregullim", "Printimi direkt pa \"fit to page\" (shkalla 100%) dhe paralajmërim kur etiketat janë më afër se 4 mm nga skaji i letrës."],
    ],
  },
  {
    versioni: "1.0.1",
    data: "2026-11-20",
    pikat: [
      ["E re", "Printeri dhe kopjet brenda aplikacionit, pa dialogun e Windows-it."],
      ["E re", "Margjina minimale me orientimin dhe rrjetën më të mirë për çdo shabllon (p.sh. 35 etiketa Raft për fletë)."],
      ["E re", "Fshirja e produkteve dhe \"Pastro\"."],
      ["Rregullim", "A4 peisazh printohet saktë; vijat e prerjes të zeza; shablloni Zbritje 71.5 pa mbivendosje."],
    ],
  },
  {
    versioni: "1.0.0",
    data: "2026-11-19",
    pikat: [["E re", "Versioni i parë: çmimorja e rafteve nga Excel-i, pa internet, me shabllonet dhe editorin e FinanCare-s, magjistarin e printimit, kopjet dhe historikun e printimeve."]],
  },
];

const numrat = (v) => String(v || "").replace(/^v/i, "").split(/[.-]/).map((x) => parseInt(x, 10) || 0);
export const krahasoVersionet = (a, b) => {
  const x = numrat(a);
  const y = numrat(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};

// Versionet pas "ngaVersioni" deri te "deriVersioni" (përfshirë); pa "ngaVersioni" - vetëm i fundit.
export const ndryshimetMes = (ngaVersioni, deriVersioni) =>
  NDRYSHIMET.filter((n) => krahasoVersionet(n.versioni, deriVersioni) <= 0 && (!ngaVersioni || krahasoVersionet(n.versioni, ngaVersioni) > 0));
