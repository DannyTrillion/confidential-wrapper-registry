"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { explorerTxUrl } from "@/lib/networks";
import { haptics } from "@/lib/haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { Button } from "./Button";

export interface TxResult {
  status: "success" | "error";
  title: string;
  message?: string;
  txHash?: string;
  chainId?: number;
  /** Raw error string, shown in a collapsible on failure. */
  raw?: string | null;
}

interface TxResultApi {
  show: (r: TxResult) => void;
  dismiss: () => void;
}

const Ctx = createContext<TxResultApi | null>(null);

export function useTxResult(): TxResultApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTxResult must be used within TxResultProvider");
  return ctx;
}

const SUCCESS_TTL = 4200;

/**
 * A single center-screen result popup. Success lands with a ring-burst + confetti
 * + drawn check and auto-dismisses; failure shakes once with a drawn cross and
 * waits for the user. Reduced-motion collapses both to a static reveal.
 */
export function TxResultProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<TxResult | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const dismiss = useCallback(() => {
    clearTimer();
    setResult(null);
  }, []);

  const show = useCallback((r: TxResult) => {
    clearTimer();
    setResult(r);
    if (r.status === "success") {
      haptics.success();
      timer.current = setTimeout(() => setResult(null), SUCCESS_TTL);
    } else {
      haptics.error();
    }
  }, []);

  useEffect(() => () => clearTimer(), []);

  return (
    <Ctx.Provider value={{ show, dismiss }}>
      {children}
      <TxResultOverlay result={result} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

// Twelve particles fanned around the icon — fixed directions so the burst is
// deterministic (no Math.random, stays identical across renders/SSR).
const CONFETTI = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = 52 + (i % 3) * 16;
  // Success is a STATUS moment — green and white only, no identity yellow.
  const colors = ["#FFD208", "#FFFFFF"];
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
    color: colors[i % colors.length],
    delay: `${(i % 4) * 22}ms`,
    size: i % 2 === 0 ? 6 : 4,
  };
});

function TxResultOverlay({
  result,
  onDismiss,
}: {
  result: TxResult | null;
  onDismiss: () => void;
}) {
  const reduced = useReducedMotion();
  const [showRaw, setShowRaw] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(!!result, cardRef);

  // Close on Escape whenever a popup is open.
  useEffect(() => {
    if (!result) return;
    setShowRaw(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, onDismiss]);

  if (!result) return null;
  const success = result.status === "success";

  return (
    <div
      className="fixed inset-0 z-[85] grid place-items-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={success ? "Transaction succeeded" : "Transaction failed"}
    >
      {/* Scrim — dim + blur, click to dismiss. */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className={cn(
          "absolute inset-0 bg-black/55 backdrop-blur-[3px]",
          !reduced && "animate-fade-in",
        )}
      />

      <div
        ref={cardRef}
        tabIndex={-1}
        className={cn(
          "relative w-[min(92vw,400px)] rounded-card border bg-surface/95 backdrop-blur-2xl px-6 pt-7 pb-6 text-center shadow-2xl outline-none",
          success ? "border-ok/25" : "border-danger/25",
          !reduced && (success ? "animate-pop-in" : "animate-shake"),
        )}
      >
        {/* Icon medallion */}
        <div className="relative mx-auto h-16 w-16">
          {success && !reduced && (
            <>
              <span className="absolute inset-0 rounded-pill border-2 border-ok/45 animate-ring-burst" />
              <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
                {CONFETTI.map((p, i) => (
                  <span
                    key={i}
                    className="absolute rounded-pill"
                    style={{
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      animation: "confetti-fly 720ms ease-out forwards",
                      animationDelay: p.delay,
                      // CSS custom props for the fly-out vector.
                      ["--tx" as string]: `${p.tx}px`,
                      ["--ty" as string]: `${p.ty}px`,
                    }}
                  />
                ))}
              </div>
            </>
          )}
          <span
            className={cn(
              "relative grid h-16 w-16 place-items-center rounded-pill border",
              success
                ? "border-ok/30 bg-ok/10 text-ok"
                : "border-danger/30 bg-danger/10 text-danger",
            )}
          >
            {success ? (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
                <path
                  d="m6 12.5 3.5 3.5L18 7.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={reduced ? undefined : "animate-draw-check"}
                  style={reduced ? undefined : { strokeDasharray: 24 }}
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
                <path
                  d="M8 8l8 8M16 8l-8 8"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
        </div>

        <h3 className="mt-4 text-base font-semibold text-ink tracking-tight">
          {result.title}
        </h3>
        {result.message && (
          <p className="mt-1.5 text-13 text-ink-muted leading-relaxed">{result.message}</p>
        )}

        {success && result.txHash && result.chainId && (
          <a
            href={explorerTxUrl(result.chainId, result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1 text-2xs font-mono text-ink-faint hover:text-ink transition-colors"
          >
            {result.txHash.slice(0, 10)}…{result.txHash.slice(-8)} ↗
          </a>
        )}

        {!success && result.raw && (
          <div className="mt-3 text-left">
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-2xs text-ink-faint hover:text-ink-muted transition-colors"
            >
              {showRaw ? "Hide" : "Show"} technical details
            </button>
            {showRaw && (
              <pre className="mt-1.5 max-h-32 overflow-auto rounded-input border border-line bg-base/60 p-2.5 text-[11px] leading-snug text-ink-faint font-mono whitespace-pre-wrap break-words">
                {result.raw}
              </pre>
            )}
          </div>
        )}

        <div className="mt-5">
          <Button
            variant={success ? "primary" : "secondary"}
            onClick={onDismiss}
            className="w-full"
          >
            {success ? "Done" : "Dismiss"}
          </Button>
        </div>

        {success && !reduced && (
          <span
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-b-card bg-ok/40"
            style={{ animation: `timer-bar ${SUCCESS_TTL}ms linear forwards` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
