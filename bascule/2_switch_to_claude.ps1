# Récupération de votre clé API depuis l'environnement ou définie manuellement
$apiKey = $env:ANTHROPIC_API_KEY
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    $apiKey = "VOTRE_CLE_API_CLAUDE_ICI"
}

$apiUrl = "https://api.anthropic.com/v1/messages"

$headers = @{
    "x-api-key"         = $apiKey
    "anthropic-version" = "2023-06-01"
    "content-type"      = "application/json"
}

$body = @{
    model      = "claude-3-7-sonnet-20250219"
    max_tokens = 20000
    # Activation de l'Effort MAX (Extended Thinking)
    thinking   = @{
        type          = "enabled"
        budget_tokens = 16000 # Budget alloué à la réflexion
    }
    messages   = @(
        @{
            role    = "user"
            content = "Écris-moi un script d'administration système en PowerShell et explique ton raisonnement pas à pas."
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

Write-Host "Envoi de la requête à Claude avec la configuration Effort MAX (Extended Thinking)..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    
    Write-Host "`n--- RÉPONSE CLAUDE ---" -ForegroundColor Yellow
    
    foreach ($block in $response.content) {
        if ($block.type -eq "thinking") {
            Write-Host "`n[RÉFLEXION INTERNE DE CLAUDE] :" -ForegroundColor Magenta
            Write-Host $block.thinking -ForegroundColor Gray
        }
        elseif ($block.type -eq "text") {
            Write-Host "`n[RÉPONSE FINALE] :" -ForegroundColor Green
            Write-Host $block.text
        }
    }
}
catch {
    Write-Error "Erreur lors de l'appel à l'API Claude : $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Error $_.ErrorDetails.Message
    }
}
