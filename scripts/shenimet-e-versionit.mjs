// Shënimet e release-it në GitHub nga "Çka ka të re" (src/lib/ndryshimet.js): node scripts/shenimet-e-versionit.mjs 1.0.2
import { NDRYSHIMET } from "../src/lib/ndryshimet.js";

const versioni = String(process.argv[2] || "").replace(/^v/i, "");
const v = NDRYSHIMET.find((n) => n.versioni === versioni);
const rreshtat = v ? v.pikat.map(([lloji, teksti]) => `- **${lloji}:** ${teksti}`) : ["- Rregullime dhe përmirësime."];
console.log(`## FinanCare Labels ${versioni}

**Cilin ta shkarkoj?**
- \`FinanCare.Labels.Setup.${versioni}.exe\` - instaluesi, për kompjuterin ku punoni çdo ditë (pa leje administratori, shkurtore në Desktop/Start, përditësohet vetë).
- \`FinanCare.Labels.Portable.${versioni}.exe\` - pa instalim, për USB; të dhënat ruhen në dosjen FinanCareLabels-Data pranë exe-së.

Kush e ka programin, e merr këtë version vetë (njoftimi lart në program).

**Si ta instaloj? (dritarja blu "Windows protected your PC")**
Programi ende s'ka nënshkrim digjital, prandaj herën e parë Windows (Microsoft Defender SmartScreen) mund të shfaqë dritaren blu "Windows protected your PC" me "Publisher: Unknown publisher". Programi është i sigurt; vazhdoni kështu:
1. Hapni exe-në e shkarkuar (dy klikime).
2. Te dritarja blu klikoni **More info** (Më shumë informacion), poshtë tekstit.
3. Shfaqet butoni **Run anyway** - klikoni atë. Instalimi/programi niset.
4. Te instaluesi zgjidhni për kë instalohet (vetëm për ju ose për të gjithë përdoruesit) dhe vendin (**Browse...** për një disk/dosje tjetër - dosja "FinanCare Labels" krijohet vetë), pastaj **Install**. Shkurtorja krijohet në Desktop dhe në Start, dhe programi hapet në fund.

Këtë e bëni vetëm herën e parë; përditësimet më pas instalohen vetë. Nëse shfletuesi (Edge/Chrome) e bllokon shkarkimin, zgjidhni "Keep" / "Mbaje". Shkarkojeni vetëm nga kjo faqe e GitHub-it.

### Çka ka të re
${rreshtat.join("\n")}`);
