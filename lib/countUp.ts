/**
 * Animate a numeric string up to `exact` (a plain, comma-free decimal so it
 * stays parseable as an input value). Returns a cancel fn. Reduced-motion or
 * tiny values resolve instantly.
 */
export function startCountUp(opts: {
  to: number;
  maxFrac: number;
  exact: string;
  durationMs?: number;
  reduced?: boolean;
  onTick: (s: string) => void;
}): () => void {
  const { to, maxFrac, exact, durationMs = 450, reduced, onTick } = opts;
  if (reduced || to <= 0 || !Number.isFinite(to)) {
    onTick(exact);
    return () => {};
  }
  let raf = 0;
  let start: number | undefined;
  const step = (t: number) => {
    if (start === undefined) start = t;
    const p = Math.min(1, (t - start) / durationMs);
    const eased = 1 - Math.pow(1 - p, 3);
    if (p < 1) {
      onTick((to * eased).toLocaleString("en-US", { maximumFractionDigits: maxFrac, useGrouping: false }));
      raf = requestAnimationFrame(step);
    } else {
      onTick(exact); // exact, parseable final value
    }
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
