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

### Çka ka të re
${rreshtat.join("\n")}`);
