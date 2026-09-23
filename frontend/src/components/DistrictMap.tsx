import type { CityData, IndicatorCode, SimulationResult } from '../types'
import * as fmt from '../lib/format'
import { WarnIcon } from './Icons'

export function DistrictMap({ data, result }: { data: CityData; result: SimulationResult }) {
  const codes = Object.keys(data.indicators) as IndicatorCode[]
  return <section className="panel district-panel" aria-label="Показатели районов">
    <div className="panel-head"><h2>Районы · показатели</h2><span className="aside muted">Итог и изменение · 0–100, больше — лучше</span></div>
    <div className="matrix-scroll" tabIndex={0} role="region" aria-label="Таблица показателей районов">
      <table className="dmap-table">
        <thead><tr><th scope="col">Район</th>{codes.map((code) => <th scope="col" key={code} title={data.indicators[code]}>{code}<small>{data.indicators[code]}</small></th>)}<th scope="col">Оценка</th></tr></thead>
        <tbody>{result.districts.map((district) => <tr key={district.id}>
          <th scope="row">{district.name}</th>
          {codes.map((code) => {
            const value = district.after[code]
            const alpha = 0.08 + 0.72 * Math.max(0, Math.min(1, (value - 35) / 45))
            const channels = [11, 92, 140].map((channel) => {
              const composite = (channel * alpha + 255 * (1 - alpha)) / 255
              return composite <= 0.04045 ? composite / 12.92 : ((composite + 0.055) / 1.055) ** 2.4
            })
            const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
            return <td key={code} title={`${data.indicators[code]}: было ${fmt.score(district.before[code])}, стало ${fmt.score(value)}`}>
              <span className={`cell${value < data.rules.critical_threshold ? ' is-crit' : ''}`} style={{ background: `rgba(11, 92, 140, ${alpha})`, color: luminance > 0.179 ? '#000' : '#fff' }}>{fmt.score(value)}</span>
              <small className={district.delta[code] < 0 ? 'negative' : district.delta[code] > 0 ? 'positive' : 'muted'}>{district.delta[code] ? fmt.signed(district.delta[code]) : '—'}</small>
            </td>
          })}
          <td className={`dmap-d${district.id === result.weakest_district ? ' is-min' : ''}`}>{fmt.score(district.score_after)}<small>было {fmt.score(district.score_before)}</small></td>
        </tr>)}</tbody>
      </table>
    </div>
    {result.critical.length > 0 ? <div className="notice is-crit">
      <strong><WarnIcon /> Критические показатели ниже {data.rules.critical_threshold}</strong>
      {result.critical.map((item) => <span key={`${item.district_id}-${item.indicator}`}>
        <b>{data.districts.find((district) => district.id === item.district_id)?.name}</b> · {data.indicators[item.indicator]} — <span className="mono">{fmt.score(item.value)}</span>
      </span>)}
    </div> : <div className="notice is-ok">Критических показателей нет.</div>}
  </section>
}
