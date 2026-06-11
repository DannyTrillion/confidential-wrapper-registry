"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import type { Address } from "viem";
import { REGISTRY_ABI, ERC20_ABI, ERC7984_WRAPPER_ABI } from "@/lib/abis";
import { getNetwork, type SupportedChainId } from "@/lib/networks";
import { getCustomPairs } from "./customPairs";
import { pairKey, type EnrichedPair, type TokenMeta, type TokenWrapperPair } from "./types";

const SLICE_SIZE = 50;

/**
 * Reads the ENTIRE registry for a network, data-driven:
 *  1. getTokenConfidentialTokenPairsLength()
 *  2. paginate getTokenConfidentialTokenPairsSlice() in chunks (fromIndex incl, toIndex excl)
 *  3. multicall-resolve ERC-20 + ERC-7984 metadata for every pair
 *
 * A newly registered pair appears automatically — there is no hardcoded list.
 * Revoked pairs (isValid=false) are returned and kept; the UI flags them.
 */
export function useRegistryPairs(chainId: SupportedChainId) {
  const config = useConfig();

  return useQuery({
    queryKey: ["registry-pairs", chainId],
    queryFn: async (): Promise<EnrichedPair[]> => {
      const net = getNetwork(chainId);
      if (!net) throw new Error(`Unsupported chain ${chainId}`);
      const client = getPublicClient(config, { chainId });
      if (!client) throw new Error("No RPC client available for this network");

      const registry = { address: net.registry, abi: REGISTRY_ABI } as const;

      const length = (await client.readContract({
        ...registry,
        functionName: "getTokenConfidentialTokenPairsLength",
      })) as bigint;

      const total = Number(length);

      // 1) Pull all onchain slices.
      const onchain: TokenWrapperPair[] = [];
      for (let from = 0; from < total; from += SLICE_SIZE) {
        const to = Math.min(from + SLICE_SIZE, total);
        const slice = (await client.readContract({
          ...registry,
          functionName: "getTokenConfidentialTokenPairsSlice",
          args: [BigInt(from), BigInt(to)],
        })) as readonly TokenWrapperPair[];
        onchain.push(...slice);
      }

      // 1b) Hybrid registry — merge local/dev pairs that aren't already onchain.
      const seen = new Set(onchain.map((p) => pairKey({ token: p.tokenAddress, confidentialToken: p.confidentialTokenAddress })));
      const localPairs = getCustomPairs(chainId).filter(
        (p) => !seen.has(pairKey({ token: p.token, confidentialToken: p.confidentialToken })),
      );

      const sources: ("onchain" | "local")[] = [
        ...onchain.map(() => "onchain" as const),
        ...localPairs.map(() => "local" as const),
      ];
      const pairs: TokenWrapperPair[] = [
        ...onchain,
        ...localPairs.map((p) => ({ tokenAddress: p.token, confidentialTokenAddress: p.confidentialToken, isValid: true })),
      ];

      if (pairs.length === 0) return [];

      // 2) Batch-resolve metadata for both sides via multicall.
      const underlyingMetas = await resolveMetas(
        client,
        pairs.map((p) => p.tokenAddress),
        ERC20_ABI,
      );
      const wrapperMetas = await resolveMetas(
        client,
        pairs.map((p) => p.confidentialTokenAddress),
        ERC7984_WRAPPER_ABI,
      );

      return pairs.map((p, i) => ({
        index: i,
        token: p.tokenAddress,
        confidentialToken: p.confidentialTokenAddress,
        isValid: p.isValid,
        source: sources[i],
        underlying: underlyingMetas[i],
        wrapper: wrapperMetas[i],
      }));
    },
    staleTime: 60_000,
  });
}

/**
 * Resolve name/symbol/decimals for a list of token addresses with a single
 * multicall. Per-token failures degrade gracefully (resolved=false) rather
 * than failing the whole load — important for unusual or self-destructed tokens.
 */
async function resolveMetas(
  client: NonNullable<ReturnType<typeof getPublicClient>>,
  addresses: Address[],
  abi: typeof ERC20_ABI | typeof ERC7984_WRAPPER_ABI,
): Promise<TokenMeta[]> {
  if (addresses.length === 0) return [];

  const calls = addresses.flatMap((address) => [
    { address, abi, functionName: "name" as const },
    { address, abi, functionName: "symbol" as const },
    { address, abi, functionName: "decimals" as const },
  ]);

  const results = await client.multicall({ contracts: calls, allowFailure: true });

  return addresses.map((_, i) => {
    const name = results[i * 3];
    const symbol = results[i * 3 + 1];
    const decimals = results[i * 3 + 2];
    const meta: TokenMeta = {
      name: name?.status === "success" ? (name.result as string) : undefined,
      symbol: symbol?.status === "success" ? (symbol.result as string) : undefined,
      decimals: decimals?.status === "success" ? Number(decimals.result) : undefined,
      resolved: symbol?.status === "success" && decimals?.status === "success",
    };
    return meta;
  });
}
