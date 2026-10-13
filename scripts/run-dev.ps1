# Start API + React dev servers (run from repo root)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Ensure SQL Server Express is running and database TalentMobility exists (see database\CreateDatabase.sql)."
Write-Host "Starting API on http://localhost:5241 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\src\TalentMobility.Api'; dotnet run --urls http://localhost:5241"

Start-Sleep -Seconds 4
Write-Host "Starting UI on http://127.0.0.1:5173 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\src\TalentMobility.Web'; npm run dev -- --host 127.0.0.1 --port 5173"
