export type DroneStatus = 'available' | 'charging' | 'mission'
export type MissionStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered'

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
}

export interface Mission {
  id: string
  customer: string
  origin: Location
  destination: Location
  payloadKg: number
  priority: 'standard' | 'urgent' | 'critical'
  status: MissionStatus
  droneId?: string
  etaMinutes: number
}

export interface Station {
  id: string
  name: string
  location: Location
  totalSlots: number
  occupiedSlots: number
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
