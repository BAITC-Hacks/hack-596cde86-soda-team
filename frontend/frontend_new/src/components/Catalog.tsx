import type { Choice, DirCode, GameData, Measure, PreviewResult } from '../api/types';
import { DIRECTIONS, DIR_ORDER, dirVars } from '../lib/directions';
import { allowedDistricts, availability } from '../lib/rules';
import { MeasureCard, type Gain } from './MeasureCard';

export type Filter = 'all' | DirCode;

const COLUMNS = 3;
/** Rows from this index on open their popover upward. */
const POP_UP_FROM_ROW = 2;

interface Props {
  data: GameData;
  selection: Choice[];
  preview: PreviewResult | null;
  filter: Filter;
  onFilter: (f: Filter) => void;
  openInfo: string | null;
  onOpenInfo: (id: string | null) => void;
  onAdd: (choice: Choice) => void;
  onRemove: (measureId: string) => void;
}

/** Best engine-reported placement for adding `m` to the current set. */
function bestCandidate(m: Measure, selection: Choice[], data: GameData, preview: PreviewResult | null): Gain | null {
  if (!preview) return null;
  const allowed = m.type === 'district' ? allowedDistricts(m, selection, data) : null;
  const options = preview.candidates.filter(
    (c) => c.measure_id === m.id && (allowed === null || (c.district !== null && allowed.includes(c.district))),
  );
  if (options.length === 0) return null;
  const best = options.reduce((a, b) => (b.delta > a.delta ? b : a));
  return { delta: best.delta, district: best.district };
}

export function Catalog({ data, selection, preview, filter, onFilter, openInfo, onOpenInfo, onAdd, onRemove }: Props) {
  const list = data.measures.filter((m) => filter === 'all' || m.direction === filter);
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Все', count: data.measures.length },
    ...DIR_ORDER.map((d) => ({
      key: d,
      label: DIRECTIONS[d].name,
      count: data.measures.filter((m) => m.direction === d).length,
    })),
  ];

  return (
    <section className="catalog" aria-label="Каталог мероприятий">
      <div className="tabs" role="group" aria-label="Фильтр по направлению">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className="tab"
            aria-pressed={filter === t.key}
            onClick={() => onFilter(t.key)}
            style={t.key === 'all' ? undefined : dirVars(t.key)}
          >
            {t.key !== 'all' && <span className="dot" />}
            {t.label}
            <span className="mono">{t.count}</span>
          </button>
        ))}
        <span className="tabs-hint">
          Клик — в ячейку · <b>i</b> — детали
        </span>
      </div>

      <div className="catalog-grid scroll">
        {list.map((m, idx) => {
          const avail = availability(m, selection, data);
          const gain: Gain | null =
            avail.state === 'selected'
              ? preview?.contributions[m.id] !== undefined
                ? { delta: preview.contributions[m.id] ?? 0, district: avail.district }
                : null
              : avail.state === 'available'
                ? bestCandidate(m, selection, data, preview)
                : null;

          const pick = () => {
            if (avail.state === 'selected') return onRemove(m.id);
            if (avail.state !== 'available') return;
            const district =
              m.type === 'city' ? null : (gain?.district ?? allowedDistricts(m, selection, data)[0] ?? null);
            onAdd({ measure_id: m.id, district });
          };

          return (
            <MeasureCard
              key={m.id}
              measure={m}
              avail={avail}
              horizon={data.horizon}
              gain={gain}
              open={openInfo === m.id}
              popUp={Math.floor(idx / COLUMNS) >= POP_UP_FROM_ROW}
              onToggleInfo={() => onOpenInfo(openInfo === m.id ? null : m.id)}
              onClose={() => onOpenInfo(null)}
              onPick={pick}
            />
          );
        })}
      </div>
    </section>
  );
}
