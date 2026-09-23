import { useEffect, useRef, useState } from 'react';
import { ApiError, api, isAbort } from '../api/client';
import type { Choice, PreviewResult, SimulationResult, ValidationResult } from '../api/types';

const DEBOUNCE_MS = 120;

export interface LiveState {
  /** Latest engine result for the current set; kept while the next one loads. */
  sim: SimulationResult | null;
  /** Per-measure deltas; null when the backend has no /api/preview. */
  preview: PreviewResult | null;
  validation: ValidationResult | null;
  loading: boolean;
  error: string | null;
}

/**
 * Recomputes the set on every change: /api/validate + /api/preview.
 * Without /api/preview (404) it falls back to /api/simulate, which only
 * answers for a complete valid set — the HUD then shows a score only at 5/5.
 */
export function useLiveSimulation(selection: Choice[], enabled: boolean): LiveState {
  const [state, setState] = useState<LiveState>({
    sim: null,
    preview: null,
    validation: null,
    loading: false,
    error: null,
  });
  const previewSupported = useRef(true);
  const key = JSON.stringify(selection);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));

    const run = async () => {
      const validation = await api.validate(selection, ctrl.signal);
      let preview: PreviewResult | null = null;
      let sim: SimulationResult | null = null;

      if (previewSupported.current) {
        try {
          preview = await api.preview(selection, ctrl.signal);
          sim = preview;
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) previewSupported.current = false;
          else throw e;
        }
      }
      if (!previewSupported.current && validation.ok) {
        sim = await api.simulate(selection, ctrl.signal);
      }
      setState({ sim, preview, validation, loading: false, error: null });
    };

    const timer = setTimeout(() => {
      run().catch((e: unknown) => {
        if (!isAbort(e)) setState((s) => ({ ...s, loading: false, error: 'API не отвечает' }));
      });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [key, enabled]); // `key` stands in for `selection` (compared by value)

  return state;
}
