import type { CSSProperties } from 'react';
import type { Choice, CityData, SimulationResult, ValidationResult } from '../types';
import { dirVars } from '../lib/directions';
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
  data: CityData;
  selection: Choice[];
  cost: number;
  validation: ValidationResult | null;
  calc: CalcState;
  onDistrict: (measureId: string, district: string) => void;
  onRemove: (measureId: string) => void;
  onCalculate: () => void;
  onExample: () => void;
  onClear: () => void;
  validationError: string;
  onRetryValidation: () => void;
}

export function SetPanel(props: Props) {
  const { data, selection, cost, validation, calc } = props;
  const over = cost > data.budget;
  const valid = validation?.ok ?? false;
  const done = calc.status === 'done';

  return (
    <div className="panel" style={{ '--budget-color': budgetColor(cost, data.budget) } as CSSProperties}>
      <div className="panel-head">
        <h2>Набор</h2>
        <span className="mono muted">
          {selection.length}/{data.rules.required_choices} ячеек
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
        {Array.from({ length: data.rules.required_choices }, (_, i) => {
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
                </span>
              </span>
              {m.scope === 'district' ? (
                <select
                  aria-label={`Район для ${m.id}`}
                  value={c.district ?? ''}
                  onChange={(e) => props.onDistrict(m.id, e.target.value)}
                >
                  <option value="">Выберите район</option>
                  {data.districts.map((d) => (
                    <option key={d.id} value={d.id}>
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
              : selection.length < data.rules.required_choices ? 'Рассчитать Score — заполните набор' : validation ? 'Рассчитать Score — исправьте ошибки' : 'Проверяем набор…'}
      </button>

      {calc.status === 'error' && <div className="notice is-err">{calc.message}</div>}
      {props.validationError && <div className="notice is-err" role="alert">{props.validationError}<button className="text-button" onClick={props.onRetryValidation}>Повторить проверку</button></div>}
      <div className="plan-actions">
        <button className="text-button" onClick={props.onExample}>Загрузить пример</button>
        {selection.length > 0 && <button className="text-button" onClick={props.onClear}>Очистить набор</button>}
      </div>
      <p className="muted plan-note">Результат и разбор появятся ниже. Предыдущие расчёты сохраняются до перезагрузки страницы.</p>
    </div>
  );
}
