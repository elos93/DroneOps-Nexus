import { Controller, Get, Header } from '@nestjs/common';

const openApi = {
  openapi: '3.1.0',
  info: {
    title: 'DroneOps Nexus API',
    version: '1.0.0',
    description:
      'Operations, booking, weather, authentication and fleet simulation API.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/login': {
      post: { summary: 'Sign in with a demo or configured user' },
    },
    '/auth/me': { get: { summary: 'Return the authenticated profile' } },
    '/operations/overview': {
      get: { summary: 'Fleet overview and analytics' },
    },
    '/operations/public/quote': {
      post: { summary: 'Quote a public delivery' },
    },
    '/operations/public/orders': { post: { summary: 'Create a public order' } },
    '/operations/no-fly-zones': {
      post: { summary: 'Create a managed no-fly zone' },
    },
    '/operations/no-fly-zones/{id}': {
      delete: { summary: 'Deactivate a no-fly zone' },
    },
    '/operations/missions/{id}/telemetry-step': {
      post: { summary: 'Advance a mission simulation step' },
    },
    '/weather/flight-gate': { post: { summary: 'Assess live weather safety' } },
    '/weather/dispatch': {
      post: { summary: 'Dispatch after safety approval' },
    },
    '/weather/forecast/{missionId}': {
      get: { summary: 'Return six-hour wind scheduling forecast' },
    },
  },
};

@Controller()
export class DocsController {
  @Get('openapi.json')
  openApi() {
    return openApi;
  }

  @Get('docs')
  @Header('content-type', 'text/html; charset=utf-8')
  docs() {
    const rows = Object.entries(openApi.paths)
      .map(
        ([path, methods]) =>
          `<tr><td><code>${Object.keys(methods).join(', ').toUpperCase()}</code></td><td>${path}</td><td>${Object.values(methods)[0].summary}</td></tr>`,
      )
      .join('');
    return `<!doctype html>
      <html lang="en">
        <head>
          <title>DroneOps Nexus API Docs</title>
          <style>
            body{font-family:Inter,Segoe UI,Arial,sans-serif;margin:0;background:#081120;color:#e9f1ff}
            main{max-width:980px;margin:0 auto;padding:48px 22px}
            h1{font-size:42px;margin:0 0 8px} p{color:#94a3b8}
            table{width:100%;border-collapse:collapse;margin-top:28px;background:#0d192c;border:1px solid #1c2b42;border-radius:14px;overflow:hidden}
            th,td{padding:14px 16px;border-bottom:1px solid #1c2b42;text-align:left}
            th{color:#22d3ee;font-size:12px;text-transform:uppercase;letter-spacing:.1em}
            code{color:#86efac}
            a{color:#22d3ee}
          </style>
        </head>
        <body><main><h1>DroneOps Nexus API</h1><p>Production-facing API map for the drone operations platform. Raw schema: <a href="/api/openapi.json">/api/openapi.json</a>.</p><table><thead><tr><th>Method</th><th>Path</th><th>Summary</th></tr></thead><tbody>${rows}</tbody></table></main></body>
      </html>`;
  }
}
