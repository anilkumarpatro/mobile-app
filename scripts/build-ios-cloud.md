# iOS cloud build (from Windows)

iOS apps **cannot** be compiled on Windows. Use one of these cloud Mac options.

## Option A — GitHub Actions (recommended)

1. Push this repo to GitHub.
2. Open **Actions → iOS Cloud Build → Run workflow**.
3. When finished, download artifact **`mediq-ios-simulator`** (`.zip` with `.app` for Simulator).

### Install on a real iPhone (TestFlight / IPA)

Add these GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `IOS_TEAM_ID` | Apple Developer Team ID |
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Base64 of `.p12` distribution cert |
| `IOS_CERTIFICATE_PASSWORD` | `.p12` password |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64 of `.mobileprovision` for `com.psystemcustomermobile` |
| `IOS_KEYCHAIN_PASSWORD` | Any strong random string |

Re-run workflow → download **`mediq-ios-ipa`**.

## Option B — Codemagic

1. Sign up at [codemagic.io](https://codemagic.io).
2. Connect this repository.
3. Codemagic reads `codemagic.yaml` automatically.
4. Add Apple code signing in Codemagic UI (Apple ID or upload cert + profile).
5. Start build → download `.ipa` from artifacts.

## Option C — Mac with Xcode

```bash
cd psystem-customer-mobile
npm ci
cd ios && pod install && cd ..
npx react-native run-ios --configuration Release
```

## App identifiers

| Item | Value |
|------|--------|
| Bundle ID | `com.psystemcustomermobile` |
| Display name | `MEDIQ` |
| Min iOS | 15.1 |

## Apple Developer requirements (real device)

- Apple Developer Program ($99/year)
- App ID for `com.psystemcustomermobile`
- Development or Ad Hoc provisioning profile
- For App Store / TestFlight: App Store Connect app record
