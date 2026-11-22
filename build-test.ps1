<#
.SYNOPSIS
    FinanCare Labels - Build & Deploy Test (si build-test.ps1 i FinanCare-s)
    Nderton UI-ne dhe programin pa instalues (electron-builder --dir) dhe e kopjon direkt te
    D:\FinanCareTest\FinanCareLabels, qe te testohet menjehere pa instalim.

.USAGE
    Double-click build-test.bat ose ekzekuto ne terminal:
      .\build-test.ps1
      .\build-test.ps1 -Nis       # e hap programin ne fund

    Versioni NUK rritet (s'eshte release); Setup dhe Portable i nderton vetem build.ps1.
#>

param(
    [switch]$Nis
)

$ErrorActionPreference = "Stop"
$swTotal = [System.Diagnostics.Stopwatch]::StartNew()

try { $Host.UI.RawUI.WindowTitle = "FinanCare Labels Build & Deploy Test [Duke u ekzekutuar...]" } catch {}

$repoRoot  = $PSScriptRoot
$distDir   = Join-Path $repoRoot "dist"
$pkgPath   = Join-Path $repoRoot "package.json"
$unpacked  = Join-Path $repoRoot "release\win-unpacked"
$targetDir = "D:\FinanCareTest\FinanCareLabels"
$exeName   = "FinanCare Labels.exe"

function Remove-BomFromFile {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $noBomBytes = New-Object byte[] ($bytes.Length - 3)
            [System.Array]::Copy($bytes, 3, $noBomBytes, 0, $noBomBytes.Length)
            [System.IO.File]::WriteAllBytes($FilePath, $noBomBytes)
        }
    }
}

Remove-BomFromFile $pkgPath

function Draw-ProgressBar {
    param([int]$Percent, [string]$StepText)
    $barWidth = 24
    $filled = [int](($Percent / 100) * $barWidth)
    $bar = ('=' * $filled) + ('-' * ($barWidth - $filled))
    $pct = "{0,3}" -f $Percent
    $timeStr = $swTotal.Elapsed.ToString("mm\:ss")
    Write-Progress -Activity "FinanCare Labels Build & Deploy Test ($timeStr)" -Status "[$pct%] $StepText" -PercentComplete $Percent
    Write-Host ""
    Write-Host " [$pct%] [$bar] $StepText  (Koha: $timeStr)" -ForegroundColor Cyan
}

function Show-SubStep {
    param([string]$Text)
    $timeStr = $swTotal.Elapsed.ToString("mm\:ss")
    Write-Host "        >> [$timeStr] $Text" -ForegroundColor DarkCyan
}

function Show-Success {
    param([string]$Text, [System.Diagnostics.Stopwatch]$SwStep)
    $stepTime = if ($SwStep) { "$([math]::Round($SwStep.Elapsed.TotalSeconds, 1))s" } else { "" }
    Write-Host "        [OK] $Text ($stepTime)" -ForegroundColor Green
}

