// Festive: festat kombëtare, fetare dhe të biznesit. Vizatimet (SVG origjinale; flamujt nga flag-icons) janë te
// public/img/qmimore/festive/ - shablloniQmimores.pergatitImazhet i kthen në PNG para vizatimit.
// Çdo festë vjen në tri madhësi: poster 2 për fletë A4 (1x2, 200 × 143.5 mm), poster 4 për fletë (2x2,
// 100 × 143.5 mm) dhe - për festat më të shpeshta - raft 21 për fletë (3x7, 66.6 × 41 mm).
// Paraqitja e posterit ndjek dizajnin e vjetër "Festive" (qmimorjaPdf.js): koka me titullin dhe datën, emri,
// origjina, çmimi i vjetër i prerë me vulën ZBRITJE (vetëm me zbritjen reale), çmimi i madh dhe poshtë urimi
// me vizatimin e festës. Tekstet (titulli, urimi, "10 VJET") ndryshohen te kopja në "Shabllonet e Çmimores".
import { ZI, KUQE, GRI, shabllon, emri, tekst, qmimi } from "./baza";
import { BARDHE, kuti, vije, vule, flamur, korniza } from "./ndihmes";

const DOSJA = "/img/qmimore/festive/";
const A4 = (rrjeta) => ({ letra: "a4", rrjeta });

const imazh = (skedari, raporti, x, y, w, h, shtese = {}) => ({ lloji: "imazh", imazhi: DOSJA + skedari, raporti, x, y, w, h, ...shtese });

// Vizatimi me vijë (xhamia.png): vija e drejtë majtas, pastaj xhamia djathtas. Urimi shkruhet mbi pjesën e
// drejtë të vijës, si i nënvizuar prej saj. Përpjesët e imazhit (1800 × 491): vija në 70.6% të lartësisë,
// e drejtë deri në 60% të gjerësisë.
// trashesia = trashësia e vijës te skaji i majtë / lartësia e imazhit (vazhdimi majtas del njësoj i trashë).
const VIJA_XHAMIA = { skedari: "xhamia.png", raporti: 1800 / 491, yVijes: 0.709, fundiIDrejte: 0.6, trashesia: 5 / 491 };
// Kurban Bajrami: e njëjta vijë me xhaminë dhe dashin (560 × 161; vija në 73.3%, e drejtë deri në 71%).
const VIJA_KURBANI = { skedari: "kurbanBajrami.png", raporti: 560 / 161, yVijes: 0.733, fundiIDrejte: 0.71, trashesia: 5 / 161 };

// Poster 2 për fletë (200 × 143.5, horizontal).
const poster2 = (f) => [
  kuti(0, 0, 200, 22, { mbushja: f.koka }),
  tekst(f.titulli, 6, 2.5, f.koke ? 128 : 150, 11.5, { ngjyra: f.titulliNgjyra, rreshtimi: "left" }),
  tekst("{data}", 6, 14, f.koke ? 128 : 150, 6, { ngjyra: f.dataNgjyra, rreshtimi: "left", trashe: false }),
  f.koke ? tekst(f.koke, 140, 4, 54, 14, { ngjyra: f.titulliNgjyra, rreshtimi: "right" }) : null,
  emri(6, 24.5, 188, 22, { rreshtimi: "center", madhesia: 46 }),
  vije(6, 47, 188, 1.5, { vija: ZI, trashesia: 0.3 }),
  flamur(6, 49.5, 10, 7, "left"),
  tekst("{shteti}", 18, 49.5, 80, 7, { rreshtimi: "left", madhesia: 18 }),
  tekst("{barkodi}", 110, 49.5, 84, 7, { rreshtimi: "right", madhesia: 14, trashe: false, ngjyra: GRI }),
  // Me zbritje, krah për krah: vula, çmimi i vjetër i prerë në mes dhe çmimi i ri i madh djathtas (të ndarë qartë).
  vule(8, 61, 32, { kushti: "zbritje" }),
  qmimi("vjeter", 44, 66, 52, 22, { ngjyra: GRI, iPrere: true, rreshtimi: "center", kushti: "zbritje" }),
  qmimi("aktual", 102, 56, 92, 46, { ngjyra: KUQE, rreshtimi: "center", kushti: "zbritje" }),
  qmimi("aktual", 6, 58, 188, 46, { rreshtimi: "center", kushti: "paZbritje" }),
  vije(6, 104.5, 188, 1.5, { vija: ZI, trashesia: 0.3 }),
  ...(f.vija ? urimiMbiVije2(f) : [
    tekst(f.urimi, 6, 110, 120, 24, { rreshta: 2, rreshtimi: "left", ngjyra: f.urimiNgjyra || ZI }),
    imazh(f.imazhi, f.raporti, 130, 106.5, 64, 35),
    vije(6, 138, 120, 1.5, { vija: ZI, trashesia: 0.4 }),
  ]),
  korniza(200, 143.5),
].filter(Boolean);

