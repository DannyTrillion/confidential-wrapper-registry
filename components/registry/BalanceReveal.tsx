"use client";

import { cn } from "@/lib/cn";
import { AnimatedAmount } from "@/components/fx/AnimatedAmount";

type RevealState =
  | { kind: "locked" }
  | { kind: "decrypting" }
  | { kind: "revealed"; value: bigint }
  | { kind: "empty" };

/**
 * The signature interaction. Encrypted → redacted dots with a faint shimmer
 * (accent-tinted + working while decrypting). Revealed → the value resolves
 * blurry-to-sharp while counting up, then a single soft glow, then it goes
 * fully still. Reduced-motion shows the final value instantly (globals.css).
 */
export function BalanceReveal({
  state,
  decimals,
  symbol,
  showLock = false,
}: {
  state: RevealState;
  decimals: number;
  symbol?: string;
  showLock?: boolean;
}) {
  if (state.kind === "empty") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl text-ink-faint tabular-nums">—</span>
        <span className="text-13 text-ink-faint">No balance yet</span>
      </div>
    );
  }

  if (state.kind === "revealed") {
    return (
      <div className="flex items-center gap-2.5">
        {showLock && <LockIcon open />}
        <div className="flex items-baseline gap-2">
          {/* blur-to-sharp + one soft glow + settle, in a single animation; the
              digits count up underneath, then go fully still. */}
          <span className="font-mono text-2xl tabular-nums text-ink animate-decrypt-reveal">
            <AnimatedAmount value={state.value} decimals={decimals} />
          </span>
          {symbol && <span className="font-mono text-13 text-ink-muted">{symbol}</span>}
        </div>
      </div>
    );
  }

  // locked or decrypting → redacted dots with a faint shimmer
  const working = state.kind === "decrypting";
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      {showLock && <LockIcon open={false} />}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "ciphertext font-mono text-2xl tracking-[0.18em] select-none transition-opacity duration-200",
            working ? "opacity-100" : "opacity-70",
          )}
          style={working ? { animationDuration: "1.4s" } : undefined}
        >
          ••••••
        </span>
        {symbol && <span className="font-mono text-13 text-ink-ghost">{symbol}</span>}
      </div>
    </div>
  );
}

/** Lock that morphs closed → open. The shackle pivots; crossfades, no snap. */
function LockIcon({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "grid place-items-center h-6 w-6 rounded-input border shrink-0 transition-colors duration-300",
        open ? "border-accent/30 bg-accent-faint text-accentInk" : "border-line bg-raised text-ink-faint",
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <rect x="3.5" y="7" width="9" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
        {/* shackle: rotates open around its right leg */}
        <path
          d="M5.5 7V5.4a2.5 2.5 0 0 1 5 0V7"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          className="origin-[10.5px_5.4px] transition-transform duration-300 ease-out"
          style={{ transform: open ? "rotate(-32deg)" : "rotate(0deg)" }}
        />
      </svg>
    </span>
  );
}

export type { RevealState };
