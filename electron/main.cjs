'use strict'

// FinanCare Labels si aplikacion desktop portabël: pa backend, pa internet. UI-ja (dist/) shërbehet me
// protokollin app://, të dhënat (shabllonet, cilësimet) ruhen si JSON.
//
// Mënyra USB (si te ULM): exe-ja portabël krijon pranë vetes dosjen "FinanCareLabels-Data" dhe gjithçka -
// edhe sesioni i Electron-it - ruhet atje, pa lënë gjurmë në kompjuter. Pa atë dosje: %APPDATA%.

const path = require('path')
const fs = require('fs')
const os = require('os')
const { pathToFileURL } = require('url')
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
ipcMain.handle('te-dhenat:hap-dosjen', () => shell.openPath(DATA_DIR))

/* ---------- Excel-i ---------- */

ipcMain.handle('excel:zgjidh', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Zgjidh Excel-in me çmimet',
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xlsm', 'xls'] }],
    properties: ['openFile']
  })
  return r.canceled ? null : r.filePaths[0]
})

// Bajtet e skedarit; null nëse s'ekziston. Excel-i i hapur lejon leximin (ndarje leximi në Windows).
ipcMain.handle('excel:lexo', (_e, skedari) => {
  try {
    if (!/\.(xlsx|xlsm|xls)$/i.test(skedari || '')) return null
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

// Printimi direkt: faqet (PNG, të vizatuara nga pdf.js te faqja) në një dritare të fshehur, pastaj dialogu i
// printimit i Windows-it me zgjedhjen e printerit. Madhësia e letrës = madhësia e faqes së PDF-së.
ipcMain.handle('pdf:printo', async (_e, faqet, gjeresiaMm, lartesiaMm) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${gjeresiaMm}mm ${lartesiaMm}mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    img { display: block; width: ${gjeresiaMm}mm; height: ${lartesiaMm - 0.5}mm; page-break-after: always; break-after: page; }
    img:last-child { page-break-after: auto; break-after: auto; }
  </style></head><body>${faqet.map((f) => `<img src="${f}">`).join('')}</body></html>`
  const dosja = path.join(os.tmpdir(), 'FinanCareLabels')
  fs.mkdirSync(dosja, { recursive: true })
  const s = path.join(dosja, `printimi-${Date.now()}.html`)
  fs.writeFileSync(s, html, 'utf8')
  const w = new BrowserWindow({ show: false, webPreferences: { javascript: false } })
  try {
    await w.loadFile(s)
    // A4 si letër standarde e Windows-it (madhësia me porosi s'pranohet nga shumë drivera); tjetër vetëm kur s'është A4.
    const eshteA4 = Math.abs(gjeresiaMm - 210) < 1.5 && Math.abs(lartesiaMm - 297) < 1.5
    const pageSize = eshteA4 ? 'A4' : { width: Math.round(gjeresiaMm * 1000), height: Math.round(lartesiaMm * 1000) }
    return await new Promise((resolve) => {
      w.webContents.print({ silent: false, printBackground: true, margins: { marginType: 'none' }, pageSize }, (ok, arsyeja) =>
        resolve({ ok, anuluar: !ok && /cancel/i.test(arsyeja || ''), arsyeja: ok ? '' : arsyeja || 'Printimi dështoi' })
      )
    })
  } finally {
    w.destroy()
    fs.rm(s, { force: true }, () => {})
  }
})

/* ---------- Dritarja ---------- */

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
