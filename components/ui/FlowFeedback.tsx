"use client";

import type { FlowState } from "@/lib/useActionFlow";
import { Spinner } from "./Button";
import { Collapsible } from "./Collapsible";
import { explorerTxUrl } from "@/lib/networks";
import { cn } from "@/lib/cn";

/**
 * Renders the current state of an action flow inline. Pending shows the live
 * step text; error shows a human message + raw collapsible; success is quiet
 * confirmation. Never shifts layout — it reserves its own block.
 */
export function FlowFeedback({
  state,
  chainId,
  txHash,
  className,
}: {
  state: FlowState;
  chainId?: number;
  txHash?: string;
  className?: string;
}) {
  if (state.status === "idle") return null;

  return (
    <div className={cn("space-y-2", className)} role="status" aria-live="polite">
      {state.status === "pending" && (
        <div className="flex items-center gap-2.5 rounded-input border border-warn/20 bg-warn/5 px-3 py-2.5">
          <Spinner className="text-warn h-4 w-4" />
          <span className="text-13 text-ink">{state.step ?? "Working…"}</span>
        </div>
      )}

      {state.status === "success" && (
        <div className="flex items-start gap-2.5 rounded-input border border-ok/20 bg-ok/5 px-3 py-2.5">
          <svg viewBox="0 0 16 16" className="h-4 w-4 mt-0.5 text-ok shrink-0" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m5 8 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="min-w-0">
            <div className="text-13 text-ink">{state.message}</div>
            {txHash && chainId && (
              <a
                href={explorerTxUrl(chainId, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xs font-mono text-ink-faint hover:text-accent transition-colors"
              >
                {txHash.slice(0, 10)}…{txHash.slice(-8)} ↗
              </a>
            )}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 rounded-input border border-danger/20 bg-danger/5 px-3 py-2.5">
            <svg viewBox="0 0 16 16" className="h-4 w-4 mt-0.5 text-danger shrink-0" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <div className="text-13 text-ink">{state.message}</div>
          </div>
          {state.raw && <Collapsible summary="Show raw error">{state.raw}</Collapsible>}
        </div>
      )}
    </div>
  );
}
