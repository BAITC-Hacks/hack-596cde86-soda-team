import type { GameData, SimulationResult } from '../api/types';
import { CRITICAL_THRESHOLD } from '../lib/constants';
import * as fmt from '../lib/format';
import { WarnIcon } from './Icons';

interface Props {
  data: GameData;
  /** Live engine result; before the first one arrives the base values from /api/data are shown. */
  sim: SimulationResult | null;
}

interface Row {
  name: string;
  values: Record<string, number>;
  before: Record<string, number>;
  d: number | null;
}

function cellStyle(v: number) {
  const t = Math.max(0, Math.min(1, (v - 35) / 45));
  const alpha = 0.08 + 0.72 * t;
  return { background: `rgba(11, 92, 140, ${alpha.toFixed(2)})`, color: alpha > 0.5 ? '#fff' : 'var(--ink)' };
}

export function DistrictMap({ data, sim }: Props) {
  const codes = data.indicators.map((i) => i.code);
  const nameOf = Object.fromEntries(data.indicators.map((i) => [i.code, i.name]));

  const rows: Row[] = sim
    ? sim.districts.map((d) => ({ name: d.name, values: d.after, before: d.before, d: d.d_after }))
    : data.districts.map((d) => ({ name: d.name, values: d.indicators, before: d.indicators, d: null }));
  const dMin = sim ? sim.d_min : null;

  const critical = rows.flatMap((r) =>
    codes
      .filter((k) => (r.values[k] ?? 100) < CRITICAL_THRESHOLD)
      .map((k) => ({ district: r.name, code: k, value: r.values[k] ?? 0 })),
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Районы · прогноз</h2>
        <span className="aside muted">0–100, больше — лучше</span>
      </div>

      <div className="dmap" role="table" aria-label="Показатели по районам">
        <span role="columnheader" />
        {codes.map((k) => (
          <span key={k} className="dmap-h" role="columnheader" title={nameOf[k]}>
            {k}
          </span>
        ))}
        <span className="dmap-h" role="columnheader">
          D
        </span>
        {rows.map((r) => (
          <div key={r.name} role="row" style={{ display: 'contents' }}>
            <span className="dmap-name" role="rowheader">
              {r.name}
            </span>
            {codes.map((k) => {
              const v = r.values[k] ?? 0;
              const b = r.before[k] ?? v;
              const crit = v < CRITICAL_THRESHOLD;
              return (
                <span
                  key={k}
                  role="cell"
                  className={`cell${crit ? ' is-crit' : ''}`}
                  style={cellStyle(v)}
                  title={`${nameOf[k]}: ${fmt.value(v)}${v - b > 0.01 ? ` (было ${fmt.value(b)})` : ''}`}
                >
                  {crit && '⚠'}
                  {fmt.value(v)}
                </span>
              );
            })}
            <span role="cell" className={`dmap-d${r.d !== null && dMin !== null && Math.abs(r.d - dMin) < 1e-9 ? ' is-min' : ''}`}>
              {r.d !== null ? r.d.toFixed(1) : '—'}
            </span>
          </div>
        ))}
      </div>

      {critical.length > 0 ? (
        <div className="notice is-crit" role="alert">
          <strong>
            <WarnIcon /> Критические зоны: −1 к Score за каждую
          </strong>
          {critical.map((c) => (
            <span key={c.district + c.code}>
              <b>{c.district}</b> · {nameOf[c.code]} ({c.code}) — <span className="mono">{fmt.value(c.value)}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="notice is-ok">Критических зон нет — все показатели ≥ {CRITICAL_THRESHOLD}</div>
      )}
    </div>
  );
}
