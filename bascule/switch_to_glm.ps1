# Configuration de Claude Code CLI vers GLM-5.3-Flash[1m] (Zhipu AI / Z.ai) avec Effort MAX

$settingsPath = Join-Path $env:USERPROFILE ".claude\settings.json"
$dir = $PSScriptRoot
if (-not $dir) { $dir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $dir) { $dir = (Get-Location).Path }
$envPath = $null
while ($dir) {
    $candidate = Join-Path $dir ".env"
    if (Test-Path $candidate) {
        $envPath = $candidate
        break
    }
    $parent = Split-Path -Parent $dir
    if ($parent -eq $dir) { break }
    $dir = $parent
}
if (-not $envPath) { $envPath = Join-Path (Get-Location).Path ".env" }

$apiKey = $null
if (Test-Path $envPath) {
    $apiKey = (Get-Content $envPath -ErrorAction SilentlyContinue |
        Where-Object { $_ -match "^ZHIPU_API_KEY=" } | ForEach-Object { ($_ -replace "^ZHIPU_API_KEY=", "").Trim() })
}
if (-not $apiKey) { $apiKey = $env:ZHIPU_API_KEY }
if (-not $apiKey) { throw "ZHIPU_API_KEY absent de .env ($envPath)" }
$baseUrl = "https://api.z.ai/api/anthropic"
$modelName = "glm-5.3-flash"

Write-Host "=== Configuration de Claude Code CLI -> GLM-5.3-Flash (Haiku, Sonnet, Opus) ===" -ForegroundColor Cyan

# 1. Sauvegarde et modification du fichier settings.json
if (Test-Path $settingsPath) {
    Copy-Item $settingsPath "$settingsPath.backup" -Force
    Write-Host "[+] Sauvegarde effectuee : $settingsPath.backup" -ForegroundColor DarkGray
    $config = Get-Content $settingsPath -Raw | ConvertFrom-Json
} else {
    New-Item -ItemType Directory -Path (Split-Path $settingsPath) -Force | Out-Null
    $config = [PSCustomObject]@{}
}

# Assurer l'existence de la section 'env'
if (-not $config.PSObject.Properties['env'] -or $null -eq $config.env) {
    $config | Add-Member -MemberType NoteProperty -Name "env" -Value ([PSCustomObject]@{}) -Force
}

# Redirection de Claude Code vers le proxy Anthropic de Zhipu AI (Z.ai)
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_BASE_URL" -Value $baseUrl -Force
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_AUTH_TOKEN" -Value $apiKey -Force
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_API_KEY" -Value "" -Force
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_MODEL" -Value $modelName -Force
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_DEFAULT_OPUS_MODEL" -Value $modelName -Force
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_DEFAULT_SONNET_MODEL" -Value $modelName -Force
$config.env | Add-Member -MemberType NoteProperty -Name "ANTHROPIC_DEFAULT_HAIKU_MODEL" -Value $modelName -Force
$config.env | Add-Member -MemberType NoteProperty -Name "CLAUDE_CODE_EFFORT_LEVEL" -Value "max" -Force

# Mise a jour des flags principaux
$config | Add-Member -MemberType NoteProperty -Name "model" -Value $modelName -Force
$config | Add-Member -MemberType NoteProperty -Name "effortLevel" -Value "max" -Force

# Sauvegarde du JSON
$config | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
Write-Host "[+] $settingsPath mis a jour avec succes !" -ForegroundColor Green

# 2. Export des variables pour la session PowerShell actuelle
$env:ANTHROPIC_BASE_URL = $baseUrl
$env:ANTHROPIC_AUTH_TOKEN = $apiKey
$env:ANTHROPIC_API_KEY = ""
$env:ANTHROPIC_MODEL = $modelName
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = $modelName
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = $modelName
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = $modelName
$env:CLAUDE_CODE_EFFORT_LEVEL = "max"

Write-Host "[+] Variables d'environnement de session definies." -ForegroundColor Green
Write-Host "`nClaude Code est maintenant configure sur GLM-5.3-Flash[1m] pour tous les tiers (Opus, Sonnet, Haiku) avec Effort MAX." -ForegroundColor Yellow
Write-Host "Vous pouvez lancer claude pour commencer a coder avec GLM !" -ForegroundColor Cyan
