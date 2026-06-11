"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { parseAbiItem, zeroAddress, type Address } from "viem";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import type { EnrichedPair } from "./types";

const UNWRAP_FINALIZED = parseAbiItem(
  "event UnwrapFinalized(address indexed receiver, bytes32 indexed unwrapRequestId, bytes32 encryptedAmount, uint64 cleartextAmount)",
);
// euint64 is bytes32 on the wire; all three params are indexed.
const CONFIDENTIAL_TRANSFER = parseAbiItem(
  "event ConfidentialTransfer(address indexed from, address indexed to, bytes32 indexed amount)",
);
const REGISTERED = parseAbiItem(
  "event ConfidentialTokenRegistered(address indexed tokenAddress, address indexed confidentialTokenAddress)",
);
const REVOKED = parseAbiItem(
  "event ConfidentialTokenRevoked(address indexed tokenAddress, address indexed confidentialTokenAddress)",
);

const LOOKBACK = 45_000n;

export type GlobalActivityItem =
  | {
      type: "unwrap";
      symbol?: string;
      decimals: number;
      receiver: Address;
      amount: bigint;
      txHash: string;
      blockNumber: bigint;
    }
  | {
      // Wrap (mint) or confidential transfer — amount is encrypted, so no value.
      type: "wrap" | "transfer";
      symbol?: string;
      from: Address;
      to: Address;
      txHash: string;
      blockNumber: bigint;
    }
  | {
      type: "registered" | "revoked";
      symbol?: string;
      confidential: Address;
      txHash: string;
      blockNumber: bigint;
    };

/**
 * Registry-wide recent activity: finalized unwraps across every wrapper (one
 * batched getLogs over an address array) plus registry register/revoke events.
 * Bounded block window so public RPCs accept it; failures degrade to empty.
 */
export function useGlobalActivity(chainId: SupportedChainId, pairs: EnrichedPair[]) {
  const config = useConfig();
  const valid = pairs.filter((p) => p.isValid);
  const wrappers = valid.map((p) => p.confidentialToken as Address);
  const net = getNetwork(chainId);

  return useQuery({
    queryKey: ["global-activity", chainId, wrappers.length],
    enabled: wrappers.length > 0,
    staleTime: 30_000,
    retry: 0,
    queryFn: async (): Promise<GlobalActivityItem[]> => {
      const client = getPublicClient(config, { chainId });
      if (!client || !net) return [];
      const latest = await client.getBlockNumber();
      const fromBlock = latest > LOOKBACK ? latest - LOOKBACK : 0n;
      const byWrapper = new Map(valid.map((p) => [p.confidentialToken.toLowerCase(), p]));
      const items: GlobalActivityItem[] = [];

      const symOfWrapper = (addr: string) => byWrapper.get(addr.toLowerCase())?.wrapper.symbol;

      try {
        const logs = await client.getLogs({ address: wrappers, event: UNWRAP_FINALIZED, fromBlock, toBlock: latest });
        for (const l of logs) {
          const p = byWrapper.get((l.address as string).toLowerCase());
          items.push({
            type: "unwrap",
            symbol: p?.wrapper.symbol,
            decimals: p?.wrapper.decimals ?? 6,
            receiver: l.args.receiver as Address,
            amount: (l.args.cleartextAmount as bigint) ?? 0n,
            txHash: l.transactionHash ?? "",
            blockNumber: l.blockNumber ?? 0n,
          });
        }
      } catch {
        /* ignore — feed degrades to whatever loaded */
      }

      try {
        const logs = await client.getLogs({ address: wrappers, event: CONFIDENTIAL_TRANSFER, fromBlock, toBlock: latest });
        for (const l of logs) {
          const from = l.args.from as Address;
          const to = l.args.to as Address;
          // Burns (to == 0) are the unwrap-request side, already covered by the
          // finalized-unwrap rows — skip to avoid double-listing.
          if (to === zeroAddress) continue;
          items.push({
            type: from === zeroAddress ? "wrap" : "transfer",
            symbol: symOfWrapper(l.address as string),
            from,
            to,
            txHash: l.transactionHash ?? "",
            blockNumber: l.blockNumber ?? 0n,
          });
        }
      } catch {
        /* transfers optional */
      }

      try {
        const symOf = (conf: string) =>
          valid.find((p) => p.confidentialToken.toLowerCase() === conf.toLowerCase())?.wrapper.symbol;
        const [reg, rev] = await Promise.all([
          client.getLogs({ address: net.registry, event: REGISTERED, fromBlock, toBlock: latest }),
          client.getLogs({ address: net.registry, event: REVOKED, fromBlock, toBlock: latest }),
        ]);
        for (const l of reg)
          items.push({
            type: "registered",
            confidential: l.args.confidentialTokenAddress as Address,
            symbol: symOf(l.args.confidentialTokenAddress as string),
            txHash: l.transactionHash ?? "",
            blockNumber: l.blockNumber ?? 0n,
          });
        for (const l of rev)
          items.push({
            type: "revoked",
            confidential: l.args.confidentialTokenAddress as Address,
            symbol: symOf(l.args.confidentialTokenAddress as string),
            txHash: l.transactionHash ?? "",
            blockNumber: l.blockNumber ?? 0n,
          });
      } catch {
        /* registry events optional */
      }

      items.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      return items.slice(0, 40);
    },
  });
}