// Poster 2: vizatimi me vijë djathtas poshtë (lartësia 33), vija vazhdon majtas deri te skaji nën urimin.
const urimiMbiVije2 = (f) => {
  const v = f.vija;
  const h = 33;
  const w = h * v.raporti;
  const x = 194 - w;
  const y = 108;
  const yV = y + h * v.yVijes;
  return [
    imazh(v.skedari, v.raporti, x, y, w, h),
    // Vazhdimi i vijës së imazhit deri te skaji majtas: në të njëjtën lartësi dhe me të njëjtën trashësi,
    // pak brenda imazhit që bashkimi të mos duket.
    vije(6, yV - 0.75, x - 6 + 1, 1.5, { vija: ZI, trashesia: h * v.trashesia }),
    tekst(f.urimi, 7, yV - 17, x + w * v.fundiIDrejte - 10, 15.5, { rreshta: 2, rreshtimi: "left", ngjyra: f.urimiNgjyra || ZI }),
  ];
};

// Poster 4 për fletë (100 × 143.5, në këmbë).
const poster4 = (f) => [
  kuti(0, 0, 100, 22, { mbushja: f.koka }),
  tekst(f.titulli, 4, 2.5, 92, 11, { ngjyra: f.titulliNgjyra, rreshta: 2 }),
  tekst("{data}", 4, 14.5, 92, 5.5, { ngjyra: f.dataNgjyra, trashe: false }),
  emri(4, 24, 92, 19, { rreshtimi: "center", madhesia: 30 }),
  vije(4, 44, 92, 1.5, { vija: ZI, trashesia: 0.3 }),
  flamur(4, 46.5, 8.5, 5.7, "left"),
  tekst("{shteti}", 14, 46.3, 82, 6, { rreshtimi: "left", madhesia: 14 }),
  vule(4, 55, 28, { kushti: "zbritje" }),
  qmimi("vjeter", 34, 54, 62, 11, { ngjyra: GRI, iPrere: true, rreshtimi: "center", kushti: "zbritje" }),
  qmimi("aktual", 34, 69.5, 62, 23.5, { ngjyra: KUQE, rreshtimi: "center", kushti: "zbritje" }),
  qmimi("aktual", 4, 55, 92, 37, { rreshtimi: "center", kushti: "paZbritje" }),
  vije(4, 94, 92, 1.5, { vija: ZI, trashesia: 0.3 }),
  ...(f.vija ? urimiMbiVije4(f) : [
    tekst(f.urimi, 4, 96.5, 92, 10.5, { rreshta: 2, ngjyra: f.urimiNgjyra || ZI }),
    imazh(f.imazhi, f.raporti, 8, 107.5, 84, 34),
  ]),
  korniza(100, 143.5),
];

// Poster 4: vizatimi me vijë në gjithë gjerësinë poshtë, urimi majtas mbi pjesën e drejtë të vijës.
const urimiMbiVije4 = (f) => {
  const v = f.vija;
  const w = 92;
  const h = w / v.raporti;
  const y = 141.5 - h;
  const yV = y + h * v.yVijes;
  return [
    imazh(v.skedari, v.raporti, 4, y, w, h),
    tekst(f.urimi, 5, yV - 13, w * v.fundiIDrejte - 3, 12, { rreshta: 2, rreshtimi: "left", ngjyra: f.urimiNgjyra || ZI }),
  ];
};

