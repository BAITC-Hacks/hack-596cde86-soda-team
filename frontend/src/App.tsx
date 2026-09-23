import { useEffect, useRef, useState } from 'react'
import { explainScenario, getBest, getData, simulateScenario, validateScenario } from './api'
import type { Choice, CityData, RankedSelection, ValidationResult } from './types'
import { Catalog, type Filter } from './components/Catalog'
import { DistrictMap } from './components/DistrictMap'
import { Hud } from './components/Hud'
import { Logo } from './components/Icons'
import { ScenarioResult, type ScenarioRun } from './components/ScenarioResult'
import { SetPanel, type CalcState } from './components/SetPanel'
import { directionCounts, selectionCost } from './lib/rules'
import * as fmt from './lib/format'

const message = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить запрос. Повторите попытку.'
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({
  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start',
})

function openReference(id: string) {
  const section = document.getElementById(id)
  if (section instanceof HTMLDetailsElement) section.open = true
}

export default function App() {
  const [data, setData] = useState<CityData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [selection, setSelection] = useState<Choice[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [openInfo, setOpenInfo] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validationError, setValidationError] = useState('')
  const [validationRetry, setValidationRetry] = useState(0)
  const [calc, setCalc] = useState<CalcState>({ status: 'idle' })
  const [runs, setRuns] = useState<ScenarioRun[]>([])
  const [best, setBest] = useState<RankedSelection[] | null>(null)
  const [bestError, setBestError] = useState('')
  const [bestLoading, setBestLoading] = useState(false)
  const revision = useRef(0)
  const nextRun = useRef(0)
  const calculating = useRef(false)

  useEffect(() => {
    let active = true
    getData().then((value) => { if (active) { setData(value); setLoadError('') } })
      .catch((error: unknown) => { if (active) setLoadError(message(error)) })
    return () => { active = false }
  }, [retry])

  useEffect(() => {
    if (!data) return
    let active = true
    setValidation(null)
    setValidationError('')
    const timer = setTimeout(() => {
      validateScenario(selection).then((value) => { if (active) setValidation(value) })
        .catch((error: unknown) => { if (active) setValidationError(message(error)) })
    }, 150)
    return () => { active = false; clearTimeout(timer) }
  }, [data, selection, validationRetry])

  useEffect(() => {
    if (runs.length) scrollTo(`scenario-${runs[runs.length - 1].id}`)
  }, [runs.length])

  function updateSelection(next: Choice[]) {
    revision.current += 1
    calculating.current = false
    setSelection(next)
    setValidation(null)
    setValidationError('')
    setCalc({ status: 'idle' })
    setOpenInfo(null)
  }

  async function explain(id: number, snapshot: Choice[]) {
    setRuns((previous) => previous.map((run) => run.id === id ? { ...run, explanationError: '' } : run))
    try {
      const explanation = await explainScenario(snapshot)
      setRuns((previous) => previous.map((run) => run.id === id ? { ...run, explanation, explanationError: '' } : run))
    } catch (error) {
      setRuns((previous) => previous.map((run) => run.id === id ? { ...run, explanationError: message(error) } : run))
    }
  }

  async function calculate() {
    if (!validation?.ok || calculating.current || calc.status === 'done') return
    const currentRevision = revision.current
    const snapshot = selection.map((choice) => ({ ...choice }))
    calculating.current = true
    setCalc({ status: 'loading' })
    try {
      const result = await simulateScenario(snapshot)
      if (revision.current !== currentRevision) return
      const id = ++nextRun.current
      setCalc({ status: 'done', result })
      setRuns((previous) => [...previous, { id, result, explanation: null, explanationError: '' }])
      void explain(id, snapshot)
    } catch (error) {
      if (revision.current === currentRevision) setCalc({ status: 'error', message: message(error) })
    } finally {
      if (revision.current === currentRevision) calculating.current = false
    }
  }

  async function loadBest() {
    if (bestLoading) return
    setBestLoading(true)
    setBestError('')
    try { setBest(await getBest()) } catch (error) { setBestError(message(error)) } finally { setBestLoading(false) }
  }

  if (!data) return <div className="state-screen"><Logo /><p>{loadError || 'Загружаем городскую модель…'}</p>{loadError && <button className="calc" onClick={() => { setLoadError(''); setRetry((value) => value + 1) }}>Повторить загрузку</button>}</div>

  const current = calc.status === 'done' ? calc.result : data.baseline
  const optimum = best?.[0]?.score ?? runs.find((run) => run.explanation)?.explanation?.best_score ?? null

  return <div className="app">
    <header className="topnav">
      <a href="#simulator" className="brand"><Logo />Аким на 5 часов</a>
      <nav aria-label="Основная навигация"><a href="#simulator" aria-current="page">Симулятор</a><a href="#best" onClick={() => openReference('best')}>Лучшие наборы</a><a href="#districts" onClick={() => openReference('districts')}>Районы</a><a href="#method" onClick={() => openReference('method')}>Методика</a></nav>
      <div className={`api-status${validationError || calc.status === 'error' ? ' is-down' : ''}`}><i />{validationError || calc.status === 'error' ? 'Ошибка связи' : 'API на связи'}</div>
    </header>
    <Hud cost={selectionCost(selection, data)} budget={data.budget} filled={selection.length} dirCounts={directionCounts(selection, data)} nCrit={current.critical_count}
      score={current.score} baseScore={data.baseline.score} optimum={optimum} rules={data.rules} directions={data.directions} calculated={calc.status === 'done'} scoreDelta={current.score_delta} />
    <main>
      <section className="workspace" id="simulator" aria-label="Составление набора">
        <Catalog data={data} selection={selection} filter={filter} onFilter={setFilter} openInfo={openInfo} onOpenInfo={setOpenInfo}
          onAdd={(choice) => updateSelection([...selection, choice])} onRemove={(id) => updateSelection(selection.filter((choice) => choice.measure_id !== id))} />
        <aside className="side" aria-label="Ваш набор"><SetPanel data={data} selection={selection} cost={selectionCost(selection, data)} validation={validation} calc={calc}
          onDistrict={(id, district) => updateSelection(selection.map((choice) => choice.measure_id === id ? { ...choice, district: district || null } : choice))}
          onRemove={(id) => updateSelection(selection.filter((choice) => choice.measure_id !== id))} onCalculate={() => void calculate()}
          onExample={() => updateSelection(data.example_selection.map((choice) => ({ ...choice })))} onClear={() => updateSelection([])}
          validationError={validationError} onRetryValidation={() => { setValidation(null); setValidationRetry((value) => value + 1) }} /></aside>
      </section>
      <div className="page-sections">
        <details id="districts" className="reference-section"><summary>Районы · исходное состояние</summary><DistrictMap data={data} result={data.baseline} /></details>
        <details id="best" className="reference-section"><summary>Лучшие наборы</summary><div className="panel">
          <p className="muted">Полный перебор допустимых наборов движком. Выбранный набор можно загрузить в симулятор и рассчитать.</p>
          {!best && <button className="calc" disabled={bestLoading} onClick={() => void loadBest()}>{bestLoading ? 'Ищем лучшие наборы…' : 'Показать лучшие наборы'}</button>}
          {bestError && <p role="alert" className="notice is-err">{bestError}</p>}
          {best?.map((item, index) => <div className="best-row" key={index}><div><strong>Score {fmt.score(item.score)}</strong><span className="muted">Бюджет {item.cost} / {data.budget}</span><p>{item.selection.map((choice) => `${choice.measure_id}${choice.district ? ` · ${data.districts.find((d) => d.id === choice.district)?.name}` : ''}`).join(' / ')}</p></div><button className="text-button" onClick={() => { updateSelection(item.selection.map((choice) => ({ ...choice }))); scrollTo('simulator') }}>Загрузить набор</button></div>)}
        </div></details>
        <details id="method" className="reference-section"><summary>Методика</summary><div className="panel method-copy">
          <p>Выберите ровно {data.rules.required_choices} разных мер на бюджет до {data.budget} единиц. В каждом направлении — не более {data.rules.max_per_direction} мер. Для районных мер выберите район; городские применяются ко всему городу.</p>
          <p>Движок учитывает лаги и синергии на горизонте {data.horizon_quarters} кварталов. Итоговый Score зависит от средней оценки города, слабейшего района и числа показателей ниже {data.rules.critical_threshold}. Остаток бюджета не даёт бонуса.</p>
          <p>Все расчёты выполняет движок. Агент объясняет результат и предлагает замены. Пока набор не рассчитан, верхняя панель показывает исходный Score. Рассчитанные сценарии и разборы добавляются ниже и сохраняются до перезагрузки.</p>
        </div></details>
        {runs.map((run) => <ScenarioResult key={run.id} data={data} run={run} onRetry={() => void explain(run.id, run.result.selection)} />)}
      </div>
    </main>
    <footer className="footer">Аким на 5 часов · Синтетическая модель города. Результаты — условный сценарий, а не прогноз для реальной Астаны.</footer>
  </div>
}
