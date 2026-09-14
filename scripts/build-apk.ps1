# Build MEDIQ Customer release APK on Windows.
#
# Why two phases?
#   Metro : Node resolves subst drives back to the real path, so bundling under a
#           subst drive fails with "Failed to get the SHA-1 for ...".
#   CMake : RN's New Architecture embeds full source paths in object file names, and
#           D:\psystem\workspace\psystem-customer-mobile blows past the 260-char limit.
#
#   Phase 1 (real drive) : Gradle runs Metro + Hermes, output copied to src/main/assets.
#   Phase 2 (subst drive): assembleRelease with -PskipJsBundling=true, packaging Phase 1 output.
#
# -Abis selects the native ABIs. The Android Studio emulator on an Intel/AMD laptop is x86_64,
# so an arm64-only APK installs there but dies at launch on libappmodules.so. Building both
# costs time but not peak memory, since Gradle compiles one ABI at a time here.
param(
  [string]$Abis = "arm64-v8a,x86_64"
)

$ErrorActionPreference = "Stop"

$AbiList = @($Abis -split '[,;\s]+' | Where-Object { $_ })
$KnownAbis = @("arm64-v8a", "armeabi-v7a", "x86", "x86_64")
foreach ($abi in $AbiList) {
  if ($KnownAbis -notcontains $abi) {
    throw "Unknown ABI '$abi'. Valid values: $($KnownAbis -join ', ')"
  }
}
if ($AbiList.Count -eq 0) { throw "-Abis cannot be empty." }
$AbiProperty = "-PreactNativeArchitectures=$($AbiList -join ',')"

$RealProjectRoot = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path.TrimEnd('\')
$SubstDrive      = $null
$SubstCandidates = @("Z:", "M:", "Y:", "W:", "R:", "P:", "Q:", "X:")
$SdkRoot         = "C:\mediq-sdk"
$GradleHome      = "C:\gradle"
$TempHome        = "C:\rn-temp"

$RealAndroidDir = Join-Path $RealProjectRoot "android"
$GeneratedBundle = Join-Path $RealProjectRoot "android\app\build\generated\assets\react\release\index.android.bundle"
$GeneratedResDir = Join-Path $RealProjectRoot "android\app\build\generated\res\react\release"
$MainAssetsDir   = Join-Path $RealProjectRoot "android\app\src\main\assets"
$MainResDir      = Join-Path $RealProjectRoot "android\app\src\main\res"
$PackagedBundle  = Join-Path $MainAssetsDir "index.android.bundle"
$ApkPath         = Join-Path $RealProjectRoot "android\app\build\outputs\apk\release\app-release.apk"

function Invoke-Subst {
  param([string[]]$SubstArgs)
  & "$env:SystemRoot\System32\subst.exe" @SubstArgs 2>$null | Out-Null
}

function Enable-ShortPath {
  param([string]$TargetPath)

  $TargetPath = $TargetPath.TrimEnd('\')
  $substExe   = Join-Path $env:SystemRoot "System32\subst.exe"
  $failures   = @()

  # subst refuses to map a path the current shell is standing inside.
  Push-Location $env:SystemRoot
  try {
    foreach ($drive in $SubstCandidates) {
      Invoke-Subst @($drive, "/d")
      $output = & $substExe $drive $TargetPath 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) {
        $failures += "${drive} $($output.Trim())"
        continue
      }
      if (Test-Path -LiteralPath "${drive}\") {
        $script:SubstDrive = $drive
        return "${drive}\"
      }
      $failures += "${drive} mapped but not accessible"
    }
  }
  finally {
    Pop-Location
  }

  throw @(
    "subst failed: no usable drive letter for the short-path native build."
    "Tried: $($SubstCandidates -join ', ')"
    ($failures | ForEach-Object { "  $_" })
    "Close Explorer / Android Studio windows on the project, then retry."
  ) -join "`n"
}

function Initialize-Sdk {
  $sourceSdk = Join-Path $RealProjectRoot "android-sdk"
  if (-not (Test-Path -LiteralPath $sourceSdk)) {
    throw "Android SDK not found at $sourceSdk"
  }

  # Junction keeps NDK/CMake on a short path so clang command lines stay under the limit.
  if (-not (Test-Path -LiteralPath $SdkRoot)) {
    Write-Host "Linking SDK -> $SdkRoot"
    cmd /c "mklink /J `"$SdkRoot`" `"$sourceSdk`""
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create SDK junction at $SdkRoot"
    }
  }

  $required = @(
    (Join-Path $SdkRoot "cmake\3.22.1\bin\cmake.exe"),
    (Join-Path $SdkRoot "cmake\3.22.1\bin\ninja.exe"),
    (Join-Path $SdkRoot "ndk\27.1.12297006")
  )
  foreach ($path in $required) {
    if (-not (Test-Path -LiteralPath $path)) {
      throw "SDK incomplete - missing: $path"
    }
  }

  $escaped = ($SdkRoot -replace '\\', '\\')
  "sdk.dir=$escaped" | Set-Content -Path (Join-Path $RealAndroidDir "local.properties") -Encoding ASCII
}

