"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import type { Address } from "viem";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { useMyBalances, type Holding } from "@/lib/fhevm/useMyBalances";
import { useDecryptSession } from "@/lib/fhevm/useDecryptSession";
import { setDecryptedValue } from "@/lib/fhevm/decryptedCache";
import { useActionFlow } from "@/lib/useActionFlow";
import { useFlowToast } from "@/lib/useFlowToast";
import { getNetwork } from "@/lib/networks";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { NetworkGuard } from "@/components/NetworkGuard";
import { TokenIdentity } from "@/components/registry/TokenIdentity";
import { BalanceReveal, type RevealState } from "@/components/registry/BalanceReveal";
import { ArbitraryDecrypt } from "@/components/registry/ArbitraryDecrypt";
import { DecryptDemo } from "@/components/fx/DecryptDemo";

type Tab = "positions" | "reveal-any";

/**
 * jup.ag/portfolio analog: an account dashboard. Header = wallet pill +
 * hide-values eye + refresh. Top band = "encrypted net worth" summary with the
 * page's one accent CTA (reveal all) and a decrypt-session status card. Below,
 * tabbed sections: Positions (your confidential holdings) and Reveal any token.
 */
export function PortfolioView() {
  const router = useRouter();
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  // Decryption signs over the chain you're browsing — wallet must match it.
  const walletOnChain = walletChainId === chainId;

  const { data: pairs, isLoading: pairsLoading } = useRegistryPairs(chainId);
  const validPairs = useMemo(() => (pairs ?? []).filter((p) => p.isValid), [pairs]);
  const { data: holdings, isLoading: balancesLoading, refetch, isFetching } = useMyBalances(
    chainId,
    address as Address | undefined,
    validPairs,
  );

  const { decryptHandle, hasSession } = useDecryptSession();
  const { state, run } = useActionFlow();
  const [decrypted, setDecrypted] = useState<Record<string, bigint>>({});
  const [hideValues, setHideValues] = useState(false);
  const [tab, setTab] = useState<Tab>("positions");
  useFlowToast(state, { label: "Reveal balances" });

  const allWrappers = useMemo(
    () => validPairs.map((p) => p.confidentialToken as string),
    [validPairs],
  );

  const loading = pairsLoading || balancesLoading;
  const total = holdings?.length ?? 0;
  const revealedCount = holdings?.filter((h) => decrypted[h.handle] != null).length ?? 0;

  async function decryptAll() {
    if (!holdings?.length) return;
    const n = holdings.length;
    await run(
      async (setStep) => {
        let done = 0;
        for (const h of holdings) {
          setStep(
            done === 0 && !hasSession()
              ? "Waiting for approval…"
              : `Revealing balances… ${done}/${n}`,
          );
          const v = await decryptHandle(h.pair.confidentialToken as Address, h.handle, allWrappers, {
            onStep: (s) => setStep(`${s} · ${done}/${n}`),
          });
          if (v != null) {
            setDecrypted((prev) => ({ ...prev, [h.handle]: v }));
            setDecryptedValue(h.handle, v);
          }
          done += 1;
          setStep(`Revealing balances… ${done}/${n}`);
          // Small beat between reveals so the cascade reads across rows.
          if (done < n) await new Promise((r) => setTimeout(r, 140));
        }
      },
      { successMessage: `Revealed ${n} balance${n === 1 ? "" : "s"}.` },
    );
  }

  async function decryptOne(h: Holding) {
    await run(
      async (setStep) => {
        const v = await decryptHandle(h.pair.confidentialToken as Address, h.handle, allWrappers, {
          onStep: setStep,
        });
        if (v != null) {
          setDecrypted((prev) => ({ ...prev, [h.handle]: v }));
          setDecryptedValue(h.handle, v);
        }
      },
      { successMessage: "Balance revealed." },
    );
  }

  /* ---------- disconnected: quiet landing, jup.ag/portfolio style ---------- */
  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto pt-6 sm:pt-14 text-center">
        <p className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-ghost">Portfolio</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-ink tracking-tight text-balance">
          Your confidential holdings, tracked in one dashboard.
        </h1>
        <p className="mt-3 text-13 text-ink-faint leading-relaxed max-w-md mx-auto">
          Every confidential balance you hold across the {net.name} registry — hidden onchain,
          revealed client-side with a single signature, visible only to you.
        </p>
        <div className="mt-7 max-w-sm mx-auto text-left">
          <DecryptDemo />
        </div>
        <button
          onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          className="mt-4 h-11 px-8 rounded-input bg-accent text-[#0a0a0a] text-sm font-semibold hover:brightness-[1.05] active:scale-[0.99] transition"
        >
          {isPending ? "Connecting…" : "Connect wallet"}
        </button>
        <div className="mt-10 text-left">
          <ArbitraryDecrypt />
        </div>
      </div>
    );
  }

  /* -------------------------------- connected ------------------------------ */
  return (
    <div className="space-y-5">
      <h1 className="sr-only">Portfolio</h1>

      {/* Account header */}
      <div className="flex items-center gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-pill bg-raised font-mono text-2xs text-ink-muted shrink-0" aria-hidden="true">
          {address!.slice(2, 4).toUpperCase()}
        </span>
        <button
          onClick={() => navigator.clipboard?.writeText(address!)}
          title="Copy address"
          className="flex items-center gap-2 h-9 px-3 rounded-input border border-line bg-surface font-mono text-13 text-ink hover:border-line-strong transition-colors"
        >
          {truncateAddress(address!)}
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-ink-ghost" fill="none" aria-hidden="true">
            <rect x="5.5" y="5.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 5.5v-1a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 4.5V9A1.5 1.5 0 0 0 5 10.5h.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <span className="hidden sm:block text-2xs text-ink-ghost">{net.name}</span>

        <div className="ml-auto flex items-center gap-1.5">
          <IconBtn
            label={hideValues ? "Show revealed values" : "Hide revealed values"}
            pressed={hideValues}
            onClick={() => setHideValues((v) => !v)}
          >
            {hideValues ? (
              <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M2.5 9s2.4-4.5 6.5-4.5S15.5 9 15.5 9s-2.4 4.5-6.5 4.5S2.5 9 2.5 9Z" stroke="currentColor" strokeWidth="1.3" />
                <path d="m3.5 3.5 11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M2.5 9s2.4-4.5 6.5-4.5S15.5 9 15.5 9s-2.4 4.5-6.5 4.5S2.5 9 2.5 9Z" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            )}
          </IconBtn>
          <IconBtn label="Refresh balances" onClick={() => refetch()} spinning={isFetching}>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path d="M13 8a5 5 0 1 1-1.46-3.54M13 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* Top band: net worth + session */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-3.5">
        <Card className="p-5">
          <div className="text-2xs uppercase tracking-wide text-ink-ghost">Encrypted net worth</div>
          <div className="mt-2 flex items-baseline gap-3">
            {loading ? (
              <Skeleton className="h-9 w-40" />
            ) : (
              <span className="font-mono text-3xl text-ink tabular-nums tracking-tight">
                {total === 0 ? "0" : revealedCount === total && !hideValues ? total : "•••"}
                <span className="ml-2 text-sm text-ink-faint font-sans font-normal">
                  {total === 1 ? "balance" : "balances"}
                </span>
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-8">
            <div>
              <div className="font-mono text-base text-ink tabular-nums leading-none">
                {loading ? "—" : `${revealedCount}/${total}`}
              </div>
              <div className="mt-1 text-2xs text-ink-ghost uppercase tracking-wide">Revealed</div>
            </div>
            <div>
              <div className="font-mono text-base text-ink tabular-nums leading-none">
                {pairsLoading ? "—" : validPairs.length}
              </div>
              <div className="mt-1 text-2xs text-ink-ghost uppercase tracking-wide">Active pairs</div>
            </div>
          </div>

          {net.supportsDecryption && total > 0 && walletOnChain && (
            <button
              onClick={decryptAll}
              disabled={state.status === "pending" || revealedCount === total}
              className="mt-5 w-full sm:w-auto h-10 px-6 rounded-input bg-accent text-[#0a0a0a] text-13 font-semibold hover:brightness-[1.05] active:scale-[0.99] transition disabled:opacity-40 disabled:pointer-events-none"
            >
              {revealedCount === total
                ? "All revealed"
                : hasSession()
                  ? "Reveal all balances"
                  : "Approve & reveal all"}
            </button>
          )}
          {net.supportsDecryption && !walletOnChain && total > 0 && (
            <div className="mt-4">
              <NetworkGuard targetChainId={chainId} action="reveal your balances">
                <span />
              </NetworkGuard>
            </div>
          )}
          {!net.supportsDecryption && (
            <p className="mt-4 text-13 text-ink-faint">
              Revealing on {net.name} requires a Zama relayer API key
              (<span className="font-mono">NEXT_PUBLIC_ZAMA_RELAYER_API_KEY</span>) —
              or switch to Sepolia, where no key is needed.
            </p>
          )}
          <FlowFeedback state={state} className="mt-3" />
        </Card>

        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-wide text-ink-ghost">Decrypt session</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[10px] font-medium tracking-wide",
                hasSession()
                  ? "border-accent/25 bg-accent/10 text-accentInk"
                  : "border-line bg-raised text-ink-faint",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-pill", hasSession() ? "bg-accent" : "bg-ink-ghost")} aria-hidden="true" />
              {hasSession() ? "ACTIVE" : "LOCKED"}
            </span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-input bg-well border border-line shrink-0" aria-hidden="true">
              <svg viewBox="0 0 20 20" className="h-4 w-4 text-ink-muted" fill="none">
                <rect x="4" y="9" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M6.5 9V7a3.5 3.5 0 1 1 7 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <p className="text-13 text-ink-faint leading-relaxed">
              {hasSession()
                ? "You're approved — revealing more balances won't ask for another signature for the rest of the session."
                : "Your first reveal asks for one free wallet signature. It unlocks every balance — no fee, no transaction."}
            </p>
          </div>
          <p className="mt-auto pt-3 text-2xs text-ink-ghost">
            Balances decrypt client-side. Nothing you reveal leaves this device.
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        <TabBtn active={tab === "positions"} onClick={() => setTab("positions")}>
          Positions{total > 0 && <span className="ml-1.5 font-mono text-2xs text-ink-faint">{total}</span>}
        </TabBtn>
        <TabBtn active={tab === "reveal-any"} onClick={() => setTab("reveal-any")}>
          Reveal any token
        </TabBtn>
      </div>

      {tab === "reveal-any" ? (
        <ArbitraryDecrypt />
      ) : loading ? (
        <PositionsSkeleton />
      ) : total === 0 ? (
        <Card className="px-4 py-14 text-center">
          <h3 className="text-sm font-medium text-ink">No confidential balances yet</h3>
          <p className="mt-1.5 text-13 text-ink-faint max-w-sm mx-auto leading-relaxed">
            You don&apos;t hold any confidential tokens on {net.name}. Wrap a token to create
            your first encrypted balance.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push("/")}>Browse the registry</Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {holdings!.map((h, i) => {
            const value = decrypted[h.handle];
            const reveal: RevealState =
              value != null && !hideValues
                ? { kind: "revealed", value }
                : value != null && hideValues
                  ? { kind: "locked" }
                  : state.status === "pending"
                    ? { kind: "decrypting" }
                    : { kind: "locked" };
            return (
              <div
                key={h.pair.index}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5",
                  i > 0 && "border-t border-line",
                )}
              >
                <div className="flex items-center gap-3 min-w-0 sm:w-64">
                  <TokenIdentity meta={h.pair.wrapper} address={h.pair.confidentialToken} confidential />
                </div>
                <span className="hidden md:block font-mono text-2xs text-ink-ghost">
                  via {h.pair.underlying.symbol ?? "ERC-20"}
                </span>
                <div className="sm:ml-auto min-h-8 flex items-center">
                  <BalanceReveal
                    state={reveal}
                    decimals={h.pair.wrapper.decimals ?? 6}
                    symbol={h.pair.wrapper.symbol}
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:pl-2" >
                  {net.supportsDecryption && walletOnChain && value == null && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => decryptOne(h)}
                      loading={state.status === "pending"}
                    >
                      Reveal
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/token/${h.pair.confidentialToken}`)}>
                    Manage
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function IconBtn({
  label,
  onClick,
  pressed,
  spinning,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  spinning?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "grid place-items-center h-9 w-9 rounded-input border border-line text-ink-faint",
        "hover:text-ink hover:border-line-strong transition-colors",
        pressed && "text-ink bg-raised",
        spinning && "[&>svg]:animate-spin",
      )}
    >
      {children}
    </button>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 px-4 rounded-input text-13 font-medium transition-colors",
        active ? "bg-raised text-ink" : "text-ink-faint hover:text-ink hover:bg-raised/50",
      )}
    >
      {children}
    </button>
  );
}

function PositionsSkeleton() {
  return (
    <Card className="overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn("flex items-center gap-4 px-4 py-3.5", i > 0 && "border-t border-line")}>
          <Skeleton className="h-8 w-8 rounded-pill" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-20 rounded-input" />
        </div>
      ))}
    </Card>
  );
}
