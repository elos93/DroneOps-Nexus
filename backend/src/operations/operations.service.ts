import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  AlertRecord,
  DroneRecord,
  Location,
  MissionRecord,
  MissionStatus,
  NoFlyZone,
  QuoteResult,
} from '../database/operations.types';
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

@Injectable()
export class OperationsService {
  constructor(private readonly database: DatabaseService) {}

  async getOverview() {
    const [drones, missions, stations, customers, auditEvents, noFlyZones] =
      await Promise.all([
        this.database.getDrones(),
        this.database.getMissions(),
        this.database.getStations(),
        this.database.getCustomers(),
        this.database.getAuditEvents(),
        this.database.getNoFlyZones(),
      ]);
    const alerts = this.buildAlerts(drones, missions, stations, noFlyZones);

    return {
      storageMode: this.database.getStorageMode(),
      metrics: {
        totalDrones: drones.length,
        activeMissions: missions.filter((mission) =>
          ['assigned', 'in-transit'].includes(mission.status),
        ).length,
        charging: drones.filter((drone) => drone.status === 'charging').length,
        ready: drones.filter((drone) => drone.status === 'available').length,
        averageBattery: Math.round(
          drones.reduce((sum, drone) => sum + drone.battery, 0) / drones.length,
        ),
      },
      drones,
      missions: missions.map((mission) => this.publicMission(mission)),
      stations,
      customers,
      alerts,
      notifications: alerts.map((alert) => ({
        ...alert,
        channel: alert.severity === 'critical' ? 'sms + email' : 'in-app',
        deliveryState: 'demo-preview',
      })),
      roleCapabilities: {
        admin: ['manage fleet', 'dispatch missions', 'view audit'],
        dispatcher: ['dispatch missions', 'monitor weather', 'track fleet'],
        customer: ['create delivery', 'receive quote', 'track shipment'],
      },
      analytics: {
        deliveredMissions: missions.filter(
          (mission) => mission.status === 'delivered',
        ).length,
        pendingRevenueIls: missions
          .filter((mission) => mission.status !== 'delivered')
          .reduce((sum, mission) => sum + (mission.priceIls ?? 0), 0),
        medicalMissions: missions.filter(
          (mission) => mission.serviceType === 'medical',
        ).length,
        averagePayloadKg:
          Math.round(
            (missions.reduce((sum, mission) => sum + mission.payloadKg, 0) /
              Math.max(missions.length, 1)) *
              10,
          ) / 10,
        averageRouteKm:
          Math.round(
            (missions.reduce(
              (sum, mission) => sum + (mission.routeDistanceKm ?? 0),
              0,
            ) /
              Math.max(
                missions.filter((mission) => mission.routeDistanceKm).length,
                1,
              )) *
              10,
          ) / 10,
        fleetUtilizationPercent: Math.round(
          (drones.filter((drone) => drone.status === 'mission').length /
            Math.max(drones.length, 1)) *
            100,
        ),
        chargingCapacityPercent: Math.round(
          (stations.reduce((sum, station) => sum + station.occupiedSlots, 0) /
            Math.max(
              stations.reduce((sum, station) => sum + station.totalSlots, 0),
              1,
            )) *
            100,
        ),
        maintenanceDue: drones.filter(
          (drone) =>
            drone.flightHours >= drone.nextServiceHours ||
            drone.batteryHealth < 82,
        ).length,
      },
      noFlyZones,
      auditEvents: auditEvents.slice(0, 12),
    };
  }

  async getDrones() {
    return this.database.getDrones();
  }

  async getMissions() {
    return (await this.database.getMissions()).map((mission) =>
      this.publicMission(mission),
    );
  }

  async getStations() {
    return this.database.getStations();
  }

  async getCustomers() {
    return this.database.getCustomers();
  }

