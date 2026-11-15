# start-nerve.ps1 - brings up the whole Iron Operative Nerve Center stack
$ErrorActionPreference = "Stop"
$Repo     = "D:\ContractorSetup\agent-builder"
$Langfuse = "D:\IronNerve\langfuse"

Write-Host "`n[1/4] Checking Docker..." -ForegroundColor Cyan
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker isn't running. Starting Docker Desktop, give it ~60s..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    do { Start-Sleep 5; docker info *> $null } until ($LASTEXITCODE -eq 0)
}

Write-Host "[2/4] Langfuse (observability) -> http://localhost:3002" -ForegroundColor Cyan
Push-Location $Langfuse
docker compose up -d
Pop-Location

Write-Host "[3/4] n8n (integrations) -> http://localhost:5678" -ForegroundColor Cyan
$n8n = docker ps -a --filter "name=^n8n$" --format "{{.Names}}"
if ($n8n) { docker start n8n | Out-Null }
else { docker run -d --name n8n --restart unless-stopped -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n | Out-Null }

# Clear any stale Paperclip database left by a window that was closed instead of Ctrl+C
if (-not (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue)) {
 Get-CimInstance Win32_Process -Filter "Name='postgres.exe'" |
   Where-Object { # start-nerve.ps1 - brings up the whole Iron Operative Nerve Center stack
$ErrorActionPreference = "Stop"
$Repo     = "D:\ContractorSetup\agent-builder"
$Langfuse = "D:\IronNerve\langfuse"

Write-Host "`n[1/4] Checking Docker..." -ForegroundColor Cyan
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker isn't running. Starting Docker Desktop, give it ~60s..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    do { Start-Sleep 5; docker info *> $null } until ($LASTEXITCODE -eq 0)
}

Write-Host "[2/4] Langfuse (observability) -> http://localhost:3002" -ForegroundColor Cyan
Push-Location $Langfuse
docker compose up -d
Pop-Location

Write-Host "[3/4] n8n (integrations) -> http://localhost:5678" -ForegroundColor Cyan
$n8n = docker ps -a --filter "name=^n8n$" --format "{{.Names}}"
if ($n8n) { docker start n8n | Out-Null }
else { docker run -d --name n8n --restart unless-stopped -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n | Out-Null }

Write-Host "[4/4] Paperclip -> http://localhost:3100  +  Iron Operative -> http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle='Paperclip'; npx paperclipai run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle='Iron Operative'; cd '$Repo'; npm run dev"

Start-Sleep 15
Start-Process "http://localhost:3100"
Start-Process "http://localhost:3002"
Write-Host "`nNerve Center is up." -ForegroundColor Green
.CommandLine -like "*embedded-postgres*" } |
   ForEach-Object { Stop-Process -Id # start-nerve.ps1 - brings up the whole Iron Operative Nerve Center stack
$ErrorActionPreference = "Stop"
$Repo     = "D:\ContractorSetup\agent-builder"
$Langfuse = "D:\IronNerve\langfuse"

Write-Host "`n[1/4] Checking Docker..." -ForegroundColor Cyan
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker isn't running. Starting Docker Desktop, give it ~60s..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    do { Start-Sleep 5; docker info *> $null } until ($LASTEXITCODE -eq 0)
}

Write-Host "[2/4] Langfuse (observability) -> http://localhost:3002" -ForegroundColor Cyan
Push-Location $Langfuse
docker compose up -d
Pop-Location

Write-Host "[3/4] n8n (integrations) -> http://localhost:5678" -ForegroundColor Cyan
$n8n = docker ps -a --filter "name=^n8n$" --format "{{.Names}}"
if ($n8n) { docker start n8n | Out-Null }
else { docker run -d --name n8n --restart unless-stopped -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n | Out-Null }

Write-Host "[4/4] Paperclip -> http://localhost:3100  +  Iron Operative -> http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle='Paperclip'; npx paperclipai run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle='Iron Operative'; cd '$Repo'; npm run dev"

Start-Sleep 15
Start-Process "http://localhost:3100"
Start-Process "http://localhost:3002"
Write-Host "`nNerve Center is up." -ForegroundColor Green
.ProcessId -Force -ErrorAction SilentlyContinue }
}

Write-Host "[4/4] Paperclip -> http://localhost:3100  +  Iron Operative -> http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle='Paperclip'; npx paperclipai run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle='Iron Operative'; cd '$Repo'; npm run dev"

Start-Sleep 15
Start-Process "http://localhost:3100"
Start-Process "http://localhost:3002"
Write-Host "`nNerve Center is up." -ForegroundColor Green

