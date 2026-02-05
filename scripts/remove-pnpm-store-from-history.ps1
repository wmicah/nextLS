# Remove .pnpm-store from entire git history so push to GitHub succeeds.
# Run from repo root: .\scripts\remove-pnpm-store-from-history.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Removing .pnpm-store from git history (this may take a few minutes)..." -ForegroundColor Yellow
git filter-branch --force --index-filter "git rm -r -f --cached --ignore-unmatch .pnpm-store" --prune-empty -- --all
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDone. Next steps:" -ForegroundColor Green
Write-Host "  1. git push -u origin main --force"
Write-Host "  2. (Optional) rm -rf .git/refs/original && git reflog expire --expire=now --all && git gc --prune=now --aggressive"
Write-Host "     (cleans backup refs and prunes old objects)"
