# Restauration de la configuration standard de Claude Code CLI (Anthropic Claude officiel)

$settingsPath = Join-Path $env:USERPROFILE ".claude\settings.json"

Write-Host "=== Restauration de Claude Code CLI -> Modèle Claude Anthropic ===" -ForegroundColor Cyan

# 1. Modification du fichier settings.json pour supprimer la redirection Zhipu
if (Test-Path $settingsPath) {
    $config = Get-Content $settingsPath -Raw | ConvertFrom-Json

    if ($config.PSObject.Properties['env'] -and $null -ne $config.env) {
        $config.env.PSObject.Properties.Remove('ANTHROPIC_BASE_URL')
        $config.env.PSObject.Properties.Remove('ANTHROPIC_AUTH_TOKEN')
        $config.env.PSObject.Properties.Remove('ANTHROPIC_API_KEY')
        $config.env.PSObject.Properties.Remove('ANTHROPIC_MODEL')
        $config.env.PSObject.Properties.Remove('ANTHROPIC_DEFAULT_OPUS_MODEL')
        $config.env.PSObject.Properties.Remove('ANTHROPIC_DEFAULT_SONNET_MODEL')
        $config.env.PSObject.Properties.Remove('ANTHROPIC_DEFAULT_HAIKU_MODEL')
        $config.env.PSObject.Properties.Remove('CLAUDE_CODE_EFFORT_LEVEL')

        # Si le bloc 'env' est vide, on le supprime proprement
        if ($config.env.PSObject.Properties.Count -eq 0) {
            $config.PSObject.Properties.Remove('env')
        }
    }

    # Restauration du modèle Claude et de l'effort
    $config | Add-Member -MemberType NoteProperty -Name "model" -Value "opus" -Force
    $config | Add-Member -MemberType NoteProperty -Name "effortLevel" -Value "max" -Force

    $config | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
    Write-Host "[+] Redirection supprimee de $settingsPath." -ForegroundColor Green
}

# 2. Nettoyage des variables d'environnement de la session PowerShell
Remove-Item env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
Remove-Item env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
Remove-Item env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
Remove-Item env:ANTHROPIC_MODEL -ErrorAction SilentlyContinue
Remove-Item env:ANTHROPIC_DEFAULT_OPUS_MODEL -ErrorAction SilentlyContinue
Remove-Item env:ANTHROPIC_DEFAULT_SONNET_MODEL -ErrorAction SilentlyContinue
Remove-Item env:ANTHROPIC_DEFAULT_HAIKU_MODEL -ErrorAction SilentlyContinue
Remove-Item env:CLAUDE_CODE_EFFORT_LEVEL -ErrorAction SilentlyContinue

Write-Host "[+] Variables d'environnement reinitialisees." -ForegroundColor Green
Write-Host "`nClaude Code est reinitialise sur Claude Anthropic officiel (Effort: MAX)." -ForegroundColor Yellow
Write-Host "Vous pouvez relancer claude !" -ForegroundColor Cyan
