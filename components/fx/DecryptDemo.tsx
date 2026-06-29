"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BalanceReveal, type RevealState } from "@/components/registry/BalanceReveal";

const SAMPLES = [
  { value: parseUnits("1204.50", 6), symbol: "cUSDC", handle: "0x9f…a705" },
  { value: parseUnits("87.20", 6), symbol: "cUSDT", handle: "0x3c…1be0" },
  { value: parseUnits("3.4150", 6), symbol: "cWETH", handle: "0x46…3158" },
];

/**
 * Self-playing demonstration of the unlock moment in the hero — same calm
 * language as the real flow: redacted dots → blur-to-sharp + count-up → hold →
 * re-lock. Honours reduced-motion (renders a single revealed state).
 */
export function DecryptDemo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"locked" | "revealed">(reduced ? "revealed" : "locked");
  const [i, setI] = useState(0);
  const sample = SAMPLES[i % SAMPLES.length];

  useEffect(() => {
    if (reduced) return;
    const dwell = phase === "locked" ? 2400 : 3600;
    const t = setTimeout(() => {
      if (phase === "locked") setPhase("revealed");
      else {
        setI((x) => x + 1);
        setPhase("locked");
      }
    }, dwell);
    return () => clearTimeout(t);
  }, [phase, i, reduced]);

  const revealed = phase === "revealed";
  const state: RevealState = revealed ? { kind: "revealed", value: sample.value } : { kind: "locked" };

  return (
    <div className={cn("rounded-card border border-line bg-surface/80 backdrop-blur-sm p-5 w-full select-none", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-mono uppercase tracking-wide text-ink-faint">Confidential balance</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[10px] font-medium tracking-wide transition-colors duration-300",
            revealed ? "border-accent/30 bg-accent-faint text-accentInk" : "border-line bg-raised text-ink-faint",
          )}
        >
          {revealed ? "REVEALED" : "ENCRYPTED"}
        </span>
      </div>

      <div className="mt-4 min-h-[40px]">
        {/* re-key per cycle so the reveal animation replays */}
        <BalanceReveal key={`${i}-${phase}`} state={state} decimals={6} symbol={sample.symbol} showLock />
      </div>

      <div className="mt-4 pt-3 border-t border-line">
        <div className="text-[10px] font-mono uppercase tracking-wide text-ink-ghost">Balance handle</div>
        <div className="mt-1 font-mono text-2xs text-ink-faint truncate">{sample.handle}…0aa36a70500</div>
      </div>
    </div>
  );
}
