import type { Choice, CityData, DirectionCode, Measure } from '../types'

export type Availability =
  | { state: 'selected'; district: string | null }
  | { state: 'available' }
  | { state: 'blocked'; reason: string }

export function selectionCost(selection: Choice[], data: CityData): number {
  return selection.reduce((sum, c) => sum + (findMeasure(data, c.measure_id)?.cost ?? 0), 0)
}

export function directionCounts(selection: Choice[], data: CityData): Record<DirectionCode, number> {
  const counts: Record<DirectionCode, number> = { T: 0, E: 0, S: 0, B: 0, C: 0 }
  for (const choice of selection) {
    const measure = findMeasure(data, choice.measure_id)
    if (measure) counts[measure.direction] += 1
  }
  return counts
}

export function findMeasure(data: CityData, id: string): Measure | undefined {
  return data.measures.find((measure) => measure.id === id)
}

export function allowedDistricts(measure: Measure, selection: Choice[], data: CityData): string[] {
  return data.districts.filter((district) => !data.incompatibilities.some((conflict) => {
    if (conflict.scope !== 'same_district') return false
    const other = conflict.first === measure.id ? conflict.second : conflict.second === measure.id ? conflict.first : null
    return other !== null && selection.some((choice) => choice.measure_id === other && choice.district === district.id)
  })).map((district) => district.id)
}

export function availability(measure: Measure, selection: Choice[], data: CityData): Availability {
  const own = selection.find((choice) => choice.measure_id === measure.id)
  if (own) return { state: 'selected', district: data.districts.find((d) => d.id === own.district)?.name ?? null }
  if (selection.length >= data.rules.required_choices) return { state: 'blocked', reason: 'Все ячейки заняты' }
  if (selectionCost(selection, data) + measure.cost > data.budget) return { state: 'blocked', reason: 'Не хватает бюджета' }
  if (directionCounts(selection, data)[measure.direction] >= data.rules.max_per_direction) {
    return { state: 'blocked', reason: `Лимит направления: ${data.rules.max_per_direction}` }
  }
  const conflict = data.incompatibilities.find((item) => item.scope === 'city' &&
    ((item.first === measure.id && selection.some((c) => c.measure_id === item.second)) ||
      (item.second === measure.id && selection.some((c) => c.measure_id === item.first))))
  if (conflict) return { state: 'blocked', reason: `Не сочетается с ${conflict.first === measure.id ? conflict.second : conflict.first}` }
  if (measure.scope === 'district' && allowedDistricts(measure, selection, data).length === 0) {
    return { state: 'blocked', reason: 'Конфликт во всех районах' }
  }
  return { state: 'available' }
}
