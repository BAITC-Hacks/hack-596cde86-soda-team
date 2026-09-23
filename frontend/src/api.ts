import type { Choice, CityData, Explanation, SimulationResult, ValidationResult } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const payload = await response.json()
  if (!response.ok) {
    const message = Array.isArray(payload.errors)
      ? payload.errors.map((error: { message: string }) => error.message).join(' ')
      : 'Сервис временно недоступен. Повторите попытку.'
    throw new Error(message)
  }
  return payload as T
}

function post<T>(path: string, selection: Choice[]): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selection }),
  })
}

export const getData = () => request<CityData>('/api/data')
export const validateScenario = (selection: Choice[]) => post<ValidationResult>('/api/validate', selection)
export const simulateScenario = (selection: Choice[]) => post<SimulationResult>('/api/simulate', selection)
export const explainScenario = (selection: Choice[]) => post<Explanation>('/api/explain', selection)
