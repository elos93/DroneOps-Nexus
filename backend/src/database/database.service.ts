import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Model, createConnection } from 'mongoose';
import {
  demoAuditEvents,
  demoCustomers,
  demoDrones,
  demoMissions,
  demoStations,
} from './demo-data';
import {
  AuditEventSchema,
  CustomerSchema,
  DroneSchema,
  MissionSchema,
  StationSchema,
} from './operations.schemas';
import {
  AuditEventRecord,
  CustomerRecord,
  DroneRecord,
  MissionRecord,
  StationRecord,
} from './operations.types';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private connection?: Connection;
  private droneModel?: Model<DroneRecord>;
  private missionModel?: Model<MissionRecord>;
  private stationModel?: Model<StationRecord>;
  private customerModel?: Model<CustomerRecord>;
  private auditModel?: Model<AuditEventRecord>;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const uri = this.config.get<string>('MONGODB_URI');
    if (!uri) {
      this.logger.log('MONGODB_URI not set. Running with built-in demo data.');
      return;
    }

    this.connection = await createConnection(uri).asPromise();
    this.droneModel = this.connection.model<DroneRecord>('Drone', DroneSchema);
    this.missionModel = this.connection.model<MissionRecord>(
      'Mission',
      MissionSchema,
    );
    this.stationModel = this.connection.model<StationRecord>(
      'Station',
      StationSchema,
    );
    this.customerModel = this.connection.model<CustomerRecord>(
      'Customer',
      CustomerSchema,
    );
    this.auditModel = this.connection.model<AuditEventRecord>(
      'AuditEvent',
      AuditEventSchema,
    );
    await this.seedAtlasIfEmpty();
    this.logger.log('Connected to MongoDB Atlas.');
  }

  async onModuleDestroy() {
    await this.connection?.close();
  }

  async getDrones(): Promise<DroneRecord[]> {
    const records = !this.droneModel
      ? demoDrones.filter((record) => record.isActive !== false)
      : await this.droneModel
          .find({ isActive: { $ne: false } })
          .lean()
          .exec();
    return records.map((record) => ({
      ...record,
      flightHours: record.flightHours ?? 0,
      completedDeliveries: record.completedDeliveries ?? 0,
      batteryHealth: record.batteryHealth ?? 100,
      nextServiceHours: record.nextServiceHours ?? 100,
    }));
  }

  async getMissions(): Promise<MissionRecord[]> {
    const records = !this.missionModel
      ? demoMissions.filter((record) => record.isActive !== false)
      : await this.missionModel
          .find({ isActive: { $ne: false } })
          .lean()
          .exec();
    return records.map((record) => ({
      ...record,
      progressPercent:
        record.progressPercent ??
        (record.status === 'delivered'
          ? 100
          : record.status === 'in-transit'
            ? 48
            : record.status === 'assigned'
              ? 15
              : 0),
      trackingCode:
        record.trackingCode ??
        `TRACK-${record.id.replace(/[^A-Za-z0-9]/g, '')}`,
      proofOfDeliveryCode: record.proofOfDeliveryCode ?? '0000',
      timeline: record.timeline ?? [],
    }));
  }

  async getStations(): Promise<StationRecord[]> {
    if (!this.stationModel)
      return demoStations.filter((record) => record.isActive !== false);
    return this.stationModel
      .find({ isActive: { $ne: false } })
      .lean()
      .exec();
  }

  async getCustomers(): Promise<CustomerRecord[]> {
    if (!this.customerModel)
      return demoCustomers.filter((record) => record.isActive !== false);
    return this.customerModel
      .find({ isActive: { $ne: false } })
      .lean()
      .exec();
  }

  async getAuditEvents(): Promise<AuditEventRecord[]> {
    if (!this.auditModel) return [...demoAuditEvents].reverse();
    return this.auditModel.find().sort({ timestamp: -1 }).lean().exec();
  }

  async saveDrone(record: DroneRecord) {
    return this.saveRecord(this.droneModel, demoDrones, record);
  }

  async saveMission(record: MissionRecord) {
    return this.saveRecord(this.missionModel, demoMissions, record);
  }

  async saveStation(record: StationRecord) {
    return this.saveRecord(this.stationModel, demoStations, record);
  }

  async saveCustomer(record: CustomerRecord) {
    return this.saveRecord(this.customerModel, demoCustomers, record);
  }

  async saveAuditEvent(record: AuditEventRecord) {
    return this.saveRecord(this.auditModel, demoAuditEvents, record);
  }

  async deactivateDrone(id: string) {
    return this.deactivateRecord(this.droneModel, demoDrones, id);
  }

  async deactivateMission(id: string) {
    return this.deactivateRecord(this.missionModel, demoMissions, id);
  }

  async deactivateStation(id: string) {
    return this.deactivateRecord(this.stationModel, demoStations, id);
  }

  async deactivateCustomer(id: string) {
    return this.deactivateRecord(this.customerModel, demoCustomers, id);
  }

  getStorageMode() {
    return this.connection ? 'mongodb-atlas' : 'demo-memory';
  }

  private async seedAtlasIfEmpty() {
    if (!this.droneModel || !this.missionModel || !this.stationModel) return;
    const [drones, missions, stations, customers, auditEvents] =
      await Promise.all([
        this.droneModel.countDocuments(),
        this.missionModel.countDocuments(),
        this.stationModel.countDocuments(),
        this.customerModel?.countDocuments() ?? 0,
        this.auditModel?.countDocuments() ?? 0,
      ]);
    if (drones === 0) await this.droneModel.insertMany(demoDrones);
    if (missions === 0) await this.missionModel.insertMany(demoMissions);
    if (stations === 0) await this.stationModel.insertMany(demoStations);
    if (customers === 0) await this.customerModel?.insertMany(demoCustomers);
    if (auditEvents === 0) await this.auditModel?.insertMany(demoAuditEvents);
  }

  private async saveRecord<T extends { id: string }>(
    model: Model<T> | undefined,
    collection: T[],
    record: T,
  ) {
    if (model) {
      await model.updateOne(
        { id: record.id },
        { $set: record },
        { upsert: true },
      );
      return record;
    }
    const index = collection.findIndex((item) => item.id === record.id);
    if (index >= 0) collection[index] = record;
    else collection.push(record);
    return record;
  }

  private async deactivateRecord<T extends { id: string; isActive?: boolean }>(
    model: Model<T> | undefined,
    collection: T[],
    id: string,
  ) {
    if (model) {
      await model.updateOne({ id }, { $set: { isActive: false } });
      return;
    }
    const record = collection.find((item) => item.id === id);
    if (record) record.isActive = false;
  }
}
