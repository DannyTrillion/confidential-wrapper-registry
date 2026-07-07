"use client";

import type { Address } from "viem";
import { useTokenActivity } from "@/lib/registry/useTokenActivity";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAmount, truncateAddress } from "@/lib/format";
import { explorerTxUrl, explorerAddressUrl, type SupportedChainId } from "@/lib/networks";

/** Compact recent-unwrap feed for a wrapper, read from on-chain logs. */
export function TokenActivity({
  wrapper,
  chainId,
  decimals,
  symbol,
}: {
  wrapper: Address;
  chainId: SupportedChainId;
  decimals: number;
  symbol?: string;
}) {
  const { data, isLoading, isError } = useTokenActivity(wrapper, chainId);

  return (
    <Card className="p-4">
      <div className="text-2xs text-ink-faint uppercase tracking-wide mb-3">Recent unwraps</div>
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-2xs text-ink-faint">Couldn&apos;t load activity from the RPC right now.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-2xs text-ink-faint">No unwraps in the recent window yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((a, i) => (
            <li key={`${a.txHash}-${i}`} className="flex items-center justify-between gap-3 text-13">
              <a
                href={explorerAddressUrl(chainId, a.receiver)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-2xs text-ink-muted hover:text-ink transition-colors"
                title={a.receiver}
              >
                {truncateAddress(a.receiver)}
              </a>
              <span className="font-mono text-2xs tabular-nums text-ink">
                {formatAmount(a.amount, decimals)} {symbol}
              </span>
              <a
                href={explorerTxUrl(chainId, a.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xs text-ink-faint hover:text-ink transition-colors shrink-0"
              >
                tx ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
