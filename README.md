# FinanCare Labels

Çmimorja e rafteve nga Excel-i, si aplikacion desktop **portabël** (një exe, pa instalim) dhe **pa internet**.
Përdor të njëjtin motor etiketash, shabllone të gatshme, flamuj (flag-icons), fontet (Barlow Condensed) dhe vizatime
festive si "Shtyp Çmimet" / "Shabllonet e Çmimores" te FinanCare.

## Si punon

1. **Printimi** – hapni `QmimePerRaft.xlsx` (ose një Excel tjetër me të njëjtat kolona). Çdo fletë (Raft,
   RaftMeZbritje, 9CopVaga, 9Cop, 2CopZbritje, 4Cop, QmimeFestive ...) del si tab me produktet e veta dhe shabllonin
   e sugjeruar. Zgjidhni shabllonin, hiqni rreshtat që s'duhen, "Gjenero çmimoren" → Printo / Ruaj PDF / Hap jashtë.
   Pasi ndryshoni Excel-in dhe e ruani, kthimi te programi e rilexon listën vetë.
2. **Editori i shablloneve** – i njëjti editor si te FinanCare: shabllonet tuaja, kopjimi i të gatshmeve,
   importi dhe **shkarkimi si skedar `.qmimore.json`** (edhe i shablloneve të gatshme), që hapet edhe te FinanCare.
3. **Cilësimet** – emri i biznesit (`{dyqani}`) dhe dosja e të dhënave.

4. **Udhëzuesi** – udhëzuesi i plotë brenda programit; i njëjti në Word te `public/FinanCareLabels-Udhezuesi.docx`
   (rigjenerohet nga `src/lib/udhezuesi.json` me `python tools/udhezuesi_docx.py`).

Excel-i ose CSV-ja hapet edhe duke e **tërhequr në dritare**; shablloni `.qmimore.json` importohet njësoj te Editori.

### Printeri dhe kalibrimi

Te Cilësimet → Printeri: "Printo fletën e kalibrimit", matni A (skaji majtas → korniza, 10 mm), B (skaji lart → korniza,
10 mm) dhe C (vija, 150 mm). Korrigjimi (zhvendosja X/Y dhe shkalla) ruhet për çdo printer dhe zbatohet te printimi direkt.
Printimi bëhet në 100%, punët dërgohen një nga një dhe dritarja e printimit mbetet e hapur derisa driveri ta marrë punën.

### Përditësimet

Programi kontrollon `releases/latest` te GitHub (repo publik, pa token). Exe-ja portabël e re shkarkohet pranë asaj
të vjetrës si `<exe>.perditesim` (verifikohet madhësia dhe SHA-256 kur GitHub e jep), pastaj një skript PowerShell i
fshehur pret mbylljen, e zëvendëson exe-në me të njëjtin emër dhe e hap përsëri. Në release duhet ngarkuar exe-ja
portabël (emri përmban "Portable" dhe mbaron me `.exe`). Çka ka të re: `src/lib/ndryshimet.js`.

### Kolonat e Excel-it

Rreshti i titujve kërkohet në 30 rreshtat e parë; kolonat njihen sipas emrit, me sinonime si te FinanCare Migrator
(`Pershkrimi`, `Naziv`, `Description`, `Cmimi shites`, `MPC`, `Price`, `EAN`, `Barcode`...). Pa tituj, kolonat gjenden
sipas përmbajtjes. Kur s'njihen, "Lidh kolonat" i lidh me dorë dhe lidhja ruhet sipas titujve për Excel-at e ardhshëm.

| Kolona | Kuptimi |
| --- | --- |
| `Shifra` | shifra e produktit (fusha `{shifra}`, p.sh. kodi i peshores) |
| `Barcodi` | barkodi; origjina (flamuri) del nga prefiksi GS1 |
| `Emertimi` | emri i produktit (rreshtat pa emër anashkalohen) |
| `Cmimi` / `Cmim` | çmimi |
| `CmimiZbritje` + `CmimiRregullt` | zbritje: i rregullti del i prerë, përqindja llogaritet |
| `CmimRi` + `CmimiVjeter` | njësoj (fleta festive) |
| `Origjina` | përdoret kur barkodi është i brendshëm |

`QmimePerRaft.xlsx` në repo ka vetëm të dhëna shembull.

## Hapja e shpejtë

Nisësi standard i exe-së portabël të electron-builder-it e shpaketon gjithë programin në `%TEMP%` në çdo hapje.
`build/nsis/portable.nsi` (e vendos `scripts/nisesi-portabel.mjs` para paketimit, nga `build.ps1` dhe `npm run dist`)
e shpaketon vetëm herën e parë të çdo versioni te `%LOCALAPPDATA%\FinanCareLabels\app-<versioni>`, me
`build/splash.bmp`, dhe fshin versionet e vjetra; hapjet e tjera nisin direkt. Paketohen vetëm gjuhët `en-US` të Chromium-it dhe me ngjeshje normale: exe-ja ~70 MB (më parë ~290 MB).

## Të dhënat

S'ka bazë të dhënash: Excel-i është burimi i produkteve; shabllonet dhe cilësimet ruhen si JSON në
`FinanCareLabels-Data\` pranë exe-së portabël (kopjohet bashkë me exe-në) ose në `%APPDATA%\FinanCareLabels`.

## Zhvillimi

```
npm install
npm approve-scripts electron esbuild   # npm 11 i bllokon postinstall-et
npm run electron:dev                   # vite build + electron
npm run dev                            # vetëm UI në shfletues (pa Excel/printim)
npm test                               # testet e leximit të Excel-it dhe kalibrimit
build.bat                              # exe portabël te release\
```