// Raft 21 për fletë (66.6 × 41): shirit me titullin, emri, çmimi; vizatimi i vogël kur s'ka zbritje.
// Me zbritje, në një rresht: vula, çmimi i vjetër i prerë në mes dhe çmimi i ri i madh djathtas - pa u
// mbivendosur njëri mbi tjetrin si kur ishin njëri mbi tjetrin.
const raft = (f) => [
  kuti(0, 0, 66.6, 7, { mbushja: f.koka }),
  tekst(f.titulliShkurt || f.titulli, 1.5, 0.9, 63.6, 5.2, { ngjyra: f.titulliNgjyra }),
  emri(1.5, 8, 63.6, 9, { madhesia: 14 }),
  vule(1.5, 19.5, 15, { kushti: "zbritje" }),
  imazh(f.imazhi, f.raporti, 1.5, 21, 16, 14, { kushti: "paZbritje" }),
  qmimi("vjeter", 18, 23, 17, 9, { ngjyra: GRI, iPrere: true, rreshtimi: "center", kushti: "zbritje" }),
  qmimi("aktual", 36.5, 18, 28.5, 21.5, { ngjyra: KUQE, kushti: "zbritje" }),
  qmimi("aktual", 19, 19, 46, 20.5, { kushti: "paZbritje" }),
  korniza(66.6, 41),
];

