# DroneOps Nexus

A modern full-stack drone operations platform rebuilt with TypeScript, React, NestJS and MongoDB Atlas.

## Technology

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts and React Leaflet.
- Backend: Node.js, NestJS and TypeScript.
- Database: MongoDB Atlas through Mongoose schemas.
- Live weather: Open-Meteo wind and gust data.

## Features Implemented

- Modern command dashboard with fleet metrics, mission queue and battery analytics.
- Live map view for drones and charging stations.
- Weather Flight Gate that evaluates wind, gusts, payload and battery reserve.
- `GO`, `CAUTION` and `HOLD` takeoff decisions.
- API endpoints for operations overview and flight assessment.
- Demo-mode seed data so development works before Atlas credentials are supplied.
- MongoDB Atlas bootstrap: when `MONGODB_URI` is configured, empty collections are seeded automatically.

## Project Structure

```text
DroneOps-Nexus/
  frontend/   React + Vite operations dashboard
  backend/    NestJS API, MongoDB Atlas integration and weather policy
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

## API

- `GET /api/health`
- `GET /api/operations/overview`
- `GET /api/operations/drones`
- `GET /api/operations/missions`
- `POST /api/weather/flight-gate`

Example assessment request:

```json
{
  "droneId": "DX-07",
  "missionId": "MS-207"
}
```