  async quoteOrder(dto: QuoteOrderDto): Promise<QuoteResult> {
    const route = this.planRoute(
      dto.origin,
      dto.destination,
      await this.database.getNoFlyZones(),
    );
    const priorityFactor =
      dto.priority === 'critical' ? 1.6 : dto.priority === 'urgent' ? 1.28 : 1;
    const medicalFactor = dto.serviceType === 'medical' ? 1.45 : 1;
    const coldChainCost = dto.temperatureControlled ? 22 : 0;
    const priceIls = Math.round(
      (18 + route.distanceKm * 8.5 + dto.payloadKg * 6 + coldChainCost) *
        priorityFactor *
        medicalFactor,
    );
    return {
      distanceKm: route.distanceKm,
      priceIls,
      estimatedMinutes: Math.max(
        6,
        Math.ceil(
          route.distanceKm * 3.3 + (dto.serviceType === 'medical' ? 2 : 4),
        ),
      ),
      serviceType: dto.serviceType,
      priority: dto.priority,
      routeWaypoints: route.waypoints,
      routeNotice: route.notice,
    };
  }

  async createPublicOrder(dto: CreatePublicOrderDto) {
    const suffix = `${Date.now()}`.slice(-7);
    const senderId = `CU-S${suffix}`;
    const targetId = `CU-R${suffix}`;
    const missionId = `WEB-${suffix}`;
    const quote = await this.quoteOrder(dto);
    await Promise.all([
      this.database.saveCustomer({
        id: senderId,
        name: dto.senderName,
        phone: dto.senderPhone,
        email: dto.senderEmail,
        location: dto.origin,
        isActive: true,
      }),
      this.database.saveCustomer({
        id: targetId,
        name: dto.recipientName,
        phone: dto.recipientPhone,
        email: dto.recipientEmail,
        location: dto.destination,
        isActive: true,
      }),
    ]);
    const mission = await this.database.saveMission({
      id: missionId,
      senderCustomerId: senderId,
      targetCustomerId: targetId,
      customer: dto.senderName,
      origin: dto.origin,
      destination: dto.destination,
      payloadKg: dto.payloadKg,
      priority: dto.priority,
      serviceType: dto.serviceType,
      temperatureControlled: dto.temperatureControlled ?? false,
      priceIls: quote.priceIls,
      routeDistanceKm: quote.distanceKm,
      routeWaypoints: quote.routeWaypoints,
      routeNotice: quote.routeNotice,
      status: 'pending',
      etaMinutes: quote.estimatedMinutes,
      progressPercent: 0,
      trackingCode: `TRACK-${missionId}`,
      proofOfDeliveryCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      timeline: [
        this.timelineEvent(
          'pending',
          dto.serviceType === 'medical'
            ? 'Medical delivery requested'
            : 'Online delivery ordered',
          `${quote.routeNotice} Estimated price: ILS ${quote.priceIls}.`,
        ),
      ],
      isActive: true,
    });
    await this.audit(
      'PUBLIC_ORDER_CREATED',
      'mission',
      missionId,
      `${dto.serviceType} order submitted through customer portal.`,
    );
    return {
      mission: this.publicMission(mission),
      quote,
      notificationPreview: [
        `Confirmation email queued for ${dto.senderEmail}.`,
        `Tracking message queued for ${dto.recipientPhone}.`,
      ],
    };
  }

  async getTracking(id: string) {
    const mission = await this.findMission(id);
    const drone = mission.droneId
      ? await this.findDrone(mission.droneId)
      : undefined;
    return {
      mission: this.publicMission(mission),
      drone,
      publicCode: mission.trackingCode,
      demoConfirmationCode:
        this.database.getStorageMode() === 'demo-memory'
          ? mission.proofOfDeliveryCode
          : undefined,
      estimatedArrivalMinutes:
        mission.status === 'delivered'
          ? 0
          : Math.max(
              1,
              Math.round(
                mission.etaMinutes * (1 - mission.progressPercent / 100),
              ),
            ),
    };
  }

