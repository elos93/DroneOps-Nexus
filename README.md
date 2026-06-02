# DroneOps Nexus

A modern full-stack drone operations platform rebuilt with TypeScript, React, NestJS and MongoDB Atlas.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?logo=vercel)](https://droneops-nexus.vercel.app)
[![API Status](https://img.shields.io/badge/API-Online-16a34a)](https://droneops-nexus-api.vercel.app/api/health)
[![CI](https://github.com/elos93/DroneOps-Nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/elos93/DroneOps-Nexus/actions/workflows/ci.yml)

## Live Demo

- Web application: [https://droneops-nexus.vercel.app](https://droneops-nexus.vercel.app)
- Public API health check: [https://droneops-nexus-api.vercel.app/api/health](https://droneops-nexus-api.vercel.app/api/health)
- Detailed product tour: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

The hosted demo currently runs with seeded in-memory operations data. MongoDB Atlas can be configured for persistent production data.

## Technology

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts and React Leaflet.
- Backend: Node.js, NestJS and TypeScript.
- Mobile: Expo, React Native, TypeScript and TanStack Query.
- Database: MongoDB Atlas through Mongoose schemas.
- Live weather: Open-Meteo wind and gust data.

## Features Implemented

- Modern command dashboard with fleet metrics, mission queue and battery analytics.
- Public product landing page and customer booking portal with instant route pricing.
- Secure demo authentication with administrator, dispatcher and customer roles.
- Medical priority delivery mode with temperature-controlled shipment indication.
- Live map view for drones and charging stations.
- Weather Flight Gate that evaluates wind, gusts, payload and battery reserve.
- Six-hour weather scheduling forecast for selecting a safer departure window.
- `GO`, `CAUTION` and `HOLD` takeoff decisions.
- Full fleet management: add, update, remove, charge and release drones.
- Customer and charging-station management screens.
- Delivery lifecycle matching the original WPF system: create, weather-approved dispatch, pickup and delivery.
- API endpoints for operational CRUD, delivery actions and weather-approved dispatch.
- Mission Intelligence center with alert detection, analytics and smart drone recommendations.
- Customer Tracking Portal with shipment progress, timeline, printable mission report and proof-of-delivery flow.
- Fleet Maintenance center with battery-health monitoring, flight-hours and preventive service actions.
- Restricted no-fly zones displayed on the map and enforced during dispatch.
- Smart route calculation with bypass waypoint planning around restricted corridors.
- Operational audit log, light/dark themes and guided live demo progression.
- Role-preview experience for administrator, dispatcher and customer product flows.
- Server-side RBAC protection for fleet changes, dispatch and geofence management.
- Managed no-fly-zone editor with Atlas persistence when `MONGODB_URI` is configured.
- Mission telemetry simulator that moves drones along active delivery routes.
- PWA support with installable manifest and offline app shell.
- Multilingual UI with English, Spanish and Hebrew, including RTL layout support for Hebrew.
- Built-in API documentation at [`/api/docs`](https://droneops-nexus-api.vercel.app/api/docs) and schema at [`/api/openapi.json`](https://droneops-nexus-api.vercel.app/api/openapi.json).
- Notification routing preview for in-app, SMS and email escalation channels.
- GitHub Actions quality gate for lint, builds, unit tests and API integration tests.
- Emergency Return Home command that recalls an active drone and safely requeues its mission.
- Demo-mode seed data so development works before Atlas credentials are supplied.
- MongoDB Atlas bootstrap: when `MONGODB_URI` is configured, empty collections are seeded automatically.
- Android-first Expo mobile app with booking, Sky Radar tracking and OTP handoff.

## Android Mobile App

The repository includes a real Expo / React Native Android app in `mobile/`.

It connects to the same public DroneOps API and includes a mobile fleet dashboard, customer delivery booking, landing-zone selection, smart quote calculation, Sky Radar tracking and OTP-style secure handoff.

Run it locally:

```bash
cd mobile
npm install
npm run android
```

Or from the repository root:

```bash
npm run mobile:android
```

## Project Structure

```text
DroneOps-Nexus/
  frontend/   React + Vite operations dashboard
  backend/    NestJS API, MongoDB Atlas integration and weather policy
  mobile/     Expo + React Native Android app
```

## Start Locally

From the project root, install the root runner once and launch both applications:

```bash
npm install
npm run dev
```

Or run each application separately:

Backend:

```bash
cd backend
copy .env.example .env
npm run start:dev
```

For immediate demo mode, leave `MONGODB_URI` unset in `.env`. To use Atlas, paste your Atlas connection string there.
The API is configured to run locally on `http://localhost:3100/api`.

Frontend:

```bash
cd frontend
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## MongoDB Atlas Setup

1. Create an Atlas cluster and database user.
2. Allow your development IP address in Network Access.
3. Copy the application connection string.
4. Set `MONGODB_URI` in `backend/.env`.

Never commit real MongoDB credentials to Git.

## Production Integrations

The application is fully demonstrable without cloud credentials. For a production deployment:

- Configure `MONGODB_URI` to persist fleet, timeline and audit information in Atlas.
- Replace demo authentication users with a real identity provider such as Clerk, Auth0 or a managed enterprise SSO when moving beyond portfolio/demo mode.
- Set a strong `AUTH_SECRET` in production. The public demo falls back to a clearly marked demo secret.
- Connect an SMS or email provider for actual notification delivery. Current channel routing is a demonstration preview, and in demo-memory mode only the tracking screen displays its demo code.

## API

- `GET /api/health`
- `GET /api/docs`
- `GET /api/openapi.json`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/operations/overview`
- `POST /api/operations/public/quote`
- `POST /api/operations/public/orders`
- `GET /api/operations/drones`
- `GET /api/operations/missions`
- `GET /api/operations/customers`
- `GET /api/operations/stations`
- `POST|PATCH|DELETE /api/operations/drones/:id`
- `POST|PATCH|DELETE /api/operations/customers/:id`
- `POST|PATCH|DELETE /api/operations/stations/:id`
- `POST|DELETE /api/operations/missions/:id`
- `POST /api/operations/drones/:id/charge`
- `POST /api/operations/drones/:id/release-charge`
- `POST /api/operations/missions/:id/pickup`
- `POST /api/operations/missions/:id/deliver`
- `POST /api/operations/missions/:id/confirm-delivery`
- `POST /api/operations/missions/:id/simulate-step`
- `GET /api/operations/tracking/:id`
- `GET /api/operations/recommendations/:missionId`
- `POST /api/operations/no-fly-zones`
- `DELETE /api/operations/no-fly-zones/:id`
- `POST /api/operations/missions/:id/telemetry-step`
- `POST /api/operations/drones/:id/service`
- `POST /api/operations/drones/:id/emergency-return`
- `POST /api/weather/flight-gate`
- `POST /api/weather/dispatch`
- `GET /api/weather/forecast/:missionId`

Example assessment request:

```json
{
  "droneId": "DX-07",
  "missionId": "MS-207"
}
```
