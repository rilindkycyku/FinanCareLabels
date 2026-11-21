<#
.SYNOPSIS
    FinanCare Labels - Sistemi i Ndertimit (Build System)
    Nderton vetem Portable (nje exe per USB, pa internet, pa backend).

.USAGE
    Double-click build.bat ose ekzekuto ne terminal:
      .\build.ps1
      .\build.ps1 -NoBump     # pa rritje versioni (rindertim i te njejtit version)

    Cdo ndertim e rrit versionin automatikisht (pervec -NoBump) - dy ndertime te ndryshme s'kane kurre
    te njejtin version.
#>

param(
    [switch]$NoBump
)

$ErrorActionPreference = "Stop"
$swTotal = [System.Diagnostics.Stopwatch]::StartNew()

$repoRoot   = $PSScriptRoot
$releaseDir = Join-Path $repoRoot "release"
$distDir    = Join-Path $repoRoot "dist"
$pkgPath    = Join-Path $repoRoot "package.json"

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

function Bump-VersionString {
    param([string]$ver)
    $prMatch = [regex]::Match($ver, '^(.*[-.a-zA-Z]+)(\d+)$')
    if ($prMatch.Success) {
        $prefix = $prMatch.Groups[1].Value
        $num = [int]$prMatch.Groups[2].Value + 1
        return "$prefix$num"
    }
    $patchMatch = [regex]::Match($ver, '^(\d+\.\d+\.)(\d+)$')
    if ($patchMatch.Success) {
        $prefix = $patchMatch.Groups[1].Value
        $num = [int]$patchMatch.Groups[2].Value + 1
        return "$prefix$num"
    }
    return $ver
}

# Vetem rreshti "version" - ConvertTo-Json i PowerShell 5.1 do ta riformatonte gjithe skedarin.
function Set-AppVersion {
    param([string]$newVer)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    $text = [System.IO.File]::ReadAllText($pkgPath)
    $text = ([regex]'"version"\s*:\s*"[^"]*"').Replace($text, "`"version`": `"$newVer`"", 1)
    [System.IO.File]::WriteAllText($pkgPath, $text, $utf8NoBom)
}

function Draw-ProgressBar {
    param([int]$Percent, [string]$StepText)
    $barWidth = 24
    $filled = [int](($Percent / 100) * $barWidth)
    $bar = ('=' * $filled) + ('-' * ($barWidth - $filled))
    $pct = "{0,3}" -f $Percent
    $timeStr = $swTotal.Elapsed.ToString("mm\:ss")
    Write-Progress -Activity "FinanCare Labels Build ($timeStr)" -Status "[$pct%] $StepText" -PercentComplete $Percent
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

try { $Host.UI.RawUI.WindowTitle = "FinanCare Labels Build [Portable - Duke u ekzekutuar...]" } catch {}

# ── RUAJTJA DHE PËRDITËSIMI I VERSIONIT ───────────────────
$curVer = (Get-Content $pkgPath -Raw | ConvertFrom-Json).version
if (-not $NoBump) {
    $newVer = Bump-VersionString $curVer
    Set-AppVersion $newVer
    Write-Host "`n>> Versioni u rrit: $curVer -> $newVer" -ForegroundColor Yellow
    $curVer = $newVer
}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " FINANCARE LABELS BUILD: PORTABLE" -ForegroundColor Yellow
Write-Host " Versioni:    $curVer" -ForegroundColor Green
Write-Host " Burimi:      $repoRoot" -ForegroundColor Gray
Write-Host " Dalja:       $releaseDir" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# ── HAPI 1: MBYLLJA E PROCESEVE ──────────────────────────
$swStep = [System.Diagnostics.Stopwatch]::StartNew()
Draw-ProgressBar -Percent 5 -StepText "HAPI 1: Kontrolli dhe mbyllja e proceseve aktive"
# Programi nga release (nisesi portabel) dhe nga %TEMP% (exe-ja portabel shpaketohet dhe xhiron prej andej).
$dosjetEMbishkruara = @($releaseDir, (Join-Path $env:LOCALAPPDATA "Temp"), (Join-Path $repoRoot "node_modules\electron"))
Show-SubStep "Duke mbyllur FinanCare Labels (release, portable, dev) nese po xhiron..."
$proceset = @(Get-Process "FinanCare Labels*", "electron" -ErrorAction SilentlyContinue | Where-Object {
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
    Draw-ProgressBar -Percent 15 -StepText "HAPI 2: Kontrolli i paketave (npm)"
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
    Draw-ProgressBar -Percent 35 -StepText "HAPI 3: Kompilimi i UI-se me Vite"
    Show-SubStep "Duke ndertuar UI-ne te dist/..."
    npx vite build
    if ($LASTEXITCODE -ne 0) { throw "Build i UI-se deshtoi me kod: $LASTEXITCODE" }
    if (-not (Test-Path (Join-Path $distDir "index.html"))) { throw "Mungon dist/index.html pas build-it" }
    Show-Success "UI-ja u ndertua" $swStep

    # ── HAPI 4: PAKETIMI I PORTABLE ───────────────────────
    $swStep = [System.Diagnostics.Stopwatch]::StartNew()
    Draw-ProgressBar -Percent 60 -StepText "HAPI 4: Paketimi i Portable"
    # Nisesi yne portabel: programi shpaketohet vetem heren e pare te cdo versioni (jo ne cdo hapje).
    node scripts\nisesi-portabel.mjs
    if ($LASTEXITCODE -ne 0) { throw "Nisesi portabel nuk u vendos" }
    npx electron-builder --win portable
    if ($LASTEXITCODE -ne 0) { throw "Paketimi Portable deshtoi" }
    Show-Success "Portable u krijua me sukses!" $swStep
} finally {
    Pop-Location
}

# ── VERIFIKIMI PËRFUNDIMTAR ──────────────────────────────
Draw-ProgressBar -Percent 100 -StepText "Verifikimi i skedareve te perfunduara"
Write-Progress -Activity "FinanCare Labels Build" -Completed

$totalSeconds = [math]::Round($swTotal.Elapsed.TotalSeconds, 1)
try { $Host.UI.RawUI.WindowTitle = "FinanCare Labels Build [Portable - PERFUNDOI ($totalSeconds s)]" } catch {}
try { [System.Console]::Beep(1200, 200) } catch {}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " PERFUNDOI ME SUKSES NE $totalSeconds SEKONDA!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "`nSkedaret ne: $releaseDir`n" -ForegroundColor Cyan
Get-ChildItem -Path $releaseDir -Filter "*$curVer*.exe" | Select-Object Name, LastWriteTime, @{Name="Madhesia (MB)"; Expression={[math]::Round($_.Length / 1MB, 2)}} | Format-Table -AutoSize