  async getRecommendations(missionId: string) {
    const [mission, drones] = await Promise.all([
      this.findMission(missionId),
      this.database.getDrones(),
    ]);
    return drones
      .filter(
        (drone) =>
          drone.status === 'available' &&
          drone.maxPayloadKg >= mission.payloadKg &&
          drone.flightHours < drone.nextServiceHours &&
          drone.batteryHealth >= 82,
      )
      .map((drone) => {
        const approachKm = this.distanceKm(drone.location, mission.origin);
        const score = Math.round(
          drone.battery * 0.5 +
            drone.batteryHealth * 0.25 -
            approachKm * 6 -
            (100 - drone.maxPayloadKg * 5) * 0.05,
        );
        return {
          drone,
          score,
          approachKm: Math.round(approachKm * 10) / 10,
          rationale: `${drone.battery}% battery, ${drone.batteryHealth}% health, ${Math.round(approachKm * 10) / 10} km from pickup`,
        };
      })
      .sort((first, second) => second.score - first.score);
  }

  async assertRouteClear(missionId: string) {
    const [mission, noFlyZones] = await Promise.all([
      this.findMission(missionId),
      this.database.getNoFlyZones(),
    ]);
    const destinationZone = noFlyZones.find(
      (item) =>
        this.distanceKm(item.center, mission.destination) <= item.radiusKm,
    );
    if (destinationZone) {
      throw new BadRequestException(
        `Destination is inside ${destinationZone.name}. ${destinationZone.reason}`,
      );
    }
    const route = this.planRoute(
      mission.origin,
      mission.destination,
      noFlyZones,
    );
    await this.database.saveMission({
      ...mission,
      routeDistanceKm: route.distanceKm,
      routeWaypoints: route.waypoints,
      routeNotice: route.notice,
    });
  }

  async findDrone(id: string) {
    const drone = (await this.database.getDrones()).find(
      (item) => item.id === id,
    );
    if (!drone) throw new NotFoundException(`Drone ${id} was not found.`);
    return drone;
  }

  async findMission(id: string) {
    const mission = (await this.database.getMissions()).find(
      (item) => item.id === id,
    );
    if (!mission) throw new NotFoundException(`Mission ${id} was not found.`);
    return mission;
  }

  async findStation(id: string) {
    const station = (await this.database.getStations()).find(
      (item) => item.id === id,
    );
    if (!station) throw new NotFoundException(`Station ${id} was not found.`);
    return station;
  }

  async findCustomer(id: string) {
    const customer = (await this.database.getCustomers()).find(
      (item) => item.id === id,
    );
    if (!customer) throw new NotFoundException(`Customer ${id} was not found.`);
    return customer;
  }

  async createDrone(dto: CreateDroneDto) {
    if (
      (await this.database.getDrones()).some((drone) => drone.id === dto.id)
    ) {
      throw new ConflictException(`Drone ${dto.id} already exists.`);
    }
    const drone = await this.database.saveDrone({
      ...dto,
      status: 'available',
      flightHours: 0,
      completedDeliveries: 0,
      batteryHealth: 100,
      nextServiceHours: 100,
      isActive: true,
    });
    await this.audit('DRONE_CREATED', 'drone', dto.id, 'New drone added.');
    return drone;
  }

  async updateDrone(id: string, dto: UpdateDroneDto) {
    const drone = await this.findDrone(id);
    const updated = await this.database.saveDrone({ ...drone, ...dto });
    await this.audit('DRONE_UPDATED', 'drone', id, 'Drone profile updated.');
    return updated;
  }

  async removeDrone(id: string) {
    const drone = await this.findDrone(id);
    if (drone.status === 'mission') {
      throw new BadRequestException('A drone on a mission cannot be removed.');
    }
    await this.database.deactivateDrone(id);
    await this.audit(
      'DRONE_DEACTIVATED',
      'drone',
      id,
      'Drone removed from fleet.',
    );
    return { message: `Drone ${id} deactivated.` };
  }

