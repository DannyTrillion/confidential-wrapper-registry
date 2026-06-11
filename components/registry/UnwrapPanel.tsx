"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { writeContract, waitForTransactionReceipt, readContract } from "wagmi/actions";
import { parseUnits, formatUnits, parseEventLogs, zeroAddress, type Address } from "viem";
import type { EnrichedPair } from "@/lib/registry/types";
import { useActionFlow } from "@/lib/useActionFlow";
import { getFhevmInstance } from "@/lib/fhevm/instance";
import { useConfidentialBalance } from "@/lib/fhevm/useConfidentialBalance";
import { useDecryptSession } from "@/lib/fhevm/useDecryptSession";
import { getDecryptedValue, setDecryptedValue } from "@/lib/fhevm/decryptedCache";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { ERC7984_WRAPPER_ABI } from "@/lib/abis";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import { AmountInput } from "@/components/ui/AmountInput";
import { Button } from "@/components/ui/Button";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { Stepper } from "@/components/ui/Stepper";
import { PairFlow } from "@/components/fx/PairFlow";
import { BalanceReveal, type RevealState } from "./BalanceReveal";
import { useFlowToast } from "@/lib/useFlowToast";
import { usePendingUnwrap } from "@/lib/hooks/usePendingUnwrap";
import { formatAmount } from "@/lib/format";
import { startCountUp } from "@/lib/countUp";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Info } from "@/components/ui/Info";
import { cn } from "@/lib/cn";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Unwrap is inherently two-phase: the encrypted burn amount must be revealed
 * (public-decrypted by the relayer) before the underlying ERC-20 can be
 * released. We narrate every stage so the asynchrony is legible.
 */
