; FinanCare Labels - nisësi i exe-së portabël (zëvendëson templates/nsis/portable.nsi të electron-builder-it;
; e vendos scripts/nisesi-portabel.mjs para paketimit).
;
; Origjinali e shpaketonte gjithë programin (~250 MB) në %TEMP% në ÇDO hapje dhe e fshinte në mbyllje: hapja zgjaste
; disa sekonda (edhe më shumë nga USB ose me antivirusin). Këtu shpaketohet vetëm herën e parë të çdo versioni, si te
; ULM pranë exe-së: FinanCareLabels-Data\app-<versioni> (bashkë me të dhënat - asgjë në kompjuter). Kur dosja pranë
; exe-së s'shkruhet (p.sh. disk vetëm për lexim), te %LOCALAPPDATA%\FinanCareLabels\app-<versioni>. Hapjet e tjera nisin
; direkt; versionet e vjetra fshihen pas shpaketimit të ri. Të dhënat e programit s'preken.

!include "common.nsh"
!include "extractAppPackage.nsh"

CRCCheck off
WindowIcon Off
AutoCloseWindow True
RequestExecutionLevel ${REQUEST_EXECUTION_LEVEL}

Var DOSJA_BAZE

Function .onInit
  SetSilent silent
  !insertmacro check64BitAndSetRegView
FunctionEnd

Section
  ; Pranë exe-së nëse aty mund të shkruhet, ndryshe %LOCALAPPDATA%.
  StrCpy $DOSJA_BAZE "$EXEDIR\FinanCareLabels-Data"
  ClearErrors
  CreateDirectory $DOSJA_BAZE
  FileOpen $0 "$DOSJA_BAZE\.provo-shkrimin" w
  IfErrors 0 shkruhet
    StrCpy $DOSJA_BAZE "$LOCALAPPDATA\FinanCareLabels"
    Goto dosja_gati
  shkruhet:
    FileClose $0
    Delete "$DOSJA_BAZE\.provo-shkrimin"
  dosja_gati:
  StrCpy $INSTDIR "$DOSJA_BAZE\app-${VERSION}"

  ; Shpaketimi i plotë lë "gati.txt" në fund; pa të (ose pa skedarët kryesorë) shpaketohet përsëri.
  IfFileExists "$INSTDIR\gati.txt" 0 shpaketo
  IfFileExists "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 shpaketo
  IfFileExists "$INSTDIR\resources\app.asar" nis shpaketo

  shpaketo:
  InitPluginsDir
  !ifdef SPLASH_IMAGE
    File /oname=$PLUGINSDIR\splash.bmp "${SPLASH_IMAGE}"
    BgImage::SetBg $PLUGINSDIR\splash.bmp
    BgImage::Redraw
  !endif
  RMDir /r $INSTDIR
  SetOutPath $INSTDIR
  !ifdef APP_DIR_64
    File /r "${APP_DIR_64}\*.*"
  !else
    !ifdef APP_DIR_32
      File /r "${APP_DIR_32}\*.*"
    !else
      !insertmacro extractEmbeddedAppPackage
    !endif
  !endif
  FileOpen $0 "$INSTDIR\gati.txt" w
  FileWrite $0 "${VERSION}"
  FileClose $0

  ; Versionet e tjera (të vjetra) s'duhen më.
  FindFirst $0 $1 "$DOSJA_BAZE\app-*"
  pastro:
    StrCmp $1 "" pastruar
    StrCmp $1 "app-${VERSION}" tjetri
    RMDir /r "$DOSJA_BAZE\$1"
    tjetri:
    FindNext $0 $1
    Goto pastro
  pastruar:
  FindClose $0
  !ifdef SPLASH_IMAGE
    BgImage::Destroy
  !endif

  nis:
  System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("PORTABLE_EXECUTABLE_DIR", "$EXEDIR").r0'
  System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("PORTABLE_EXECUTABLE_FILE", "$EXEPATH").r0'
  System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("PORTABLE_EXECUTABLE_APP_FILENAME", "${APP_FILENAME}").r0'
  ${StdUtils.GetAllParameters} $R0 0

  SetOutPath $INSTDIR
  ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" $R0' $0
  SetErrorLevel $0
SectionEnd
