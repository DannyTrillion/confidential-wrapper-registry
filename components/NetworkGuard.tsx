"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { Button } from "./ui/Button";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import type { ReactNode } from "react";

/**
 * Gates an action on the wallet being connected to `targetChainId`. Renders a
 * one-click switch banner otherwise — covers the "wrong network" failure mode.
 */
export function NetworkGuard({
  targetChainId,
  children,
  action,
}: {
  targetChainId: SupportedChainId;
  children: ReactNode;
  action: string;
}) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const target = getNetwork(targetChainId)!;

  if (!isConnected) {
    return (
      <Notice tone="neutral">
        Connect your wallet to {action} on {target.name}.
      </Notice>
    );
  }

  if (chainId !== targetChainId) {
    return (
      <div className="rounded-input border border-warn/20 bg-warn/5 px-3 py-3 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-pill bg-warn shrink-0" />
          <p className="text-13 text-ink">
            Your wallet is on a different network. Switch to{" "}
            <span className="font-medium text-ink">{target.name}</span> to {action}.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={() => switchChain({ chainId: targetChainId })}
        >
          Switch to {target.shortName}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

function Notice({ children, tone }: { children: ReactNode; tone: "neutral" }) {
  return (
    <div className="rounded-input border border-line glass-soft px-3 py-3 text-13 text-ink-muted">
      {children}
    </div>
  );
}
