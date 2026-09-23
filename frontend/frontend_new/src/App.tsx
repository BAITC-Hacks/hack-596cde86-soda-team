import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from './api/client';
import type { Choice, ValidationError } from './api/types';
import { Catalog, type Filter } from './components/Catalog';
import { DistrictMap } from './components/DistrictMap';
import { ExplainDrawer } from './components/ExplainDrawer';
import { Hud } from './components/Hud';
import { SetPanel, type CalcState } from './components/SetPanel';
import { TopNav } from './components/TopNav';
import { useGameData } from './hooks/useGameData';
import { useLiveSimulation } from './hooks/useLiveSimulation';
import { directionCounts, selectionCost } from './lib/rules';

export default function App() {
  const { data, optimum, error } = useGameData();
  const [selection, setSelection] = useState<Choice[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [calc, setCalc] = useState<CalcState>({ status: 'idle' });
  const [explainOpen, setExplainOpen] = useState(false);
  const [lastMove, setLastMove] = useState<{ delta: number; id: number } | null>(null);

  const live = useLiveSimulation(selection, data !== null);
  const score = live.sim?.score ?? null;

  const prevScore = useRef<number | null>(null);
  useEffect(() => {
    if (score === null) return;
    const prev = prevScore.current;
    prevScore.current = score;
    if (prev !== null && Math.abs(score - prev) > 1e-9) {
      setLastMove((m) => ({ delta: score - prev, id: (m?.id ?? 0) + 1 }));
    }
  }, [score]);

  const update = useCallback((next: (sel: Choice[]) => Choice[]) => {
    setSelection(next);
    setCalc({ status: 'idle' });
  }, []);

  const onAdd = (choice: Choice) => update((sel) => [...sel, choice]);
  const onRemove = (id: string) => update((sel) => sel.filter((c) => c.measure_id !== id));
  const onDistrict = (id: string, district: string) =>
    update((sel) => sel.map((c) => (c.measure_id === id ? { ...c, district } : c)));

  const onCalculate = async () => {
    setCalc({ status: 'loading' });
    try {
      const result = await api.simulate(selection);
      setCalc({ status: 'done', result });
    } catch (e) {
      const body = e instanceof ApiError ? (e.body as { errors?: ValidationError[] } | null) : null;
      const message = body?.errors?.map((x) => x.message).join('; ') ?? 'Расчёт не удался — API не отвечает';
      setCalc({ status: 'error', message });
    }
  };

  if (error) return <div className="state-screen">{error}</div>;
  if (!data) return <div className="state-screen">Загрузка данных…</div>;

  const cost = selectionCost(selection, data);

  return (
    <div className="app">
      <TopNav apiOk={!live.error} />
      <Hud
        cost={cost}
        budget={data.budget}
        filled={selection.length}
        dirCounts={directionCounts(selection, data)}
        nCrit={live.sim?.n_crit ?? null}
        score={score}
        baseScore={live.sim?.base_score ?? null}
        optimum={optimum?.score ?? null}
        lastMove={lastMove}
      />
      <main className="workspace">
        <Catalog
          data={data}
          selection={selection}
          preview={live.preview}
          filter={filter}
          onFilter={setFilter}
          openInfo={openInfo}
          onOpenInfo={setOpenInfo}
          onAdd={onAdd}
          onRemove={onRemove}
        />
        <aside className="side scroll" aria-label="Набор и районы">
          <SetPanel
            data={data}
            selection={selection}
            cost={cost}
            preview={live.preview}
            validation={live.validation}
            calc={calc}
            optimum={optimum?.score ?? null}
            onDistrict={onDistrict}
            onRemove={onRemove}
            onCalculate={onCalculate}
            onExplain={() => setExplainOpen(true)}
          />
          <DistrictMap data={data} sim={live.sim} />
        </aside>
      </main>
      {explainOpen && <ExplainDrawer selection={selection} onClose={() => setExplainOpen(false)} />}
    </div>
  );
}