export function UnwrapPanel({ pair, chainId }: { pair: EnrichedPair; chainId: SupportedChainId }) {
  const { address } = useAccount();
  const config = useConfig();
  const net = getNetwork(chainId)!;
  const queryClient = useQueryClient();
  const { state, run } = useActionFlow();
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string>();
  const [steps, setSteps] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const reduced = useReducedMotion();
  useFlowToast(state, { label: `Unwrap ${pair.wrapper.symbol ?? "token"}`, chainId, txHash });

  const wrapper = pair.confidentialToken as Address;
  const dec = pair.wrapper.decimals ?? 6;
  const { pending, save, clear } = usePendingUnwrap(chainId, wrapper, address as string | undefined);
  // The confidential balance handle — zero means nothing to unwrap.
  const { handle, isUninitialized, isLoading: balanceLoading } = useConfidentialBalance({
    wrapper,
    account: address as Address | undefined,
    chainId,
  });
  const noBalance = !!address && !balanceLoading && isUninitialized;

  // Reveal the user's balance so the unwrap amount can be capped at it. Reuses
  // the cached decrypt session (no extra signature if already decrypted, here or
  // in the Decrypt/Portfolio tabs).
  const { decryptHandle, hasSession } = useDecryptSession();
  const { data: allPairs } = useRegistryPairs(chainId);
  const allWrappers = useMemo(
    () => (allPairs ?? []).filter((p) => p.isValid).map((p) => p.confidentialToken as string),
    [allPairs],
  );
  const reveal = useActionFlow();
  const [localMax, setLocalMax] = useState<bigint | null>(null);
  // Reset when the balance handle changes (e.g. after a wrap/unwrap).
  useEffect(() => {
    setLocalMax(null);
  }, [handle]);
  const maxBalance = localMax ?? (handle ? getDecryptedValue(handle) ?? null : null);

  async function revealBalance() {
    if (!handle || isUninitialized) return;
    const v = await reveal.run(
      async (setStep) => decryptHandle(wrapper, handle, allWrappers, { onStep: setStep }),
      { successMessage: "Balance revealed — only you can see it." },
    );
    if (v != null) {
      setLocalMax(v);
      setDecryptedValue(handle, v);
    }
  }

  const parsed = safeParse(amount, dec);
  const exceedsBalance = parsed != null && maxBalance != null && parsed > maxBalance;
  // Unwrap requires knowing the balance (so we can cap it) — reveal first.
  const canSubmit =
    parsed != null && parsed > 0n && !noBalance && maxBalance != null && !exceedsBalance;

  /**
   * Phase 2 — reveal the burned amount via the relayer and finalize on-chain.
   * Extracted so both the normal flow and the recovery path share it: if this
   * fails after the burn, the pending request stays saved and is resumable.
   */
  async function finalize(
    requestId: `0x${string}`,
    handle: `0x${string}`,
    setStep: (s: string) => void,
    phases?: { reveal: number; finalize: number },
  ) {
    const instance = await getFhevmInstance(chainId);
    if (phases) setStepIndex(phases.reveal);
    setStep("Revealing the amount to withdraw…");
    const pub = await instance.publicDecrypt([handle]);
    const cleartext = pub.clearValues[handle];
    const proof = pub.decryptionProof;
    if (cleartext == null) throw new Error("Relayer did not return a cleartext for the unwrap amount.");

    if (phases) setStepIndex(phases.finalize);
    setStep("Waiting for finalize signature…");
    const finHash = await writeContract(config, {
      address: wrapper,
      abi: ERC7984_WRAPPER_ABI,
      functionName: "finalizeUnwrap",
      args: [requestId, BigInt(cleartext as string | number | bigint), toHexBytes(proof)],
      chainId: chainId as never,
    });
    setTxHash(finHash);
    setStep(`Releasing ${pair.underlying.symbol ?? "tokens"} on ${net.name}…`);
    const finReceipt = await waitForTransactionReceipt(config, { hash: finHash, chainId: chainId as never });
    if (finReceipt.status === "reverted") throw new Error(`Finalize reverted (${finHash}).`);
  }

  async function onUnwrap() {
    if (parsed == null || !address) return;
    setSteps(["Burn", "Reveal", "Finalize"]);
    setStepIndex(0);
    const ok = await run(
      async (setStep) => {
        const instance = await getFhevmInstance(chainId);

        // Phase 1 — encrypt the burn amount bound to (wrapper, user).
        setStep("Encrypting unwrap amount…");
        const input = instance.createEncryptedInput(wrapper, address);
        input.add64(parsed);
        const enc = await input.encrypt();

        // Phase 1 (cont.) — submit the burn; contract emits UnwrapRequested.
        setStep("Waiting for unwrap signature…");
        const burnHash = await writeContract(config, {
          address: wrapper,
          abi: ERC7984_WRAPPER_ABI,
          functionName: "unwrap",
          args: [address, address, toHex(enc.handles[0]), toHexBytes(enc.inputProof)],
          chainId: chainId as never,
        });
        setTxHash(burnHash);
        setStep(`Confirming burn on ${net.name}…`);
        const burnReceipt = await waitForTransactionReceipt(config, { hash: burnHash, chainId: chainId as never });
        if (burnReceipt.status === "reverted") throw new Error(`Unwrap burn reverted (${burnHash}).`);

        const events = parseEventLogs({ abi: ERC7984_WRAPPER_ABI, logs: burnReceipt.logs, eventName: "UnwrapRequested" });
        // requestId IS the burned-amount handle (contract: requestId = euint64.unwrap(amount)).
        const req = events[0]?.args as { unwrapRequestId: `0x${string}`; amount: `0x${string}` } | undefined;
        if (!req) throw new Error("Could not find the UnwrapRequested event in the receipt.");

        // The burn is now on-chain. Persist BEFORE finalize so a phase-2 failure
        // is always recoverable — funds can never be stranded.
        save({ requestId: req.unwrapRequestId, handle: req.unwrapRequestId, createdAt: Date.now() });

        await finalize(req.unwrapRequestId, req.unwrapRequestId, setStep, { reveal: 1, finalize: 2 });
        clear();
        return true;
      },
      { successMessage: `Unwrapped back to ${pair.underlying.symbol ?? "the underlying token"}.` },
    );
    if (ok) {
      setStepIndex(3); // all three steps done
      setAmount("");
      queryClient.invalidateQueries();
    }
  }

  async function onResume() {
    if (!pending) return;
    setSteps(["Reveal", "Finalize"]);
    setStepIndex(0);
    const ok = await run(
      async (setStep) => {
        // If the request was already finalized (e.g. in another tab), the
        // contract has deleted it — skip the relayer round-trip and clear.
        setStep("Checking pending request…");
        const requester = (await readContract(config, {
          address: wrapper,
          abi: ERC7984_WRAPPER_ABI,
          functionName: "unwrapRequester",
          args: [pending.requestId as `0x${string}`],
          chainId: chainId as never,
        })) as string;
        if (!requester || requester === zeroAddress) {
          clear();
          throw new Error("This unwrap was already finalized — nothing left to complete.");
        }
        await finalize(pending.requestId as `0x${string}`, pending.handle as `0x${string}`, setStep, { reveal: 0, finalize: 1 });
        return true;
      },
      { successMessage: `Withdrawal completed for ${pair.underlying.symbol ?? "the underlying token"}.` },
    );
    if (ok) {
      setStepIndex(2);
      clear();
      queryClient.invalidateQueries();
    }
  }

  return (
    <div className="space-y-4">
      <PairFlow pair={pair} direction="reverse" active={state.status === "pending"} />

      {pending && (
        <div className="rounded-input border border-warn/25 bg-warn/5 px-3 py-3 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-pill bg-warn shrink-0" />
            <p className="text-13 text-ink">
              You have an unwrap awaiting finalization. The burn already happened — complete the
              withdrawal to receive your {pair.underlying.symbol ?? "tokens"}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={onResume} loading={state.status === "pending"}>
              Complete withdrawal
            </Button>
            <Button size="sm" variant="ghost" onClick={clear} disabled={state.status === "pending"}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {noBalance ? (
        <div className="rounded-input border border-line glass-soft px-3 py-3 text-13 text-ink-muted">
          You don&apos;t hold any confidential {pair.wrapper.symbol ?? "balance"} on this wrapper yet,
          so there&apos;s nothing to unwrap. Wrap some {pair.underlying.symbol ?? "tokens"} first.
        </div>
      ) : (
        <>
          {/* Confidential balance — must be revealed so the amount can be capped. */}
          <div className="rounded-card border border-line glass-soft p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-ink-faint uppercase tracking-wide">
                Your wrapped balance
              </span>
              {maxBalance == null && address && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={revealBalance}
                  loading={reveal.state.status === "pending"}
                  disabled={balanceLoading || !handle}
                >
                  {hasSession() ? "Reveal balance" : "Sign & reveal balance"}
                </Button>
              )}
            </div>
            <div className="mt-2 min-h-9">
              {balanceLoading ? (
                <span className="text-13 text-ink-faint">Loading…</span>
              ) : (
                <BalanceReveal
                  state={
                    (maxBalance != null
                      ? { kind: "revealed", value: maxBalance }
                      : reveal.state.status === "pending"
                        ? { kind: "decrypting" }
                        : { kind: "locked" }) as RevealState
                  }
                  decimals={dec}
                  symbol={pair.wrapper.symbol}
                />
              )}
            </div>
            <FlowFeedback state={reveal.state} className="mt-2" />
          </div>

          {maxBalance != null && (
            <div className="space-y-2">
              <span className="text-2xs text-ink-faint uppercase tracking-wide">Amount to unwrap</span>
              <AmountInput
                value={amount}
                onChange={setAmount}
                symbol={pair.wrapper.symbol}
                invalid={exceedsBalance}
                onMax={() => {
                  const exact = formatUnits(maxBalance, dec);
                  startCountUp({ to: Number(exact), maxFrac: Math.min(dec, 6), exact, reduced, onTick: setAmount });
                }}
                disabled={state.status === "pending"}
              />
              {exceedsBalance ? (
                <p className="text-2xs text-danger">
                  Exceeds your wrapped balance of{" "}
                  <span className="font-mono">{formatAmount(maxBalance, dec)}</span>{" "}
                  {pair.wrapper.symbol}.
                </p>
              ) : (
                <p className="text-2xs text-ink-faint">
                  Only the amount you unwrap is revealed on-chain; the rest of your balance stays
                  encrypted.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {!noBalance && maxBalance != null && (
        <>
          <PhaseHint />
          <Button
            variant="primary"
            className={cn("w-full", state.status === "pending" && "btn-progress")}
            onClick={onUnwrap}
            disabled={!canSubmit}
            loading={state.status === "pending"}
          >
            {state.status === "pending" && state.step ? (
              <span key={state.step} className="animate-fade-in">{state.step}</span>
            ) : (
              "Unwrap"
            )}
          </Button>
        </>
      )}

      {steps.length > 1 && state.status !== "idle" && (
        <div className="rounded-input border border-line glass-soft px-4 py-3">
          <Stepper steps={steps} current={stepIndex} failed={state.status === "error"} />
        </div>
      )}

      <FlowFeedback state={state} chainId={chainId} txHash={txHash} />
    </div>
  );
}

function PhaseHint() {
  return (
    <div className="rounded-input border border-line glass-soft px-3 py-2.5 space-y-1.5">
      <div className="text-2xs text-ink-faint uppercase tracking-wide flex items-center gap-1.5">
        Withdrawal happens in two steps
        <Info>
          To pay out the public token, the network needs to know the exact amount — but your balance
          is hidden. So the first step locks in the amount, only that amount is then revealed, and a
          second step pays you out. Your funds are never stranded if the second step fails.
        </Info>
      </div>
      <ol className="space-y-1 text-2xs text-ink-muted">
        <li className="flex gap-2">
          <span className="font-mono text-ink-faint">1.</span> Set aside the amount confidentially on-chain.
        </li>
        <li className="flex gap-2">
          <span className="font-mono text-ink-faint">2.</span> Reveal just that amount, then release your public token.
        </li>
      </ol>
    </div>
  );
}

function safeParse(amount: string, decimals: number): bigint | null {
  if (!amount) return null;
  try {
    return parseUnits(amount as `${number}`, decimals);
  } catch {
    return null;
  }
}

/** Encrypted-input handles/proofs come back as Uint8Array or hex; normalize. */
function toHex(v: unknown): `0x${string}` {
  if (typeof v === "string") return (v.startsWith("0x") ? v : `0x${v}`) as `0x${string}`;
  return bytesToHex(v as Uint8Array);
}
function toHexBytes(v: unknown): `0x${string}` {
  return toHex(v);
}
function bytesToHex(bytes: Uint8Array): `0x${string}` {
  let s = "0x";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s as `0x${string}`;
}
