export type IndicatorCode = 'T1' | 'T2' | 'E1' | 'E2' | 'S1' | 'S2' | 'B1' | 'B2' | 'C1' | 'C2'
export type DirectionCode = 'T' | 'E' | 'S' | 'B' | 'C'

export interface Choice {
  measure_id: string
  district: string | null
}

export interface Measure {
  id: string
  direction: DirectionCode
  name: string
  scope: 'city' | 'district'
  cost: number
  lag: number
  effects: Partial<Record<IndicatorCode, number>>
}

export interface District {
  id: string
  name: string
  population_share: number
  profile: string
  indicators: Record<IndicatorCode, number>
}

export interface DistrictOutcome {
  id: string
  name: string
  population_share: number
  before: Record<IndicatorCode, number>
  after: Record<IndicatorCode, number>
  delta: Record<IndicatorCode, number>
  score_before: number
  score_after: number
}

export interface SimulationResult {
  selection: Choice[]
  total_cost: number
  remaining_budget: number
  horizon_quarters: number
  districts: DistrictOutcome[]
  city_average: number
  weakest_district: string
  critical_count: number
  critical: Array<{ district_id: string; indicator: IndicatorCode; value: number }>
  synergies: string[]
  score: number
  base_score: number
  score_delta: number
}

export interface CityData {
  budget: number
  horizon_quarters: number
  rules: { required_choices: number; max_per_direction: number; critical_threshold: number }
  example_selection: Choice[]
  weights: Record<IndicatorCode, number>
  indicators: Record<IndicatorCode, string>
  directions: Record<DirectionCode, string>
  districts: District[]
  measures: Measure[]
  baseline: SimulationResult
}

export interface ValidationResult {
  ok: boolean
  errors: Array<{ rule: string; message: string }>
  total_cost: number
  remaining_budget: number
}

export interface Explanation {
  mode: 'ai' | 'fallback'
  text: string
  score: number
  best_score: number
  gap_to_best: number
  contributions: Array<{ measure_id: string; district: string | null; score_delta: number }>
  suggestions: Array<{
    from_choice: Choice
    to_choice: Choice
    new_score: number
    gain: number
  }>
}
