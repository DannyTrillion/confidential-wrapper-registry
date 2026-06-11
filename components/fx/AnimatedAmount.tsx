"use client";

import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { formatAmount } from "@/lib/format";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Counts a token amount up to its value with an ease-out curve, then snaps to
 * the exact formatted figure (so float drift never shows). Tabular by default.
 * Reduced-motion renders the final value instantly.
 */
export function AnimatedAmount({
  value,
  decimals,
  durationMs = 620,
  className,
}: {
  value: bigint;
  decimals: number;
  durationMs?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const exact = formatAmount(value, decimals);
  const [display, setDisplay] = useState(exact);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setDisplay(exact);
      return;
    }
    const target = Number(formatUnits(value, decimals));
    const maxFrac = Math.min(decimals, 6);
    let start: number | undefined;

    const step = (t: number) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      if (p < 1) {
        setDisplay((target * eased).toLocaleString("en-US", { maximumFractionDigits: maxFrac }));
        raf.current = requestAnimationFrame(step);
      } else {
        setDisplay(exact); // exact final figure
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, durationMs, reduced]);

  return <span className={className}>{display}</span>;
}
