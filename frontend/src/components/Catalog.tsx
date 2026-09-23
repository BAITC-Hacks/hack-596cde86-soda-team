import { useState } from 'react'
import type { Choice, CityData, DirectionCode } from '../types'
import { DIR_ORDER, dirVars } from '../lib/directions'
import { availability } from '../lib/rules'
import { DistrictPicker } from './DistrictPicker'
import { MeasureCard } from './MeasureCard'

export type Filter = 'all' | DirectionCode

interface Props {
  data: CityData
  selection: Choice[]
  filter: Filter
  onFilter: (filter: Filter) => void
  openInfo: string | null
  onOpenInfo: (id: string | null) => void
  onAdd: (choice: Choice) => void
  onRemove: (id: string) => void
}

export function Catalog({ data, selection, filter, onFilter, openInfo, onOpenInfo, onAdd, onRemove }: Props) {
  const [pendingDistrictMeasure, setPendingDistrictMeasure] = useState<string | null>(null)
  const pendingMeasure = data.measures.find((measure) => measure.id === pendingDistrictMeasure)
  const list = data.measures.filter((m) => filter === 'all' || m.direction === filter)
  const tabs = [
    { key: 'all' as const, label: 'Все', count: data.measures.length },
    ...DIR_ORDER.map((d) => ({ key: d, label: data.directions[d], count: data.measures.filter((m) => m.direction === d).length })),
  ]
  return <section className="catalog" aria-label="Каталог мероприятий">
    <div className="tabs" role="group" aria-label="Фильтр по направлению">
      {tabs.map((tab) => <button key={tab.key} className="tab" aria-pressed={filter === tab.key} onClick={() => onFilter(tab.key)} style={tab.key === 'all' ? undefined : dirVars(tab.key)}>
        {tab.key !== 'all' && <span className="dot" />}{tab.label}<span className="mono">{tab.count}</span>
      </button>)}
    </div>
    <p className="catalog-hint">Выберите {data.rules.required_choices} мер. Район для меры выбирается сразу; позже его можно изменить в наборе. <b>i</b> — детали.</p>
    <div className="catalog-grid">
      {list.map((measure, index) => {
        const avail = availability(measure, selection, data)
        return <MeasureCard key={measure.id} measure={measure} avail={avail} directionName={data.directions[measure.direction]}
          open={openInfo === measure.id} popUp={index >= 6} onToggleInfo={() => onOpenInfo(openInfo === measure.id ? null : measure.id)} onClose={() => onOpenInfo(null)}
          onPick={() => {
            if (avail.state === 'selected') onRemove(measure.id)
            if (avail.state === 'available') {
              if (measure.scope === 'district') {
                onOpenInfo(null)
                setPendingDistrictMeasure(measure.id)
              } else {
                onAdd({ measure_id: measure.id, district: null })
              }
            }
          }} />
      })}
    </div>
    {pendingMeasure && <DistrictPicker measure={pendingMeasure} data={data} selection={selection}
      onChoose={(district) => { onAdd({ measure_id: pendingMeasure.id, district }); setPendingDistrictMeasure(null) }}
      onClose={() => setPendingDistrictMeasure(null)} />}
  </section>
}
