"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Counts up to `value` with an ease-out curve. Tabular by default so the width
 * never jumps. Used for the registry stat band.
 */
export function AnimatedNumber({ value, durationMs = 650 }: { value: number; durationMs?: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let start: number | undefined;

    const step = (t: number) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs, reduced]);

  return <span className="tabular-nums">{display.toLocaleString("en-US")}</span>;
}
