import type {
  Customer,
  CustomerInput,
  Drone,
  DroneInput,
  FlightAssessment,
  ForecastResult,
  Location,
  Mission,
  MissionInput,
  NoFlyZone,
  NoFlyZoneInput,
  Overview,
  PublicOrderInput,
  PublicOrderResult,
  QuoteResult,
  Recommendation,
  Station,
  StationInput,
  TrackingResult,
} from './types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://droneops-nexus-api.vercel.app/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

const json = (payload?: unknown) => (payload === undefined ? undefined : JSON.stringify(payload))

export function getOverview() {
  return request<Overview>('/operations/overview')
}

export function quoteOrder(payload: PublicOrderInput) {
  return request<QuoteResult>('/operations/public/quote', { method: 'POST', body: json(payload) })
}

export function createPublicOrder(payload: PublicOrderInput) {
  return request<PublicOrderResult>('/operations/public/orders', { method: 'POST', body: json(payload) })
}

export function assessFlight(droneId: string, missionId: string) {
  return request<FlightAssessment>('/weather/flight-gate', { method: 'POST', body: json({ droneId, missionId }) })
}

export function dispatchMission(droneId: string, missionId: string) {
  return request<{ assessment: FlightAssessment; mission: Mission }>('/weather/dispatch', {
    method: 'POST',
    body: json({ droneId, missionId }),
  })
}

export function createDrone(payload: DroneInput) {
  return request<Drone>('/operations/drones', { method: 'POST', body: json(payload) })
}

export function deleteDrone(id: string) {
  return request<void>(`/operations/drones/${id}`, { method: 'DELETE' })
}

export function chargeDrone(id: string, stationId: string) {
  return request<Drone>(`/operations/drones/${id}/charge`, { method: 'POST', body: json({ stationId }) })
}

export function releaseCharge(id: string, minutes: number) {
  return request<Drone>(`/operations/drones/${id}/release-charge`, { method: 'POST', body: json({ minutes }) })
}

export function completeDroneService(id: string) {
  return request<Drone>(`/operations/drones/${id}/service`, { method: 'POST' })
}

export function emergencyReturnHome(id: string) {
  return request<Drone>(`/operations/drones/${id}/emergency-return`, { method: 'POST' })
}

export function createCustomer(payload: CustomerInput) {
  return request<Customer>('/operations/customers', { method: 'POST', body: json(payload) })
}

export function deleteCustomer(id: string) {
  return request<void>(`/operations/customers/${id}`, { method: 'DELETE' })
}

export function createStation(payload: StationInput) {
  return request<Station>('/operations/stations', { method: 'POST', body: json(payload) })
}

export function deleteStation(id: string) {
  return request<void>(`/operations/stations/${id}`, { method: 'DELETE' })
}

export function createMission(payload: MissionInput) {
  return request<Mission>('/operations/missions', { method: 'POST', body: json(payload) })
}

export function deleteMission(id: string) {
  return request<void>(`/operations/missions/${id}`, { method: 'DELETE' })
}

export function pickupMission(id: string) {
  return request<Mission>(`/operations/missions/${id}/pickup`, { method: 'POST' })
}

export function deliverMission(id: string) {
  return request<Mission>(`/operations/missions/${id}/deliver`, { method: 'POST' })
}

export function simulateMissionStep(id: string) {
  return request<Mission>(`/operations/missions/${id}/simulate-step`, { method: 'POST' })
}

export function advanceTelemetry(id: string) {
  return request<{ mission: Mission; drone: Drone; telemetry: { progressPercent: number; location: Location; route: Location[] } }>(
    `/operations/missions/${id}/telemetry-step`,
    { method: 'POST' },
  )
}

export function confirmDelivery(id: string, code: string) {
  return request<Mission>(`/operations/missions/${id}/confirm-delivery`, { method: 'POST', body: json({ code }) })
}

export function getTracking(id: string) {
  return request<TrackingResult>(`/operations/tracking/${id}`)
}

export function getRecommendations(missionId: string) {
  return request<Recommendation[]>(`/operations/recommendations/${missionId}`)
}

export function getForecast(missionId: string) {
  return request<ForecastResult>(`/weather/forecast/${missionId}`)
}

export function createNoFlyZone(payload: NoFlyZoneInput) {
  return request<NoFlyZone>('/operations/no-fly-zones', { method: 'POST', body: json(payload) })
}

export function deleteNoFlyZone(id: string) {
  return request<void>(`/operations/no-fly-zones/${id}`, { method: 'DELETE' })
}