$curVer = (Get-Content $pkgPath -Raw | ConvertFrom-Json).version

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " FINANCARE LABELS BUILD & DEPLOY TEST (pa instalim)" -ForegroundColor Yellow
Write-Host " Versioni:     $curVer (pa rritje)" -ForegroundColor Green
Write-Host " Burimi:       $repoRoot" -ForegroundColor Gray
Write-Host " Destinacioni: $targetDir" -ForegroundColor Gray
Write-Host " Nisja:        $((Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# ── HAPI 1: MBYLLJA E PROCESEVE ──────────────────────────
$swStep = [System.Diagnostics.Stopwatch]::StartNew()
Draw-ProgressBar -Percent 5 -StepText "HAPI 1/6: Mbyllja e FinanCare Labels (testi dhe release/win-unpacked)"
# Vetem kopjet qe mbishkruhen ketu - programi i instaluar ose portabli i perditshem s'preken.
$dosjetEMbishkruara = @($targetDir, $unpacked)
$proceset = @(Get-Process "FinanCare Labels*" -ErrorAction SilentlyContinue | Where-Object {
    $p = $_.Path
    $p -and ($dosjetEMbishkruara | Where-Object { $p.StartsWith($_, [StringComparison]::OrdinalIgnoreCase) })
})
$closedCount = @($proceset | Where-Object { $_.MainWindowHandle -ne 0 }).Count
if ($proceset) {
    $proceset | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { [void]$_.CloseMainWindow() }
    $afati = (Get-Date).AddSeconds(8)
    while ((Get-Date) -lt $afati -and ($proceset | Where-Object { -not $_.HasExited })) { Start-Sleep -Milliseconds 300 }
    $mbetur = @($proceset | Where-Object { -not $_.HasExited })
    if ($mbetur) {
        Show-SubStep "$($mbetur.Count) procese s'u mbyllen vete - mbyllja e detyruar..."
        $mbetur | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 600
}
Show-Success "Proceset u pastruan ($closedCount u mbyllen)." $swStep

Push-Location $repoRoot
try {
    # ── HAPI 2: PAKETAT (NPM) ─────────────────────────────
    $swStep = [System.Diagnostics.Stopwatch]::StartNew()
    Draw-ProgressBar -Percent 15 -StepText "HAPI 2/6: Kontrolli i paketave (npm)"
    if (-not (Test-Path (Join-Path $repoRoot "node_modules\.bin\vite.cmd"))) {
        Show-SubStep "Duke instaluar paketat..."
        npm install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw "npm install deshtoi me kod: $LASTEXITCODE" }
    }
    # npm 11 i bllokon skriptet postinstall: binari i Electron-it shkarkohet me install.js te vet.
    if (-not (Test-Path (Join-Path $repoRoot "node_modules\electron\dist\electron.exe"))) {
        Show-SubStep "Duke shkarkuar Electron-in (vetem heren e pare)..."
        node node_modules\electron\install.js
        if ($LASTEXITCODE -ne 0) { throw "Shkarkimi i Electron-it deshtoi me kod: $LASTEXITCODE" }
    }
    Show-Success "Paketat jane gati" $swStep

    # ── HAPI 3: NDËRTIMI I UI-SË (VITE) ───────────────────
    $swStep = [System.Diagnostics.Stopwatch]::StartNew()
    Draw-ProgressBar -Percent 35 -StepText "HAPI 3/6: Kompilimi i UI-se me Vite"
    npx vite build
    if ($LASTEXITCODE -ne 0) { throw "Build i UI-se deshtoi me kod: $LASTEXITCODE" }
    if (-not (Test-Path (Join-Path $distDir "index.html"))) { throw "Mungon dist/index.html pas build-it" }
    Show-Success "UI-ja u ndertua" $swStep

    # ── HAPI 4: PAKETIMI PA INSTALUES ─────────────────────
    $swStep = [System.Diagnostics.Stopwatch]::StartNew()
    Draw-ProgressBar -Percent 60 -StepText "HAPI 4/6: Paketimi me Electron (pa instalues, release/win-unpacked)"
    npx electron-builder --win --dir
    if ($LASTEXITCODE -ne 0) { throw "Paketimi deshtoi me kod: $LASTEXITCODE" }
    if (-not (Test-Path (Join-Path $unpacked $exeName))) { throw "Mungon $exeName te $unpacked" }
    Show-Success "Programi u paketua te release\win-unpacked" $swStep
} finally {
    Pop-Location
}

# ── HAPI 5: KOPJIMI ME ROBOCOPY ──────────────────────────
$swStep = [System.Diagnostics.Stopwatch]::StartNew()
Draw-ProgressBar -Percent 85 -StepText "HAPI 5/6: Sinkronizimi te $targetDir"
if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
# /MIR: skedaret e vjeter qe s'jane me ne build fshihen (te dhenat e perdoruesit s'jane ketu, por te %APPDATA%).
& robocopy $unpacked $targetDir /MIR /R:3 /W:1 /NP /NFL /NDL /MT:8 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Kopjimi me Robocopy deshtoi me kod: $LASTEXITCODE" }
Show-Success "Skedaret u sinkronizuan" $swStep

# ── HAPI 6: VERIFIKIMI ───────────────────────────────────
Draw-ProgressBar -Percent 100 -StepText "HAPI 6/6: Verifikimi"
Write-Progress -Activity "FinanCare Labels Build & Deploy Test" -Completed

$totalSeconds = [math]::Round($swTotal.Elapsed.TotalSeconds, 1)
try { $Host.UI.RawUI.WindowTitle = "FinanCare Labels Build & Deploy Test [PERFUNDOI ME SUKSES ($totalSeconds s)]" } catch {}
try { [System.Console]::Beep(1200, 200) } catch {}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " PERFUNDOI ME SUKSES NE $totalSeconds SEKONDA!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Get-Item (Join-Path $targetDir $exeName) | Select-Object Name, LastWriteTime, Length
Get-Item (Join-Path $targetDir "resources\app.asar") | Select-Object Name, LastWriteTime, Length

$exePath = Join-Path $targetDir $exeName

# Shkurtore e vecante ne Desktop: "FinanCare Labels" eshte programi i instaluar (s'perditesohet nga ky skript).
try {
    $lnk = Join-Path ([Environment]::GetFolderPath("Desktop")) "FinanCare Labels TEST.lnk"
    $sc = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
    $sc.TargetPath = $exePath
    $sc.WorkingDirectory = $targetDir
    $sc.IconLocation = "$exePath,0"
    $sc.Description = "FinanCare Labels - kopja e testit (build-test.ps1)"
    $sc.Save()
    Show-SubStep "Shkurtorja 'FinanCare Labels TEST' ne Desktop -> $exePath"
} catch {
    Show-SubStep "Shkurtorja ne Desktop s'u krijua: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Programi eshte gati per testim:" -ForegroundColor Yellow
Write-Host "  $exePath" -ForegroundColor White
Write-Host ""

if ($Nis) {
    Show-SubStep "Duke hapur programin..."
    Start-Process -FilePath $exePath -WorkingDirectory $targetDir
}
