import { useEffect, useRef, useState } from 'react';

/** Tweens a number toward `target` (ease-out cubic). Returns the displayed value. */
export function useAnimatedNumber(target: number | null, durationMs = 550): number | null {
  const [shown, setShown] = useState<number | null>(target);
  const fromRef = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      setShown(null);
      fromRef.current = null;
      return;
    }
    const from = fromRef.current ?? target;
    if (from === target) {
      setShown(target);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      fromRef.current = target;
      setShown(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const v = from + (target - from) * (1 - Math.pow(1 - t, 3));
      fromRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return shown;
}