  async createCustomer(dto: CreateCustomerDto) {
    if (
      (await this.database.getCustomers()).some((item) => item.id === dto.id)
    ) {
      throw new ConflictException(`Customer ${dto.id} already exists.`);
    }
    const customer = await this.database.saveCustomer({
      ...dto,
      isActive: true,
    });
    await this.audit('CUSTOMER_CREATED', 'customer', dto.id, 'Customer added.');
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findCustomer(id);
    const updated = await this.database.saveCustomer({ ...customer, ...dto });
    await this.audit(
      'CUSTOMER_UPDATED',
      'customer',
      id,
      'Customer profile updated.',
    );
    return updated;
  }

  async removeCustomer(id: string) {
    const hasMission = (await this.database.getMissions()).some(
      (mission) =>
        (mission.senderCustomerId === id || mission.targetCustomerId === id) &&
        ['assigned', 'in-transit'].includes(mission.status),
    );
    if (hasMission) {
      throw new BadRequestException('Customer has an active delivery mission.');
    }
    await this.findCustomer(id);
    await this.database.deactivateCustomer(id);
    await this.audit(
      'CUSTOMER_DEACTIVATED',
      'customer',
      id,
      'Customer removed.',
    );
    return { message: `Customer ${id} deactivated.` };
  }

  async createStation(dto: CreateStationDto) {
    if (
      (await this.database.getStations()).some((item) => item.id === dto.id)
    ) {
      throw new ConflictException(`Station ${dto.id} already exists.`);
    }
    const station = await this.database.saveStation({
      ...dto,
      occupiedSlots: 0,
      isActive: true,
    });
    await this.audit(
      'STATION_CREATED',
      'station',
      dto.id,
      'Charging station added.',
    );
    return station;
  }

  async updateStation(id: string, dto: UpdateStationDto) {
    const station = await this.findStation(id);
    if (dto.totalSlots && dto.totalSlots < station.occupiedSlots) {
      throw new BadRequestException(
        'Total slots cannot be less than occupied slots.',
      );
    }
    const updated = await this.database.saveStation({ ...station, ...dto });
    await this.audit(
      'STATION_UPDATED',
      'station',
      id,
      'Station profile updated.',
    );
    return updated;
  }

  async removeStation(id: string) {
    const station = await this.findStation(id);
    if (station.occupiedSlots > 0) {
      throw new BadRequestException(
        'A charging station in use cannot be removed.',
      );
    }
    await this.database.deactivateStation(id);
    await this.audit('STATION_DEACTIVATED', 'station', id, 'Station removed.');
    return { message: `Station ${id} deactivated.` };
  }

  async createMission(dto: CreateMissionDto) {
    if (
      (await this.database.getMissions()).some((item) => item.id === dto.id)
    ) {
      throw new ConflictException(`Mission ${dto.id} already exists.`);
    }
    const [sender, target] = await Promise.all([
      this.findCustomer(dto.senderCustomerId),
      this.findCustomer(dto.targetCustomerId),
    ]);
    const quote = await this.quoteOrder({
      origin: sender.location,
      destination: target.location,
      payloadKg: dto.payloadKg,
      priority: dto.priority,
      serviceType: dto.serviceType ?? 'standard',
      temperatureControlled: dto.temperatureControlled,
    });
    const mission = await this.database.saveMission({
      ...dto,
      customer: sender.name,
      origin: sender.location,
      destination: target.location,
      serviceType: dto.serviceType ?? 'standard',
      temperatureControlled: dto.temperatureControlled ?? false,
      priceIls: quote.priceIls,
      routeDistanceKm: quote.distanceKm,
      routeWaypoints: quote.routeWaypoints,
      routeNotice: quote.routeNotice,
      status: 'pending',
      progressPercent: 0,
      trackingCode: `TRACK-${dto.id.replace(/[^A-Za-z0-9]/g, '')}`,
      proofOfDeliveryCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      timeline: [
        this.timelineEvent(
          'pending',
          'Mission created',
          `${quote.routeNotice} Estimated price: ILS ${quote.priceIls}.`,
        ),
      ],
      isActive: true,
    });
    await this.audit('MISSION_CREATED', 'mission', dto.id, 'Delivery created.');
    return mission;
  }

