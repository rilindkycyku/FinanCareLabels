# Vizatimet e shablloneve Festive

Vizatimet e festave, të ndara sipas grupit të shabllonit (si te "Shabllonet e Çmimores"). Shabllonet i gjejnë me
adresën `/img/qmimore/festive/<grupi>/<skedari>` (shabllonetEGatshme/festive.js dhe galeria e editorit,
galeriaEImazheve.js). SVG-të duhet të kenë `viewBox`; para printimit kthehen në PNG 800 px
(shablloniQmimores.js `pergatitImazhet`).

Kur një vizatim zhvendoset ose riemërtohet, adresa e vjetër shtohet te `VIZATIMET_E_ZHVENDOSURA`
(shablloniQmimores.js), që shabllonet e ruajtura te "Të miat" ta gjejnë të renë.

```
festive/
├── fetare/
│   ├── xhamiaMeVije.png     Festive, Ramazani, Fitër Bajrami - posterat (urimi shkruhet mbi vijë)
│   ├── xhamiaMeDashin.png   Kurban Bajrami - posterat (vizatim me vijë: xhamia + dashi)
│   ├── xhamia.svg           Festive - raft
│   ├── xhamiaVale.png       Ramazani, Fitër Bajrami - raft
│   └── dashi.png            Kurban Bajrami - raft
├── kombetare/
│   ├── kosova.svg           17 Shkurti - Pavarësia e Kosovës (flag-icons)
│   └── shqiperia.svg        28 Nëntori - Dita e Flamurit (flag-icons)
├── gjate-vitit/
│   ├── babagjyshi.svg       Viti i Ri
│   └── tulipanet.png        8 Marsi
├── festime/
│   └── torta.png            Ditëlindja, Përvjetori i biznesit (vizatim me vijë, pa hapësirë bosh poshtë)
└── biznesi/
    └── ofertaSpeciale.svg   Ofertë speciale - shenja e uljes me % (nga SVG Repo, "sale-03", me vijën 1.6 në vend të 2)
```
