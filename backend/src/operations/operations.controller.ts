import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { OperationsService } from './operations.service';
import {
  AssignMissionDto,
  ChargeDroneDto,
  ConfirmDeliveryDto,
  CreateCustomerDto,
  CreateDroneDto,
  CreateMissionDto,
  CreateNoFlyZoneDto,
  CreatePublicOrderDto,
  CreateStationDto,
  QuoteOrderDto,
  ReleaseChargeDto,
  UpdateCustomerDto,
  UpdateDroneDto,
  UpdateStationDto,
} from './dto/operations.dto';

@Controller('operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('overview')
  getOverview() {
    return this.operations.getOverview();
  }

  @Post('public/quote')
  quoteOrder(@Body() dto: QuoteOrderDto) {
    return this.operations.quoteOrder(dto);
  }

  @Post('public/orders')
  createPublicOrder(@Body() dto: CreatePublicOrderDto) {
    return this.operations.createPublicOrder(dto);
  }

  @Get('drones')
  getDrones() {
    return this.operations.getDrones();
  }

  @Post('drones')
  @UseGuards(AuthGuard)
  @Roles('admin')
  createDrone(@Body() dto: CreateDroneDto) {
    return this.operations.createDrone(dto);
  }

  @Patch('drones/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  updateDrone(@Param('id') id: string, @Body() dto: UpdateDroneDto) {
    return this.operations.updateDrone(id, dto);
  }

  @Delete('drones/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  removeDrone(@Param('id') id: string) {
    return this.operations.removeDrone(id);
  }

  @Post('drones/:id/charge')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  chargeDrone(@Param('id') id: string, @Body() dto: ChargeDroneDto) {
    return this.operations.sendDroneToCharge(id, dto);
  }

  @Post('drones/:id/release-charge')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  releaseDrone(@Param('id') id: string, @Body() dto: ReleaseChargeDto) {
    return this.operations.releaseDroneFromCharge(id, dto);
  }

  @Post('drones/:id/service')
  @UseGuards(AuthGuard)
  @Roles('admin')
  serviceDrone(@Param('id') id: string) {
    return this.operations.completeService(id);
  }

  @Post('drones/:id/emergency-return')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  emergencyReturn(@Param('id') id: string) {
    return this.operations.emergencyReturnHome(id);
  }

  @Get('missions')
  getMissions() {
    return this.operations.getMissions();
  }

  @Post('missions')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  createMission(@Body() dto: CreateMissionDto) {
    return this.operations.createMission(dto);
  }

  @Delete('missions/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  removeMission(@Param('id') id: string) {
    return this.operations.removeMission(id);
  }

  @Post('missions/:id/assign')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  assignMission(@Param('id') id: string, @Body() dto: AssignMissionDto) {
    return this.operations.assignMission(id, dto);
  }

  @Post('missions/:id/pickup')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  pickupMission(@Param('id') id: string) {
    return this.operations.collectMission(id);
  }

  @Post('missions/:id/deliver')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  deliverMission(@Param('id') id: string) {
    return this.operations.deliverMission(id);
  }

  @Post('missions/:id/confirm-delivery')
  confirmDelivery(@Param('id') id: string, @Body() dto: ConfirmDeliveryDto) {
    return this.operations.confirmDelivery(id, dto);
  }

  @Post('missions/:id/simulate-step')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  simulateStep(@Param('id') id: string) {
    return this.operations.simulateMissionStep(id);
  }

  @Post('missions/:id/telemetry-step')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  telemetryStep(@Param('id') id: string) {
    return this.operations.advanceMissionTelemetry(id);
  }

  @Get('tracking/:id')
  tracking(@Param('id') id: string) {
    return this.operations.getTracking(id);
  }

  @Get('recommendations/:missionId')
  recommendations(@Param('missionId') missionId: string) {
    return this.operations.getRecommendations(missionId);
  }

  @Get('customers')
  getCustomers() {
    return this.operations.getCustomers();
  }

  @Post('customers')
  @UseGuards(AuthGuard)
  @Roles('admin')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.operations.createCustomer(dto);
  }

  @Patch('customers/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.operations.updateCustomer(id, dto);
  }

  @Delete('customers/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  removeCustomer(@Param('id') id: string) {
    return this.operations.removeCustomer(id);
  }

  @Get('stations')
  getStations() {
    return this.operations.getStations();
  }

  @Post('stations')
  @UseGuards(AuthGuard)
  @Roles('admin')
  createStation(@Body() dto: CreateStationDto) {
    return this.operations.createStation(dto);
  }

  @Patch('stations/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  updateStation(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.operations.updateStation(id, dto);
  }

  @Delete('stations/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  removeStation(@Param('id') id: string) {
    return this.operations.removeStation(id);
  }

  @Post('no-fly-zones')
  @UseGuards(AuthGuard)
  @Roles('admin')
  createNoFlyZone(@Body() dto: CreateNoFlyZoneDto) {
    return this.operations.createNoFlyZone(dto);
  }

  @Delete('no-fly-zones/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  removeNoFlyZone(@Param('id') id: string) {
    return this.operations.removeNoFlyZone(id);
  }
}
