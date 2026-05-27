import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      service: 'DroneOps Nexus API',
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }
}
