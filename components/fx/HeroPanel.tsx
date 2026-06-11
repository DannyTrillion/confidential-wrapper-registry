"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { getNetwork } from "@/lib/networks";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { useMyBalances } from "@/lib/fhevm/useMyBalances";
import { useUnderlyingBalances } from "@/lib/fhevm/useUnderlyingBalances";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DecryptDemo } from "./DecryptDemo";
import { BalanceReveal } from "@/components/registry/BalanceReveal";
import { TokenIdentity } from "@/components/registry/TokenIdentity";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * The hero's live segment. Disconnected → the looping reveal animation with a
 * connect nudge. Connected → the user's REAL holdings (shown confidential, i.e.
 * hidden) with a smart primary action that adapts to their state: reveal their
 * confidential balances, wrap tokens they hold, claim test tokens, or browse.
 */
export function HeroPanel({ className }: { className?: string }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;

  const { data: pairs } = useRegistryPairs(chainId);
  const { data: holdings, isLoading: holdingsLoading } = useMyBalances(chainId, address, pairs ?? []);
  const confidentialCount = holdings?.length ?? 0;
  const noConfidential = isConnected && !holdingsLoading && confidentialCount === 0;
  const { data: underlying } = useUnderlyingBalances(chainId, address, pairs ?? [], noConfidential);

  const shown = useMemo(() => (holdings ?? []).slice(0, 3), [holdings]);

  // ---- Disconnected: animation + connect hint --------------------------------
  if (!isConnected) {
    return (
      <div className={className}>
        <DecryptDemo />
        <button
          onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          className="group mt-3 w-full flex items-center justify-center gap-1.5 text-2xs text-ink-faint hover:text-accent transition-colors"
        >
          Connect your wallet to see your balances
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    );
  }

  // ---- Connected, still loading ---------------------------------------------
  if (holdingsLoading || !pairs) {
    return (
      <Frame className={className} badge="ENCRYPTED" title="Your confidential balances">
        <div className="space-y-3 pt-1">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-9 w-full" />
        </div>
      </Frame>
    );
  }

  // ---- Has confidential balances → Reveal -----------------------------------
  if (confidentialCount > 0) {
    const more = confidentialCount - shown.length;
    return (
      <Frame className={className} badge="ENCRYPTED" title="Your confidential balances">
        <ul className="space-y-2.5">
          {shown.map((h) => (
            <li key={h.pair.index} className="flex items-center justify-between gap-3">
              <TokenIdentity meta={h.pair.wrapper} address={h.pair.confidentialToken} confidential />
              <BalanceReveal state={{ kind: "locked" }} decimals={h.pair.wrapper.decimals ?? 6} symbol={h.pair.wrapper.symbol} />
            </li>
          ))}
        </ul>
        {more > 0 && <p className="mt-2 text-2xs text-ink-faint">+{more} more</p>}
        <RevealCta
          onClick={() => router.push("/balances")}
          label={`Reveal ${confidentialCount === 1 ? "balance" : "all balances"}`}
        />
      </Frame>
    );
  }

  // ---- No confidential, but holds underlying tokens → Wrap ------------------
  if ((underlying?.length ?? 0) > 0) {
    const u = underlying![0];
    return (
      <Frame className={className} badge="PUBLIC" title="Ready to go confidential">
        <div className="flex items-center justify-between gap-3">
          <TokenIdentity meta={u.pair.underlying} address={u.pair.token} />
          <span className="font-mono text-lg text-ink tabular-nums">
            {formatAmount(u.balance, u.pair.underlying.decimals ?? 18)}
          </span>
        </div>
        <p className="mt-2 text-2xs text-ink-faint">
          Wrap it into {u.pair.wrapper.symbol ?? "its confidential twin"} — the amount becomes hidden.
        </p>
        <RevealCta
          onClick={() => router.push(`/token/${u.pair.confidentialToken}?action=wrap`)}
          label={`Wrap ${u.pair.underlying.symbol ?? "token"}`}
        />
      </Frame>
    );
  }

  // ---- Empty wallet → Faucet (testnet) or Browse (mainnet) ------------------
  return (
    <Frame className={className} badge="EMPTY" title="No balances yet">
      <p className="text-13 text-ink-faint leading-relaxed">
        {net.supportsFaucet
          ? "Grab free test tokens, then wrap one into a confidential balance."
          : "Browse the registry to find a token, then wrap it to go confidential."}
      </p>
      {net.supportsFaucet ? (
        <RevealCta onClick={() => router.push("/faucet")} label="Get test tokens" />
      ) : (
        <RevealCta
          onClick={() => document.getElementById("registry-table")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          label="Browse the registry"
        />
      )}
    </Frame>
  );
}

/** Card shell matching the original hero demo. */
function Frame({
  className,
  title,
  badge,
  children,
}: {
  className?: string;
  title: string;
  badge: "ENCRYPTED" | "PUBLIC" | "EMPTY";
  children: React.ReactNode;
}) {
  const accent = badge === "ENCRYPTED";
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface/80 backdrop-blur-sm p-5 w-full select-none",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xs font-mono uppercase tracking-wide text-ink-faint">{title}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[10px] font-medium tracking-wide",
            accent ? "border-accent/30 bg-accent-faint text-accent" : "border-line bg-raised text-ink-faint",
          )}
        >
          {badge}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** The animated primary action — a softly pulsing accent button. */
function RevealCta({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="relative mt-4">
      {/* breathing glow behind the button */}
      <span className="pointer-events-none absolute -inset-1 rounded-pill bg-accent/25 blur-md animate-breathe" aria-hidden="true" />
      <button
        onClick={onClick}
        className="btn-sheen relative w-full h-9 rounded-pill bg-accent text-base text-13 font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform overflow-hidden"
      >
        <KeyIcon />
        {label}
      </button>
    </div>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m8.4 8.4 4 4M11 11l1.4-1.4M10 13l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
