# WATCHR Mobile (Initial Setup)

React Native mobile app scaffold for WATCHR, based on Expo + TypeScript.

## Run

```bash
npm install
npm run start
```

## Useful scripts

```bash
npm run android
npm run ios
npm run web
npm run typecheck
```

## Environment

Copy `.env.example` to `.env` and set your backend URL.

```env
EXPO_PUBLIC_API_URL=http://<YOUR_PC_IP>:3000
```

Use your LAN IP when testing from a real device.

## Current status

- Bottom tab shell ready (Watchlist, Futures, Alerts, History)
- AsyncStorage hooks scaffolded
- API client scaffolded
- Notification utility scaffolded
- Futures open prediction card (weighted index model)
- Expo export validation passed (android/ios bundle)
