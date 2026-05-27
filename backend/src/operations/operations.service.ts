import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class OperationsService {
  constructor(private readonly database: DatabaseService) {}

  async getOverview() {
    const [drones, missions, stations] = await Promise.all([
      this.database.getDrones(),
      this.database.getMissions(),
      this.database.getStations(),
    ]);

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
      missions,
      stations,
    };
  }

  async getDrones() {
    return this.database.getDrones();
  }

  async getMissions() {
    return this.database.getMissions();
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
}
