"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import type { EnrichedPair } from "@/lib/registry/types";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { useConfidentialBalance } from "@/lib/fhevm/useConfidentialBalance";
import { useDecryptSession } from "@/lib/fhevm/useDecryptSession";
import { setDecryptedValue } from "@/lib/fhevm/decryptedCache";
import { useActionFlow } from "@/lib/useActionFlow";
import { BalanceReveal, type RevealState } from "./BalanceReveal";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Info } from "@/components/ui/Info";
import { useFlowToast } from "@/lib/useFlowToast";
import { getNetwork, type SupportedChainId } from "@/lib/networks";

export function DecryptPanel({ pair, chainId }: { pair: EnrichedPair; chainId: SupportedChainId }) {
  const { address } = useAccount();
  const net = getNetwork(chainId)!;
  const wrapperDecimals = pair.wrapper.decimals ?? 6;
  const symbol = pair.wrapper.symbol;

  const { handle, isUninitialized, isLoading, refetch } = useConfidentialBalance({
    wrapper: pair.confidentialToken,
    account: address as Address | undefined,
    chainId,
  });

  // All valid wrapper addresses on this network → one signature covers them all.
  const { data: allPairs } = useRegistryPairs(chainId);
  const allWrappers = useMemo(
    () => (allPairs ?? []).filter((p) => p.isValid).map((p) => p.confidentialToken as string),
    [allPairs],
  );

  const { decryptHandle, hasSession } = useDecryptSession();
  const { state, run, reset } = useActionFlow();
  const [revealed, setRevealed] = useState<bigint | null>(null);
  useFlowToast(state, { label: `Reveal ${symbol ?? "balance"}` });

  if (!net.supportsDecryption) {
    return (
      <PanelNote>
        Revealing a confidential balance is wired for the{" "}
        <span className="text-ink">Sepolia</span> test network in this app. Switch the network up top
        to Sepolia to reveal balances.
      </PanelNote>
    );
  }

  const revealState: RevealState = isUninitialized
    ? { kind: "empty" }
    : revealed != null
      ? { kind: "revealed", value: revealed }
      : state.status === "pending"
        ? { kind: "decrypting" }
        : { kind: "locked" };

  async function onDecrypt() {
    if (!handle) return;
    const value = await run(
      async (setStep) => {
        const v = await decryptHandle(pair.confidentialToken as Address, handle, allWrappers, {
          onStep: setStep,
        });
        return v;
      },
      { successMessage: "Balance revealed — only you can see it." },
    );
    if (value !== undefined && value !== null) {
      setRevealed(value);
      if (handle) setDecryptedValue(handle, value); // share with Unwrap/Portfolio
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line glass-soft p-4">
        <div className="flex items-center justify-between">
          <span className="text-2xs text-ink-faint uppercase tracking-wide">
            Your confidential balance
          </span>
          {revealed != null && (
            <button
              onClick={() => {
                setRevealed(null);
                reset();
              }}
              className="text-2xs text-ink-faint hover:text-ink transition-colors inline-flex items-center gap-1"
            >
              <LockIcon /> Re-lock
            </button>
          )}
        </div>

        <div className="mt-3 min-h-9">
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : !address ? (
            <span className="text-13 text-ink-faint">Connect your wallet to view.</span>
          ) : (
            <BalanceReveal state={revealState} decimals={wrapperDecimals} symbol={symbol} showLock />
          )}
        </div>

        {/* Handle line — shows the opaque ciphertext handle for transparency. */}
        {address && !isLoading && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-2xs text-ink-faint flex items-center gap-1.5">
              Balance handle
              <Info>
                On-chain your balance is a <span className="font-mono">bytes32</span> handle — a
                scrambled stand-in for the amount. The real number never appears on-chain; only you
                can reveal it.
              </Info>
            </div>
            <div className="mt-1 font-mono text-2xs text-ink-ghost break-all">
              {isUninitialized ? "Uninitialized (bytes32 zero)" : handle}
            </div>
          </div>
        )}
      </div>

      {address && !isUninitialized && revealed == null && (
        <NetworkGuard targetChainId={chainId} action="reveal this balance">
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={onDecrypt}
              loading={state.status === "pending"}
              disabled={!handle}
            >
              {state.status === "pending" && state.step ? (
                <span key={state.step} className="animate-fade-in">{state.step}</span>
              ) : !hasSession() ? (
                <>
                  <KeyIcon /> Approve &amp; reveal
                </>
              ) : (
                <>
                  <KeyIcon /> Reveal
                </>
              )}
            </Button>
            <p className="text-2xs text-ink-faint text-center">
              {hasSession()
                ? "Using your active approval — no new signature needed."
                : "You'll approve once. After that, revealing any token needs no new signature."}
            </p>
          </div>
        </NetworkGuard>
      )}

      <FlowFeedback state={state} />

      {isUninitialized && address && (
        <PanelNote>
          You don&apos;t hold any of this confidential token yet, so there&apos;s nothing to reveal. Wrap
          some {pair.underlying.symbol ?? "tokens"} to create your first confidential balance.
        </PanelNote>
      )}

      <button
        onClick={() => refetch()}
        className="text-2xs text-ink-faint hover:text-ink-muted transition-colors"
      >
        Refresh handle
      </button>
    </div>
  );
}

function PanelNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-input border border-line glass-soft px-3 py-3 text-13 text-ink-muted leading-relaxed">
      {children}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
      <rect x="3" y="6.5" width="8" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.75 6.5V5a2.25 2.25 0 0 1 4.5 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
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
