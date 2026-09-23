// UI-side gating for the catalog (what can be clicked right now).
// The authoritative check is still POST /api/validate; nothing here computes a score.
import type { Choice, DirCode, GameData, Measure } from '../api/types';
import { DIRECTIONS } from './directions';
import { MAX_PER_DIRECTION, SLOTS } from './constants';

export type Availability =
  | { state: 'selected'; district: string | null }
  | { state: 'available'; overBudgetBy: number }
  | { state: 'blocked'; reason: string };

export function selectionCost(sel: Choice[], data: GameData): number {
  return sel.reduce((sum, c) => sum + (findMeasure(data, c.measure_id)?.cost ?? 0), 0);
}

export function directionCounts(sel: Choice[], data: GameData): Record<DirCode, number> {
  const counts: Record<DirCode, number> = { T: 0, E: 0, S: 0, B: 0, C: 0 };
  for (const c of sel) {
    const m = findMeasure(data, c.measure_id);
    if (m) counts[m.direction] += 1;
  }
  return counts;
}

export function findMeasure(data: GameData, id: string): Measure | undefined {
  return data.measures.find((m) => m.id === id);
}

/** Districts where `m` can go without breaking a same-district incompatibility. */
export function allowedDistricts(m: Measure, sel: Choice[], data: GameData): string[] {
  return data.districts
    .map((d) => d.name)
    .filter(
      (name) =>
        !data.incompatibilities.some((inc) => {
          if (inc.scope !== 'same_district' || !inc.measures.includes(m.id)) return false;
          const other = inc.measures[0] === m.id ? inc.measures[1] : inc.measures[0];
          return sel.some((c) => c.measure_id === other && c.district === name);
        }),
    );
}

export function availability(m: Measure, sel: Choice[], data: GameData): Availability {
  const own = sel.find((c) => c.measure_id === m.id);
  if (own) return { state: 'selected', district: own.district };

  if (sel.length >= SLOTS) return { state: 'blocked', reason: `Все ${SLOTS} ячеек заняты` };

  if (directionCounts(sel, data)[m.direction] >= MAX_PER_DIRECTION) {
    return {
      state: 'blocked',
      reason: `Лимит «${DIRECTIONS[m.direction].name}» ${MAX_PER_DIRECTION}/${MAX_PER_DIRECTION}`,
    };
  }

  const globalConflict = data.incompatibilities.find(
    (inc) =>
      inc.scope === 'global' &&
      inc.measures.includes(m.id) &&
      sel.some((c) => inc.measures.includes(c.measure_id) && c.measure_id !== m.id),
  );
  if (globalConflict) {
    const other = globalConflict.measures.find((id) => id !== m.id);
    return { state: 'blocked', reason: `Не сочетается с ${other}` };
  }

  if (m.type === 'district' && allowedDistricts(m, sel, data).length === 0) {
    return { state: 'blocked', reason: 'Конфликт во всех районах' };
  }

  return { state: 'available', overBudgetBy: Math.max(0, selectionCost(sel, data) + m.cost - data.budget) };
}
