export interface Location {
  latitude: number;
  longitude: number;
  label: string;
}

export type DroneStatus = 'available' | 'charging' | 'mission';
export type MissionStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered';
export type MissionPriority = 'standard' | 'urgent' | 'critical';

export interface DroneRecord {
  id: string;
  model: string;
  status: DroneStatus;
  battery: number;
  maxPayloadKg: number;
  location: Location;
  activeMissionId?: string;
}

export interface StationRecord {
  id: string;
  name: string;
  location: Location;
  totalSlots: number;
  occupiedSlots: number;
}

export interface MissionRecord {
  id: string;
  customer: string;
  origin: Location;
  destination: Location;
  payloadKg: number;
  priority: MissionPriority;
  status: MissionStatus;
  droneId?: string;
  etaMinutes: number;
}
