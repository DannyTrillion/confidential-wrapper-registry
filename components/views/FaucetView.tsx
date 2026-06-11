"use client";

import { useMemo } from "react";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { getNetwork } from "@/lib/networks";
import { sepolia } from "wagmi/chains";
import { Card } from "@/components/ui/Card";
import { NetworkGuard } from "@/components/NetworkGuard";
import { FaucetPanel } from "@/components/registry/FaucetPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIdentity } from "@/components/registry/TokenIdentity";
import { PageGuide } from "@/components/learn/PageGuide";
import { PageHeader } from "./BalancesView";

export function FaucetView() {
  const { chainId, setChainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { data: pairs, isLoading } = useRegistryPairs(chainId);
  const claimable = useMemo(() => (pairs ?? []).filter((p) => p.isValid), [pairs]);

  return (
    <div className="space-y-5">
      <PageHeader
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
            <button onClick={() => setChainId(sepolia.id)} className="text-accent hover:underline">
              Sepolia
            </button>{" "}
            only. Mainnet tokens have real value and can&apos;t be minted.
          </p>
        </Card>
      ) : isLoading ? (
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
        </NetworkGuard>
      )}
    </div>
  );
}
