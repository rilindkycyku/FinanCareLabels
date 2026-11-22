'use strict'

// FinanCare Labels si aplikacion desktop portabël: pa backend, pa internet. UI-ja (dist/) shërbehet me
// protokollin app://, të dhënat (shabllonet, cilësimet) ruhen si JSON.
//
// Mënyra USB (si te ULM): exe-ja portabël krijon pranë vetes dosjen "FinanCareLabels-Data" dhe gjithçka -
// edhe sesioni i Electron-it - ruhet atje, pa lënë gjurmë në kompjuter. I instaluari (Setup) dhe pa atë dosje: %APPDATA%.

const path = require('path')
const fs = require('fs')
const os = require('os')
const { pathToFileURL } = require('url')
const { spawn } = require('child_process')
const crypto = require('crypto')
const { app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, shell } = require('electron')

const EXE_PORTABEL = Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
const EXE_DIR = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'))
const USB_DATA_DIR = path.join(EXE_DIR, 'FinanCareLabels-Data')
if (app.isPackaged && EXE_PORTABEL && !fs.existsSync(USB_DATA_DIR)) {
  try { fs.mkdirSync(USB_DATA_DIR, { recursive: true }) } catch { /* disk vetëm për lexim: %APPDATA% */ }
}
const IS_PORTABLE = app.isPackaged && fs.existsSync(USB_DATA_DIR)
const DATA_DIR = IS_PORTABLE ? USB_DATA_DIR : path.join(app.getPath('appData'), 'FinanCareLabels')
fs.mkdirSync(DATA_DIR, { recursive: true })
if (IS_PORTABLE) app.setPath('userData', path.join(DATA_DIR, 'electron'))

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
app.setAppUserModelId('com.rilindkycyku.financarelabels')

const DIST = path.join(__dirname, '..', 'dist')
const SKEDARET = { shabllonet: 'shabllonet.json', cilesimet: 'cilesimet.json', produktet: 'produktet.json', printimet: 'printimet.json' }

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
])

let mainWindow = null

/* ---------- Të dhënat (JSON) ---------- */

const shtegu = (emri) => {
  if (!SKEDARET[emri]) throw new Error(`Skedar i panjohur: ${emri}`)
  return path.join(DATA_DIR, SKEDARET[emri])
}

ipcMain.handle('te-dhenat:lexo', (_e, emri) => {
  try {
    return JSON.parse(fs.readFileSync(shtegu(emri), 'utf8'))
  } catch {
    return null
  }
})

