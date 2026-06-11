"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import type { Address } from "viem";
import { ERC7984_WRAPPER_ABI, ZERO_HANDLE } from "@/lib/abis";
import type { EnrichedPair } from "@/lib/registry/types";
import type { SupportedChainId } from "@/lib/networks";

export interface Holding {
  pair: EnrichedPair;
  /** The encrypted balance handle (guaranteed non-zero here). */
  handle: string;
}

/**
 * Reads the user's confidential balance handle for every VALID wrapper on the
 * network in a single multicall, and keeps only the wrappers where a balance
 * actually exists (handle ≠ bytes32(0)). This powers the portfolio: one read,
 * then one signature decrypts them all.
 */
export function useMyBalances(
  chainId: SupportedChainId,
  account: Address | undefined,
  pairs: EnrichedPair[],
) {
  const config = useConfig();
  const wrappers = pairs.filter((p) => p.isValid).map((p) => p.confidentialToken);

  return useQuery({
    queryKey: ["my-balances", chainId, account, wrappers],
    enabled: !!account && wrappers.length > 0,
    staleTime: 15_000,
    queryFn: async (): Promise<Holding[]> => {
      const client = getPublicClient(config, { chainId });
      if (!client || !account) return [];
      const valid = pairs.filter((p) => p.isValid);

      const res = await client.multicall({
        allowFailure: true,
        contracts: valid.map((p) => ({
          address: p.confidentialToken,
          abi: ERC7984_WRAPPER_ABI,
          functionName: "confidentialBalanceOf" as const,
          args: [account],
        })),
      });

      const holdings: Holding[] = [];
      valid.forEach((p, i) => {
        const r = res[i];
        const handle = r?.status === "success" ? (r.result as string) : ZERO_HANDLE;
        if (handle && handle !== ZERO_HANDLE) holdings.push({ pair: p, handle });
      });
      return holdings;
    },
  });
}