function Resolve-Keytool {
  $candidates = @()
  if ($env:JAVA_HOME) { $candidates += (Join-Path $env:JAVA_HOME "bin\keytool.exe") }
  $candidates += @(
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jre\bin\keytool.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  $onPath = Get-Command keytool.exe -ErrorAction SilentlyContinue
  if ($onPath) { return $onPath.Source }
  return $null
}

# app/build.gradle signs release with the debug keystore, which is not committed.
function Initialize-Keystore {
  $keystore = Join-Path $RealProjectRoot "android\app\debug.keystore"
  if (Test-Path -LiteralPath $keystore) { return }

  $keytool = Resolve-Keytool
  if (-not $keytool) {
    throw "debug.keystore is missing and keytool.exe was not found. Set JAVA_HOME and retry."
  }

  # Routed through cmd so keytool's stderr chatter cannot trip $ErrorActionPreference = Stop.
  Write-Host "Generating debug.keystore for release signing..."
  $keytoolArgs = @(
    "-genkeypair"
    "-keystore `"$keystore`""
    "-storepass android -keypass android"
    "-alias androiddebugkey"
    "-keyalg RSA -keysize 2048 -validity 10000"
    "-dname `"CN=Android Debug, O=Android, C=US`""
  ) -join " "
  cmd /c "`"$keytool`" $keytoolArgs 2>&1" | Out-Null

  if (-not (Test-Path -LiteralPath $keystore)) {
    throw "keytool did not create $keystore"
  }
}

# Remove-Item cannot delete CMake output trees: the object-file paths exceed 260 chars, so it
# aborts partway and leaves android_gradle_build.json behind. Gradle then treats the CMake
# configure step as up-to-date and ninja dies on the missing CMakeFiles/rules.ninja.
# robocopy mirroring an empty directory is the supported way to purge long-path trees.
function Remove-Tree {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) { return }

  $Path  = $Path.TrimEnd('\')
  $empty = Join-Path $TempHome ("empty-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
  New-Item -ItemType Directory -Force -Path $empty | Out-Null
  try {
    cmd /c "robocopy `"$empty`" `"$Path`" /MIR /NFL /NDL /NJH /NJS /NC /NS /NP" | Out-Null
    Remove-Item -Recurse -Force $Path -ErrorAction SilentlyContinue
  }
  finally {
    Remove-Item -Recurse -Force $empty -ErrorAction SilentlyContinue
  }

  if (Test-Path -LiteralPath $Path) {
    throw "Could not delete $Path - close any program holding files there and retry."
  }
}

function Remove-Paths {
  param([string[]]$Paths)
  foreach ($path in $Paths) {
    Remove-Tree -Path $path
  }
}

# Autolinking and CMake metadata record absolute paths, so anything generated under the
# other drive letter must go before switching phases.
function Clear-GeneratedBuildState {
  param([string]$Root)
  Remove-Paths @(
    "$Root\android\build",
    "$Root\android\app\build",
    "$Root\android\app\.cxx"
  )
  # Depth 4 covers <pkg>/android/.cxx and @scope/<pkg>/android/.cxx without walking the
  # long-path object trees inside them, which Get-ChildItem cannot enumerate reliably.
  Get-ChildItem -Path "$Root\node_modules" -Recurse -Depth 4 -Directory -Filter ".cxx" -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Tree -Path $_.FullName }
  Get-ChildItem -Path "$Root\node_modules" -Recurse -Depth 4 -Directory -Filter "build" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\android\\build$" } |
    ForEach-Object { Remove-Tree -Path $_.FullName }

  # Fail loudly rather than letting Gradle reuse half-deleted CMake metadata.
  foreach ($leftover in @("$Root\android\build", "$Root\android\app\build", "$Root\android\app\.cxx")) {
    if (Test-Path -LiteralPath $leftover) {
      throw "Stale build state survived cleanup: $leftover"
    }
  }
}

