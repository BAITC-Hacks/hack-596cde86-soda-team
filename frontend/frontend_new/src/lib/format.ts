const MINUS = '−';

export function signed(x: number, digits = 2): string {
  return (x >= 0 ? '+' : MINUS) + Math.abs(x).toFixed(digits);
}

export function score(x: number): string {
  return x.toFixed(2);
}

/** Indicator value: integer when whole, otherwise one decimal. */
export function value(x: number): string {
  return Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1);
}

export function effect(code: string, v: number): string {
  return `${code} ${v >= 0 ? '+' : MINUS}${Math.abs(v)}`;
}

/** Share of the full effect realised within the horizon, per the lag rule. */
export function lagShare(lag: number, horizon: number): string {
  return `${Math.round(((horizon - lag) / horizon) * 100)}%`;
}

export function cells(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'ячейку';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'ячейки';
  return 'ячеек';
}
