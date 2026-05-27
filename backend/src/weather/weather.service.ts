import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { FlightGateDto } from './dto/flight-gate.dto';
import { evaluateFlight, WindConditions } from './wind-policy';
import { OperationsService } from '../operations/operations.service';

@Injectable()
export class WeatherService {
  constructor(private readonly operations: OperationsService) {}

  async assessFlight(dto: FlightGateDto) {
    const [drone, mission] = await Promise.all([
      this.operations.findDrone(dto.droneId),
      this.operations.findMission(dto.missionId),
    ]);
    const wind = await this.getWind(
      mission.destination.latitude,
      mission.destination.longitude,
    );
    return evaluateFlight(drone, mission, wind);
  }

  private async getWind(
    latitude: number,
    longitude: number,
  ): Promise<WindConditions> {
    const query = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
    });
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${query}`,
      );
      if (!response.ok)
        throw new Error(`Weather API returned HTTP ${response.status}`);
      const data = (await response.json()) as {
        current: {
          time: string;
          wind_speed_10m: number;
          wind_direction_10m: number;
          wind_gusts_10m: number;
        };
      };
      return {
        speedKmh: data.current.wind_speed_10m,
        gustKmh: data.current.wind_gusts_10m,
        directionDegrees: data.current.wind_direction_10m,
        observedAt: data.current.time,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Live wind data is currently unavailable.',
      );
    }
  }
}
