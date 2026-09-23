import type {
  Choice,
  ExplainResult,
  GameData,
  PreviewResult,
  RankedSelection,
  SimulationResult,
  ValidationResult,
} from './types';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(BASE_URL + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      signal: controller.signal,
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

const post = <T>(path: string, selection: Choice[], signal?: AbortSignal) =>
  request<T>(path, { method: 'POST', body: JSON.stringify({ selection }) }, signal);

export const api = {
  data: (signal?: AbortSignal) => request<GameData>('/api/data', {}, signal),
  best: (topN = 1, signal?: AbortSignal) =>
    request<RankedSelection[]>(`/api/best?top_n=${topN}`, {}, signal),
  validate: (s: Choice[], signal?: AbortSignal) => post<ValidationResult>('/api/validate', s, signal),
  simulate: (s: Choice[], signal?: AbortSignal) => post<SimulationResult>('/api/simulate', s, signal),
  preview: (s: Choice[], signal?: AbortSignal) => post<PreviewResult>('/api/preview', s, signal),
  explain: (s: Choice[], signal?: AbortSignal) => post<ExplainResult>('/api/explain', s, signal),
};

export function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}
