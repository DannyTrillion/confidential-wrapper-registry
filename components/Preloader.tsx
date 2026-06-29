"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BrandGlyph } from "@/components/layout/BrandGlyph";

/**
 * A brief, calm splash shown on every load — the brand mark, a soothing line,
 * and a thin indeterminate sweep — that fades out as the app settles in. Pure
 * presentation: it never blocks the app underneath (auto-dismisses), and
 * reduced-motion collapses it to a near-instant fade.
 */
export function Preloader() {
  const reduced = useReducedMotion();
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const hold = reduced ? 200 : 1000;
    const t1 = setTimeout(() => setFading(true), hold);
    const t2 = setTimeout(() => setGone(true), hold + 360);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);

  if (gone) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] grid place-items-center bg-base transition-opacity duration-300",
        fading && "opacity-0 pointer-events-none",
      )}
      aria-hidden={fading}
      role="status"
    >
      <div className="text-center px-6">
        <span className="relative inline-grid place-items-center h-16 w-16 rounded-2xl bg-accent">
          {!reduced && (
            <span className="pointer-events-none absolute -inset-2 rounded-3xl bg-accent/25 blur-lg animate-breathe" aria-hidden="true" />
          )}
          <BrandGlyph className="relative h-8 w-8 text-[#0a0a0a]" />
        </span>

        <h1 className="mt-5 text-sm font-semibold text-ink tracking-tight">Confidential Wrapper Registry</h1>
        <p className="mt-1.5 text-13 text-ink-faint">Your balances, kept confidential.</p>

        <div className="relative mt-5 mx-auto h-0.5 w-32 overflow-hidden rounded-pill bg-line">
          <span
            className="absolute inset-y-0 left-0 w-1/2 -translate-x-full rounded-pill bg-gradient-to-r from-transparent via-accent to-transparent"
            style={reduced ? undefined : { animation: "btn-sweep 1.1s ease-in-out infinite" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
