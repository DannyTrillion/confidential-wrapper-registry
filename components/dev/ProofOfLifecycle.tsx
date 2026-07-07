import { PROOF_STEPS, PROOF_CHAIN_ID } from "@/lib/proof";
import { getNetwork } from "@/lib/networks";
import { cn } from "@/lib/cn";

/**
 * Receipts table: every lifecycle step this app performs, with the exact
 * contract call and a clickable Sepolia transaction hash. States are honest:
 * verified (hash), off-chain (no tx by design), or receipt pending.
 */
export function ProofOfLifecycle() {
  const net = getNetwork(PROOF_CHAIN_ID)!;

  return (
    <div className="rounded-card border border-line bg-surface overflow-hidden">
      {PROOF_STEPS.map((s, i) => (
        <div
          key={s.key}
          className={cn(
            "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3",
            i > 0 && "border-t border-elevate/[0.05]",
          )}
        >
          <span className="grid place-items-center h-5 w-5 rounded-pill border border-line bg-elevate/[0.04] font-mono text-[10px] text-ink-muted shrink-0">
            {i + 1}
          </span>
          <div className="min-w-0 sm:w-72">
            <div className="text-13 font-medium text-ink">{s.title}</div>
            <div className="font-mono text-2xs text-ink-ghost truncate">{s.call}</div>
          </div>

          <div className="sm:ml-auto flex items-center gap-2 min-w-0">
            {s.txHash === null ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-pill border border-cipher/25 bg-cipher-faint px-2 py-0.5 text-[10px] font-medium tracking-wide text-cipher"
                title={s.note}
              >
                OFF-CHAIN BY DESIGN
              </span>
            ) : s.txHash === "" ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-raised px-2 py-0.5 text-[10px] font-medium tracking-wide text-ink-faint">
                RECEIPT PENDING
              </span>
            ) : (
              <>
                <a
                  href={`${net.explorerUrl}/tx/${s.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-2xs text-ink-muted hover:text-ink transition-colors truncate max-w-[180px]"
                >
                  {s.txHash.slice(0, 10)}…{s.txHash.slice(-6)} ↗
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accentInk">
                  <span className="h-1.5 w-1.5 rounded-pill bg-accent" aria-hidden="true" />
                  VERIFIED
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
