# DroneOps Nexus API

NestJS backend for fleet data, MongoDB Atlas persistence and the Weather Flight Gate.

## Configuration

Copy `.env.example` to `.env`. Without `MONGODB_URI`, the API runs with built-in demo data. Once an Atlas connection string is configured, the API seeds empty collections automatically.

## Development

```bash
npm install
npm run start:dev
```

API base URL: `http://localhost:3100/api`.
