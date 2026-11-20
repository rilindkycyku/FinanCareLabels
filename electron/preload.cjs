'use strict'

const { contextBridge, ipcRenderer } = require('electron')

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
  printoPdf: (faqet, gjeresiaMm, lartesiaMm, opsionet) => ipcRenderer.invoke('pdf:printo', faqet, gjeresiaMm, lartesiaMm, opsionet)
})
