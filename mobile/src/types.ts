export type DroneStatus = 'available' | 'charging' | 'mission'
export type MissionStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered'
export type ServiceType = 'standard' | 'medical'

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
  batteryHealth: number
}

export interface Mission {
  id: string
  customer: string
  origin: Location
  destination: Location
  payloadKg: number
  priority: 'standard' | 'urgent' | 'critical'
  serviceType?: ServiceType
  status: MissionStatus
  droneId?: string
  etaMinutes: number
  progressPercent: number
  trackingCode: string
  proofOfDeliveryCode?: string
}

export interface Overview {
  metrics: {
    totalDrones: number
    activeMissions: number
    charging: number
    ready: number
    averageBattery: number
  }
  drones: Drone[]
  missions: Mission[]
  analytics: {
    deliveredMissions: number
    chargingCapacityPercent: number
    maintenanceDue: number
  }
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

export interface QuoteResult {
  distanceKm: number
  priceIls: number
  estimatedMinutes: number
  serviceType: ServiceType
  priority: Mission['priority']
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