  async removeMission(id: string) {
    const mission = await this.findMission(id);
    if (['assigned', 'in-transit'].includes(mission.status)) {
      throw new BadRequestException('An active mission cannot be removed.');
    }
    await this.database.deactivateMission(id);
    await this.audit('MISSION_DEACTIVATED', 'mission', id, 'Delivery removed.');
    return { message: `Mission ${id} deactivated.` };
  }

  async createNoFlyZone(dto: CreateNoFlyZoneDto) {
    if (
      (await this.database.getNoFlyZones()).some((zone) => zone.id === dto.id)
    ) {
      throw new ConflictException(`No-fly zone ${dto.id} already exists.`);
    }
    const zone = await this.database.saveNoFlyZone({ ...dto, isActive: true });
    await this.audit(
      'NO_FLY_ZONE_CREATED',
      'no-fly-zone',
      dto.id,
      `${dto.name} added to route planning.`,
    );
    return zone;
  }

  async removeNoFlyZone(id: string) {
    await this.database.deactivateNoFlyZone(id);
    await this.audit(
      'NO_FLY_ZONE_DEACTIVATED',
      'no-fly-zone',
      id,
      'Restricted zone removed from active planning.',
    );
    return { message: `No-fly zone ${id} deactivated.` };
  }

  async assignMission(id: string, dto: AssignMissionDto) {
    const [mission, drone] = await Promise.all([
      this.findMission(id),
      this.findDrone(dto.droneId),
    ]);
    if (mission.status !== 'pending') {
      throw new BadRequestException('Only pending missions can be assigned.');
    }
    if (
      drone.status !== 'available' ||
      drone.maxPayloadKg < mission.payloadKg ||
      drone.flightHours >= drone.nextServiceHours ||
      drone.batteryHealth < 82
    ) {
      throw new BadRequestException(
        'Drone is unavailable, requires service or payload is too heavy.',
      );
    }
    await Promise.all([
      this.database.saveMission({
        ...mission,
        droneId: drone.id,
        status: 'assigned',
        progressPercent: 15,
        timeline: [
          ...mission.timeline,
          this.timelineEvent(
            'assigned',
            'Drone dispatched',
            `${drone.id} assigned to delivery.`,
          ),
        ],
      }),
      this.database.saveDrone({
        ...drone,
        status: 'mission',
        activeMissionId: mission.id,
      }),
    ]);
    await this.audit(
      'MISSION_ASSIGNED',
      'mission',
      id,
      `${drone.id} dispatched.`,
    );
    return this.findMission(id);
  }

  async collectMission(id: string) {
    const mission = await this.findMission(id);
    if (mission.status !== 'assigned' || !mission.droneId) {
      throw new BadRequestException('Mission must be assigned before pickup.');
    }
    const drone = await this.findDrone(mission.droneId);
    await Promise.all([
      this.database.saveMission({
        ...mission,
        status: 'in-transit',
        progressPercent: 48,
        timeline: [
          ...mission.timeline,
          this.timelineEvent(
            'in-transit',
            'Package collected',
            'Drone collected package and started delivery route.',
          ),
        ],
      }),
      this.database.saveDrone({
        ...drone,
        location: mission.origin,
        battery: Math.max(0, drone.battery - 6),
      }),
    ]);
    await this.audit('PACKAGE_COLLECTED', 'mission', id, 'Package collected.');
    return this.findMission(id);
  }

  async deliverMission(id: string) {
    const mission = await this.findMission(id);
    if (mission.status !== 'in-transit' || !mission.droneId) {
      throw new BadRequestException(
        'Mission must be in transit before delivery.',
      );
    }
    const drone = await this.findDrone(mission.droneId);
    await Promise.all([
      this.database.saveMission({
        ...mission,
        status: 'delivered',
        progressPercent: 100,
        timeline: [
          ...mission.timeline,
          this.timelineEvent(
            'delivered',
            'Delivery confirmed',
            'Package delivered to recipient.',
          ),
        ],
      }),
      this.database.saveDrone({
        ...drone,
        status: 'available',
        activeMissionId: undefined,
        location: mission.destination,
        battery: Math.max(0, drone.battery - 10),
        flightHours: Math.round((drone.flightHours + 0.6) * 10) / 10,
        completedDeliveries: drone.completedDeliveries + 1,
        batteryHealth: Math.max(65, drone.batteryHealth - 0.2),
      }),
    ]);
    await this.audit('PACKAGE_DELIVERED', 'mission', id, 'Delivery completed.');
    return this.findMission(id);
  }

