import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CityData, Explanation, SimulationResult } from '../types'
import { DistrictMap } from './DistrictMap'
import * as fmt from '../lib/format'

export interface ScenarioRun {
  id: number
  result: SimulationResult
  explanation: Explanation | null
  explanationError: string
}

export function ScenarioResult({ data, run, onRetry }: { data: CityData; run: ScenarioRun; onRetry: () => void }) {
  const { result, explanation, explanationError } = run
  const chart = result.districts.map((d) => ({ name: d.name, 'До': d.score_before, 'После': d.score_after }))
  return <article className="scenario" id={`scenario-${run.id}`} aria-labelledby={`scenario-title-${run.id}`}>
    <div className="section-heading"><h2 id={`scenario-title-${run.id}`}>Сценарий {run.id} · результат</h2><span className="muted">Горизонт: {result.horizon_quarters} кварталов</span></div>
    <div className="result result-summary">
      <div><span className="hud-label">Astana Quality of Life Score</span><strong className="result-score">{fmt.score(result.score)}</strong></div>
      <div className="result-meta"><span>{fmt.signed(result.score_delta)} к базе {fmt.score(result.base_score)}</span><span>До оптимума: {explanation ? fmt.score(explanation.gap_to_best) : 'ожидаем разбор'}</span></div>
      <div className="result-meta"><span>Бюджет: {result.total_cost} / {data.budget}</span><span>Критических показателей: {result.critical_count}</span></div>
    </div>
    <div className="panel scenario-plan"><h3>Рассчитанный набор</h3><ul>{result.selection.map((choice) => <li key={choice.measure_id}>
      <b>{choice.measure_id}</b> {data.measures.find((m) => m.id === choice.measure_id)?.name}<span>{choice.district ? data.districts.find((d) => d.id === choice.district)?.name : 'Весь город'}</span>
    </li>)}</ul><p className="muted">Синергии: {result.synergies.length ? result.synergies.join(', ') : 'нет'}</p></div>
    <section className="panel chart-panel"><div className="panel-head"><h2>Районы · до и после</h2><span className="aside muted">Оценка / 100</span></div>
      <div className="chart-wrap" role="img" aria-label="Оценки районов до и после реализации набора">
        <ResponsiveContainer width="100%" height={280}><BarChart data={chart} layout="vertical" margin={{ right: 24, left: 12 }} barGap={4}>
          <CartesianGrid stroke="#ddd8cc" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value, name) => [fmt.score(Number(value)), String(name)]} /><Legend />
          <Bar dataKey="До" fill="#b9c2cc" radius={[0, 3, 3, 0]} barSize={12} /><Bar dataKey="После" fill="#0b5c8c" radius={[0, 3, 3, 0]} barSize={12} />
        </BarChart></ResponsiveContainer>
      </div>
    </section>
    <DistrictMap data={data} result={result} />
    <section className="panel explanation-panel" aria-live="polite"><div className="panel-head"><h2>Разбор агента</h2><span className="aside muted">{explanation ? explanation.mode === 'ai' ? 'AI-анализ' : 'Анализ движка' : explanationError ? 'Ошибка анализа' : 'Подготавливаем анализ'}</span></div>
      {explanation ? <>
        <p className="explanation-text">{explanation.text}</p>
        <div className="contributions"><h3>Вклад мер в Score</h3>{explanation.contributions.map((item) => <div key={item.measure_id}><span>{data.measures.find((m) => m.id === item.measure_id)?.name}</span><b className={item.score_delta < 0 ? 'negative' : 'positive'}>{fmt.signed(item.score_delta)}</b></div>)}</div>
      </> : explanationError ? <div className="notice is-err" role="alert">{explanationError}<button className="text-button" onClick={onRetry}>Повторить анализ</button></div> : <p className="muted">Сравниваем с оптимумом и ищем конкретные улучшения набора…</p>}
    </section>
  </article>
}
