export interface Location {
  latitude: number;
  longitude: number;
  label: string;
}

export type DroneStatus = 'available' | 'charging' | 'mission';
export type MissionStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered';
export type MissionPriority = 'standard' | 'urgent' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type ServiceType = 'standard' | 'medical';

export interface MissionEvent {
  status: MissionStatus;
  title: string;
  timestamp: string;
  detail: string;
}

export interface DroneRecord {
  id: string;
  model: string;
  status: DroneStatus;
  battery: number;
  maxPayloadKg: number;
  location: Location;
  activeMissionId?: string;
  chargingStationId?: string;
  flightHours: number;
  completedDeliveries: number;
  batteryHealth: number;
  nextServiceHours: number;
  isActive?: boolean;
}

export interface StationRecord {
  id: string;
  name: string;
  location: Location;
  totalSlots: number;
  occupiedSlots: number;
  isActive?: boolean;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: Location;
  isActive?: boolean;
}

export interface MissionRecord {
  id: string;
  senderCustomerId: string;
  targetCustomerId: string;
  customer: string;
  origin: Location;
  destination: Location;
  payloadKg: number;
  priority: MissionPriority;
  serviceType?: ServiceType;
  temperatureControlled?: boolean;
  priceIls?: number;
  routeDistanceKm?: number;
  routeWaypoints?: Location[];
  routeNotice?: string;
  status: MissionStatus;
  droneId?: string;
  etaMinutes: number;
  progressPercent: number;
  trackingCode: string;
  proofOfDeliveryCode: string;
  timeline: MissionEvent[];
  isActive?: boolean;
}

export interface AuditEventRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  timestamp: string;
  detail: string;
}

export interface AlertRecord {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityId: string;
}

export interface NoFlyZone {
  id: string;
  name: string;
  center: Location;
  radiusKm: number;
  reason: string;
  isActive?: boolean;
}

export interface QuoteResult {
  distanceKm: number;
  priceIls: number;
  estimatedMinutes: number;
  serviceType: ServiceType;
  priority: MissionPriority;
  routeWaypoints: Location[];
  routeNotice: string;
}
