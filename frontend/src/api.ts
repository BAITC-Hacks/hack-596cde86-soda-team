import type { Choice, CityData, Explanation, RankedSelection, SimulationResult, ValidationResult } from './types'

async function request<T>(path: string, init?: RequestInit, timeout = 20_000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(path, { ...init, signal: controller.signal })
    const payload = await response.json()
    if (!response.ok) {
      const message = Array.isArray(payload.errors)
        ? payload.errors.map((error: { message: string }) => error.message).join(' ')
        : 'Сервис временно недоступен. Повторите попытку.'
      throw new Error(message)
    }
    return payload as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Сервис не ответил вовремя. Повторите попытку.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function post<T>(path: string, selection: Choice[], timeout?: number): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selection }),
  }, timeout)
}

export const getData = () => request<CityData>('/api/data')
export const validateScenario = (selection: Choice[]) => post<ValidationResult>('/api/validate', selection)
export const simulateScenario = (selection: Choice[]) => post<SimulationResult>('/api/simulate', selection)
export const explainScenario = (selection: Choice[]) => post<Explanation>('/api/explain', selection, 120_000)
export const getBest = () => request<RankedSelection[]>('/api/best?top_n=5', undefined, 120_000)