function Copy-BundleIntoSourceSet {
  if (-not (Test-Path -LiteralPath $GeneratedBundle)) {
    throw "Metro did not produce a bundle at $GeneratedBundle"
  }

  Remove-Paths @($MainAssetsDir)
  New-Item -ItemType Directory -Force -Path $MainAssetsDir | Out-Null
  Copy-Item -Force $GeneratedBundle $PackagedBundle

  if (-not (Test-Path -LiteralPath $GeneratedResDir)) { return }

  # Drawables for image assets: merge into src/main/res without touching existing resources.
  Get-ChildItem -Path $GeneratedResDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $relative = $_.FullName.Substring($GeneratedResDir.Length).TrimStart('\')
    $target   = Join-Path $MainResDir $relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
    Copy-Item -Force $_.FullName $target
  }
}

function Assert-BundleReady {
  if (-not (Test-Path -LiteralPath $PackagedBundle)) {
    throw "JS bundle missing at $PackagedBundle - re-run the script to redo Phase 1."
  }
  $sizeKb = [math]::Round((Get-Item -LiteralPath $PackagedBundle).Length / 1KB, 1)
  if ($sizeKb -lt 100) {
    throw "JS bundle is only $sizeKb KB - Phase 1 produced an incomplete bundle."
  }
  Write-Host "JS bundle ready ($sizeKb KB)" -ForegroundColor Green
}

function Assert-ApkContents {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($ApkPath)
  try {
    $entries = $zip.Entries | ForEach-Object { $_.FullName }
  }
  finally {
    $zip.Dispose()
  }

  if ($entries -notcontains "assets/index.android.bundle") {
    throw "APK was built without assets/index.android.bundle - the app would crash on launch."
  }
  Write-Host "Verified APK contains the JS bundle." -ForegroundColor Green

  # An APK missing the ABI of the target device installs fine and then dies on the first
  # System.loadLibrary call, which looks like a random crash rather than a build problem.
  foreach ($abi in $AbiList) {
    $libs = @($entries | Where-Object { $_ -like "lib/$abi/*.so" })
    if ($libs.Count -eq 0) {
      throw "APK has no native libraries for $abi - it would crash at launch on that device."
    }
    Write-Host "Verified $($libs.Count) native libraries for $abi." -ForegroundColor Green
  }
}

# The native build is bounded by the Windows commit limit, not by CPU. Each clang++ wants
# ~1.5 GB, and when commit runs out the failures are misleading: "LLVM ERROR: out of memory"
# from the compiler, or 0x5AA / 0x8 from Windows refusing to even start the process.
function Get-NativeCompileJobs {
  $os           = Get-CimInstance Win32_OperatingSystem
  $freeRamGb    = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
  $freeCommitGb = [math]::Round($os.FreeVirtualMemory / 1MB, 1)
  Write-Host "Free RAM: $freeRamGb GB, free commit: $freeCommitGb GB"

  $headroomGb = [math]::Min($freeRamGb, $freeCommitGb)
  if ($headroomGb -lt 4) {
    throw @(
      "Only $headroomGb GB available - the native build needs ~4 GB free to start."
      "Close Chrome, Android Studio and other heavy apps, then retry."
    ) -join "`n"
  }

  # Gradle (3 GB) and the Kotlin daemon (1.5 GB) are already accounted for in gradle.properties.
  $jobs = if ($headroomGb -ge 9) { 3 } elseif ($headroomGb -ge 6.5) { 2 } else { 1 }
  Write-Host "Limiting clang++ to $jobs concurrent compile(s)."
  return $jobs
}

