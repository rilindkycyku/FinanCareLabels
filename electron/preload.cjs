'use strict'

const { contextBridge, ipcRenderer, webUtils } = require('electron')

// API e vetme që faqja ka drejt diskut: vetëm skedarët e njohur (shabllonet, cilësimet, Excel-i, PDF-ja).
contextBridge.exposeInMainWorld('labels', {
  lexo: (emri) => ipcRenderer.invoke('te-dhenat:lexo', emri),
  ruaj: (emri, vlera) => ipcRenderer.invoke('te-dhenat:ruaj', emri, vlera),
  dosjaETeDhenave: () => ipcRenderer.invoke('te-dhenat:dosja'),
  hapDosjenETeDhenave: () => ipcRenderer.invoke('te-dhenat:hap-dosjen'),
  zgjidhExcel: () => ipcRenderer.invoke('excel:zgjidh'),
  lexoExcel: (skedari) => ipcRenderer.invoke('excel:lexo', skedari),
  hapExcel: (skedari) => ipcRenderer.invoke('excel:hap', skedari),
  ruajPdf: (bajtet, emri) => ipcRenderer.invoke('pdf:ruaj', bajtet, emri),
  hapPdf: (bajtet, emri) => ipcRenderer.invoke('pdf:hap', bajtet, emri),
  printerat: () => ipcRenderer.invoke('printerat:lista'),
  // Shiriti i titullit i vizatuar nga faqja: ngjyrat e butonave të Windows-it sipas temës.
  titlebar: { tema: (tema) => ipcRenderer.invoke('titlebar:tema', tema) },
  printoPdf: (faqet, gjeresiaMm, lartesiaMm, opsionet) => ipcRenderer.invoke('pdf:printo', faqet, gjeresiaMm, lartesiaMm, opsionet),
  // Shtegu i skedarit të tërhequr në dritare (drag & drop) - Electron-i s'e jep më te File.path.
  shteguISkedarit: (skedari) => {
    try {
      return webUtils.getPathForFile(skedari) || ''
    } catch {
      return ''
    }
  },
  versioni: () => ipcRenderer.invoke('app:versioni'),
  // 'portabel' | 'instaluar' | 'zhvillim'
  menyra: () => ipcRenderer.invoke('app:menyra'),
  importoNgaDosja: () => ipcRenderer.invoke('te-dhenat:importo-nga-dosja'),
  perditesimi: {
    kontrollo: () => ipcRenderer.invoke('perditesimi:kontrollo'),
    shkarko: () => ipcRenderer.invoke('perditesimi:shkarko'),
    instalo: () => ipcRenderer.invoke('perditesimi:instalo'),
    neProgres: (fn) => {
      const degjuesi = (_e, v) => fn(v)
      ipcRenderer.on('perditesimi:progresi', degjuesi)
      return () => ipcRenderer.removeListener('perditesimi:progresi', degjuesi)
    }
  }
})
