$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Instala Node.js 22 o superior.' }
if (-not (Test-Path -LiteralPath 'node_modules\tsx')) { throw 'Ejecuta npm install y npm run db:generate primero.' }
if (-not (Test-Path -LiteralPath '.env') -and -not $env:PUBLIC_URL) { $env:PUBLIC_URL = 'http://localhost:3001' }
if (-not (Test-Path -LiteralPath 'dist\index.html')) {
    & $nodePath 'node_modules\vite\bin\vite.js' build
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar.' }
}
Write-Host 'Abre http://localhost:3001. Detener: Ctrl+C.' -ForegroundColor Cyan
& $nodePath --import tsx 'server\index.ts'

