import type { CSSProperties } from 'react';
import type { Choice, GameData, PreviewResult, SimulationResult, ValidationResult } from '../api/types';
import { SLOTS } from '../lib/constants';
import { dirVars } from '../lib/directions';
import * as fmt from '../lib/format';
import { findMeasure } from '../lib/rules';
import { budgetColor } from './Hud';
import { IsoIcon } from './IsoIcon';
import { CheckIcon, CloseIcon, PlusIcon } from './Icons';

export type CalcState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: SimulationResult }
  | { status: 'error'; message: string };

interface Props {
  data: GameData;
  selection: Choice[];
  cost: number;
  preview: PreviewResult | null;
  validation: ValidationResult | null;
  calc: CalcState;
  optimum: number | null;
  onDistrict: (measureId: string, district: string) => void;
  onRemove: (measureId: string) => void;
  onCalculate: () => void;
  onExplain: () => void;
}

export function SetPanel(props: Props) {
  const { data, selection, cost, preview, validation, calc, optimum } = props;
  const over = cost > data.budget;
  const valid = validation?.ok ?? false;
  const done = calc.status === 'done';

  return (
    <div className="panel" style={{ '--budget-color': budgetColor(cost, data.budget) } as CSSProperties}>
      <div className="panel-head">
        <h2>Набор</h2>
        <span className="mono muted">
          {selection.length}/{SLOTS} ячеек
        </span>
        <span className={`aside budget-num${over ? ' is-over' : ''}`}>
          {cost} / {data.budget}
        </span>
        <span className="muted">{over ? `превышен на ${cost - data.budget}` : `осталось ${data.budget - cost}`}</span>
      </div>
      <div className="panel-bar">
        <span style={{ width: `${Math.min(100, (cost / data.budget) * 100)}%` }} />
      </div>

      <ol className="slots" aria-label="Ячейки набора">
        {Array.from({ length: SLOTS }, (_, i) => {
          const c = selection[i];
          const m = c ? findMeasure(data, c.measure_id) : undefined;
          if (!c || !m) {
            return (
              <li key={`empty-${i}`} className="slot is-empty">
                <span className="slot-n">{i + 1}</span>
                <PlusIcon />
                Пустая ячейка — выберите меру в каталоге
              </li>
            );
          }
          const contrib = preview?.contributions[m.id];
          return (
            <li key={m.id} className="slot is-filled" style={dirVars(m.direction)}>
              <span className="slot-n">{i + 1}</span>
              <IsoIcon dir={m.direction} size={32} />
              <span className="slot-text">
                <span className="slot-name" title={m.name}>
                  {m.name}
                </span>
                <span className="slot-meta">
                  {m.id} · {m.cost} ед.
                  {contrib !== undefined && (
                    <>
                      {' · '}
                      <b className={contrib >= 0 ? 'is-up' : 'is-down'}>вклад {fmt.signed(contrib)}</b>
                    </>
                  )}
                </span>
              </span>
              {m.type === 'district' ? (
                <select
                  aria-label={`Район для ${m.id}`}
                  value={c.district ?? ''}
                  onChange={(e) => props.onDistrict(m.id, e.target.value)}
                >
                  {data.districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="slot-city">Весь город</span>
              )}
              <button type="button" className="icon-btn" aria-label={`Убрать ${m.id} из набора`} onClick={() => props.onRemove(m.id)}>
                <CloseIcon />
              </button>
            </li>
          );
        })}
      </ol>

      {validation && valid && (
        <div className="notice is-ok" role="status">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckIcon size={14} /> Набор валиден — можно фиксировать результат
          </span>
        </div>
      )}
      {validation && !valid && (
        <div className="notice is-err" role="status">
          <ul>
            {validation.errors.map((e) => (
              <li key={e.rule + e.message}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className={`calc${done ? ' is-done' : ''}`}
        disabled={!valid || done || calc.status === 'loading'}
        onClick={props.onCalculate}
      >
        {done
          ? 'Результат зафиксирован ✓'
          : calc.status === 'loading'
            ? 'Считаем…'
            : valid
              ? 'Рассчитать Score'
              : 'Рассчитать Score — заполните набор'}
      </button>

      {calc.status === 'error' && <div className="notice is-err">{calc.message}</div>}
      {calc.status === 'done' && (
        <div className="result">
          <div className="hud-seg" style={{ padding: 0, gap: 2 }}>
            <span className="hud-label">Итог</span>
            <span className="result-score">{fmt.score(calc.result.score)}</span>
          </div>
          <div className="result-meta">
            <span>{fmt.signed(calc.result.score - calc.result.base_score)} к базе</span>
            {optimum !== null && <span>{fmt.signed(calc.result.score - optimum)} до оптимума</span>}
          </div>
          <button type="button" className="link-btn" onClick={props.onExplain}>
            Разбор агента →
          </button>
        </div>
      )}
    </div>
  );
}
