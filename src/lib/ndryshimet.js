// Çka ka të re: shfaqet vetë pas çdo përditësimi (versionet më të reja se i fundit i hapur) dhe te Cilësimet.
// Versioni i ri shtohet në krye. build.ps1 e rrit versionin e patch-it në çdo ndërtim.
export const NDRYSHIMET = [
  {
    versioni: "1.0.7",
    data: "2026-11-23",
    pikat: [
      ["E re", "Përditësimi tani bëhet vetë: versioni i ri shkarkohet në sfond dhe instalohet kur ta mbyllni programin. Nëse doni ta keni menjëherë, klikoni \"Përditëso tani\" te njoftimi lart. Një version i shkarkuar më parë s'shkarkohet sërish."],
      ["Rregullim", "Versioni i ri instalohet vërtet pas \"Përditëso tani\" - më parë programi mbyllej, por versioni i ri s'instalohej dhe njoftimi dilte sërish."],
      ["Rregullim", "\"Çka ka të re?\" te njoftimi i versionit të ri tregon vetëm listën e të rejave, si këtu - pa udhëzimet e shkarkimit dhe pa shenjat ** e `."],
    ],
  },
  {
    versioni: "1.0.6",
    data: "2026-11-23",
    pikat: [
      ["E re", "\"Printo bashkë me\": te Produktet zgjidhni fletët e tjera (edhe nga Excel-at e tjerë) që të printohen në të njëjtat faqe me fletën aktive - etiketat e tyre zënë vendet bosh pas këtyre, pa filluar faqe të re. Kursen letër; secila fletë mban zgjedhjet, ndryshimet dhe kopjet e veta, me shabllonin e fletës aktive."],
    ],
  },
  {
    versioni: "1.0.5",
    data: "2026-11-23",
    pikat: [
      ["E re", "Disa Excel-a njëherësh: te \"Hap Excel-in\" zgjidhni disa skedarë (ose lëshojini bashkë në dritare), dhe me \"Shto Excel\" shtoni të tjerë pa i mbyllur të hapurit. Fletët e secilit dalin veç e veç me emrin e skedarit para (p.sh. \"Book1 · Sheet1\"); çdo Excel mbyllet me ×."],
      ["Rregullim", "Njësia \"/kg\" del vetëm te malli që shitet me peshë (p.sh. \"Mollë KG\"). Kur \"kg\" vjen pas një numri (p.sh. \"Sheqer 5 kg\", \"Oriz 0,5kg\"), ajo është madhësia e paketimit: çmimi del pa \"/kg\"."],
    ],
  },
  {
    versioni: "1.0.4",
    data: "2026-11-22",
    pikat: [
      ["Rregullim", "Përditësimi automatik instalohet gjithmonë te dosja nga hapet programi, edhe kur dosja është zhvendosur ose riemërtuar pas instalimit. Më parë versioni i ri shkonte te dosja e vjetër dhe pas rihapjes dilte sërish mesazhi i përditësimit. Kur programi është instaluar për të gjithë përdoruesit, Windows-i kërkon leje administratori."],
    ],
  },
  {
    versioni: "1.0.3",
    data: "2026-11-22",
    pikat: [
      ["E re", "Zgjedhja e printerit \"Bardh e zi / Me ngjyra\" (parazgjedhja: bardh e zi): flamujt me kontrast - shqiponja e zezë në të bardhë në vend të së kuqes që dilte gri e errët - dhe ngjyrat e etiketës në të zezë, gri ose të bardhë; vula e zbritjes del e zezë me tekst të bardhë; edhe vizatimet e festave. Flamujt e Kosovës dhe Shqipërisë te festat me kornizë si flamujt e origjinës. Parapamja tregon saktë si del."],
      ["Rregullim", "Zbritjet: nga dy çmimet e një produkti, më i larti del gjithmonë si çmimi origjinal (i prerë) dhe më i ulëti si çmimi me zbritje - edhe kur kolonat e Excel-it janë të ndërruara (p.sh. çmimi i rregullt te \"CmimiZbritje\") ose çmimet shkruhen anasjelltas te tabela. Më parë zbritja humbte dhe dilte çmimi i gabuar."],
      ["E re", "\"Çmimi sa më i madh\": çmimi zë gjithë hapësirën bosh të etiketës (deri afër skajit dhe elementeve të tjera, pa i prekur) - 3% deri 22% më i madh sipas shabllonit, etiketat mbeten po aq të vogla në letër."],
      ["Rregullim", "Vija e prerjes së çmimit të vjetër s'del më jashtë çmimit (s'e pret vijën sipër, p.sh. te \"Oferta javore\")."],
      ["Rregullim", "Shkronjat e mëdha me shenjë sipër (Ë, Ä, Ö, Š, Č...) s'e prekin më vijën, kokën sipër ose skajin e etiketës: vendi i pikave të Ë-së rezervohet; titujt si \"OFERTË SPECIALE\" mbeten po aq të mëdhenj."],
      ["Rregullim", "Shablloni \"Raft - 30 për fletë (58.5 × 28.5 mm)\": emri i shtetit s'e prek më çmimin (p.sh. \"j\" te Gjermani)."],
      ["E re", "FinanCare Labels edhe në shfletues dhe celular, me printimin e telefonit dhe \"Ndaj\" - lidhja te faqja e programit."],
      ["Rregullim", "Pamja më kompakte: shkronjat, butonat, fushat dhe hapësirat më të vogla - në ekran hyjnë më shumë produkte njëherësh."],
      ["E re", "Cilësimet me hapa si te Printimi (Biznesi, Pamja, Printeri, Përditësimet, Të dhënat) - çdo hap hapet direkt ose kalohet. Në hapjen e parë programi ju udhëheq nëpër to, me \"Kalo konfigurimin\" për ta lënë për më vonë."],
      ["E re", "F11 për ekran të plotë dhe Ctrl+Shift+R për rifreskim."],
      ["E re", "\"Automatik me shabllone\" (Dizajni → Rafti): zgjidhni shabllonin për çdo rast - p.sh. produktet normale në \"Raft - 30 për fletë\", ato me zbritje në \"Me zbritje - raft\" dhe ato me shumicë në \"Pakicë + Shumicë\". Çdo grup del në fletët e veta, njëri pas tjetrit në të njëjtën PDF; zgjedhjet ruhen."],
      ["Rregullim", "Lista e shablloneve te Dizajni zë gjithë lartësinë e dritares (pa vend bosh poshtë)."],
      ["E re", "Te hapi i printimit shihet fleta e parë A4 me etiketat e saj (si do të dalë në letër), dhe përmbledhja në dy kolona."],
      ["Rregullim", "Printimi i PDF-ve të gjata nis menjëherë: faqet dërgohen te printeri në grupe me nga 20 - printeri punon ndërsa përgatiten të tjerat, pa pritur qindra faqe (kur printeri është zgjedhur te lista)."],
      ["Rregullim", "PDF-ja me shumë etiketa gjenerohet deri 5 herë më shpejt (p.sh. 2351 etiketa festive: rreth 1 sekondë në vend të 5-6)."],
      ["Rregullim", "Festive: titulli i ofertës s'ngjitet më me datën, dhe çmimi (sidomos pa zbritje) ka hapësirë nga rreshti i shtetit sipër dhe vija poshtë."],
      ["Rregullim", "Opsionet më të rregullta: kartela të vogla (Çmimi, Etiketa, Printeri, Fleta A4) me butona të vegjël në vend të çelësave të mëdhenj."],
      ["E re", "Butoni \"Anulo\" gjatë përgatitjes së printimit (\"Duke përgatitur 293/1176...\"): ndalet menjëherë, asgjë s'dërgohet te printeri."],
      ["E re", "Opsioni \"Barkodi në mes pa flamur\" (i ndezur): te produktet pa origjinë barkodi del në mes të vendit të flamurit e shtetit (zbret kur flamuri është poshtë, ngjitet kur është sipër, si te \"Klasike\") - çmimi s'lëviz."],
      ["E re", "Opsioni \"Numrat më të lartë\": kur ka vend bosh sipër ose poshtë çmimit, shifrat ngushtohen pak dhe dalin më të larta."],
      ["Rregullim", "PDF-ja me shumë faqe shfaqet më shpejt: faqja e parë del menjëherë, të tjerat shtohen ndërkohë."],
      ["Rregullim", "Excel-at me shumë produkte (mijëra rreshta) hapen menjëherë: tabela lëviz rrjedhshëm dhe ndryshimi i kopjeve, zgjedhja ose kërkimi s'e ngadalësojnë më programin."],
      ["E re", "Instaluesi: zgjidhni vetë ku instalohet (edhe në një disk tjetër) - dosja \"FinanCare Labels\" krijohet vetë; shkurtorja në Desktop kthehet edhe pas përditësimit nëse është fshirë."],
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

// Shënimet e release-it në GitHub (scripts/shenimet-e-versionit.mjs) → pikat [lloji, teksti] për "Çka ka të re".
// Merret vetëm seksioni "### Çka ka të re" (jo udhëzimet e shkarkimit/instalimit), pa shenjat e Markdown-it.
export const pikatNgaShenimet = (shenimet) => {
  const rreshtat = String(shenimet || "").split(/\r?\n/);
  const fillimi = rreshtat.findIndex((r) => /^#+\s*Çka ka të re/i.test(r.trim()));
  const pjesa = fillimi >= 0 ? rreshtat.slice(fillimi + 1) : rreshtat;
  const pastro = (t) => t.replace(/\*\*|__|`/g, "").trim();
  const pikat = [];
  for (const r of pjesa) {
    if (fillimi >= 0 && /^#+\s/.test(r.trim())) break;
    const m = /^\s*[-*]\s+(.*)$/.exec(r);
    if (!m) continue;
    const lloji = /^\*\*([^*:]+):?\*\*:?\s*(.*)$/.exec(m[1].trim());
    pikat.push(lloji ? [pastro(lloji[1]), pastro(lloji[2])] : ["E re", pastro(m[1])]);
  }
  return pikat;
};

// Versionet pas "ngaVersioni" deri te "deriVersioni" (përfshirë); pa "ngaVersioni" - vetëm i fundit.
export const ndryshimetMes = (ngaVersioni, deriVersioni) =>
  NDRYSHIMET.filter((n) => krahasoVersionet(n.versioni, deriVersioni) <= 0 && (!ngaVersioni || krahasoVersionet(n.versioni, ngaVersioni) > 0));