  async confirmDelivery(id: string, dto: ConfirmDeliveryDto) {
    const mission = await this.findMission(id);
    if (mission.proofOfDeliveryCode !== dto.code) {
      throw new BadRequestException('Invalid delivery confirmation code.');
    }
    return this.deliverMission(id);
  }

  async simulateMissionStep(id: string) {
    const mission = await this.findMission(id);
    if (mission.status === 'assigned') return this.collectMission(id);
    if (mission.status === 'in-transit') return this.deliverMission(id);
    throw new BadRequestException(
      'Simulation is available after a drone has been assigned.',
    );
  }

  async advanceMissionTelemetry(id: string) {
    const mission = await this.findMission(id);
    if (!mission.droneId) {
      throw new BadRequestException('Mission must have an assigned drone.');
    }
    if (mission.status === 'pending') {
      throw new BadRequestException('Dispatch the mission before simulation.');
    }
    const drone = await this.findDrone(mission.droneId);
    const route = [
      mission.origin,
      ...(mission.routeWaypoints ?? []),
      mission.destination,
    ];
    const nextProgress =
      mission.status === 'assigned'
        ? 28
        : Math.min(100, mission.progressPercent + 18);
    const location = this.interpolateRoute(route, nextProgress / 100);
    const delivered = nextProgress >= 100;
    await Promise.all([
      this.database.saveMission({
        ...mission,
        status: delivered ? 'delivered' : 'in-transit',
        progressPercent: nextProgress,
        timeline: [
          ...mission.timeline,
          this.timelineEvent(
            delivered ? 'delivered' : 'in-transit',
            delivered ? 'Simulation delivery completed' : 'Live telemetry step',
            delivered
              ? 'Drone reached destination in simulation mode.'
              : `Drone advanced to ${location.label}.`,
          ),
        ],
      }),
      this.database.saveDrone({
        ...drone,
        status: delivered ? 'available' : 'mission',
        activeMissionId: delivered ? undefined : mission.id,
        location,
        battery: Math.max(0, drone.battery - (delivered ? 8 : 4)),
        flightHours: delivered
          ? Math.round((drone.flightHours + 0.5) * 10) / 10
          : drone.flightHours,
        completedDeliveries: delivered
          ? drone.completedDeliveries + 1
          : drone.completedDeliveries,
      }),
    ]);
    await this.audit(
      'TELEMETRY_ADVANCED',
      'mission',
      id,
      `${mission.droneId} moved to ${nextProgress}% route progress.`,
    );
    return {
      mission: this.publicMission(await this.findMission(id)),
      drone: await this.findDrone(mission.droneId),
      telemetry: {
        progressPercent: nextProgress,
        location,
        route,
      },
    };
  }

  async sendDroneToCharge(id: string, dto: ChargeDroneDto) {
    const [drone, station] = await Promise.all([
      this.findDrone(id),
      this.findStation(dto.stationId),
    ]);
    if (drone.status !== 'available') {
      throw new BadRequestException(
        'Only an available drone can be sent to charge.',
      );
    }
    if (station.occupiedSlots >= station.totalSlots) {
      throw new BadRequestException('Charging station has no free slots.');
    }
    await Promise.all([
      this.database.saveDrone({
        ...drone,
        status: 'charging',
        chargingStationId: station.id,
        location: station.location,
      }),
      this.database.saveStation({
        ...station,
        occupiedSlots: station.occupiedSlots + 1,
      }),
    ]);
    await this.audit(
      'CHARGE_STARTED',
      'drone',
      id,
      `Charging at ${station.id}.`,
    );
    return this.findDrone(id);
  }

