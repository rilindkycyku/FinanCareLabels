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

### Kolonat e Excel-it

Rreshti i titujve kërkohet në krye të fletës; kolonat njihen sipas emrit:

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

## Të dhënat

S'ka bazë të dhënash: Excel-i është burimi i produkteve; shabllonet dhe cilësimet ruhen si JSON në
`FinanCareLabels-Data\` pranë exe-së portabël (kopjohet bashkë me exe-në) ose në `%APPDATA%\FinanCareLabels`.

## Zhvillimi

```
npm install
npm approve-scripts electron esbuild   # npm 11 i bllokon postinstall-et
npm run electron:dev                   # vite build + electron
npm run dev                            # vetëm UI në shfletues (pa Excel/printim)
build.bat                              # exe portabël te release\
```
