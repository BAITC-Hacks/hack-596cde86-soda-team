import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { explainScenario, getData, simulateScenario, validateScenario } from './api'
import type { Choice, CityData, DirectionCode, Explanation, IndicatorCode, Measure, SimulationResult, ValidationResult } from './types'

const number = (value: number, digits = 2) =>
  value.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })

const signed = (value: number) => `${value > 0 ? '+' : ''}${number(value)}`

function MeasureCard({
  measure, data, selected, disabled, reason, onAdd,
}: {
  measure: Measure
  data: CityData
  selected: boolean
  disabled: boolean
  reason: string
  onAdd: () => void
}) {
  return (
    <article className={`measure-card tone-${measure.direction}`}>
      <div className="measure-topline">
        <span className="measure-id">{measure.id}</span>
        <span className="measure-cost">{measure.cost} ед.</span>
      </div>
      <h3>{measure.name}</h3>
      <p className="measure-scope">{measure.scope === 'city' ? 'Весь город' : 'Один район'} · эффект через {measure.lag} кв.</p>
      <div className="effect-list">
        {Object.entries(measure.effects).map(([indicator, value]) => (
          <span key={indicator} className={value < 0 ? 'effect negative' : 'effect'} title={data.indicators[indicator as IndicatorCode]}>
            {indicator} {value > 0 ? '+' : ''}{value}
          </span>
        ))}
      </div>
      <button className="add-button" onClick={onAdd} disabled={disabled} title={reason || undefined}>
        {selected ? 'В плане' : disabled ? reason : 'Добавить в план'}
        {!disabled && <span aria-hidden="true">↗</span>}
      </button>
    </article>
  )
}

