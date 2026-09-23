// Frontend view of the API contracts. Field names follow backend/engine/models.py
// (snake_case, Pydantic v2). If a model there changes, update only this file.

export type DirCode = 'T' | 'E' | 'S' | 'B' | 'C';
export type MeasureType = 'district' | 'city';

export interface Indicator {
  code: string; // T1 … C2
  direction: DirCode;
  name: string;
  weight: number;
}

export interface District {
  name: string;
  population_share: number;
  indicators: Record<string, number>;
}

export interface Measure {
  id: string;
  direction: DirCode;
  name: string;
  type: MeasureType;
  cost: number;
  lag: number;
  effects: Record<string, number>;
}

export interface Synergy {
  measures: [string, string];
  indicator: string;
  bonus: number;
}

export interface Incompatibility {
  measures: [string, string];
  scope: 'global' | 'same_district';
}

export interface GameData {
  budget: number;
  horizon: number;
  districts: District[];
  indicators: Indicator[];
  measures: Measure[];
  synergies: Synergy[];
  incompatibilities: Incompatibility[];
}

export interface Choice {
  measure_id: string;
  district: string | null;
}

export interface ValidationError {
  rule: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

export interface DistrictResult {
  name: string;
  before: Record<string, number>;
  after: Record<string, number>;
  d_before: number;
  d_after: number;
}

export interface SimulationResult {
  score: number;
  base_score: number;
  d_avg: number;
  d_min: number;
  n_crit: number;
  districts: DistrictResult[];
}

/** Engine delta for adding one measure to the current set in one district. */
export interface Candidate {
  measure_id: string;
  district: string | null;
  delta: number;
}

/**
 * POST /api/preview — the same simulation without the "exactly 5 / budget" rules,
 * plus per-measure deltas. Needed for the live HUD; see README-frontend.md.
 */
export interface PreviewResult extends SimulationResult {
  contributions: Record<string, number>;
  candidates: Candidate[];
}

export interface RankedSelection {
  score: number;
  cost: number;
  selection: Choice[];
}

export interface ExplainResult {
  text: string;
  source: 'llm' | 'fallback';
}
