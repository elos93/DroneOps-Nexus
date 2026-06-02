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

## Share An Install Link

Expo Go is useful for development, but it can feel slower because it runs through the development server.
For sharing the app with other Android users, create a real APK build:

```bash
cd mobile
npx eas-cli build -p android --profile preview
```

When the build finishes, Expo will print a public build URL.
Send that URL to testers so they can download and install the APK on Android.

For Google Play Store release, use the production profile:

```bash
cd mobile
npx eas-cli build -p android --profile production
```