  async releaseDroneFromCharge(id: string, dto: ReleaseChargeDto) {
    const drone = await this.findDrone(id);
    if (drone.status !== 'charging' || !drone.chargingStationId) {
      throw new BadRequestException('Drone is not charging.');
    }
    const station = await this.findStation(drone.chargingStationId);
    await Promise.all([
      this.database.saveDrone({
        ...drone,
        status: 'available',
        chargingStationId: undefined,
        battery: Math.min(100, drone.battery + dto.minutes * 1.25),
      }),
      this.database.saveStation({
        ...station,
        occupiedSlots: Math.max(0, station.occupiedSlots - 1),
      }),
    ]);
    await this.audit(
      'CHARGE_RELEASED',
      'drone',
      id,
      'Drone returned to service.',
    );
    return this.findDrone(id);
  }

  async completeService(id: string) {
    const drone = await this.findDrone(id);
    if (drone.status === 'mission') {
      throw new BadRequestException(
        'Drone cannot be serviced during a mission.',
      );
    }
    const updated = await this.database.saveDrone({
      ...drone,
      batteryHealth: 100,
      nextServiceHours: Math.ceil(drone.flightHours + 100),
    });
    await this.audit(
      'MAINTENANCE_COMPLETED',
      'drone',
      id,
      'Preventive service recorded.',
    );
    return updated;
  }

  async emergencyReturnHome(id: string) {
    const [drone, stations] = await Promise.all([
      this.findDrone(id),
      this.database.getStations(),
    ]);
    if (drone.status !== 'mission' || !drone.activeMissionId) {
      throw new BadRequestException(
        'Emergency return is available only for a drone on a mission.',
      );
    }
    const station = [...stations].sort(
      (first, second) =>
        this.distanceKm(drone.location, first.location) -
        this.distanceKm(drone.location, second.location),
    )[0];
    if (!station) {
      throw new BadRequestException('No return station is available.');
    }
    const mission = await this.findMission(drone.activeMissionId);
    const canCharge = station.occupiedSlots < station.totalSlots;
    await Promise.all([
      this.database.saveMission({
        ...mission,
        status: 'pending',
        droneId: undefined,
        progressPercent: 0,
        timeline: [
          ...mission.timeline,
          this.timelineEvent(
            'pending',
            'Emergency return initiated',
            `${drone.id} returned to ${station.name}; mission awaits redispatch.`,
          ),
        ],
      }),
      this.database.saveDrone({
        ...drone,
        status: canCharge ? 'charging' : 'available',
        activeMissionId: undefined,
        chargingStationId: canCharge ? station.id : undefined,
        location: station.location,
        battery: Math.max(0, drone.battery - 5),
      }),
      canCharge
        ? this.database.saveStation({
            ...station,
            occupiedSlots: station.occupiedSlots + 1,
          })
        : Promise.resolve(station),
    ]);
    await this.audit(
      'EMERGENCY_RETURN_HOME',
      'drone',
      id,
      `Drone recalled to ${station.id}; ${mission.id} returned to queue.`,
    );
    return this.findDrone(id);
  }

