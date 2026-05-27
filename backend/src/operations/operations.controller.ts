import { Controller, Get } from '@nestjs/common';
import { OperationsService } from './operations.service';

@Controller('operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('overview')
  getOverview() {
    return this.operations.getOverview();
  }

  @Get('drones')
  getDrones() {
    return this.operations.getDrones();
  }

  @Get('missions')
  getMissions() {
    return this.operations.getMissions();
  }
}
