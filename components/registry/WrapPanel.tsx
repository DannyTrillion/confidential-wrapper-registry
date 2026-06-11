"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import type { EnrichedPair } from "@/lib/registry/types";
import { useUnderlyingTokenState } from "@/lib/hooks/useTokenState";
import { useWriteAndWait } from "@/lib/hooks/useWriteAndWait";
import { useActionFlow } from "@/lib/useActionFlow";
import { ERC20_ABI, ERC7984_WRAPPER_ABI } from "@/lib/abis";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import { AmountInput } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { Stepper } from "@/components/ui/Stepper";
import { PairFlow } from "@/components/fx/PairFlow";
import { Info } from "@/components/ui/Info";
import { formatAmount } from "@/lib/format";
import { startCountUp } from "@/lib/countUp";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useFlowToast } from "@/lib/useFlowToast";
import { cn } from "@/lib/cn";
import { useQueryClient } from "@tanstack/react-query";

export function WrapPanel({ pair, chainId }: { pair: EnrichedPair; chainId: SupportedChainId }) {
  const { address } = useAccount();
  const net = getNetwork(chainId)!;
  const writeAndWait = useWriteAndWait();
  const queryClient = useQueryClient();
  const { state, run } = useActionFlow();
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string>();
  const [steps, setSteps] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const reduced = useReducedMotion();
  useFlowToast(state, { label: `Wrap ${pair.underlying.symbol ?? "token"}`, chainId, txHash });

  function fillMax() {
    if (balance == null || dec == null) return;
    const exact = formatUnits(balance, dec);
    startCountUp({ to: Number(exact), maxFrac: Math.min(dec, 6), exact, reduced, onTick: setAmount });
  }

  const token = pair.token as Address;
  const wrapper = pair.confidentialToken as Address;

  const { decimals, symbol, balance, allowance, refetch } = useUnderlyingTokenState({
    token,
    owner: address as Address | undefined,
    spender: wrapper,
    chainId,
  });

  const dec = decimals ?? pair.underlying.decimals;
  const wrapperDec = pair.wrapper.decimals ?? 6;

  // Read the wrapper's conversion rate straight from the contract — the source
  // of truth. Fall back to 10^(underlyingDecimals - wrapperDecimals) only while
  // that read is pending or if a wrapper doesn't expose rate(). Amounts below
  // `rate` mint zero; any remainder below `rate` is dust the wrapper won't pull.
  const { data: onchainRate } = useReadContract({
    address: wrapper,
    abi: ERC7984_WRAPPER_ABI,
    functionName: "rate",
    chainId,
    query: { staleTime: 60_000 },
  });
  const rate =
    typeof onchainRate === "bigint" && onchainRate > 0n
      ? onchainRate
      : dec != null
        ? 10n ** BigInt(Math.max(0, dec - wrapperDec))
        : 1n;

  const parsed = safeParse(amount, dec);
  const insufficient = parsed != null && balance != null && parsed > balance;
  const needsApproval = parsed != null && allowance != null && allowance < parsed;
  // Confidential units actually minted (floor), and the underlying actually pulled.
  const confidentialOut = parsed != null ? parsed / rate : 0n;
  const tooSmall = parsed != null && parsed > 0n && confidentialOut === 0n;
  const overflowsU64 = confidentialOut > 18_446_744_073_709_551_615n;
  const hasDust = parsed != null && rate > 1n && parsed % rate !== 0n;
  const canSubmit =
    parsed != null && parsed > 0n && !insufficient && !tooSmall && !overflowsU64 && dec != null;

  async function onWrap() {
    if (parsed == null || !address) return;
    const willApprove = allowance == null || allowance < parsed;
    setSteps(willApprove ? ["Approve", "Wrap"] : ["Wrap"]);
    setStepIndex(0);
    const hash = await run(
      async (setStep) => {
        // Step 1 — approve exact amount if the wrapper isn't already allowed.
        if (willApprove) {
          setStep("Waiting for approval signature…");
          await writeAndWait({
            address: token,
            abi: ERC20_ABI as never,
            functionName: "approve",
            args: [wrapper, parsed],
            chainId,
            onSent: () => setStep(`Confirming approval on ${net.name}…`),
          });
          setStepIndex(1); // approve done → wrap active
        }
        // Step 2 — deposit into the wrapper, minting confidential supply to self.
        setStep("Waiting for wrap signature…");
        const h = await writeAndWait({
          address: wrapper,
          abi: ERC7984_WRAPPER_ABI as never,
          functionName: "wrap",
          args: [address, parsed],
          chainId,
          onSent: (hh) => {
            setTxHash(hh);
            setStep(`Confirming wrap on ${net.name}…`);
          },
        });
        return h;
      },
      { successMessage: `Wrapped into confidential ${pair.wrapper.symbol ?? "tokens"}.` },
    );
    if (hash) {
      setStepIndex((s) => s + 1); // final step → checkmark
      setAmount("");
      refetch();
      // Underlying balance/allowance and the confidential balance handle both
      // changed — refresh all on-chain reads (balances, handles, portfolio).
      queryClient.invalidateQueries();
    }
  }

  return (
    <div className="space-y-4">
      <PairFlow pair={pair} direction="forward" active={state.status === "pending"} />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-2xs text-ink-faint">
          <span className="uppercase tracking-wide flex items-center gap-1.5">
            Amount to wrap
            <Info>
              The wrapper mints an equal confidential balance, converting at a fixed rate so the
              confidential token caps at 6 decimals. You approve the exact amount, then deposit.
            </Info>
          </span>
          {address && (
            <span className="font-mono">
              Balance:{" "}
              {balance != null && dec != null ? (
                <span className="text-ink-muted">
                  {formatAmount(balance, dec)} {symbol ?? pair.underlying.symbol}
                </span>
              ) : (
                "—"
              )}
            </span>
          )}
        </div>
        <AmountInput
          value={amount}
          onChange={setAmount}
          symbol={symbol ?? pair.underlying.symbol}
          invalid={insufficient || tooSmall}
          onMax={balance != null && dec != null ? fillMax : undefined}
          disabled={state.status === "pending"}
        />
        {insufficient && (
          <p className="text-2xs text-danger">
            Exceeds your {symbol ?? pair.underlying.symbol} balance.
          </p>
        )}
        {tooSmall && (
          <p className="text-2xs text-danger">
            Too small — this wrapper mints in steps of{" "}
            <span className="font-mono">{formatAmount(rate, dec ?? 18)}</span>{" "}
            {symbol ?? pair.underlying.symbol}. Enter at least that much.
          </p>
        )}
        {overflowsU64 && (
          <p className="text-2xs text-danger">Amount is too large for a confidential balance.</p>
        )}
        {!tooSmall && !insufficient && !overflowsU64 && confidentialOut > 0n && (
          <p className="text-2xs text-ink-faint">
            You&apos;ll receive{" "}
            <span className="font-mono text-ink-muted">{formatAmount(confidentialOut, wrapperDec)}</span>{" "}
            {pair.wrapper.symbol ?? "cTokens"}
            {hasDust && (
              <> · {formatAmount(parsed! % rate, dec ?? 18)} {symbol ?? pair.underlying.symbol} dust stays in your wallet</>
            )}
          </p>
        )}
      </div>

      {/* Flow explainer — sets expectations for the two on-chain steps. */}
      <div className="rounded-input border border-line glass-soft px-3 py-2.5 text-2xs text-ink-faint leading-relaxed">
        {needsApproval ? (
          <>Two steps: approve the wrapper for this exact amount, then deposit to mint your confidential balance.</>
        ) : parsed != null && parsed > 0n ? (
          <>The wrapper is already approved — one step: deposit to mint your confidential balance.</>
        ) : (
          <>You approve the exact amount, then the wrapper mints an equal confidential balance to you.</>
        )}
      </div>

      <Button
        variant="primary"
        className={cn("w-full", state.status === "pending" && "btn-progress")}
        onClick={onWrap}
        disabled={!canSubmit}
        loading={state.status === "pending"}
      >
        {state.status === "pending" && state.step ? (
          <span key={state.step} className="animate-fade-in">{state.step}</span>
        ) : needsApproval ? (
          "Approve & Wrap"
        ) : (
          "Wrap"
        )}
      </Button>

      {steps.length > 1 && state.status !== "idle" && (
        <div className="rounded-input border border-line glass-soft px-4 py-3">
          <Stepper steps={steps} current={stepIndex} failed={state.status === "error"} />
        </div>
      )}

      <FlowFeedback state={state} chainId={chainId} txHash={txHash} />
    </div>
  );
}

function safeParse(amount: string, decimals?: number): bigint | null {
  if (!amount || decimals == null) return null;
  try {
    return parseUnits(amount as `${number}`, decimals);
  } catch {
    return null;
  }
}
