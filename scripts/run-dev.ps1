# Talent Mobility - start API + React dev servers (Windows PowerShell)
# Usage (from anywhere):
#   & "c:\Project\Planning\talent-mobility-platform\scripts\run-dev.ps1"
# Or from repo root:
#   .\scripts\run-dev.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$ApiProject = Join-Path $RepoRoot "src\TalentMobility.Api"
$ApiBuilt = Join-Path $ApiProject "bin\Debug\net8.0"
$WebRoot = Join-Path $RepoRoot "src\TalentMobility.Web"
$ApiUrl = "http://localhost:5241"
$UiUrl = "http://127.0.0.1:5173"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")
$env:ASPNETCORE_ENVIRONMENT = "Development"

function Start-DevWindow {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )
    $escaped = $Command.Replace("'", "''")
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$WorkingDirectory'; `$host.ui.RawUI.WindowTitle = '$Title'; $escaped"
    )
}

Write-Host "Talent Mobility dev launcher"
Write-Host "Repo: $RepoRoot"
Write-Host ""

# --- API ---
$apiCmd = $null
$apiCwd = $null

if (Test-Path (Join-Path $ApiProject "TalentMobility.Api.csproj")) {
    $apiCwd = $ApiProject
    $apiCmd = "dotnet run --urls $ApiUrl"
    Write-Host "API: dotnet run (project source)"
}
elseif (Test-Path (Join-Path $ApiBuilt "TalentMobility.Api.dll")) {
    $apiCwd = $ApiBuilt
    $apiCmd = "dotnet TalentMobility.Api.dll --urls $ApiUrl"
    Write-Host "API: prebuilt DLL in bin\Debug\net8.0"
}
else {
    Write-Error "API not found. Build src\TalentMobility.Api or restore the solution."
}

Write-Host "Starting API at $ApiUrl ..."
Start-DevWindow -Title "Talent Mobility API (5241)" -WorkingDirectory $apiCwd -Command $apiCmd

Start-Sleep -Seconds 4

# --- Web UI ---
if (-not (Test-Path (Join-Path $WebRoot "package.json"))) {
    Write-Warning "Web UI: package.json missing under src\TalentMobility.Web - UI not started."
    Write-Warning "Restore the React project files, then run this script again."
}
else {
    if (-not (Test-Path (Join-Path $WebRoot "node_modules"))) {
        Write-Host "Installing npm dependencies ..."
        Push-Location $WebRoot
        npm install
        Pop-Location
    }
    Write-Host "Starting UI at $UiUrl ..."
    Start-DevWindow -Title "Talent Mobility UI (5173)" -WorkingDirectory $WebRoot -Command "npm run dev -- --host 127.0.0.1 --port 5173"
}

Write-Host ""
Write-Host "Done. Leave the new PowerShell windows open while developing."
Write-Host "  UI:  $UiUrl"
Write-Host ("  API: " + $ApiUrl + "/swagger")
Write-Host ""
Write-Host 'Tip: set OpenAI key via user-secrets in src\TalentMobility.Api (see README).'