// Shkrim atomik: skedari i përkohshëm + rename, që ndërprerja të mos e lërë JSON-in gjysmak.
ipcMain.handle('te-dhenat:ruaj', (_e, emri, vlera) => {
  const s = shtegu(emri)
  const tmp = `${s}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(vlera, null, 2), 'utf8')
  fs.renameSync(tmp, s)
  return true
})

ipcMain.handle('te-dhenat:dosja', () => DATA_DIR)
ipcMain.handle('app:menyra', () => (!app.isPackaged ? 'zhvillim' : EXE_PORTABEL ? 'portabel' : 'instaluar'))

// Kalimi nga portabli te i instaluari: shabllonet, cilësimet, produktet dhe historiku merren nga dosja
// FinanCareLabels-Data e portablit (kopjohen; ato ekzistuese ruhen si .para-importit).
ipcMain.handle('te-dhenat:importo-nga-dosja', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Zgjidh dosjen FinanCareLabels-Data të versionit portabël',
    properties: ['openDirectory']
  })
  if (r.canceled || !r.filePaths[0]) return null
  const burimi = r.filePaths[0]
  if (path.resolve(burimi) === path.resolve(DATA_DIR)) throw new Error('Kjo është dosja e këtij programi.')
  const teGjetura = Object.values(SKEDARET).filter((f) => fs.existsSync(path.join(burimi, f)))
  if (!teGjetura.length) throw new Error('Në këtë dosje s\'ka shabllone ose cilësime të FinanCare Labels.')
  for (const f of teGjetura) {
    JSON.parse(fs.readFileSync(path.join(burimi, f), 'utf8')) // vetëm JSON i vlefshëm
    const synimi = path.join(DATA_DIR, f)
    if (fs.existsSync(synimi)) fs.copyFileSync(synimi, `${synimi}.para-importit`)
    fs.copyFileSync(path.join(burimi, f), synimi)
  }
  return teGjetura.length
})
ipcMain.handle('te-dhenat:hap-dosjen', () => shell.openPath(DATA_DIR))

/* ---------- Excel-i ---------- */

ipcMain.handle('excel:zgjidh', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Zgjidh Excel-in me çmimet',
    filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'xlsm', 'xls', 'ods', 'csv'] }],
    properties: ['openFile']
  })
  return r.canceled ? null : r.filePaths[0]
})

// Bajtet e skedarit; null nëse s'ekziston. Excel-i i hapur lejon leximin (ndarje leximi në Windows).
ipcMain.handle('excel:lexo', (_e, skedari) => {
  try {
    if (!/\.(xlsx|xlsm|xls|ods|csv)$/i.test(skedari || '')) return null
    return fs.readFileSync(skedari)
  } catch (err) {
    return { gabim: err.code === 'EBUSY' ? 'Skedari është i bllokuar nga një program tjetër.' : err.message }
  }
})

ipcMain.handle('excel:hap', (_e, skedari) => (skedari ? shell.openPath(skedari) : ''))

/* ---------- PDF-ja: ruaj, hap, printo ---------- */

const emerISigurt = (emri) => (String(emri || 'Qmimorja').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Qmimorja').replace(/(\.pdf)?$/i, '.pdf')

ipcMain.handle('pdf:ruaj', async (_e, bajtet, emri) => {
  const r = await dialog.showSaveDialog(mainWindow, {
    title: 'Ruaj PDF-në',
    defaultPath: path.join(app.getPath('documents'), emerISigurt(emri)),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (r.canceled || !r.filePath) return null
  fs.writeFileSync(r.filePath, Buffer.from(bajtet))
  return r.filePath
})

// Hapet në lexuesin e PDF-ve të Windows-it (Edge, Acrobat...) - prej aty edhe printohet.
ipcMain.handle('pdf:hap', async (_e, bajtet, emri) => {
  const dosja = path.join(os.tmpdir(), 'FinanCareLabels')
  fs.mkdirSync(dosja, { recursive: true })
  const s = path.join(dosja, `${Date.now()}-${emerISigurt(emri)}`)
  fs.writeFileSync(s, Buffer.from(bajtet))
  const gabimi = await shell.openPath(s)
  return gabimi || ''
})

// Printerat e Windows-it, për zgjedhjen te dritarja e printimit e aplikacionit.
ipcMain.handle('printerat:lista', async () => {
  const lista = await mainWindow.webContents.getPrintersAsync()
  return lista.map((p) => ({ emri: p.name, shfaqja: p.displayName || p.name, parazgjedhur: Boolean(p.isDefault) }))
})

// Printimi direkt: faqet (PNG, të vizatuara nga pdf.js te faqja) në një dritare të fshehur, pastaj direkt te printeri
// i zgjedhur në aplikacion (pa dialogun e Windows-it, që s'ka parapamje për Electron-in). Pa printer: dialogu i Windows-it.
// Madhësia e letrës = madhësia e faqes së PDF-së.
// Punët e printimit dërgohen një nga një: dy printime njëkohësisht te i njëjti driver shpesh humbin njërin.
let radhaEPrintimit = Promise.resolve()
ipcMain.handle('pdf:printo', (_e, ...args) => {
  const puna = radhaEPrintimit.then(() => printoFaqet(...args))
  radhaEPrintimit = puna.catch(() => {})
  return puna
})

async function printoFaqet(faqet, gjeresiaMm, lartesiaMm, opsionet = {}) {
  const afer = (a, b) => Math.abs(a - b) < 1.5
  const eshteA4 = afer(gjeresiaMm, 210) && afer(lartesiaMm, 297)
  const eshteA4Peisazh = afer(gjeresiaMm, 297) && afer(lartesiaMm, 210)
  // A4 peisazh: letra A4 me orientim peisazh (jo madhësi me porosi 297 × 210, që driverët e kthejnë në A4 portret
  // dhe e zvogëlojnë fletën) - njësoj te @page dhe te opsionet e printimit.
  const madhesiaEFaqes = eshteA4Peisazh ? 'A4 landscape' : eshteA4 ? 'A4 portrait' : `${gjeresiaMm}mm ${lartesiaMm}mm`
  // Kalibrimi i printerit (Cilësimet → Printeri): zhvendosja në mm dhe shkalla në %, që driveri e humb/shton.
  const nr = (v, d, min, max) => (Number.isFinite(Number(v)) ? Math.min(Math.max(Number(v), min), max) : d)
  const dx = nr(opsionet.zhvendosjaX, 0, -20, 20)
  const dy = nr(opsionet.zhvendosjaY, 0, -20, 20)
  const shkalla = nr(opsionet.shkalla, 100, 80, 120) / 100
  const transformimi = dx || dy || shkalla !== 1 ? `transform: translate(${dx}mm, ${dy}mm) scale(${shkalla}); transform-origin: 0 0;` : ''
  // Çdo faqe në një kuti me madhësinë e letrës (overflow: hidden), që zhvendosja të mos krijojë faqe të tepërta.
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${madhesiaEFaqes}; margin: 0; }
    html, body { margin: 0; padding: 0; }
    .faqja { width: ${gjeresiaMm}mm; height: ${lartesiaMm - 0.5}mm; overflow: hidden; page-break-after: always; break-after: page; }
    .faqja:last-child { page-break-after: auto; break-after: auto; }
    img { display: block; width: ${gjeresiaMm}mm; height: ${lartesiaMm - 0.5}mm; ${transformimi} }
  </style></head><body>${faqet.map((f) => `<div class="faqja"><img src="${f}"></div>`).join('')}</body></html>`
  const dosja = path.join(os.tmpdir(), 'FinanCareLabels')
  fs.mkdirSync(dosja, { recursive: true })
  const s = path.join(dosja, `printimi-${Date.now()}.html`)
  fs.writeFileSync(s, html, 'utf8')
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, backgroundThrottling: false } })
  let uDergua = false
  try {
    await w.loadFile(s)
    // Imazhet e faqeve (PNG të mëdha 300 dpi) duhet të jenë të dekoduara para printimit, përndryshe driveri merr
    // faqe bosh ose s'e merr punën fare.
    await w.webContents.executeJavaScript('Promise.all([...document.images].map((i) => i.decode().catch(() => {}))).then(() => true)', true).catch(() => {})
    // A4 si letër standarde e Windows-it (madhësia me porosi s'pranohet nga shumë drivera, që e kthejnë në A4 portret
    // dhe e zvogëlojnë fletën peisazh); A4 peisazh = 'A4' + landscape. Tjetër madhësi vetëm kur s'është A4.
    const pageSize = eshteA4 || eshteA4Peisazh ? 'A4' : { width: Math.round(gjeresiaMm * 1000), height: Math.round(lartesiaMm * 1000) }
    return await new Promise((resolve) => {
      const printeri = typeof opsionet.printeri === 'string' ? opsionet.printeri : ''
      const kopjet = Math.min(Math.max(parseInt(opsionet.kopjet) || 1, 1), 99)
      // scaleFactor 100: pa "fit to page" të Chromium-it - madhësia reale; korrigjimi i driverit vjen nga kalibrimi.
      const cilesimet = { silent: Boolean(printeri), printBackground: true, margins: { marginType: 'none' }, pageSize, landscape: eshteA4Peisazh, copies: kopjet, scaleFactor: 100 }
      if (printeri) cilesimet.deviceName = printeri
      w.webContents.print(cilesimet, (ok, arsyeja) => {
        uDergua = ok
        resolve({ ok, anuluar: !ok && /cancel/i.test(arsyeja || ''), arsyeja: ok ? '' : arsyeja || 'Printimi dështoi' })
      })
    })
  } finally {
    // "ok" vjen kur puna hyn në radhën e Windows-it, jo kur driveri e ka marrë të gjithë: dritarja që mbyllet menjëherë
    // e anulon punën te disa printera (duhej shtypur "Printo" 2-3 herë). Mbetet e hapur edhe 20 s.
    const mbyll = () => {
      if (!w.isDestroyed()) w.destroy()
      fs.rm(s, { force: true }, () => {})
    }
    if (uDergua) setTimeout(mbyll, 20000)
    else mbyll()
  }
}

