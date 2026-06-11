"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import type { Address } from "viem";
import { ERC20_ABI } from "@/lib/abis";
import type { EnrichedPair } from "@/lib/registry/types";
import type { SupportedChainId } from "@/lib/networks";

export interface UnderlyingHolding {
  pair: EnrichedPair;
  /** Underlying ERC-20 balance, guaranteed > 0 here. */
  balance: bigint;
}

/**
 * Reads the user's public ERC-20 balance for every valid pair's underlying in a
 * single multicall, keeping only the ones with a positive balance. Used by the
 * hero panel to suggest "Wrap" when a user holds tokens but nothing confidential
 * yet. `enabled` gates the read so it only runs when actually needed.
 */
export function useUnderlyingBalances(
  chainId: SupportedChainId,
  account: Address | undefined,
  pairs: EnrichedPair[],
  enabled: boolean,
) {
  const config = useConfig();
  const valid = pairs.filter((p) => p.isValid);

  return useQuery({
    queryKey: ["underlying-balances", chainId, account, valid.map((p) => p.token)],
    enabled: !!account && enabled && valid.length > 0,
    staleTime: 15_000,
    queryFn: async (): Promise<UnderlyingHolding[]> => {
      const client = getPublicClient(config, { chainId });
      if (!client || !account) return [];

      const res = await client.multicall({
        allowFailure: true,
        contracts: valid.map((p) => ({
          address: p.token,
          abi: ERC20_ABI,
          functionName: "balanceOf" as const,
          args: [account],
        })),
      });

      const out: UnderlyingHolding[] = [];
      valid.forEach((p, i) => {
        const r = res[i];
        const balance = r?.status === "success" ? (r.result as bigint) : 0n;
        if (balance > 0n) out.push({ pair: p, balance });
      });
      return out;
    },
  });
}
