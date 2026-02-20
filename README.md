# DineEase — Customer Reservation App

---

## Android Release Checklist

### Every time you release to Google Play Closed Testing

#### 1. Bump the version in `app.json`

Open `app.json` and update two fields:

```json
"version": "1.2.0",    // user-visible version string (semver: major.minor.patch)
"versionCode": 3,      // integer — must be HIGHER than the previous release
```

> Google Play **rejects** a build with the same `versionCode` as a previous one.
>
> Rule of thumb:
> - Bug fix only → bump patch + versionCode &nbsp;&nbsp;(e.g. 1.1.0 → 1.1.1, versionCode 2 → 3)
> - New features → bump minor + versionCode &nbsp;&nbsp;(e.g. 1.1.0 → 1.2.0, versionCode 2 → 3)
> - Breaking change → bump major + versionCode

---

#### 2. Build and submit to Google Play

Run from the `DineEaseApp` directory:

```bash
eas build --platform android --profile production --auto-submit
```

This will:
1. Upload your code to Expo's build servers (build takes ~5–15 min)
2. Build a signed `.aab` using the `production` profile in `eas.json`
3. Automatically submit to the **Internal testing** track on Google Play using `google-play-service-account.json`

Track the build at https://expo.dev

---

#### 3. Promote to Closed Testing in Google Play Console

EAS submits to **Internal testing** automatically. To promote to **Closed testing (Alpha)**:

1. Go to [Google Play Console](https://play.google.com/console) → DineEase → Testing → Internal testing
2. Find the new release → **Promote release** → **Closed testing (Alpha)**
3. Select your tester group and roll out

---

## Useful Commands

| Command | What it does |
|---|---|
| `eas build --platform android --profile production --auto-submit` | Build AAB + auto-submit to Internal track |
| `eas build --platform android --profile production` | Build only (submit later) |
| `eas submit --platform android --profile production` | Submit the latest completed build |
| `eas build:list` | List all past builds and their status |
| `npm run update-ip` | Update `.env` with your current local IP (dev only) |
| `npm run android` | Run on a local Android device/emulator (dev only, clears Metro cache) |

---

## Config File Reference

| File | Purpose |
|---|---|
| `app.json` | App name, version, versionCode, permissions, Google Maps key |
| `eas.json` | EAS build profiles (development / preview / production) and submit config |
| `babel.config.js` | Babel config — `inline-dotenv` bakes `.env` local IPs into dev builds only (`__DEV__` guard in `api.config.ts` means prod builds always use hardcoded production URLs) |
| `metro.config.js` | Metro bundler config — Hermes minifier fix + TanStack resolver fix |
| `google-play-service-account.json` | Google Play API credentials for `eas submit` (gitignored — keep safe) |
| `.env` | Local environment variables (gitignored — never commit) |
| `local/` | Personal scratch scripts, not committed to git (gitignored) |
