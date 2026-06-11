"use client";

import { useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { isAddress, getAddress, type Address } from "viem";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useDecryptSession } from "@/lib/fhevm/useDecryptSession";
import { setDecryptedValue, getDecryptedValue } from "@/lib/fhevm/decryptedCache";
import { useActionFlow } from "@/lib/useActionFlow";
import { useFlowToast } from "@/lib/useFlowToast";
import { ERC7984_WRAPPER_ABI, ZERO_HANDLE } from "@/lib/abis";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FlowFeedback } from "@/components/ui/FlowFeedback";
import { Address as AddressChip } from "@/components/ui/Address";
import { BalanceReveal, type RevealState } from "./BalanceReveal";
import { cn } from "@/lib/cn";

interface Resolved {
  address: Address;
  symbol?: string;
  decimals: number;
  value: bigint;
}

/**
 * Decrypt the connected wallet's balance for ANY ERC-7984 token — not just
 * registry pairs. Paste an address; we read its confidential balance handle and
 * metadata, then reveal it via the same one-signature session.
 */
export function ArbitraryDecrypt() {
  const { chainId } = useExplorerNetwork();
  const { address, chainId: walletChainId } = useAccount();
  const config = useConfig();
  const { decryptHandle } = useDecryptSession();
  const { state, run } = useActionFlow();
  useFlowToast(state, { label: "Reveal balance" });

  const [input, setInput] = useState("");
  const [result, setResult] = useState<Resolved | null>(null);
  const valid = isAddress(input.trim());

  async function onDecrypt() {
    if (!valid || !address) return;
    const token = getAddress(input.trim());
    const res = await run(
      async (setStep) => {
        const client = getPublicClient(config, { chainId });
        if (!client) throw new Error("No RPC client for this network.");

        setStep("Reading confidential balance…");
        const [bal, sym, dec] = await client.multicall({
          allowFailure: true,
          contracts: [
            { address: token, abi: ERC7984_WRAPPER_ABI, functionName: "confidentialBalanceOf", args: [address] },
            { address: token, abi: ERC7984_WRAPPER_ABI, functionName: "symbol" },
            { address: token, abi: ERC7984_WRAPPER_ABI, functionName: "decimals" },
          ],
        });
        if (bal.status !== "success") {
          throw new Error("This address doesn't expose an ERC-7984 confidential balance.");
        }
        const handle = bal.result as string;
        const decimals = dec.status === "success" ? Number(dec.result) : 6;
        const symbol = sym.status === "success" ? (sym.result as string) : undefined;
        if (!handle || handle === ZERO_HANDLE) {
          return { address: token, symbol, decimals, value: null as bigint | null };
        }

        const cached = getDecryptedValue(handle);
        const value =
          cached ?? (await decryptHandle(token, handle, [token], { onStep: setStep }));
        if (value != null) setDecryptedValue(handle, value);
        return { address: token, symbol, decimals, value };
      },
      { successMessage: "Balance revealed — only you can see it." },
    );
    if (res) {
      if (res.value == null) {
        setResult(null);
        // surfaced via the "no balance" note below using state
      } else {
        setResult({ address: res.address, symbol: res.symbol, decimals: res.decimals, value: res.value });
      }
    }
  }

  const revealState: RevealState | null = result ? { kind: "revealed", value: result.value } : null;

  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-ink">Reveal any balance</h3>
        <p className="text-13 text-ink-faint mt-0.5">
          Paste any confidential token address to reveal your balance — in the registry or not.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          placeholder="0x… ERC-7984 token address"
          spellCheck={false}
          className={cn(
            "flex-1 h-10 px-3 rounded-input bg-base border text-13 font-mono text-ink placeholder:text-ink-ghost outline-none transition-colors",
            input && !valid ? "border-danger/50" : "border-line focus-visible:border-accent/50",
          )}
        />
        <NetworkGuard targetChainId={chainId} action="reveal this balance">
          <Button
            variant="primary"
            onClick={onDecrypt}
            disabled={!valid}
            loading={state.status === "pending"}
            className="sm:w-auto w-full"
          >
            Reveal
          </Button>
        </NetworkGuard>
      </div>
      {input && !valid && <p className="text-2xs text-danger">That doesn&apos;t look like an address.</p>}

      {result && revealState && (
        <div className="rounded-input border border-line glass-soft p-4 flex items-center justify-between gap-3 animate-rise-in">
          <div className="min-w-0">
            <AddressChip address={result.address} chainId={chainId} />
            <div className="mt-1.5">
              <BalanceReveal state={revealState} decimals={result.decimals} symbol={result.symbol} />
            </div>
          </div>
        </div>
      )}

      <FlowFeedback state={state} />
    </Card>
  );
}