// Festat. koka = ngjyra e kokës; titulliNgjyra/dataNgjyra/urimiNgjyra = ngjyrat e teksteve; imazhi + raporti
// (gjerësi / lartësi e vizatimit - SVG-të janë 300 × 200 = 1.5, flamujt 640 × 480 = 1.333).
const FESTAT = [
  {
    celesi: "festa",
    grupi: "Fetare",
    vija: VIJA_XHAMIA,
    emri: "Festive",
    pershkrimi: "Oferta e festës - koka e verdhë, xhamia dhe urimi (dizajni i mëparshëm)",
    titulli: "OFERTA E FESTËS",
    urimi: "URIME FESTA!",
    koka: "#ffd966",
    titulliNgjyra: ZI,
    dataNgjyra: ZI,
    imazhi: "xhamia.svg",
    raporti: 1.5,
  },
  {
    celesi: "vitiRi",
    grupi: "Gjatë vitit",
    emri: "Viti i Ri",
    pershkrimi: "Oferta e Vitit të Ri - Babagjyshi",
    titulli: "OFERTA E VITIT TË RI",
    titulliShkurt: "VITI I RI",
    urimi: "GËZUAR VITIN E RI!",
    koka: "#1e3a8a",
    titulliNgjyra: "#fde68a",
    dataNgjyra: BARDHE,
    imazhi: "babagjyshi.svg",
    raporti: 1644.71 / 1757.8,
    raft: true,
  },
  {
    celesi: "pavaresiaKosoves",
    grupi: "Kombëtare",
    emri: "17 Shkurti - Pavarësia e Kosovës",
    pershkrimi: "Oferta e 17 Shkurtit - flamuri i Kosovës",
    titulli: "OFERTA E 17 SHKURTIT",
    titulliShkurt: "17 SHKURTI",
    urimi: "GËZUAR DITËN E PAVARËSISË SË KOSOVËS!",
    koka: "#244aa5",
    titulliNgjyra: "#f2d27a",
    dataNgjyra: BARDHE,
    imazhi: "kosova.svg",
    raporti: 640 / 480,
    raft: true,
  },
  {
    celesi: "ditaFlamurit",
    grupi: "Kombëtare",
    emri: "28 Nëntori - Dita e Flamurit",
    pershkrimi: "Oferta e 28 Nëntorit - Dita e Flamurit dhe e Pavarësisë së Shqipërisë",
    titulli: "OFERTA E 28 NËNTORIT",
    titulliShkurt: "28 NËNTORI",
    urimi: "URIME DITA E FLAMURIT DHE E PAVARËSISË!",
    koka: "#e41e20",
    titulliNgjyra: BARDHE,
    dataNgjyra: BARDHE,
    imazhi: "shqiperia.svg",
    raporti: 640 / 480,
    raft: true,
  },
  {
    celesi: "pervjetori",
    grupi: "Biznesi",
    emri: "Përvjetori i biznesit",
    pershkrimi: "Oferta e përvjetorit të marketit / restorantit - emri i biznesit, vitet dhe torta",
    titulli: "OFERTA E PËRVJETORIT",
    titulliShkurt: "{dyqani} · 10 VJET",
    // Vitet: ndryshojeni "10 VJET" te kopja e shabllonit.
    koke: "10 VJET",
    urimi: "{dyqani} - FALEMINDERIT QË JENI ME NE!",
    koka: "#6d28d9",
    titulliNgjyra: "#fde68a",
    dataNgjyra: BARDHE,
    imazhi: "torta.png",
    raporti: 1000 / 971,
  },
  {
    celesi: "ramazani",
    grupi: "Fetare",
    vija: VIJA_XHAMIA,
    emri: "Ramazani",
    pershkrimi: "Oferta e Ramazanit - hëna me yllin dhe fanarët",
    titulli: "OFERTA E RAMAZANIT",
    titulliShkurt: "RAMAZANI",
    urimi: "URIME MUAJI I SHENJTË I RAMAZANIT",
    koka: "#14532d",
    titulliNgjyra: BARDHE,
    dataNgjyra: "#f2c94c",
    imazhi: "xhamiaVale.png",
    raporti: 900 / 626,
    raft: true,
  },
  {
    celesi: "fiterBajrami",
    grupi: "Fetare",
    vija: VIJA_XHAMIA,
    emri: "Fitër Bajrami",
    pershkrimi: "Oferta e Fitër Bajramit - hëna me yllin",
    titulli: "OFERTA E FITËR BAJRAMIT",
    titulliShkurt: "FITËR BAJRAMI",
    urimi: "URIME FESTA E FITËR BAJRAMIT",
    koka: "#166534",
    titulliNgjyra: BARDHE,
    dataNgjyra: "#f2c94c",
    imazhi: "xhamiaVale.png",
    raporti: 900 / 626,
    raft: true,
  },
  {
    celesi: "kurbanBajrami",
    grupi: "Fetare",
    vija: VIJA_KURBANI,
    emri: "Kurban Bajrami",
    pershkrimi: "Oferta e Kurban Bajramit - dashi dhe hëna",
    titulli: "OFERTA E KURBAN BAJRAMIT",
    titulliShkurt: "KURBAN BAJRAMI",
    urimi: "URIME FESTA E KURBAN BAJRAMIT",
    koka: "#166534",
    titulliNgjyra: BARDHE,
    dataNgjyra: "#f2c94c",
    imazhi: "dashi.png",
    raporti: 899 / 900,
    raft: true,
  },
  {
    celesi: "teteMarsi",
    grupi: "Gjatë vitit",
    emri: "8 Marsi",
    pershkrimi: "Oferta e 8 Marsit - tulipanët",
    titulli: "OFERTA E 8 MARSIT",
    titulliShkurt: "8 MARSI",
    urimi: "GËZUAR 8 MARSIN, DITËN E GRUAS!",
    koka: "#be185d",
    titulliNgjyra: BARDHE,
    dataNgjyra: "#fde68a",
    imazhi: "tulipanet.png",
    raporti: 855 / 1000,
  },
  {
    celesi: "ditelindja",
    grupi: "Festime",
    emri: "Ditëlindja",
    pershkrimi: "Oferta e ditëlindjes - torta me qirinj",
    titulli: "OFERTA E DITËLINDJES",
    titulliShkurt: "DITËLINDJA",
    urimi: "GËZUAR DITËLINDJEN!",
    koka: "#db2777",
    titulliNgjyra: BARDHE,
    dataNgjyra: "#fde68a",
    imazhi: "torta.png",
    raporti: 1000 / 971,
    raft: true,
  },
  {
    celesi: "ofertaSpeciale",
    grupi: "Biznesi",
    emri: "Ofertë speciale",
    pershkrimi: "Ofertë e përgjithshme - ylli me përqindjen",
    titulli: "OFERTË SPECIALE",
    titulliShkurt: "OFERTË SPECIALE",
    urimi: "VETËM PËR PAK DITË!",
    koka: KUQE,
    titulliNgjyra: "#ffec00",
    dataNgjyra: BARDHE,
    urimiNgjyra: KUQE,
    imazhi: "ofertaSpeciale.svg",
    raporti: 1.5,
  },
];

// Nënkategoritë e tab-it "Festive" (çipat poshtë tab-it), në këtë radhë.
export const GRUPET_E_FESTAVE = ["Fetare", "Kombëtare", "Gjatë vitit", "Festime", "Biznesi"];

export default FESTAT.flatMap((f) => [
  { celesi: f.celesi, emri: `${f.emri} - 2 për fletë A4`, pershkrimi: f.pershkrimi, shablloni: shabllon(200, 143.5, A4("1x2"), poster2(f)) },
  { celesi: `${f.celesi}4`, emri: `${f.emri} - 4 për fletë A4`, pershkrimi: f.pershkrimi, shablloni: shabllon(100, 143.5, A4("2x2"), poster4(f)) },
  ...(f.raft
    ? [{ celesi: `${f.celesi}Raft`, emri: `${f.emri} - raft 21 për fletë A4`, pershkrimi: f.pershkrimi, shablloni: shabllon(66.6, 41, A4("3x7"), raft(f)) }]
    : []),
].map((sh) => ({ ...sh, nenkategoria: f.grupi })));
