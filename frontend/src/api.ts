import axios from 'axios'
import type { FlightAssessment, Overview } from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

export async function getOverview() {
  const response = await api.get<Overview>('/operations/overview')
  return response.data
}

export async function assessFlight(droneId: string, missionId: string) {
  const response = await api.post<FlightAssessment>('/weather/flight-gate', {
    droneId,
    missionId,
  })
  return response.data
}
