# DroneOps Nexus Mobile

Android-first Expo app for the DroneOps Nexus delivery platform.

## What It Includes

- Mobile command dashboard connected to the public DroneOps API.
- Customer delivery booking flow.
- Landing zone selection.
- Quote and route estimate.
- Tracking code lookup.
- Sky Radar mobile delivery tracking.
- OTP delivery confirmation.

## Run Locally

```bash
cd mobile
npm install
npm run android
```

The app uses:

```text
https://droneops-nexus-api.vercel.app/api
```

You can override it with:

```bash
EXPO_PUBLIC_API_URL=https://your-api-url/api npm run android
```