  private buildAlerts(
    drones: DroneRecord[],
    missions: MissionRecord[],
    stations: Awaited<ReturnType<DatabaseService['getStations']>>,
    noFlyZones: NoFlyZone[],
  ): AlertRecord[] {
    const alerts: AlertRecord[] = [];
    drones.forEach((drone) => {
      if (drone.battery < 35) {
        alerts.push({
          id: `BAT-${drone.id}`,
          severity: 'warning',
          title: 'Low battery',
          message: `${drone.id} is at ${drone.battery}% and should be charged.`,
          entityId: drone.id,
        });
      }
      if (
        drone.flightHours >= drone.nextServiceHours ||
        drone.batteryHealth < 82
      ) {
        alerts.push({
          id: `MNT-${drone.id}`,
          severity: 'critical',
          title: 'Maintenance due',
          message: `${drone.id} requires inspection before its next mission.`,
          entityId: drone.id,
        });
      }
    });
    stations
      .filter((station) => station.occupiedSlots >= station.totalSlots)
      .forEach((station) =>
        alerts.push({
          id: `ST-${station.id}`,
          severity: 'warning',
          title: 'Charging station full',
          message: `${station.name} has no open charging slot.`,
          entityId: station.id,
        }),
      );
    missions.forEach((mission) => {
      const zone = noFlyZones.find(
        (item) =>
          this.distanceKm(item.center, mission.destination) <= item.radiusKm,
      );
      if (zone && mission.status !== 'delivered') {
        alerts.push({
          id: `NFZ-${mission.id}`,
          severity: 'critical',
          title: 'Route intersects restricted zone',
          message: `${mission.id}: ${zone.name}. ${zone.reason}`,
          entityId: mission.id,
        });
      }
    });
    return alerts;
  }

  private timelineEvent(status: MissionStatus, title: string, detail: string) {
    return { status, title, detail, timestamp: new Date().toISOString() };
  }

  private async audit(
    action: string,
    entityType: string,
    entityId: string,
    detail: string,
  ) {
    await this.database.saveAuditEvent({
      id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      entityType,
      entityId,
      actor: 'Operations Control',
      timestamp: new Date().toISOString(),
      detail,
    });
  }

  private distanceKm(first: Location, second: Location) {
    const latitude = ((second.latitude - first.latitude) * Math.PI) / 180;
    const longitude = ((second.longitude - first.longitude) * Math.PI) / 180;
    const value =
      Math.sin(latitude / 2) ** 2 +
      Math.cos((first.latitude * Math.PI) / 180) *
        Math.cos((second.latitude * Math.PI) / 180) *
        Math.sin(longitude / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  private interpolateRoute(route: Location[], progress: number): Location {
    if (route.length === 0) {
      throw new BadRequestException('Route has no points.');
    }
    if (route.length === 1) return route[0];
    const clamped = Math.min(1, Math.max(0, progress));
    const segment = Math.min(
      route.length - 2,
      Math.floor(clamped * (route.length - 1)),
    );
    const localProgress = clamped * (route.length - 1) - segment;
    const start = route[segment];
    const end = route[segment + 1];
    return {
      latitude:
        start.latitude + (end.latitude - start.latitude) * localProgress,
      longitude:
        start.longitude + (end.longitude - start.longitude) * localProgress,
      label: `${Math.round(clamped * 100)}% along route`,
    };
  }

  private planRoute(
    origin: Location,
    destination: Location,
    noFlyZones: NoFlyZone[],
  ) {
    const directDistance = this.distanceKm(origin, destination);
    const midpoint = {
      latitude: (origin.latitude + destination.latitude) / 2,
      longitude: (origin.longitude + destination.longitude) / 2,
      label: 'Direct route midpoint',
    };
    const intersectedZone = noFlyZones.find(
      (zone) => this.distanceKm(zone.center, midpoint) <= zone.radiusKm + 0.55,
    );
    if (!intersectedZone) {
      return {
        distanceKm: Math.round(directDistance * 10) / 10,
        waypoints: [] as Location[],
        notice: 'Direct route cleared.',
      };
    }
    const waypoint: Location = {
      latitude: intersectedZone.center.latitude + intersectedZone.radiusKm / 92,
      longitude:
        intersectedZone.center.longitude + intersectedZone.radiusKm / 76,
      label: `Bypass ${intersectedZone.name}`,
    };
    return {
      distanceKm:
        Math.round(
          (this.distanceKm(origin, waypoint) +
            this.distanceKm(waypoint, destination)) *
            10,
        ) / 10,
      waypoints: [waypoint],
      notice: `Rerouted around ${intersectedZone.name}.`,
    };
  }

  private publicMission(mission: MissionRecord) {
    const { proofOfDeliveryCode, ...publicMission } = mission;
    void proofOfDeliveryCode;
    return publicMission;
  }
}
