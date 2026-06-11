"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { useMyBalances, type Holding } from "@/lib/fhevm/useMyBalances";
import { useDecryptSession } from "@/lib/fhevm/useDecryptSession";
import { setDecryptedValue } from "@/lib/fhevm/decryptedCache";
import { useActionFlow } from "@/lib/useActionFlow";
import { getNetwork } from "@/lib/networks";
import type { EnrichedPair } from "@/lib/registry/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useFlowToast } from "@/lib/useFlowToast";
import { TokenIdentity } from "./TokenIdentity";
import { BalanceReveal, type RevealState } from "./BalanceReveal";
import { ArbitraryDecrypt } from "./ArbitraryDecrypt";

export function Portfolio({
  onOpenPair,
  onBrowse,
}: {
  onOpenPair: (p: EnrichedPair) => void;
  onBrowse: () => void;
}) {
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { address, isConnected, chainId: walletChainId } = useAccount();
  // Decryption signs over the chain you're browsing — wallet must match it.
  const walletOnChain = walletChainId === chainId;

  const { data: pairs, isLoading: pairsLoading } = useRegistryPairs(chainId);
  const validPairs = useMemo(() => (pairs ?? []).filter((p) => p.isValid), [pairs]);
  const { data: holdings, isLoading: balancesLoading, refetch } = useMyBalances(
    chainId,
    address as Address | undefined,
    validPairs,
  );

  const { decryptHandle, hasSession } = useDecryptSession();
  const { state, run } = useActionFlow();
  const [decrypted, setDecrypted] = useState<Record<string, bigint>>({});
  useFlowToast(state, { label: "Reveal balances" });

  const allWrappers = useMemo(() => validPairs.map((p) => p.confidentialToken as string), [validPairs]);

  async function decryptAll() {
    if (!holdings?.length) return;
    const total = holdings.length;
    await run(
      async (setStep) => {
        let done = 0;
        for (const h of holdings) {
          setStep(
            done === 0 && !hasSession()
              ? "Waiting for approval…"
              : `Revealing balances… ${done}/${total}`,
          );
          const v = await decryptHandle(h.pair.confidentialToken as Address, h.handle, allWrappers, {
            onStep: (s) => setStep(`${s} · ${done}/${total}`),
          });
          if (v != null) {
            setDecrypted((prev) => ({ ...prev, [h.handle]: v }));
            setDecryptedValue(h.handle, v);
          }
          done += 1;
          setStep(`Revealing balances… ${done}/${total}`);
          // Small beat between reveals so the cascade reads across cards.
          if (done < total) await new Promise((r) => setTimeout(r, 140));
        }
      },
      { successMessage: `Revealed ${total} balance${total === 1 ? "" : "s"}.` },
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

  // --- gated states ---
  if (!isConnected) {
    return (
      <Empty
        title="Connect to see your confidential balances"
        body="Every confidential balance you hold across the registry, in one place — reveal them all with a single approval."
      />
    );
  }

  const loading = pairsLoading || balancesLoading;
  const decryptedCount = holdings?.filter((h) => decrypted[h.handle] != null).length ?? 0;

  return (
    <div className="space-y-5">
      <Card className="px-4 py-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-ink">Your confidential balances</h2>
            <p className="text-13 text-ink-faint mt-0.5">
              {net.supportsDecryption
                ? hasSession()
                  ? "You're approved — revealing won't ask for another signature."
                  : "Approve once to reveal every balance below."
                : `Revealing runs on the Sepolia test network. Switch networks to see these.`}
            </p>
          </div>
          {net.supportsDecryption && (holdings?.length ?? 0) > 0 && walletOnChain && (
            <Button
              variant="primary"
              onClick={decryptAll}
              loading={state.status === "pending"}
              disabled={decryptedCount === holdings!.length}
            >
              <KeyIcon />
              {decryptedCount === holdings!.length
                ? "All revealed"
                : hasSession()
                  ? "Reveal all"
                  : "Approve & reveal all"}
            </Button>
          )}
        </div>
        {net.supportsDecryption && isConnected && !walletOnChain && (holdings?.length ?? 0) > 0 && (
          <div className="mt-3">
            <NetworkGuard targetChainId={chainId} action="reveal your balances">
              <span />
            </NetworkGuard>
          </div>
        )}
        <FlowFeedback state={state} className="mt-3" />
      </Card>

      <ArbitraryDecrypt />

      {loading ? (
        <HoldingsSkeleton />
      ) : (holdings?.length ?? 0) === 0 ? (
        <Empty
          title="No confidential balances yet"
          body="You don't hold any confidential tokens on this network. Wrap a token to create your first confidential balance."
          action={<Button variant="secondary" onClick={onBrowse}>Browse the registry</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {holdings!.map((h) => {
            const value = decrypted[h.handle];
            const reveal: RevealState =
              value != null
                ? { kind: "revealed", value }
                : state.status === "pending"
                  ? { kind: "decrypting" }
                  : { kind: "locked" };
            return (
              <Card key={h.pair.index} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <TokenIdentity meta={h.pair.wrapper} address={h.pair.confidentialToken} confidential />
                  <span className="text-2xs text-ink-faint font-mono shrink-0">
                    via {h.pair.underlying.symbol ?? "ERC-20"}
                  </span>
                </div>
                <div className="min-h-9">
                  <BalanceReveal
                    state={reveal}
                    decimals={h.pair.wrapper.decimals ?? 6}
                    symbol={h.pair.wrapper.symbol}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
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
                  <Button size="sm" variant="ghost" onClick={() => onOpenPair(h.pair)}>
                    Manage
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && (holdings?.length ?? 0) > 0 && (
        <button onClick={() => refetch()} className="text-2xs text-ink-faint hover:text-ink-muted transition-colors">
          Refresh balances
        </button>
      )}
    </div>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Card className="px-4 py-16 text-center">
      <div className="grid place-items-center h-12 w-12 mx-auto rounded-pill border border-line bg-raised">
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-ink-faint" fill="none" aria-hidden="true">
          <rect x="4" y="9" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 9V7a3.5 3.5 0 1 1 7 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-medium text-ink">{title}</h3>
      <p className="mt-1.5 text-13 text-ink-faint max-w-sm mx-auto leading-relaxed">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

function HoldingsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-pill" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-24 rounded-input" />
        </Card>
      ))}
    </div>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="3.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8.3 8.3 4.2 4.2M11 11l1.5-1.5M10 12.5l1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