function ResultPanel({ data, result, explanation, explanationError, onRetry }: { data: CityData; result: SimulationResult; explanation: Explanation | null; explanationError: string; onRetry: () => void }) {
  const chart = result.districts.map((district) => ({
    name: district.name,
    'До': Number(district.score_before.toFixed(2)),
    'После': Number(district.score_after.toFixed(2)),
  }))
  const indicators = Object.keys(data.indicators) as IndicatorCode[]
  const weakest = result.districts.find((district) => district.id === result.weakest_district)

  return (
    <section className="results" id="results" aria-live="polite">
      <div className="section-heading result-heading">
        <div>
          <h2>Что изменилось в городе</h2>
          <p>Итог после выбранных мер на горизонте {result.horizon_quarters} кварталов.</p>
        </div>
        <span className="result-status">Сценарий рассчитан</span>
      </div>

      <div className="score-panel">
        <div className="score-main">
          <span className="score-caption">Astana Quality of Life Score</span>
          <strong>{number(result.score)}</strong>
          <span className={`score-change ${result.score_delta < 0 ? 'is-negative' : ''}`}>
            {signed(result.score_delta)} к исходному состоянию
          </span>
        </div>
        <div className="score-context">
          <div><span>Исходный балл</span><b>{number(result.base_score)}</b></div>
          <div><span>Лучший найденный</span><b>{explanation ? number(explanation.best_score) : explanationError ? 'Недоступно' : 'Считаем…'}</b></div>
          <div><span>Разрыв с лучшим</span><b>{explanation ? number(explanation.gap_to_best) : '—'}</b></div>
          <div><span>Слабейший район</span><b>{weakest?.name}</b></div>
        </div>
      </div>

      <div className="results-grid">
        <div className="result-block chart-block">
          <div className="block-head"><h3>Районы: до и после</h3><span>Оценка / 100</span></div>
          <div className="chart-wrap" role="img" aria-label="Сравнение районных оценок до и после решений">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={chart} layout="vertical" margin={{ top: 8, right: 18, bottom: 0, left: 12 }} barGap={3}>
                <CartesianGrid stroke="#e5e8e4" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#63726d', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={78} tick={{ fill: '#263b35', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value, name) => [`${number(Number(value))} балла`, String(name)]} />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="До" fill="#b7c4bd" radius={[0, 3, 3, 0]} barSize={11} />
                <Bar dataKey="После" fill="#177b6b" radius={[0, 3, 3, 0]} barSize={11} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="result-block insight-block">
          <div className="block-head"><h3>На что обратить внимание</h3></div>
          <div className="insight-line"><span>Потрачено</span><strong>{result.total_cost} из {data.budget}</strong></div>
          <div className="insight-line"><span>Критических показателей</span><strong className={result.critical_count ? 'alert-text' : 'good-text'}>{result.critical_count}</strong></div>
          <div className="insight-line"><span>Синергии мер</span><strong>{result.synergies.length ? result.synergies.join(', ') : 'Нет'}</strong></div>
          <p className="insight-note">Балл учитывает среднюю оценку города, слабейший район и показатели ниже {data.rules.critical_threshold}.</p>
        </div>
      </div>

      <div className="result-block matrix-block">
        <div className="block-head"><h3>Показатели районов</h3><span>Итоговое значение и изменение</span></div>
        <div className="matrix-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col">Район</th>
                {indicators.map((indicator) => <th scope="col" key={indicator} title={data.indicators[indicator]}>{indicator}<small>{data.indicators[indicator]}</small></th>)}
              </tr>
            </thead>
            <tbody>
              {result.districts.map((district) => (
                <tr key={district.id}>
                  <th scope="row">{district.name}</th>
                  {indicators.map((indicator) => {
                    const value = district.after[indicator]
                    const delta = district.delta[indicator]
                    return <td key={indicator} className={value < data.rules.critical_threshold ? 'cell-critical' : delta > 0 ? 'cell-positive' : delta < 0 ? 'cell-negative' : ''} title={`${data.indicators[indicator]}: было ${number(district.before[indicator])}, стало ${number(value)}`}>
                      <b>{number(value, 1)}</b><small>{delta === 0 ? '—' : signed(delta)}</small>
                    </td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="matrix-legend"><span className="legend-dot positive" /> улучшение <span className="legend-dot critical" /> ниже {data.rules.critical_threshold} <span className="legend-dot negative" /> снижение</p>
      </div>

      <div className="result-block explanation-block">
        <div className="block-head"><h3>Разбор сценария</h3><span>{explanation?.mode === 'ai' ? 'AI-анализ' : explanation ? 'Анализ движка' : explanationError ? 'Ошибка анализа' : 'Подготавливаем анализ'}</span></div>
        {explanation ? <p className="explanation-text">{explanation.text}</p> : explanationError ? <div className="explanation-error" role="alert"><p>Не удалось получить объяснение: {explanationError}</p><button onClick={onRetry}>Повторить анализ</button></div> : <p className="muted">Сравниваем решения и ищем улучшения среди допустимых замен…</p>}
      </div>
    </section>
  )
}

export default function App() {
  const [data, setData] = useState<CityData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [selection, setSelection] = useState<Choice[]>([])
  const [filter, setFilter] = useState<DirectionCode | 'all'>('all')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [explanationError, setExplanationError] = useState('')
  const [status, setStatus] = useState<'idle' | 'simulating' | 'explaining'>('idle')
  const [actionError, setActionError] = useState('')
  const runId = useRef(0)

  useEffect(() => {
    let active = true
    getData().then((payload) => { if (active) { setData(payload); setLoadError('') } })
      .catch((error: Error) => { if (active) setLoadError(error.message) })
    return () => { active = false }
  }, [retry])

  useEffect(() => {
    if (!data) return
    let active = true
    setValidation(null)
    validateScenario(selection)
      .then((value) => { if (active) setValidation(value) })
      .catch((error: Error) => { if (active) setActionError(error.message) })
    return () => { active = false }
  }, [data, selection])

  const byId = useMemo(() => new Map(data?.measures.map((measure) => [measure.id, measure]) ?? []), [data])
  const spent = selection.reduce((total, choice) => total + (byId.get(choice.measure_id)?.cost ?? 0), 0)
  const directionCounts = selection.reduce((counts, choice) => {
    const direction = byId.get(choice.measure_id)?.direction
    if (direction) counts[direction] = (counts[direction] ?? 0) + 1
    return counts
  }, {} as Partial<Record<DirectionCode, number>>)

  function updateSelection(next: Choice[]) {
    runId.current += 1
    setSelection(next)
    setValidation(null)
    setResult(null)
    setExplanation(null)
    setExplanationError('')
    setActionError('')
    setStatus('idle')
  }

  async function requestExplanation(currentRun: number, currentSelection: Choice[]) {
    setStatus('explaining')
    setExplanationError('')
    try {
      const details = await explainScenario(currentSelection)
      if (runId.current !== currentRun) return
      setExplanation(details)
    } catch (error) {
      if (runId.current !== currentRun) return
      setExplanationError(error instanceof Error ? error.message : 'Повторите попытку позже.')
    } finally {
      if (runId.current === currentRun) setStatus('idle')
    }
  }

  async function calculate() {
    if (!validation?.ok) return
    const currentRun = ++runId.current
    setStatus('simulating')
    setActionError('')
    try {
      const simulation = await simulateScenario(selection)
      if (runId.current !== currentRun) return
      setResult(simulation)
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      await requestExplanation(currentRun, selection)
    } catch (error) {
      if (runId.current !== currentRun) return
      setActionError(error instanceof Error ? error.message : 'Не удалось рассчитать сценарий.')
      setStatus('idle')
    }
  }

  if (!data) return <div className="loading-screen"><span className="brand-mark">А</span><p>{loadError || 'Загружаем городскую модель…'}</p>{loadError && <button onClick={() => setRetry((value) => value + 1)}>Повторить</button>}</div>

  const visible = filter === 'all' ? data.measures : data.measures.filter((measure) => measure.direction === filter)
  const validationErrors = validation?.errors.filter((error) => error.rule !== 'count') ?? []
  const canCalculate = selection.length === data.rules.required_choices && validation?.ok && status === 'idle'

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand"><span className="brand-mark">А</span><span>Аким на 5 часов<small>Городской симулятор решений</small></span></div>
        <div className="header-meta"><span className="live-dot" /> Синтетическая модель · {data.districts.length} районов</div>
      </header>

      <main>
        <section className="intro">
          <div className="intro-copy">
            <h1>Город меняется<br /><em>от каждого решения.</em></h1>
            <p>Распределите ограниченный бюджет между инициативами. Модель покажет, где качество жизни вырастет, а где останутся риски.</p>
          </div>
          <div className="intro-facts">
            <div><strong>{data.budget}</strong><span>единиц бюджета</span></div>
            <div><strong>{data.rules.required_choices}</strong><span>решений в плане</span></div>
            <div><strong>{number(data.baseline.score)}</strong><span>исходный Score</span></div>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="catalog" aria-labelledby="catalog-title">
            <div className="section-heading">
              <div><h2 id="catalog-title">Каталог инициатив</h2><p>Выберите меры из разных направлений развития города.</p></div>
              <span className="catalog-count">{data.measures.length} мероприятий</span>
            </div>
            <div className="direction-tabs" role="group" aria-label="Фильтр по направлению">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Все</button>
              {(Object.keys(data.directions) as DirectionCode[]).map((direction) => (
                <button key={direction} className={filter === direction ? 'active' : ''} onClick={() => setFilter(direction)}>
                  {data.directions[direction]}
                </button>
              ))}
            </div>
            <div className="measure-grid">
              {visible.map((measure) => {
                const selected = selection.some((choice) => choice.measure_id === measure.id)
                const full = selection.length >= data.rules.required_choices
                const overBudget = spent + measure.cost > data.budget
                const overDirection = (directionCounts[measure.direction] ?? 0) >= data.rules.max_per_direction
                const reason = selected ? 'В плане' : full ? 'План заполнен' : overBudget ? 'Не хватает бюджета' : overDirection ? 'Лимит направления' : ''
                return <MeasureCard key={measure.id} measure={measure} data={data} selected={selected} disabled={Boolean(reason)} reason={reason} onAdd={() => updateSelection([...selection, { measure_id: measure.id, district: null }])} />
              })}
            </div>
          </section>

          <aside className="plan" aria-labelledby="plan-title">
            <div className="plan-top">
              <div className="plan-title-row"><h2 id="plan-title">Ваш план</h2><span>{selection.length} / {data.rules.required_choices}</span></div>
              <div className="budget-head"><span>Бюджет</span><strong>{spent} / {data.budget}</strong></div>
              <div className="budget-track" role="progressbar" aria-valuenow={spent} aria-valuemin={0} aria-valuemax={data.budget} aria-label="Использованный бюджет"><span style={{ width: `${spent / data.budget * 100}%` }} /></div>
              <p className="budget-foot">Осталось {data.budget - spent} единиц. Остаток не повышает Score.</p>
              <div className="decision-track" aria-label="Количество выбранных решений">
                {Array.from({ length: data.rules.required_choices }, (_, index) => <span key={index} className={index < selection.length ? 'filled' : ''} />)}
              </div>
            </div>

            <div className="plan-content">
              {selection.length === 0 ? (
                <div className="empty-plan"><strong>Пока пусто</strong><p>Добавьте первую инициативу из каталога. Для районной меры затем выберите место реализации.</p><button className="example-button" onClick={() => updateSelection(data.example_selection)}>Загрузить пример сценария</button></div>
              ) : selection.map((choice, index) => {
                const measure = byId.get(choice.measure_id)!
                return <div className={`chosen-measure tone-${measure.direction}`} key={choice.measure_id}>
                  <div className="chosen-head"><span>{measure.id} · {data.directions[measure.direction]}</span><button aria-label={`Убрать ${measure.name}`} onClick={() => updateSelection(selection.filter((_, offset) => offset !== index))}>Убрать</button></div>
                  <strong>{measure.name}</strong>
                  <div className="chosen-foot"><span>{measure.cost} ед.</span>{measure.scope === 'city' ? <span>Весь город</span> : <label>
                    <span className="sr-only">Район для {measure.name}</span>
                    <select value={choice.district ?? ''} onChange={(event) => updateSelection(selection.map((item, offset) => offset === index ? { ...item, district: event.target.value || null } : item))}>
                      <option value="">Выберите район</option>
                      {data.districts.map((district) => <option value={district.id} key={district.id}>{district.name}</option>)}
                    </select>
                  </label>}</div>
                </div>
              })}
            </div>

            <div className="plan-bottom">
              {validationErrors.length > 0 && <div className="validation-list" role="alert">{validationErrors.map((error, index) => <p key={`${error.rule}-${index}`}>{error.message}</p>)}</div>}
              {actionError && <p className="action-error" role="alert">{actionError}</p>}
              <button className="calculate-button" disabled={!canCalculate} onClick={calculate}>
                {status === 'simulating' ? 'Считаем сценарий…' : status === 'explaining' ? 'Ищем рекомендации…' : 'Рассчитать сценарий'}
                <span aria-hidden="true">↗</span>
              </button>
              {!canCalculate && status === 'idle' && <p className="calculate-hint">{selection.length < data.rules.required_choices ? `Добавьте ещё ${data.rules.required_choices - selection.length} ${data.rules.required_choices - selection.length === 1 ? 'меру' : 'меры'}.` : 'Исправьте ошибки в плане.'}</p>}
              {selection.length > 0 && <button className="reset-button" onClick={() => updateSelection([])}>Очистить план</button>}
            </div>
          </aside>
        </div>

        {result && <ResultPanel data={data} result={result} explanation={explanation} explanationError={explanationError} onRetry={() => { void requestExplanation(++runId.current, selection) }} />}
      </main>
      <footer className="footer"><span>Аким на 5 часов</span><p>Модель использует синтетические данные. Результат показывает условный сценарий, а не прогноз для реального города.</p></footer>
    </div>
  )
}