/* ---------- Përditësimi automatik nga GitHub Releases ---------- */

// Exe-ja portabël s'mund ta mbishkruajë veten ndërsa xhiron: versioni i ri shkarkohet pranë saj si
// "<exe>.perditesim", pastaj një skript i fshehur pret mbylljen e programit, e zëvendëson exe-në (i njëjti emër, ndaj
// shkurtoret mbeten) dhe e nis përsëri. Dosja FinanCareLabels-Data pranë exe-së s'preket.
const REPO = 'rilindkycyku/FinanCareLabels'
const EXE_PORTABEL_SKEDARI = process.env.PORTABLE_EXECUTABLE_FILE || ''
// I instaluari (Setup) përditësohet me Setup-in e ri, në heshtje (/S), dhe hapet vetë pas instalimit (--force-run).
const I_INSTALUAR = app.isPackaged && !EXE_PORTABEL && process.platform === 'win32'
let perditesimi = null // { versioni, url, madhesia, sha256, faqja, shenimet }
let skedariIShkarkuar = ''

const versioniNumra = (v) => String(v || '').replace(/^v/i, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0)
const eshteMeIRi = (a, b) => {
  const x = versioniNumra(a)
  const y = versioniNumra(b)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0)
  }
  return false
}

ipcMain.handle('app:versioni', () => app.getVersion())

