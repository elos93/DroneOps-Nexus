import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Model, createConnection } from 'mongoose';
import { demoDrones, demoMissions, demoStations } from './demo-data';
import {
  DroneSchema,
  MissionSchema,
  StationSchema,
} from './operations.schemas';
import { DroneRecord, MissionRecord, StationRecord } from './operations.types';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private connection?: Connection;
  private droneModel?: Model<DroneRecord>;
  private missionModel?: Model<MissionRecord>;
  private stationModel?: Model<StationRecord>;

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
    await this.seedAtlasIfEmpty();
    this.logger.log('Connected to MongoDB Atlas.');
  }

  async onModuleDestroy() {
    await this.connection?.close();
  }

  async getDrones(): Promise<DroneRecord[]> {
    if (!this.droneModel) return demoDrones;
    return this.droneModel.find().lean().exec();
  }

  async getMissions(): Promise<MissionRecord[]> {
    if (!this.missionModel) return demoMissions;
    return this.missionModel.find().lean().exec();
  }

  async getStations(): Promise<StationRecord[]> {
    if (!this.stationModel) return demoStations;
    return this.stationModel.find().lean().exec();
  }

  getStorageMode() {
    return this.connection ? 'mongodb-atlas' : 'demo-memory';
  }

  private async seedAtlasIfEmpty() {
    if (!this.droneModel || !this.missionModel || !this.stationModel) return;
    const [drones, missions, stations] = await Promise.all([
      this.droneModel.countDocuments(),
      this.missionModel.countDocuments(),
      this.stationModel.countDocuments(),
    ]);
    if (drones === 0) await this.droneModel.insertMany(demoDrones);
    if (missions === 0) await this.missionModel.insertMany(demoMissions);
    if (stations === 0) await this.stationModel.insertMany(demoStations);
  }
}
