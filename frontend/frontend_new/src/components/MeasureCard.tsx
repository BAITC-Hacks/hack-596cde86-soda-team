import type { KeyboardEvent } from 'react';
import type { Measure } from '../api/types';
import type { Availability } from '../lib/rules';
import { DIRECTIONS, dirVars } from '../lib/directions';
import * as fmt from '../lib/format';
import { IsoIcon } from './IsoIcon';
import { CheckIcon, LockIcon } from './Icons';

export interface Gain {
  delta: number;
  district: string | null;
}

interface Props {
  measure: Measure;
  avail: Availability;
  horizon: number;
  /** Engine delta if added (available) or contribution (selected); null if unknown. */
  gain: Gain | null;
  open: boolean;
  popUp: boolean;
  onToggleInfo: () => void;
  onClose: () => void;
  onPick: () => void;
}

export function MeasureCard({ measure: m, avail, horizon, gain, open, popUp, onToggleInfo, onClose, onPick }: Props) {
  const dir = DIRECTIONS[m.direction];
  const selected = avail.state === 'selected';
  const blocked = avail.state === 'blocked';
  const overBy = avail.state === 'available' ? avail.overBudgetBy : 0;
  const popId = `pop-${m.id}`;

  const stateClass = selected ? ' is-selected' : blocked ? ' is-blocked' : '';
  const label = `${m.name}, ${dir.name}, ${m.cost} ед.${selected ? ', в наборе' : ''}${blocked ? `, недоступно: ${avail.reason}` : ''}`;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) onClose();
  };

  return (
    <div className={`mwrap${open ? ' is-open' : ''}`} style={dirVars(m.direction)} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`mcard${stateClass}`}
        disabled={blocked}
        aria-pressed={selected}
        aria-label={label}
        aria-describedby={popId}
        onClick={onPick}
      >
        <span className="mcard-body">
          <IsoIcon dir={m.direction} size={40} />
          <span className="mcard-name">{m.name}</span>
          <span className={`mcard-price${overBy > 0 ? ' is-over' : ''}`}>{m.cost}</span>
        </span>
      </button>

      {selected && (
        <span className="mcard-mark mcard-check" aria-hidden="true">
          <CheckIcon />
        </span>
      )}
      {blocked && (
        <span className="mcard-mark mcard-lock" aria-hidden="true">
          <LockIcon size={15} />
        </span>
      )}

      <button
        type="button"
        className="info-btn"
        aria-label={`Подробнее: ${m.id}`}
        aria-expanded={open}
        aria-controls={popId}
        onClick={onToggleInfo}
      >
        i
      </button>

      <div id={popId} role="tooltip" className={`pop ${popUp ? 'is-up' : 'is-down'}${open ? ' is-open' : ''}`}>
        <div className="pop-head">
          <span className="dot" />
          <b>{dir.name}</b>
          <span>· {m.type === 'district' ? 'на район' : 'весь город'}</span>
          <span className="mono">{m.id}</span>
        </div>
        <div className="pop-name">{m.name}</div>
        <div className="chips">
          {Object.entries(m.effects).map(([code, v]) => (
            <span key={code} className="chip">
              {fmt.effect(code, v)}
            </span>
          ))}
        </div>
        <div className="pop-meta">
          <span className="mono">{m.cost} ед.</span>
          <span>
            лаг {m.lag} кв · {fmt.lagShare(m.lag, horizon)} эффекта
          </span>
        </div>
        {!blocked &&
          (gain ? (
            <span className={`gain${gain.delta < 0 ? ' is-down' : ''}`}>
              {selected
                ? `вклад в Score ${fmt.signed(gain.delta)}`
                : `${fmt.signed(gain.delta)} к Score${gain.district ? ` · район ${gain.district}` : ''}`}
            </span>
          ) : (
            <span className="pop-note">Прогноз вклада недоступен</span>
          ))}
        {selected && avail.district && <span className="pop-note">В наборе · район {avail.district}</span>}
        {blocked && (
          <span className="pop-note is-block">
            <LockIcon size={12} />
            Заблокировано: {avail.reason}
          </span>
        )}
        {overBy > 0 && (
          <span className="pop-note is-warn">
            <LockIcon size={12} />
            Превысит бюджет на {overBy} ед.
          </span>
        )}
      </div>
    </div>
  );
}
