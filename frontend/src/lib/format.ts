const MINUS = '−';

export function signed(x: number, digits = 2): string {
  return (x >= 0 ? '+' : MINUS) + Math.abs(x).toFixed(digits);
}

export function score(x: number): string {
  return x.toFixed(2);
}

export function effect(code: string, v: number): string {
  return `${code} ${v >= 0 ? '+' : MINUS}${Math.abs(v)}`;
}
