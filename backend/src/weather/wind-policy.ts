import {
  DroneRecord,
  Location,
  MissionRecord,
} from '../database/operations.types';

export interface WindConditions {
  speedKmh: number;
  gustKmh: number;
  directionDegrees: number;
  observedAt: string;
}

export interface FlightAssessment {
  decision: 'GO' | 'CAUTION' | 'HOLD';
  reason: string;
  droneId: string;
  missionId: string;
  wind: WindConditions;
  routeDistanceKm: number;
  batteryRequired: number;
  availableBattery: number;
  energyMultiplier: number;
}

export const windLimits = {
  maximumSpeedKmh: 40,
  maximumGustKmh: 55,
  reserveBatteryPercent: 12,
};

export function evaluateFlight(
  drone: DroneRecord,
  mission: MissionRecord,
  wind: WindConditions,
): FlightAssessment {
  const routeDistance =
    distanceKm(drone.location, mission.origin) +
    distanceKm(mission.origin, mission.destination);
  const routeBearing = bearingDegrees(mission.origin, mission.destination);
  const angle = Math.abs(
    normalizeDegrees(wind.directionDegrees - routeBearing),
  );
  const relativeAngle = angle > 180 ? 360 - angle : angle;
  const headwindExposure = Math.max(
    0,
    Math.cos((relativeAngle * Math.PI) / 180),
  );
  const windPenalty = (wind.speedKmh / 100) * (0.35 + headwindExposure * 0.65);
  const gustPenalty = wind.gustKmh / 170;
  const energyMultiplier = round(Math.min(1.9, 1 + windPenalty + gustPenalty));
  const payloadConsumption = 0.55 + mission.payloadKg * 0.11;
  const batteryRequired = round(
    routeDistance * payloadConsumption * energyMultiplier +
      windLimits.reserveBatteryPercent,
  );

  const grounded =
    wind.speedKmh >= windLimits.maximumSpeedKmh ||
    wind.gustKmh >= windLimits.maximumGustKmh;
  const insufficientBattery = drone.battery < batteryRequired;
  const incapable =
    drone.status !== 'available' || drone.maxPayloadKg < mission.payloadKg;

  if (grounded) {
    return result(
      'HOLD',
      `Unsafe wind conditions. Launch blocked above ${windLimits.maximumSpeedKmh} km/h wind or ${windLimits.maximumGustKmh} km/h gusts.`,
    );
  }
  if (incapable) {
    return result(
      'HOLD',
      'Drone is not available or cannot carry this payload.',
    );
  }
  if (insufficientBattery) {
    return result(
      'CAUTION',
      'Wind-adjusted battery reserve is insufficient for this mission.',
    );
  }
  return result('GO', 'Mission cleared with weather-adjusted battery reserve.');

  function result(
    decision: FlightAssessment['decision'],
    reason: string,
  ): FlightAssessment {
    return {
      decision,
      reason,
      droneId: drone.id,
      missionId: mission.id,
      wind,
      routeDistanceKm: round(routeDistance),
      batteryRequired,
      availableBattery: drone.battery,
      energyMultiplier,
    };
  }
}

function distanceKm(first: Location, second: Location) {
  const radius = 6371;
  const latitude = ((second.latitude - first.latitude) * Math.PI) / 180;
  const longitude = ((second.longitude - first.longitude) * Math.PI) / 180;
  const value =
    Math.sin(latitude / 2) ** 2 +
    Math.cos((first.latitude * Math.PI) / 180) *
      Math.cos((second.latitude * Math.PI) / 180) *
      Math.sin(longitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function bearingDegrees(first: Location, second: Location) {
  const firstLatitude = (first.latitude * Math.PI) / 180;
  const secondLatitude = (second.latitude * Math.PI) / 180;
  const longitude = ((second.longitude - first.longitude) * Math.PI) / 180;
  const y = Math.sin(longitude) * Math.cos(secondLatitude);
  const x =
    Math.cos(firstLatitude) * Math.sin(secondLatitude) -
    Math.sin(firstLatitude) * Math.cos(secondLatitude) * Math.cos(longitude);
  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

function normalizeDegrees(value: number) {
  return (value + 360) % 360;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
