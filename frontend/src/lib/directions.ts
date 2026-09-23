import type { CSSProperties } from 'react';
import type { DirectionCode as DirCode } from '../types';

interface DirMeta {
  name: string;
  short: string;
  color: string; // edge, border, text on light
  tint: string; // light background
  hud: string; // on dark surfaces
}

export const DIR_ORDER: DirCode[] = ['T', 'E', 'S', 'B', 'C'];

export const DIRECTIONS: Record<DirCode, DirMeta> = {
  T: { name: 'Транспорт', short: 'Тр', color: '#1F4E79', tint: '#E3ECF5', hud: '#8DB7D4' },
  E: { name: 'Экология', short: 'Эк', color: '#2E6B3A', tint: '#E3F0E4', hud: '#9CC49A' },
  S: { name: 'Соцсфера', short: 'Со', color: '#8F4A17', tint: '#F6E8DC', hud: '#E5A877' },
  B: { name: 'Безопасность', short: 'Бз', color: '#7A2E4E', tint: '#F3E2EA', hud: '#D99AB5' },
  C: { name: 'Сервисы', short: 'Св', color: '#1E6664', tint: '#DDEFEE', hud: '#7CC3C0' },
};

/** Exposes a direction's colors as CSS variables (--dir, --dir-tint, --dir-hud). */
export function dirVars(code: DirCode): CSSProperties {
  const d = DIRECTIONS[code];
  return { '--dir': d.color, '--dir-tint': d.tint, '--dir-hud': d.hud } as CSSProperties;
}