ipcMain.handle('perditesimi:kontrollo', async () => {
  const r = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'FinanCareLabels-Updater' }
  })
  if (!r.ok) throw new Error(`GitHub: ${r.status}`)
  const d = await r.json()
  const versioni = String(d.tag_name || '').replace(/^v/i, '')
  const asetet = (d.assets || []).filter((a) => /\.exe$/i.test(a.name))
  // Portabli merr exe-në "Portable", i instaluari "Setup" - secili zëvendësohet me llojin e vet.
  const exe = I_INSTALUAR ? asetet.find((a) => /setup/i.test(a.name)) : asetet.find((a) => /portable/i.test(a.name)) || asetet.find((a) => !/setup/i.test(a.name))
  const iRi = Boolean(versioni) && eshteMeIRi(versioni, app.getVersion())
  perditesimi = iRi && exe
    ? {
        versioni,
        url: exe.browser_download_url,
        madhesia: exe.size,
        sha256: /^sha256:([0-9a-f]{64})$/i.exec(exe.digest || '')?.[1]?.toLowerCase() || '',
        faqja: d.html_url,
        shenimet: String(d.body || '')
      }
    : null
  return {
    aktual: app.getVersion(),
    iRi: Boolean(perditesimi),
    versioni,
    shenimet: String(d.body || ''),
    madhesia: exe?.size || 0,
    faqja: d.html_url,
    // Portabli dhe i instaluari përditësohen vetë; në zhvillim hapet faqja e versionit.
    vetvetiu: Boolean(EXE_PORTABEL_SKEDARI) || I_INSTALUAR
  }
})

ipcMain.handle('perditesimi:shkarko', async (event) => {
  if (!perditesimi) throw new Error('S\'ka version të ri.')
  if (!EXE_PORTABEL_SKEDARI && !I_INSTALUAR) {
    shell.openExternal(perditesimi.faqja)
    return { hapurFaqja: true }
  }
  let destinacioni = `${EXE_PORTABEL_SKEDARI}.perditesim`
  if (I_INSTALUAR) {
    const dosja = path.join(app.getPath('temp'), 'FinanCareLabels-perditesimi')
    fs.mkdirSync(dosja, { recursive: true })
    destinacioni = path.join(dosja, `FinanCare Labels Setup ${perditesimi.versioni}.exe`)
  }
  const r = await net.fetch(perditesimi.url, { headers: { 'User-Agent': 'FinanCareLabels-Updater' } })
  if (!r.ok || !r.body) throw new Error(`Shkarkimi dështoi: ${r.status}`)
  const gjithsej = Number(r.headers.get('content-length')) || perditesimi.madhesia || 0
  const hash = crypto.createHash('sha256')
  const shkrimi = fs.createWriteStream(destinacioni)
  let marre = 0
  let iFundit = 0
  try {
    const lexuesi = r.body.getReader()
    for (;;) {
      const { done, value } = await lexuesi.read()
      if (done) break
      const copa = Buffer.from(value)
      hash.update(copa)
      marre += copa.length
      if (!shkrimi.write(copa)) await new Promise((ok) => shkrimi.once('drain', ok))
      const tani = Date.now()
      if (tani - iFundit > 250) {
        iFundit = tani
        if (!event.sender.isDestroyed()) event.sender.send('perditesimi:progresi', { marre, gjithsej })
      }
    }
    await new Promise((ok, gabim) => shkrimi.end((e) => (e ? gabim(e) : ok())))
  } catch (err) {
    shkrimi.destroy()
    fs.rm(destinacioni, { force: true }, () => {})
    throw err
  }
  if (perditesimi.madhesia && marre !== perditesimi.madhesia) {
    fs.rm(destinacioni, { force: true }, () => {})
    throw new Error('Skedari i shkarkuar është i paplotë. Provoni përsëri.')
  }
  if (perditesimi.sha256 && hash.digest('hex') !== perditesimi.sha256) {
    fs.rm(destinacioni, { force: true }, () => {})
    throw new Error('Skedari i shkarkuar s\'përputhet me versionin në GitHub (SHA-256).')
  }
  skedariIShkarkuar = destinacioni
  return { gati: true, versioni: perditesimi.versioni }
})

