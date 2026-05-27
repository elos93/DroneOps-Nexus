import { DroneRecord, MissionRecord, StationRecord } from './operations.types';

export const demoDrones: DroneRecord[] = [
  {
    id: 'DX-18',
    model: 'AeroLift X4',
    status: 'mission',
    battery: 82,
    maxPayloadKg: 6,
    activeMissionId: 'MS-204',
    location: {
      latitude: 32.064,
      longitude: 34.786,
      label: 'Tel Aviv Corridor',
    },
  },
  {
    id: 'DX-07',
    model: 'SkyCourier S2',
    status: 'available',
    battery: 94,
    maxPayloadKg: 4,
    location: { latitude: 32.071, longitude: 34.775, label: 'Central Hub' },
  },
  {
    id: 'DX-22',
    model: 'CargoWing Pro',
    status: 'available',
    battery: 67,
    maxPayloadKg: 9,
    location: { latitude: 32.093, longitude: 34.79, label: 'North Station' },
  },
  {
    id: 'DX-31',
    model: 'AeroLift X4',
    status: 'charging',
    battery: 34,
    maxPayloadKg: 6,
    location: {
      latitude: 32.057,
      longitude: 34.781,
      label: 'Charging Bay Alpha',
    },
  },
];

export const demoMissions: MissionRecord[] = [
  {
    id: 'MS-204',
    customer: 'MedExpress',
    origin: { latitude: 32.07, longitude: 34.78, label: 'Central Warehouse' },
    destination: { latitude: 32.091, longitude: 34.812, label: 'North Clinic' },
    payloadKg: 2.4,
    priority: 'critical',
    status: 'in-transit',
    droneId: 'DX-18',
    etaMinutes: 6,
  },
  {
    id: 'MS-207',
    customer: 'TechPoint',
    origin: { latitude: 32.057, longitude: 34.777, label: 'Logistics Hub' },
    destination: { latitude: 32.083, longitude: 34.797, label: 'Ramat Aviv' },
    payloadKg: 3.1,
    priority: 'urgent',
    status: 'pending',
    etaMinutes: 11,
  },
  {
    id: 'MS-208',
    customer: 'Green Market',
    origin: { latitude: 32.065, longitude: 34.77, label: 'South Depot' },
    destination: { latitude: 32.104, longitude: 34.806, label: 'North Point' },
    payloadKg: 5.6,
    priority: 'standard',
    status: 'pending',
    etaMinutes: 16,
  },
];

export const demoStations: StationRecord[] = [
  {
    id: 'ST-01',
    name: 'Central Hub',
    totalSlots: 8,
    occupiedSlots: 3,
    location: { latitude: 32.071, longitude: 34.775, label: 'Central Hub' },
  },
  {
    id: 'ST-02',
    name: 'North Station',
    totalSlots: 5,
    occupiedSlots: 1,
    location: { latitude: 32.093, longitude: 34.79, label: 'North Station' },
  },
];
