import type { CSSProperties } from 'react';
import type { DirectionCode as DirCode } from '../types';
import { DIR_ORDER, dirVars } from '../lib/directions';
import * as fmt from '../lib/format';
import { ArrowIcon, WarnIcon } from './Icons';

export function budgetColor(cost: number, budget: number): string {
  if (cost > budget) return 'var(--bad)';
  if (cost > budget * 0.9) return 'var(--warn)';
  return 'var(--ok)';
}

interface Props {
  cost: number;
  budget: number;
  filled: number;
  dirCounts: Record<DirCode, number>;
  nCrit: number | null;
  score: number | null;
  baseScore: number | null;
  optimum: number | null;
  rules: { required_choices: number; max_per_direction: number; critical_threshold: number };
  directions: Record<DirCode, string>;
  calculated: boolean;
  scoreDelta: number;
}

export function Hud({ cost, budget, filled, dirCounts, nCrit, score, baseScore, optimum, rules, directions, calculated, scoreDelta }: Props) {
  const shown = score;
  const delta = score !== null && baseScore !== null ? scoreDelta : null;
  const budgetStyle = { '--budget-color': budgetColor(cost, budget) } as CSSProperties;

  return (
    <section className="hud" aria-label="Статус игры">
      <div className="hud-seg hud-budget" style={budgetStyle}>
        <div className="hud-budget-row">
          <span className="hud-label">Бюджет</span>
          <span className="mono">{cost}</span>
          <span className="mono muted">/ {budget}</span>
        </div>
        <div className="bar" role="meter" aria-label="Бюджет" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={cost}>
          <span style={{ width: `${Math.min(100, (cost / budget) * 100)}%` }} />
        </div>
      </div>

      <div className="hud-seg">
        <span className="hud-label">Ячейки</span>
        <div className="hud-slots">
          {Array.from({ length: rules.required_choices }, (_, i) => (
            <span key={i} className={`hud-slot${i < filled ? ' is-filled' : ''}`} />
          ))}
          <span className="mono" style={{ marginLeft: 6, fontSize: 15, fontWeight: 700 }}>
            {filled}/{rules.required_choices}
          </span>
        </div>
      </div>

      <div className="hud-seg">
        <span className="hud-label">Направления · макс. {rules.max_per_direction}</span>
        <div className="hud-dirs">
          {DIR_ORDER.map((d) => (
            <div
              key={d}
              className={`hud-dir${dirCounts[d] >= rules.max_per_direction ? ' is-full' : ''}`}
              style={dirVars(d)}
              title={`${directions[d]}: ${dirCounts[d]}/${rules.max_per_direction}`}
            >
              {directions[d].slice(0, 2)}
              {Array.from({ length: rules.max_per_direction }, (_, i) => (
                <span key={i} className={`pip${i < dirCounts[d] ? ' is-on' : ''}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="hud-seg">
        <span className="hud-label">Крит. зоны &lt; {rules.critical_threshold}</span>
        <div className={`hud-crit${nCrit ? ' is-bad' : ''}`}>
          <WarnIcon size={16} />
          <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
            {nCrit ?? '—'}
          </span>
          <small>{calculated ? 'после расчёта' : 'в базе'}</small>
        </div>
      </div>

      <div className="hud-score" aria-live="polite">
        <div className="hud-seg" style={{ padding: 0 }}>
          <span className="hud-label">{calculated ? 'Итоговый Score' : 'Исходный Score'}</span>
          <span className="hud-label" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
            база {baseScore !== null ? fmt.score(baseScore) : '—'} · оптимум {optimum !== null ? fmt.score(optimum) : '—'}
          </span>
        </div>
        <span className="hud-score-value">
          {shown !== null ? fmt.score(shown) : '—'}
        </span>
        <div className="hud-delta">
          {delta !== null && (
            <span className={`delta-chip${delta < 0 ? ' is-down' : ''}`}>
              <ArrowIcon up={delta >= 0} />
              {fmt.signed(delta)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