ipcMain.handle('perditesimi:instalo', () => {
  if (!skedariIShkarkuar || process.platform !== 'win32') return false
  if (I_INSTALUAR) {
    // Instaluesi pret pak që programi të mbyllet, instalon në heshtje në të njëjtën dosje dhe e hap përsëri.
    const thonjeza = (v) => `'${String(v).replace(/'/g, "''")}'`
    const skripti = [
      'Start-Sleep -Seconds 2',
      `Start-Process -FilePath ${thonjeza(skedariIShkarkuar)} -ArgumentList '/S','--updated','--force-run' -Wait`,
      `Remove-Item -LiteralPath ${thonjeza(skedariIShkarkuar)} -Force -ErrorAction SilentlyContinue`
    ].join('\n')
    spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-EncodedCommand', Buffer.from(skripti, 'utf16le').toString('base64')], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    }).unref()
    setTimeout(() => app.quit(), 200)
    return true
  }
  if (!EXE_PORTABEL_SKEDARI) return false
  const thonjeza = (v) => `'${String(v).replace(/'/g, "''")}'`
  const skripti = [
    `$exe = ${thonjeza(EXE_PORTABEL_SKEDARI)}`,
    `$iRi = ${thonjeza(skedariIShkarkuar)}`,
    // Pret derisa exe-ja e vjetër të lirohet (programi u mbyll), deri 2 minuta.
    'for ($i = 0; $i -lt 160; $i++) {',
    '  Start-Sleep -Milliseconds 750',
    '  try { Move-Item -LiteralPath $iRi -Destination $exe -Force -ErrorAction Stop; break } catch {}',
    '}',
    'Start-Process -FilePath $exe'
  ].join('\n')
  const komanda = Buffer.from(skripti, 'utf16le').toString('base64')
  spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-EncodedCommand', komanda], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  }).unref()
  setTimeout(() => app.quit(), 200)
  return true
})

/* ---------- Dritarja ---------- */

// Shiriti i titullit vizatohet nga faqja (src/components/ShiritiITitullit.jsx, si te FinanCare); Windows-i vizaton
// vetëm butonat minimizo/maksimizo/mbyll, me ngjyrat e temës. Lartësia = --tb-h te app.css.
const LARTESIA_E_SHIRITIT = 36
const NGJYRAT_E_SHIRITIT = {
  light: { color: '#ffffff', symbolColor: '#0f172a' },
  dark: { color: '#121212', symbolColor: '#f1f5f9' }
}

ipcMain.handle('titlebar:tema', (event, tema) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) return
  try {
    mainWindow.setTitleBarOverlay({ ...NGJYRAT_E_SHIRITIT[tema === 'dark' ? 'dark' : 'light'], height: LARTESIA_E_SHIRITIT })
  } catch {
    /* s'ka overlay (p.sh. jo Windows) */
  }
})

function krijoDritaren() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#f1f5f9', // tema e bardhë është parazgjedhja
    title: 'FinanCare Labels',
    icon: path.join(DIST, 'logo.png'),
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: { ...NGJYRAT_E_SHIRITIT.light, height: LARTESIA_E_SHIRITIT },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  // Lidhjet e jashtme (s'duhet të ketë) hapen në shfletues, jo brenda aplikacionit.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) e.preventDefault()
  })
  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'app://labels/index.html')
  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
})

app.whenReady().then(() => {
  // app://labels/<shtegu> → dist/<shtegu>; asgjë jashtë dist/.
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url)
    const s = path.normalize(path.join(DIST, decodeURIComponent(pathname)))
    if (!s.startsWith(DIST)) return new Response('Nuk lejohet', { status: 403 })
    return net.fetch(pathToFileURL(fs.existsSync(s) && fs.statSync(s).isFile() ? s : path.join(DIST, 'index.html')).toString())
  })
  Menu.setApplicationMenu(null)
  krijoDritaren()
})

app.on('window-all-closed', () => app.quit())
