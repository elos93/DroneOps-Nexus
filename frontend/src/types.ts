export type DroneStatus = 'available' | 'charging' | 'mission'
export type MissionStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered'
export type ServiceType = 'standard' | 'medical'
export type Role = 'admin' | 'dispatcher' | 'customer'

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
  isActive?: boolean
}

export interface MissionEvent {
  status: MissionStatus
  title: string
  timestamp: string
  detail: string
}

export interface Mission {
  id: string
  senderCustomerId: string
  targetCustomerId: string
  customer: string
  origin: Location
  destination: Location
  payloadKg: number
  priority: 'standard' | 'urgent' | 'critical'
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
  timeline: MissionEvent[]
  isActive?: boolean
}

export interface Station {
  id: string
  name: string
  location: Location
  totalSlots: number
  occupiedSlots: number
  isActive?: boolean
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  location: Location
  isActive?: boolean
}

export interface Overview {
  storageMode: 'demo-memory' | 'mongodb-atlas'
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
  roleCapabilities: Record<Role, string[]>
  analytics: {
    deliveredMissions: number
    fleetUtilizationPercent: number
    chargingCapacityPercent: number
    maintenanceDue: number
  }
  noFlyZones: NoFlyZone[]
  auditEvents: AuditEvent[]
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

export interface Recommendation {
  drone: Drone
  score: number
  approachKm: number
  rationale: string
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

export interface QuoteResult {
  distanceKm: number
  priceIls: number
  estimatedMinutes: number
  serviceType: ServiceType
  priority: Mission['priority']
  routeWaypoints: Location[]
  routeNotice: string
}

export interface PublicOrderInput {
  origin: Location
  destination: Location
  payloadKg: number
  priority: Mission['priority']
  serviceType: ServiceType
  temperatureControlled?: boolean
  senderName: string
  senderEmail: string
  senderPhone: string
  recipientName: string
  recipientEmail: string
  recipientPhone: string
}

export interface PublicOrderResult {
  mission: Mission
  quote: QuoteResult
  notificationPreview: string[]
}

export interface ForecastResult {
  missionId: string
  destination: string
  slots: Array<{
    time: string
    speedKmh: number
    gustKmh: number
    recommendation: string
  }>
  bestWindow?: {
    time: string
    speedKmh: number
    gustKmh: number
    recommendation: string
  }
}
