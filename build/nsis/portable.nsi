; FinanCare Labels - nisësi i exe-së portabël (zëvendëson templates/nsis/portable.nsi të electron-builder-it;
; e vendos scripts/nisesi-portabel.mjs para paketimit).
;
; Origjinali e shpaketonte gjithë programin (~250 MB) në %TEMP% në ÇDO hapje dhe e fshinte në mbyllje: hapja zgjaste
; disa sekonda (edhe më shumë nga USB ose me antivirusin). Këtu shpaketohet vetëm herën e parë të çdo versioni, te
; %LOCALAPPDATA%\FinanCareLabels\app-<versioni> (jo %TEMP%, që e pastron Windows-i); hapjet e tjera nisin direkt.
; Versionet e vjetra fshihen pas shpaketimit të ri. Të dhënat (FinanCareLabels-Data pranë exe-së) s'preken.

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
  StrCpy $DOSJA_BAZE "$LOCALAPPDATA\FinanCareLabels"
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
