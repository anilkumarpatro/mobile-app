<<<<<<< HEAD
# mobile-app
=======
# psystem-customer-mobile

React Native customer app for MEDIQ (Android APK + iOS via cloud Mac build).

## Naming convention

| Item | Value |
|------|--------|
| **Project folder** | `psystem-customer-mobile` |
| **npm / native module name** | `PsystemCustomerMobile` (PascalCase, required by React Native) |
| **App name on device** | `MEDIQ Customer` |
| **Android applicationId** | `com.psystemcustomermobile` (can rename to `com.psystem.customer` later) |

Suggested repo name instead of `p-system-solution-customer`: **`psystem-customer-mobile`** — short, kebab-case, matches `psystem-frontend`.

## Structure

```
psystem-customer-mobile/
├── android/                 # Native Android project (APK build)
├── ios/                     # Native iOS project
├── src/
│   ├── app/                 # App shell, navigation, providers
│   ├── screens/             # Feature screens (home, cart, orders, …)
│   ├── components/          # Reusable UI & layout
│   ├── services/api/        # API client & base URLs (8080, 8081, …)
│   ├── theme/               # Colors, typography
│   ├── hooks/               # Custom hooks
│   ├── store/               # State (Zustand / Redux later)
│   ├── constants/           # App constants
│   ├── types/               # TypeScript types
│   └── utils/               # Helpers
├── App.tsx                  # Re-exports src/app/App.tsx
└── index.js                 # Entry point
```

## Prerequisites

- Node.js 22+
- Android Studio + JDK 17 (for APK)
- Android SDK & emulator or physical device
- **iOS:** Mac with Xcode **or** cloud build (GitHub Actions / Codemagic) — see [scripts/build-ios-cloud.md](scripts/build-ios-cloud.md)

## Commands

```bash
cd D:\psystem\workspace\psystem-customer-mobile
npm start
npm run android
npm run build:android
```

Release APK output:

`android/app/build/outputs/apk/release/app-release.apk`

### iOS (cloud — from Windows)

1. Push repo to GitHub.
2. Run **Actions → iOS Cloud Build**.
3. Download `mediq-ios-simulator` artifact (Simulator) or `mediq-ios-ipa` (device, requires Apple signing secrets).

Full steps: [scripts/build-ios-cloud.md](scripts/build-ios-cloud.md)

Alternative: connect repo to [Codemagic](https://codemagic.io) — uses `codemagic.yaml` in project root.

## Features (parity with web customer portal)

- OTP login (JWT, AsyncStorage session)
- Home, categories, search, product detail
- Cart sync with `/api/carts/me`
- Checkout with COD (`/api/payments/cod`)
- Orders list, detail, tracking, cancel (15 min window)
- Profile, addresses CRUD, profile setup gate
- Doctor consultation listing & slots
- Contact / callback request

Mock-only web features skipped: wishlist, support chat, complaints, notifications.

## Backend APIs

Same microservice URLs as web (`66.116.246.58`):

| Service | Port |
|---------|------|
| Auth / User | 8080 |
| Products | 8081 |
| Cart / Orders | 8083 |
| Payments | 8084 |
| Doctors | 8086 |

## Stack

- React Native 0.87 + TypeScript
- React Navigation 7 (stack + bottom tabs)
- Zustand
- React Hook Form + Yup ready
- Native `fetch` API layer mirroring `psystem-frontend/src/services/`
>>>>>>> 0a810cf (IOS)
