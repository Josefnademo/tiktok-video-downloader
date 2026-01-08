try {
    # Backend 
    Write-Host "`n=== INSTALLATION DES DÉPENDANCES BACKEND ===" -ForegroundColor Cyan
    
    # Set-Location -Path .\backend\code
    npm install
    }
catch {
    Write-Host "`nERREUR: $_" -ForegroundColor Red
    exit 1
}