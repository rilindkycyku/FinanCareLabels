; Instaluesi i FinanCare Labels - si te FinanCare (financaredesktop/build/customNsis.nsh).

!macro customHeader
  ; InstallDir pa "\" ne fund i tregon NSIS-it emrin e dosjes se fundit: kur perdoruesi zgjedh
  ; "Browse..." nje vend tjeter (p.sh. D:\ ose D:\Programet), NSIS i shton vete "\FinanCare Labels"
  ; qe ne fushe, keshtu dosja e programit krijohet vete dhe s'shperndahet ne rrenjen e diskut.
  ; (electron-builder e shton edhe para instalimit, te instFilesPre, nese mungon.)
  InstallDir "$LOCALAPPDATA\Programs\${APP_FILENAME}"

  ; Detajet e instalimit (skedaret qe shpaketohen) duken ne ekran.
  ShowInstDetails show
  ShowUninstDetails show
!macroend
