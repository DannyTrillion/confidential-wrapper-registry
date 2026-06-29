"use client";

import { TokenIcon } from "./TokenIcon";
import { cn } from "@/lib/cn";
import type { EnrichedPair } from "@/lib/registry/types";

/**
 * Visualizes the ERC-20 ↔ ERC-7984 link as a living wire. Idle, it carries a
 * faint slow pulse (the pair is always "connected"); during wrap/unwrap it
 * energizes and the pulse flows directionally — forward for wrap (public →
 * confidential), reverse for unwrap.
 */
export function PairFlow({
  pair,
  active = false,
  direction = "forward",
}: {
  pair: EnrichedPair;
  active?: boolean;
  direction?: "forward" | "reverse";
}) {
  return (
    <div className="rounded-card border border-line glass-soft px-4 py-4">
      <div className="flex items-center gap-3">
        <Node label={pair.underlying.symbol ?? "ERC-20"} sub="public" />
        <div className="flex-1 relative">
          <div className="wire-track h-px w-full">
            {/* The wire is a static link at rest; it only flows while an action
                is in progress — motion that communicates, not decorates. */}
            {active && <span className="wire-pulse" data-active="true" data-dir={direction === "reverse" ? "reverse" : "forward"} />}
          </div>
          <span
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-2 text-2xs uppercase tracking-wide transition-colors duration-200",
              active ? "text-accentInk" : "text-ink-ghost",
            )}
          >
            {direction === "reverse" ? "unwrap" : "wrap"}
          </span>
        </div>
        <Node label={pair.wrapper.symbol ?? "cToken"} sub="encrypted" confidential />
      </div>
    </div>
  );
}

function Node({
  label,
  sub,
  confidential,
}: {
  label: string;
  sub: string;
  confidential?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-20 shrink-0">
      <TokenIcon symbol={label} confidential={confidential} size={36} />
      <div className="text-center leading-tight">
        <div className={cn("font-mono text-2xs truncate max-w-20", confidential ? "text-accentInk" : "text-ink-muted")}>
          {label}
        </div>
        <div className="text-[10px] text-ink-ghost">{sub}</div>
      </div>
    </div>
  );
}
