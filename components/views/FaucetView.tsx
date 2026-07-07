"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { getNetwork } from "@/lib/networks";
import { ERC20_ABI } from "@/lib/abis";
import { sepolia } from "wagmi/chains";
import { Card } from "@/components/ui/Card";
import { NetworkGuard } from "@/components/NetworkGuard";
import { FaucetPanel } from "@/components/registry/FaucetPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIdentity } from "@/components/registry/TokenIdentity";
import { PageGuide } from "@/components/learn/PageGuide";
import { PageHeader } from "./PageHeader";

export function FaucetView() {
  const { chainId, setChainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const config = useConfig();
  const { data: pairs, isLoading } = useRegistryPairs(chainId);
  const active = useMemo(() => (pairs ?? []).filter((p) => p.isValid), [pairs]);

  // Not every registered underlying is faucetable: the official list mixes
  // public-mint mocks with restricted tokens (tGBP, steakcUSDC). Probe each
  // one with an eth_call simulation of mint() so we only offer claims that
  // will actually succeed — and say so for the rest.
  const { data: mintableIdx, isLoading: probing } = useQuery({
    queryKey: ["faucet-mintable", chainId, active.map((p) => p.token).join(",")],
    enabled: net.supportsFaucet && active.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const client = getPublicClient(config, { chainId });
      if (!client) return [] as number[];
      const probe = "0x1111111111111111111111111111111111111111" as const;
      const results = await Promise.all(
        active.map(async (p) => {
          try {
            await client.simulateContract({
              address: p.token,
              abi: ERC20_ABI,
              functionName: "mint",
              args: [probe, 1n],
              account: probe,
            });
            return p.index;
          } catch {
            return null;
          }
        }),
      );
      return results.filter((i): i is number => i != null);
    },
  });
  const claimable = useMemo(
    () => (mintableIdx ? active.filter((p) => mintableIdx.includes(p.index)) : []),
    [active, mintableIdx],
  );
  const restricted = useMemo(
    () => (mintableIdx ? active.filter((p) => !mintableIdx.includes(p.index)) : []),
    [active, mintableIdx],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sepolia testnet"
        title="Test token faucet"
        subtitle="Grab free practice tokens on the Sepolia test network, then wrap them into confidential ones. One claim per token, per hour."
      />
      <PageGuide
        id="faucet"
        points={[
          {
            label: "Claim free tokens",
            body: "Each card sends practice tokens straight to your wallet on the test network. These are the public tokens you'll turn confidential.",
          },
          {
            label: "Then make them confidential",
            body: "Open a token and hit Wrap to turn your practice token into its confidential twin — that's where the encryption begins.",
          },
          {
            label: "One per hour",
            body: "You can claim each token once an hour — a countdown ring shows when the next claim unlocks. Real (mainnet) tokens have value and can't be minted.",
          },
        ]}
      />

      {!net.supportsFaucet ? (
        <Card className="px-4 py-10 text-center">
          <p className="text-13 text-ink-muted">
            The faucet mints testnet mock tokens — available on{" "}
            <button onClick={() => setChainId(sepolia.id)} className="text-ink hover:underline">
              Sepolia
            </button>{" "}
            only. Mainnet tokens have real value and can&apos;t be minted.
          </p>
        </Card>
      ) : isLoading || probing ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <NetworkGuard targetChainId={chainId} action="claim test tokens">
          <div className="grid sm:grid-cols-2 gap-3">
            {claimable.map((p) => (
              <Card key={p.index} className="p-4 space-y-3">
                <TokenIdentity meta={p.underlying} address={p.token} />
                <FaucetPanel pair={p} chainId={chainId} />
              </Card>
            ))}
          </div>
          {restricted.length > 0 && (
            <p className="mt-3 text-2xs text-ink-ghost">
              Not faucetable (restricted mint):{" "}
              <span className="font-mono text-ink-faint">
                {restricted.map((p) => p.underlying.symbol ?? "?").join(" · ")}
              </span>{" "}
              — these are official tokens without a public mint; wrap them from an existing balance instead.
            </p>
          )}
        </NetworkGuard>
      )}
    </div>
  );
}
