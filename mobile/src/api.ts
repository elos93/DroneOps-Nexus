import type { Overview, PublicOrderInput, PublicOrderResult, QuoteResult, TrackingResult } from './types'

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

export function getOverview() {
  return request<Overview>('/operations/overview')
}

export function quoteOrder(payload: PublicOrderInput) {
  return request<QuoteResult>('/operations/public/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createPublicOrder(payload: PublicOrderInput) {
  return request<PublicOrderResult>('/operations/public/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getTracking(id: string) {
  return request<TrackingResult>(`/operations/tracking/${id}`)
}

export function confirmDelivery(id: string, code: string) {
  return request('/operations/missions/' + id + '/confirm-delivery', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}
