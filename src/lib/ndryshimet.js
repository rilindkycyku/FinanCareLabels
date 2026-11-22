// Çka ka të re: shfaqet vetë pas çdo përditësimi (versionet më të reja se i fundit i hapur) dhe te Cilësimet.
// Versioni i ri shtohet në krye. build.ps1 e rrit versionin e patch-it në çdo ndërtim.
export const NDRYSHIMET = [
  {
    versioni: "1.0.3",
    data: "2026-11-22",
    pikat: [
      ["E re", "Zgjedhja e printerit \"Bardh e zi / Me ngjyra\" (parazgjedhja: bardh e zi): flamujt me kontrast - shqiponja e zezë në të bardhë në vend të së kuqes që dilte gri e errët - dhe ngjyrat e etiketës në të zezë, gri ose të bardhë; vula e zbritjes del e zezë me tekst të bardhë; edhe vizatimet e festave. Flamujt e Kosovës dhe Shqipërisë te festat me kornizë si flamujt e origjinës. Parapamja tregon saktë si del."],
      ["Rregullim", "Zbritjet: nga dy çmimet e një produkti, më i larti del gjithmonë si çmimi origjinal (i prerë) dhe më i ulëti si çmimi me zbritje - edhe kur kolonat e Excel-it janë të ndërruara (p.sh. çmimi i rregullt te \"CmimiZbritje\") ose çmimet shkruhen anasjelltas te tabela. Më parë zbritja humbte dhe dilte çmimi i gabuar."],
      ["E re", "FinanCare Labels edhe në shfletues dhe celular, me printimin e telefonit dhe \"Ndaj\" - lidhja te faqja e programit."],
    ],
  },
  {
    versioni: "1.0.2",
    data: "2026-11-22",
    pikat: [
      ["E re", "Instaluesi (FinanCare Labels Setup): instalohet një herë pa leje administratori, me shkurtore në Desktop dhe Start, hapet shpejt dhe përditësohet vetë në heshtje. Portabli mbetet për USB; \"Merr të dhënat nga portabli\" te Cilësimet i kalon shabllonet dhe cilësimet."],
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
      ["Rregullim", "Kodet e shkurtra të brendshme (p.sh. 1200 për bananet, PLU-të e peshores) s'marrin më shtet nga \"prefiksi\" (dilte SHBA): origjina nga barkodi vetëm për barkodet me 8, 12, 13 ose 14 shifra; për të tjerat vlen kolona Origjina ose zgjedhja te tabela."],
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
