import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OperationsService } from './operations.service';
import {
  AssignMissionDto,
  ChargeDroneDto,
  ConfirmDeliveryDto,
  CreateCustomerDto,
  CreateDroneDto,
  CreateMissionDto,
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
  createDrone(@Body() dto: CreateDroneDto) {
    return this.operations.createDrone(dto);
  }

  @Patch('drones/:id')
  updateDrone(@Param('id') id: string, @Body() dto: UpdateDroneDto) {
    return this.operations.updateDrone(id, dto);
  }

  @Delete('drones/:id')
  removeDrone(@Param('id') id: string) {
    return this.operations.removeDrone(id);
  }

  @Post('drones/:id/charge')
  chargeDrone(@Param('id') id: string, @Body() dto: ChargeDroneDto) {
    return this.operations.sendDroneToCharge(id, dto);
  }

  @Post('drones/:id/release-charge')
  releaseDrone(@Param('id') id: string, @Body() dto: ReleaseChargeDto) {
    return this.operations.releaseDroneFromCharge(id, dto);
  }

  @Post('drones/:id/service')
  serviceDrone(@Param('id') id: string) {
    return this.operations.completeService(id);
  }

  @Post('drones/:id/emergency-return')
  emergencyReturn(@Param('id') id: string) {
    return this.operations.emergencyReturnHome(id);
  }

  @Get('missions')
  getMissions() {
    return this.operations.getMissions();
  }

  @Post('missions')
  createMission(@Body() dto: CreateMissionDto) {
    return this.operations.createMission(dto);
  }

  @Delete('missions/:id')
  removeMission(@Param('id') id: string) {
    return this.operations.removeMission(id);
  }

  @Post('missions/:id/assign')
  assignMission(@Param('id') id: string, @Body() dto: AssignMissionDto) {
    return this.operations.assignMission(id, dto);
  }

  @Post('missions/:id/pickup')
  pickupMission(@Param('id') id: string) {
    return this.operations.collectMission(id);
  }

  @Post('missions/:id/deliver')
  deliverMission(@Param('id') id: string) {
    return this.operations.deliverMission(id);
  }

  @Post('missions/:id/confirm-delivery')
  confirmDelivery(@Param('id') id: string, @Body() dto: ConfirmDeliveryDto) {
    return this.operations.confirmDelivery(id, dto);
  }

  @Post('missions/:id/simulate-step')
  simulateStep(@Param('id') id: string) {
    return this.operations.simulateMissionStep(id);
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
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.operations.createCustomer(dto);
  }

  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.operations.updateCustomer(id, dto);
  }

  @Delete('customers/:id')
  removeCustomer(@Param('id') id: string) {
    return this.operations.removeCustomer(id);
  }

  @Get('stations')
  getStations() {
    return this.operations.getStations();
  }

  @Post('stations')
  createStation(@Body() dto: CreateStationDto) {
    return this.operations.createStation(dto);
  }

  @Patch('stations/:id')
  updateStation(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.operations.updateStation(id, dto);
  }

  @Delete('stations/:id')
  removeStation(@Param('id') id: string) {
    return this.operations.removeStation(id);
  }
}
