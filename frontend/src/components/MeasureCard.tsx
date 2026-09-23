import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Measure } from '../types';
import type { Availability } from '../lib/rules';
import { dirVars } from '../lib/directions';
import * as fmt from '../lib/format';
import { IsoIcon } from './IsoIcon';
import { CheckIcon, LockIcon } from './Icons';

interface Props {
  measure: Measure;
  avail: Availability;
  directionName: string;
  open: boolean;
  popUp: boolean;
  onToggleInfo: () => void;
  onClose: () => void;
  onPick: () => void;
}

export function MeasureCard({ measure: m, avail, directionName, open, popUp, onToggleInfo, onClose, onPick }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if ((!open && !hovered) || dismissed) return;
    const dismiss = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDismissed(true);
        onClose();
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [open, hovered, dismissed, onClose]);
  const selected = avail.state === 'selected';
  const blocked = avail.state === 'blocked';
  const popId = `pop-${m.id}`;

  const stateClass = selected ? ' is-selected' : blocked ? ' is-blocked' : '';
  const label = `${m.name}, ${directionName}, ${m.cost} ед.${selected ? ', в наборе' : ''}${blocked ? `, недоступно: ${avail.reason}` : ''}`;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDismissed(true);
      onClose();
    }
  };

  return (
    <div className={`mwrap${open ? ' is-open' : ''}${dismissed ? ' is-dismissed' : ''}`} style={dirVars(m.direction)} onKeyDown={onKeyDown} onMouseEnter={() => { setHovered(true); setDismissed(false); }} onMouseLeave={() => setHovered(false)} onFocus={() => setDismissed(false)}>
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
          <span className={'mcard-price'}>{m.cost}</span>
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
        onClick={() => { setDismissed(false); onToggleInfo(); }}
      >
        i
      </button>

      <div id={popId} role="tooltip" className={`pop ${popUp ? 'is-up' : 'is-down'}${open ? ' is-open' : ''}`}>
        <div className="pop-head">
          <span className="dot" />
          <b>{directionName}</b>
          <span>· {m.scope === 'district' ? 'на район' : 'весь город'}</span>
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
            лаг {m.lag} кв
          </span>
        </div>
        {!blocked && <span className="pop-note">Вклад появится в разборе рассчитанного сценария</span>}
        {selected && avail.district && <span className="pop-note">В наборе · район {avail.district}</span>}
        {blocked && (
          <span className="pop-note is-block">
            <LockIcon size={12} />
            Заблокировано: {avail.reason}
          </span>
        )}
      </div>
    </div>
  );
}
