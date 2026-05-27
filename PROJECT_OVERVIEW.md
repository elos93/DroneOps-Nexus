# DroneOps Nexus - Product Overview

## About The Project

DroneOps Nexus is a modern drone-delivery operations control center. It rebuilds and significantly expands an original desktop WPF fleet-management project as a public full-stack web application.

Live application: [https://droneops-nexus.vercel.app](https://droneops-nexus.vercel.app)

## Product Vision

The system is designed for an operations team managing last-mile drone deliveries. It combines dispatch decisions, fleet readiness, customer tracking, weather risk, maintenance and traceability in one control-center experience.

## Key Capabilities

### Operations Dashboard

- Fleet availability and active-mission metrics.
- Battery-readiness visualization.
- Live map for drones and charging stations.
- Restricted no-fly zones displayed on the map.

### Delivery Management

- Create and manage delivery missions.
- Assign, collect and deliver packages.
- Weather-approved dispatch based on wind, gusts, payload and battery reserve.
- Emergency Return Home command for active drones.

### Mission Intelligence

- Smart drone recommendations ranked by readiness, location and battery health.
- Operational alerts for low battery, maintenance and restricted routes.
- Utilization and charging-capacity indicators.

### Customer Tracking

- Public-style tracking portal for a selected mission.
- Delivery progress bar and estimated arrival.
- Full mission timeline.
- Proof-of-delivery confirmation flow.
- Printable mission report.

### Fleet Maintenance

- Flight hours and completed-delivery tracking.
- Battery-health monitoring.
- Preventive maintenance completion workflow.
- Dispatch protection for drones requiring service.

### Governance

- Audit log of operational activity.
- Safe public API responses that do not expose delivery confirmation codes.
- Light and dark display themes.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, TanStack Query, Recharts, React Leaflet |
| Backend | Node.js, NestJS, TypeScript |
| Persistence | MongoDB Atlas-ready Mongoose data layer |
| Weather | Open-Meteo live wind and gust assessment |
| Deployment | Vercel web application and serverless API |

## Architecture

```text
React Control Center (Vercel)
        |
        | HTTPS API requests
        v
NestJS Operations API (Vercel Serverless)
        |
        +-- Demo-memory seeded mode for public demonstration
        +-- MongoDB Atlas mode when MONGODB_URI is configured
        |
        +-- Open-Meteo weather safety assessment
```

## Deployment Links

- Frontend: [https://droneops-nexus.vercel.app](https://droneops-nexus.vercel.app)
- Backend API: [https://droneops-nexus-api.vercel.app/api](https://droneops-nexus-api.vercel.app/api)
- Health endpoint: [https://droneops-nexus-api.vercel.app/api/health](https://droneops-nexus-api.vercel.app/api/health)

## Production Next Steps

- Configure MongoDB Atlas credentials for persistent cloud data.
- Add authentication and role-based authorization for administrator, dispatcher and customer users.
- Connect a real SMS or email provider for delivery confirmation codes.
- Add a custom domain and monitoring for a production release.