# A crashed native build leaves clang++/ninja running, still holding the memory that broke it.
function Stop-StaleNativeProcesses {
  $stale = Get-Process -Name "clang++", "clang", "ninja" -ErrorAction SilentlyContinue
  if (-not $stale) { return }
  Write-Host "Killing $($stale.Count) leftover compiler process(es) from a previous run."
  $stale | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

function Invoke-Gradlew {
  param(
    [string]$AndroidDir,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$GradleArgs
  )
  $argLine  = ($GradleArgs -join ' ')
  $cmakeBin = Join-Path $SdkRoot "cmake\3.22.1\bin"
  $command  = @(
    "set ANDROID_HOME=$SdkRoot"
    "set ANDROID_SDK_ROOT=$SdkRoot"
    "set GRADLE_USER_HOME=$GradleHome"
    "set TEMP=$TempHome"
    "set TMP=$TempHome"
    "set PATH=$cmakeBin;%PATH%"
    "gradlew.bat $argLine"
  ) -join "&& "

  Push-Location $AndroidDir
  try {
    cmd /c $command
    if ($LASTEXITCODE -ne 0) {
      throw "Gradle failed: gradlew.bat $argLine (exit $LASTEXITCODE)"
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host "== MEDIQ APK build ==" -ForegroundColor Cyan
Write-Host "Project: $RealProjectRoot"
Write-Host "ABIs   : $($AbiList -join ', ')"

if ($env:TEMP -like "*cursor-sandbox-cache*") {
  Write-Host "WARNING: run this from Windows PowerShell, outside Cursor." -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force -Path $GradleHome, $TempHome | Out-Null
foreach ($drive in $SubstCandidates) { Invoke-Subst @($drive, "/d") }

Stop-StaleNativeProcesses

Initialize-Sdk
Initialize-Keystore

$env:GRADLE_USER_HOME           = $GradleHome
$env:ANDROID_HOME               = $SdkRoot
$env:ANDROID_SDK_ROOT           = $SdkRoot
$env:TEMP                       = $TempHome
$env:TMP                        = $TempHome

$CompileJobs = Get-NativeCompileJobs

# --- Phase 1: JS bundle on the real drive ---
Write-Host ""
Write-Host "Phase 1/2: bundling JS with Metro on $($RealProjectRoot.Substring(0,2))" -ForegroundColor Cyan

Clear-GeneratedBuildState -Root $RealProjectRoot
Remove-Paths @((Join-Path $RealProjectRoot "node_modules\.cache\metro"))

Invoke-Gradlew -AndroidDir $RealAndroidDir '--no-daemon' '--max-workers=1' $AbiProperty ':app:createBundleReleaseJsAndAssets'

Copy-BundleIntoSourceSet
Assert-BundleReady

# --- Phase 2: native compile + packaging on the subst drive ---
Write-Host ""
Write-Host "Phase 2/2: native build and packaging on a subst drive" -ForegroundColor Cyan

Invoke-Gradlew -AndroidDir $RealAndroidDir --stop
Start-Sleep -Seconds 2

$ShortRoot  = Enable-ShortPath -TargetPath $RealProjectRoot
$AndroidDir = Join-Path $ShortRoot "android"
Write-Host "Short path: $ShortRoot -> $RealProjectRoot"

# Clean through the subst drive so the paths being deleted are as short as possible.
Clear-GeneratedBuildState -Root $ShortRoot.TrimEnd('\')

try {
  # If clang still runs out of memory, the only remaining lever is serializing it. Retry
  # automatically rather than making a 20-minute build start over from the beginning.
  $jobPlan = if ($CompileJobs -gt 1) { @($CompileJobs, 1) } else { @(1) }

  for ($attempt = 0; $attempt -lt $jobPlan.Count; $attempt++) {
    $jobs = $jobPlan[$attempt]
    if ($attempt -gt 0) {
      Write-Host ""
      Write-Host "Native build failed - retrying with $jobs compile job at a time." -ForegroundColor Yellow
      Stop-StaleNativeProcesses
      Clear-GeneratedBuildState -Root $ShortRoot.TrimEnd('\')
    }
    try {
      Invoke-Gradlew -AndroidDir $AndroidDir '--no-daemon' '--max-workers=1' '-PskipJsBundling=true' $AbiProperty "-PnativeCompileJobs=$jobs" 'assembleRelease'
      break
    }
    catch {
      if ($attempt -eq $jobPlan.Count - 1) { throw }
    }
  }

  if (-not (Test-Path -LiteralPath $ApkPath)) {
    throw "APK not found at $ApkPath"
  }
  Assert-ApkContents

  $apkMb = [math]::Round((Get-Item -LiteralPath $ApkPath).Length / 1MB, 1)
  Write-Host ""
  Write-Host "SUCCESS - release APK built ($apkMb MB)" -ForegroundColor Green
  Write-Host "APK: $ApkPath"
}
finally {
  if ($SubstDrive) { Invoke-Subst @($SubstDrive, "/d") }
}
