# Create a GitHub repo and push MEDIQ Customer mobile app.
# Prerequisites: Git installed, GitHub CLI (gh) installed and logged in.
#   winget install GitHub.cli
#   gh auth login
#
# Run from project root:
#   powershell -ExecutionPolicy Bypass -File scripts/setup-github-repo.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

Write-Host "Project root: $Root" -ForegroundColor Cyan

# Ensure large local folders are never committed
$ignoreMustHave = @("node_modules/", "android-sdk/", ".env")
$gitignore = Get-Content ".gitignore" -Raw
foreach ($line in $ignoreMustHave) {
  if ($gitignore -notmatch [regex]::Escape($line.TrimEnd('/'))) {
    throw ".gitignore is missing '$line'. Aborting to avoid pushing huge/secret files."
  }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed. Install from https://git-scm.com/download/win"
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is not installed. Run: winget install GitHub.cli"
}

gh auth status | Out-Null

if (-not (Test-Path ".git")) {
  Write-Host "Initializing git repository..." -ForegroundColor Yellow
  git init -b main
}

$remotes = git remote 2>$null
if ($remotes -match "origin") {
  Write-Host "Remote 'origin' already exists:" -ForegroundColor Yellow
  git remote -v
  $pushOnly = Read-Host "Push to existing origin? (y/n)"
  if ($pushOnly -ne "y") { exit 0 }
} else {
  $repoName = "psystem-customer-mobile"
  Write-Host "Creating private GitHub repo: $repoName" -ForegroundColor Yellow
  gh repo create $repoName --private --source=. --remote=origin --description "MEDIQ Customer React Native mobile app"
}

Write-Host "Staging files (android-sdk and node_modules are ignored)..." -ForegroundColor Yellow
git add -A
$status = git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit — already up to date." -ForegroundColor Green
} else {
  git commit -m "$( @'
Initial commit: MEDIQ Customer mobile app

React Native app with Android APK build, iOS cloud CI, cart/search/checkout parity with web.
'@ )"
}

Write-Host "Pushing to origin main..." -ForegroundColor Yellow
git push -u origin main

$url = gh repo view --json url -q .url
Write-Host ""
Write-Host "Done! Repository:" -ForegroundColor Green
Write-Host $url
Write-Host ""
Write-Host "Next: GitHub -> Actions -> iOS Cloud Build -> Run workflow" -ForegroundColor Cyan
