import type { CSSProperties } from 'react';
import type { DirCode } from '../api/types';
import { BUDGET_WARN_SHARE, CRITICAL_THRESHOLD, MAX_PER_DIRECTION, SLOTS } from '../lib/constants';
import { DIRECTIONS, DIR_ORDER, dirVars } from '../lib/directions';
import * as fmt from '../lib/format';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { ArrowIcon, WarnIcon } from './Icons';

export function budgetColor(cost: number, budget: number): string {
  if (cost > budget) return 'var(--bad)';
  if (cost > budget * BUDGET_WARN_SHARE) return 'var(--warn)';
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
  lastMove: { delta: number; id: number } | null;
}

export function Hud({ cost, budget, filled, dirCounts, nCrit, score, baseScore, optimum, lastMove }: Props) {
  const shown = useAnimatedNumber(score);
  const delta = score !== null && baseScore !== null ? score - baseScore : null;
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
          {Array.from({ length: SLOTS }, (_, i) => (
            <span key={i} className={`hud-slot${i < filled ? ' is-filled' : ''}`} />
          ))}
          <span className="mono" style={{ marginLeft: 6, fontSize: 15, fontWeight: 700 }}>
            {filled}/{SLOTS}
          </span>
        </div>
      </div>

      <div className="hud-seg">
        <span className="hud-label">Направления · макс. {MAX_PER_DIRECTION}</span>
        <div className="hud-dirs">
          {DIR_ORDER.map((d) => (
            <div
              key={d}
              className={`hud-dir${dirCounts[d] >= MAX_PER_DIRECTION ? ' is-full' : ''}`}
              style={dirVars(d)}
              title={`${DIRECTIONS[d].name}: ${dirCounts[d]}/${MAX_PER_DIRECTION}`}
            >
              {DIRECTIONS[d].short}
              {Array.from({ length: MAX_PER_DIRECTION }, (_, i) => (
                <span key={i} className={`pip${i < dirCounts[d] ? ' is-on' : ''}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="hud-seg">
        <span className="hud-label">Крит. зоны &lt; {CRITICAL_THRESHOLD}</span>
        <div className={`hud-crit${nCrit ? ' is-bad' : ''}`}>
          <WarnIcon size={16} />
          <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
            {nCrit ?? '—'}
          </span>
          <small>{nCrit ? `${fmt.signed(-nCrit, 0)} к Score` : nCrit === 0 ? 'чисто' : ''}</small>
        </div>
      </div>

      <div className="hud-score" aria-live="polite">
        <div className="hud-seg" style={{ padding: 0 }}>
          <span className="hud-label">Прогноз Score</span>
          <span className="hud-label" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
            база {baseScore !== null ? fmt.score(baseScore) : '—'} · оптимум {optimum !== null ? fmt.score(optimum) : '—'}
          </span>
        </div>
        <span key={lastMove?.id ?? 0} className={`hud-score-value${lastMove ? ' bump' : ''}`}>
          {shown !== null ? fmt.score(shown) : '—'}
        </span>
        <div className="hud-delta">
          {delta !== null && (
            <span className={`delta-chip${delta < 0 ? ' is-down' : ''}`}>
              <ArrowIcon up={delta >= 0} />
              {fmt.signed(delta)}
            </span>
          )}
          {lastMove && (
            <span key={lastMove.id} className={`last-move${lastMove.delta < 0 ? ' is-down' : ''}`}>
              {fmt.signed(lastMove.delta)} за ход
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
