# Mobile App (iOS + Android)

Hand Tracker is packaged with [Capacitor](https://capacitorjs.com/) so the existing React + Vite UI runs inside native iOS and Android shells.

## Quick start

```bash
# Install JS deps
npm install

# Build the web app and copy assets into native projects
npm run build:mobile

# Open native IDEs (requires local tooling)
npm run cap:ios      # needs macOS + Xcode
npm run cap:android  # needs Android Studio / SDK
```

## First-time platform setup

If `ios/` or `android/` are missing:

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

## Cloud sync on devices

Native apps cannot call `localhost`. For MongoDB/cloud sync in a device build, set a public API URL before packaging:

```bash
export VITE_API_URL=https://your-backend.example.com/api
npm run build:mobile
```

Without `VITE_API_URL`, the app uses on-device storage (same localStorage path as the browser offline mode).

## Project layout

| Path | Purpose |
| --- | --- |
| `capacitor.config.ts` | App id, name, webDir, StatusBar/Splash settings |
| `src/native/bootstrap.ts` | Status bar, splash, Android back button |
| `src/config/api.ts` | Shared API URL resolution for web + native |
| `src/utils/platform.ts` | Capacitor platform helpers |
| `android/` | Android Studio project |
| `ios/` | Xcode project |

## App identity

- **App name:** Hand Tracker
- **Bundle / application id:** `com.le3beh.tracker`

## Dev workflow tips

1. Iterate in the browser with `npm run dev` for most UI work.
2. After web changes that should appear in the native shell, run `npm run build:mobile`.
3. For live reload against a phone/emulator, point Capacitor `server.url` at your LAN Vite URL in a local-only override (do not commit that for production).

## Backend CORS

If the mobile app calls a hosted API, allow the Capacitor origins (or temporarily allow all in development). Android uses an `https` scheme origin for the WebView; iOS uses `capacitor://`.
