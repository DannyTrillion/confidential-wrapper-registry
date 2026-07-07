"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, type Address } from "viem";
import type { EnrichedPair } from "@/lib/registry/types";
import { useUnderlyingTokenState } from "@/lib/hooks/useTokenState";
import { useWriteAndWait } from "@/lib/hooks/useWriteAndWait";
import { useActionFlow } from "@/lib/useActionFlow";
import { useFaucetCooldown, formatCountdown } from "@/lib/hooks/useFaucetCooldown";
import { ERC20_ABI } from "@/lib/abis";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import { Button } from "@/components/ui/Button";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { AnimatedAmount } from "@/components/fx/AnimatedAmount";
import { useFlowToast } from "@/lib/useFlowToast";
import { cn } from "@/lib/cn";

const MINT_UNITS = 1000; // mint 1,000 underlying tokens per claim

export function FaucetPanel({ pair, chainId }: { pair: EnrichedPair; chainId: SupportedChainId }) {
  const { address } = useAccount();
  const net = getNetwork(chainId)!;
  const writeAndWait = useWriteAndWait();
  const { state, run } = useActionFlow();
  const [txHash, setTxHash] = useState<string>();
  useFlowToast(state, { label: `Faucet ${pair.underlying.symbol ?? "token"}`, chainId, txHash });

  const token = pair.token as Address;
  const { decimals, symbol, balance, refetch } = useUnderlyingTokenState({
    token,
    owner: address as Address | undefined,
    spender: pair.confidentialToken as Address,
    chainId,
  });
  const dec = decimals ?? pair.underlying.decimals ?? 18;
  const { remaining, markClaimed, cooldownSeconds } = useFaucetCooldown(chainId, token, address as string | undefined);
  const [justClaimed, setJustClaimed] = useState(false);

  if (!net.supportsFaucet) {
    return (
      <div className="rounded-input border border-line glass-soft px-3 py-3 text-13 text-ink-muted">
        The faucet mints Zama&apos;s testnet mock tokens — available on{" "}
        <span className="text-ink">Sepolia</span> only. Mainnet tokens have real value and
        can&apos;t be minted.
      </div>
    );
  }

  const mintAmount = parseUnits(String(MINT_UNITS), dec);
  const onCooldown = remaining > 0;

  async function onClaim() {
    if (!address) return;
    const hash = await run(
      async (setStep) => {
        setStep("Waiting for faucet signature…");
        return writeAndWait({
          address: token,
          abi: ERC20_ABI as never,
          functionName: "mint",
          args: [address, mintAmount],
          chainId,
          onSent: (h) => {
            setTxHash(h);
            setStep(`Minting on ${net.name}…`);
          },
        });
      },
      { successMessage: `Minted ${MINT_UNITS.toLocaleString()} ${symbol ?? pair.underlying.symbol}.` },
    );
    if (hash) {
      markClaimed();
      setJustClaimed(true);
      refetch();
    }
  }

  const cooldownPct = onCooldown ? (remaining / cooldownSeconds) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line glass-soft p-4">
        <div className="text-2xs text-ink-faint uppercase tracking-wide">
          Your {symbol ?? pair.underlying.symbol} balance
        </div>
        <div className="mt-1.5 font-mono text-xl text-ink tabular-nums">
          {balance != null ? (
            <span
              key={balance.toString()}
              className={justClaimed ? "inline-block animate-drop" : "inline-block"}
              onAnimationEnd={() => setJustClaimed(false)}
            >
              <AnimatedAmount value={balance} decimals={dec} />
            </span>
          ) : (
            "—"
          )}{" "}
          <span className="text-13 text-ink-faint">{symbol ?? pair.underlying.symbol}</span>
        </div>
      </div>

      <div className="rounded-input border border-line glass-soft px-3 py-2.5 text-2xs text-ink-faint leading-relaxed">
        Mints <span className="font-mono text-ink-muted">{MINT_UNITS.toLocaleString()}</span>{" "}
        {symbol ?? pair.underlying.symbol} to your address so you can wrap. Rate-limited to one
        claim per hour, per address.
      </div>

      {onCooldown ? (
        <div className="flex items-center justify-center gap-2.5 h-10 rounded-input border border-line bg-raised/50 text-13 text-ink-faint">
          <CountdownRing pct={cooldownPct} />
          Available in {formatCountdown(remaining)}
        </div>
      ) : (
        <Button
          variant="accentOutline"
          className={cn("w-full", state.status === "pending" && "btn-progress")}
          onClick={onClaim}
          loading={state.status === "pending"}
        >
          {state.status === "pending" && state.step ? (
            <span key={state.step} className="animate-fade-in">{state.step}</span>
          ) : (
            `Claim ${MINT_UNITS.toLocaleString()} ${symbol ?? pair.underlying.symbol}`
          )}
        </Button>
      )}

      <FlowFeedback state={state} chainId={chainId} txHash={txHash} />

      {state.status === "error" && (
        <p className="text-2xs text-ink-faint">
          Not every underlying token exposes a public mint. If this one doesn&apos;t, the faucet
          can&apos;t fund it — try a different mock pair.
        </p>
      )}
    </div>
  );
}

/** Small ring that depletes over the cooldown window. */
function CountdownRing({ pct }: { pct: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="9" cy="9" r={r} stroke="currentColor" strokeWidth="2" className="text-line" fill="none" />
      <circle
        cx="9"
        cy="9"
        r={r}
        stroke="currentColor"
        strokeWidth="2"
        className="text-ink/70 transition-[stroke-dashoffset] duration-1000 ease-linear"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
