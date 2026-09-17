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
# URL de l'API Zhipu (compatible OpenAI)
$apiUrl = "https://api.z.ai/api/paas/v4/chat/completions"

$headers = @{
    "Content-Type"  = "application/json; charset=utf-8"
    "Authorization" = "Bearer $apiKey"
}

$body = @{
    model    = "glm-5.3-flash"
    messages = @(
        @{
            role    = "user"
            content = "Ã‰cris-moi un script d'administration systÃ¨me en PowerShell et explique ton raisonnement pas Ã  pas."
        }
    )
    # L'Ã©quivalent de l'effort MAX chez Zhipu pour activer le raisonnement Ã©tendu
    reasoning_effort = "high"
} | ConvertTo-Json -Depth 10 -Compress

Write-Host "Envoi de la requÃªte Ã  GLM-5.3-Flash avec l'Ã©quivalent de l'effort MAX..." -ForegroundColor Cyan

try {
    # Utilisation de Invoke-RestMethod pour appeler l'API
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $bodyBytes
    
    Write-Host "`n--- RÃ‰PONSE GLM-5.3-Flash ---" -ForegroundColor Yellow
    Write-Host $response.choices[0].message.content
}
catch {
    Write-Error "Erreur lors de l'appel Ã  l'API GLM : $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Error $_.ErrorDetails.Message
    }
}
