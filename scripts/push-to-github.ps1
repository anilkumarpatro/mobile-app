# Push MEDIQ mobile app to GitHub (fixes upstream + merge remote README if needed).
# Run: powershell -ExecutionPolicy Bypass -File scripts/push-to-github.ps1

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "Setting upstream branch..." -ForegroundColor Cyan
git branch --set-upstream-to=mobile-app/main main 2>$null

Write-Host "Pulling remote main (merge README if present)..." -ForegroundColor Cyan
git pull mobile-app main --rebase --allow-unrelated-histories

Write-Host "Staging app files..." -ForegroundColor Cyan
git add src android ios scripts App.tsx index.js package.json package-lock.json .gitignore README.md codemagic.yaml .github

$pending = git diff --cached --name-only
if ($pending) {
  git commit -m "MEDIQ Customer mobile app"
}

Write-Host "Pushing to mobile-app/main..." -ForegroundColor Cyan
git push -u mobile-app main

Write-Host "Done! https://github.com/anilkumarpatro/mobile-app" -ForegroundColor Green
