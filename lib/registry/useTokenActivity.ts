"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { parseAbiItem, type Address } from "viem";
import type { SupportedChainId } from "@/lib/networks";

const UNWRAP_FINALIZED = parseAbiItem(
  "event UnwrapFinalized(address indexed receiver, bytes32 indexed unwrapRequestId, bytes32 encryptedAmount, uint64 cleartextAmount)",
);

const LOOKBACK = 45_000n; // bounded range so public RPCs don't reject the query

export interface ActivityItem {
  receiver: Address;
  amount: bigint;
  txHash: string;
  blockNumber: bigint;
}

/**
 * Recent finalized unwraps for a wrapper — the one wrap-lifecycle event that
 * carries a revealed cleartext amount on-chain. Bounded to a recent block window
 * so public RPCs accept the getLogs call; empties/errors degrade gracefully.
 */
export function useTokenActivity(wrapper: Address, chainId: SupportedChainId) {
  const config = useConfig();
  return useQuery({
    queryKey: ["token-activity", chainId, wrapper],
    staleTime: 30_000,
    retry: 0,
    queryFn: async (): Promise<ActivityItem[]> => {
      const client = getPublicClient(config, { chainId });
      if (!client) return [];
      const latest = await client.getBlockNumber();
      const fromBlock = latest > LOOKBACK ? latest - LOOKBACK : 0n;
      const logs = await client.getLogs({ address: wrapper, event: UNWRAP_FINALIZED, fromBlock, toBlock: latest });
      return logs
        .slice(-12)
        .reverse()
        .map((l) => ({
          receiver: l.args.receiver as Address,
          amount: (l.args.cleartextAmount as bigint) ?? 0n,
          txHash: l.transactionHash ?? "",
          blockNumber: l.blockNumber ?? 0n,
        }));
    },
  });
}
