import axios from 'axios'
import type {
  Customer,
  Drone,
  FlightAssessment,
  Location,
  Mission,
  NoFlyZone,
  NoFlyZoneInput,
  Overview,
  AuthSession,
  PublicOrderInput,
  PublicOrderResult,
  QuoteResult,
  Recommendation,
  Station,
  TrackingResult,
  ForecastResult,
} from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

export async function login(email: string, password: string) {
  return (await api.post<AuthSession>('/auth/login', { email, password })).data
}

export async function getOverview() {
  const response = await api.get<Overview>('/operations/overview')
  return response.data
}

export async function quoteOrder(payload: PublicOrderInput) {
  return (await api.post<QuoteResult>('/operations/public/quote', payload)).data
}

export async function createPublicOrder(payload: PublicOrderInput) {
  return (await api.post<PublicOrderResult>('/operations/public/orders', payload)).data
}

export async function assessFlight(droneId: string, missionId: string) {
  const response = await api.post<FlightAssessment>('/weather/flight-gate', {
    droneId,
    missionId,
  })
  return response.data
}

export async function dispatchMission(droneId: string, missionId: string) {
  const response = await api.post<{ assessment: FlightAssessment; mission: Mission }>(
    '/weather/dispatch',
    { droneId, missionId },
  )
  return response.data
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
  priority: Mission['priority']
  etaMinutes: number
}

export async function createDrone(payload: DroneInput) {
  return (await api.post<Drone>('/operations/drones', payload)).data
}

export async function createNoFlyZone(payload: NoFlyZoneInput) {
  return (await api.post<NoFlyZone>('/operations/no-fly-zones', payload)).data
}

export async function deleteNoFlyZone(id: string) {
  await api.delete(`/operations/no-fly-zones/${id}`)
}

export async function updateDrone(id: string, payload: Partial<Pick<Drone, 'model' | 'battery' | 'maxPayloadKg'>>) {
  return (await api.patch<Drone>(`/operations/drones/${id}`, payload)).data
}

export async function deleteDrone(id: string) {
  await api.delete(`/operations/drones/${id}`)
}

export async function chargeDrone(id: string, stationId: string) {
  return (await api.post<Drone>(`/operations/drones/${id}/charge`, { stationId })).data
}

export async function releaseCharge(id: string, minutes: number) {
  return (await api.post<Drone>(`/operations/drones/${id}/release-charge`, { minutes })).data
}

export async function createCustomer(payload: CustomerInput) {
  return (await api.post<Customer>('/operations/customers', payload)).data
}

export async function updateCustomer(id: string, payload: Partial<Pick<Customer, 'name' | 'phone' | 'email'>>) {
  return (await api.patch<Customer>(`/operations/customers/${id}`, payload)).data
}

export async function deleteCustomer(id: string) {
  await api.delete(`/operations/customers/${id}`)
}

export async function createStation(payload: StationInput) {
  return (await api.post<Station>('/operations/stations', payload)).data
}

export async function updateStation(id: string, payload: Partial<Pick<Station, 'name' | 'totalSlots'>>) {
  return (await api.patch<Station>(`/operations/stations/${id}`, payload)).data
}

export async function deleteStation(id: string) {
  await api.delete(`/operations/stations/${id}`)
}

export async function createMission(payload: MissionInput) {
  return (await api.post<Mission>('/operations/missions', payload)).data
}

export async function deleteMission(id: string) {
  await api.delete(`/operations/missions/${id}`)
}

export async function pickupMission(id: string) {
  return (await api.post<Mission>(`/operations/missions/${id}/pickup`)).data
}

export async function deliverMission(id: string) {
  return (await api.post<Mission>(`/operations/missions/${id}/deliver`)).data
}

export async function simulateMissionStep(id: string) {
  return (await api.post<Mission>(`/operations/missions/${id}/simulate-step`)).data
}

export async function advanceTelemetry(id: string) {
  return (
    await api.post<{
      mission: Mission
      drone: Drone
      telemetry: { progressPercent: number; location: Location; route: Location[] }
    }>(`/operations/missions/${id}/telemetry-step`)
  ).data
}

export async function confirmDelivery(id: string, code: string) {
  return (await api.post<Mission>(`/operations/missions/${id}/confirm-delivery`, { code })).data
}

export async function completeDroneService(id: string) {
  return (await api.post<Drone>(`/operations/drones/${id}/service`)).data
}

export async function emergencyReturnHome(id: string) {
  return (await api.post<Drone>(`/operations/drones/${id}/emergency-return`)).data
}

export async function getRecommendations(missionId: string) {
  return (await api.get<Recommendation[]>(`/operations/recommendations/${missionId}`)).data
}

export async function getTracking(id: string) {
  return (await api.get<TrackingResult>(`/operations/tracking/${id}`)).data
}

export async function getForecast(missionId: string) {
  return (await api.get<ForecastResult>(`/weather/forecast/${missionId}`)).data
}
