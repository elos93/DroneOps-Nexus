export type DroneStatus = 'available' | 'charging' | 'mission'
export type MissionStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered'
export type ServiceType = 'standard' | 'medical'
export type Priority = 'standard' | 'urgent' | 'critical'

export interface Location {
  latitude: number
  longitude: number
  label: string
}

export interface Drone {
  id: string
  model: string
  status: DroneStatus
  battery: number
  maxPayloadKg: number
  location: Location
  activeMissionId?: string
  chargingStationId?: string
  flightHours: number
  completedDeliveries: number
  batteryHealth: number
  nextServiceHours: number
}

export interface MissionEvent {
  status: MissionStatus
  title: string
  timestamp: string
  detail: string
}

export interface Mission {
  id: string
  senderCustomerId?: string
  targetCustomerId?: string
  customer: string
  origin: Location
  destination: Location
  payloadKg: number
  priority: Priority
  serviceType?: ServiceType
  temperatureControlled?: boolean
  priceIls?: number
  routeDistanceKm?: number
  routeWaypoints?: Location[]
  routeNotice?: string
  status: MissionStatus
  droneId?: string
  etaMinutes: number
  progressPercent: number
  trackingCode: string
  proofOfDeliveryCode?: string
  timeline?: MissionEvent[]
}

export interface Station {
  id: string
  name: string
  location: Location
  totalSlots: number
  occupiedSlots: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  location: Location
}

export interface Alert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  entityId: string
}

export interface NotificationPreview extends Alert {
  channel: string
  deliveryState: string
}

export interface NoFlyZone {
  id: string
  name: string
  center: Location
  radiusKm: number
  reason: string
}

export interface AuditEvent {
  id: string
  action: string
  entityType: string
  entityId: string
  actor: string
  timestamp: string
  detail: string
}

export interface Overview {
  storageMode?: 'demo-memory' | 'mongodb-atlas'
  metrics: {
    totalDrones: number
    activeMissions: number
    charging: number
    ready: number
    averageBattery: number
  }
  drones: Drone[]
  missions: Mission[]
  stations: Station[]
  customers: Customer[]
  alerts: Alert[]
  notifications: NotificationPreview[]
  analytics: {
    deliveredMissions: number
    pendingRevenueIls: number
    medicalMissions: number
    averagePayloadKg: number
    averageRouteKm: number
    fleetUtilizationPercent: number
    chargingCapacityPercent: number
    maintenanceDue: number
  }
  noFlyZones: NoFlyZone[]
  auditEvents: AuditEvent[]
}

export interface PublicOrderInput {
  origin: Location
  destination: Location
  payloadKg: number
  priority: Priority
  serviceType: ServiceType
  temperatureControlled?: boolean
  senderName: string
  senderEmail: string
  senderPhone: string
  recipientName: string
  recipientEmail: string
  recipientPhone: string
}

export interface QuoteResult {
  distanceKm: number
  priceIls: number
  estimatedMinutes: number
  serviceType: ServiceType
  priority: Priority
  routeWaypoints?: Location[]
  routeNotice: string
}

export interface PublicOrderResult {
  mission: Mission
  quote: QuoteResult
  notificationPreview: string[]
}

export interface TrackingResult {
  mission: Mission
  drone?: Drone
  publicCode: string
  demoConfirmationCode?: string
  estimatedArrivalMinutes: number
}

export interface FlightAssessment {
  decision: 'GO' | 'CAUTION' | 'HOLD'
  reason: string
  droneId: string
  missionId: string
  wind: {
    speedKmh: number
    gustKmh: number
    directionDegrees: number
    observedAt: string
  }
  routeDistanceKm: number
  batteryRequired: number
  availableBattery: number
  energyMultiplier: number
}

export interface Recommendation {
  drone: Drone
  score: number
  approachKm: number
  rationale: string
}

export interface ForecastResult {
  missionId: string
  destination: string
  slots: {
    time: string
    speedKmh: number
    gustKmh: number
    recommendation: string
  }[]
  bestWindow?: {
    time: string
    speedKmh: number
    gustKmh: number
    recommendation: string
  }
}

export interface NoFlyZoneInput {
  id: string
  name: string
  center: Location
  radiusKm: number
  reason: string
}

export type DroneInput = {
  id: string
  model: string
  battery: number
  maxPayloadKg: number
  location: Location
}

export type CustomerInput = {
  id: string
  name: string
  phone: string
  email: string
  location: Location
}

export type StationInput = {
  id: string
  name: string
  totalSlots: number
  location: Location
}

export type MissionInput = {
  id: string
  senderCustomerId: string
  targetCustomerId: string
  payloadKg: number
  priority: Priority
  etaMinutes: number
}
