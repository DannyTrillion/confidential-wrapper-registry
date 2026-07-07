import { cn } from "@/lib/cn";
import { BalanceReveal, type RevealState } from "@/components/registry/BalanceReveal";

// Illustrative only — shown before a wallet is connected. Symbol + handle hint
// at the shape of a real confidential balance; the amount is never filled in.
const SAMPLE = { symbol: "cUSDC", handle: "0x9f…a705" };

/**
 * Pre-connect preview of the confidential-balance card. It stays in the
 * encrypted/hidden treatment (masked dots, ENCRYPTED badge) and never shows a
 * concrete figure — nothing on screen should pretend to be a real, revealed
 * balance until a wallet is connected and the user has actually revealed it.
 * Once connected, the live Portfolio dashboard takes over.
 */
export function DecryptDemo({ className }: { className?: string }) {
  const state: RevealState = { kind: "locked" };

  return (
    <div className={cn("rounded-input border border-line bg-well p-4 w-full select-none", className)} aria-hidden="true">
      {/* The instrument frame already titles this card — the well stays bare. */}
      <div className="min-h-[40px]">
        <BalanceReveal state={state} decimals={6} symbol={SAMPLE.symbol} showLock />
      </div>

      <div className="mt-4 pt-3 border-t border-line">
        <div className="text-[10px] font-mono uppercase tracking-wide text-ink-ghost">Balance handle</div>
        <div className="mt-1 font-mono text-2xs text-ink-faint truncate">{SAMPLE.handle}…0aa36a70500</div>
      </div>
    </div>
  );
}
