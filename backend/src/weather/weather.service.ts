import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FlightGateDto } from './dto/flight-gate.dto';
import { evaluateFlight, WindConditions, windLimits } from './wind-policy';
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

  async dispatchFlight(dto: FlightGateDto) {
    const assessment = await this.assessFlight(dto);
    if (assessment.decision !== 'GO') {
      throw new BadRequestException(assessment.reason);
    }
    await this.operations.assertRouteClear(dto.missionId);
    const mission = await this.operations.assignMission(dto.missionId, {
      droneId: dto.droneId,
    });
    return { assessment, mission };
  }

  async forecastMission(missionId: string) {
    const mission = await this.operations.findMission(missionId);
    const query = new URLSearchParams({
      latitude: mission.destination.latitude.toString(),
      longitude: mission.destination.longitude.toString(),
      hourly: 'wind_speed_10m,wind_gusts_10m',
      forecast_hours: '6',
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
        hourly: {
          time: string[];
          wind_speed_10m: number[];
          wind_gusts_10m: number[];
        };
      };
      const slots = data.hourly.time.slice(0, 6).map((time, index) => {
        const speedKmh = data.hourly.wind_speed_10m[index];
        const gustKmh = data.hourly.wind_gusts_10m[index];
        const safe =
          speedKmh < windLimits.maximumSpeedKmh &&
          gustKmh < windLimits.maximumGustKmh;
        return {
          time,
          speedKmh,
          gustKmh,
          recommendation: safe ? 'Recommended' : 'Hold',
        };
      });
      const bestWindow =
        slots
          .filter((slot) => slot.recommendation === 'Recommended')
          .sort(
            (first, second) =>
              first.speedKmh +
              first.gustKmh -
              (second.speedKmh + second.gustKmh),
          )[0] ?? slots[0];
      return {
        missionId,
        destination: mission.destination.label,
        slots,
        bestWindow,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Wind forecast data is currently unavailable.',
      );
    }
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
