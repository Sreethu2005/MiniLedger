param(
    [string]$Message = "chore: sync updates"
)

git add .
$hasDiff = git diff-index --quiet HEAD --
if ($LASTEXITCODE -eq 0) {
    Write-Host "[MiniLedger] No new changes to commit." -ForegroundColor Yellow
    exit 0
}

git commit -m $Message
git push origin main
Write-Host "[MiniLedger] Successfully committed and pushed to GitHub!" -ForegroundColor Green
