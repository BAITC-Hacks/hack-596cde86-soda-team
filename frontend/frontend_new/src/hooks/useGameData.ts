import { useEffect, useState } from 'react';
import { api, isAbort } from '../api/client';
import type { GameData, RankedSelection } from '../api/types';

interface State {
  data: GameData | null;
  optimum: RankedSelection | null;
  error: string | null;
}

export function useGameData(): State {
  const [state, setState] = useState<State>({ data: null, optimum: null, error: null });

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([api.data(ctrl.signal), api.best(1, ctrl.signal).catch(() => [])])
      .then(([data, best]) => setState({ data, optimum: best[0] ?? null, error: null }))
      .catch((e: unknown) => {
        if (!isAbort(e)) setState((s) => ({ ...s, error: 'Не удалось загрузить данные с API' }));
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
