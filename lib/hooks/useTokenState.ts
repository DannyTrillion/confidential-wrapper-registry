"use client";

import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { ERC20_ABI } from "@/lib/abis";
import type { SupportedChainId } from "@/lib/networks";

/**
 * Reads the user's underlying ERC-20 state needed for wrapping: decimals,
 * symbol, balance, and current allowance to the wrapper (spender). Never
 * hardcodes decimals — always reads them.
 */
export function useUnderlyingTokenState({
  token,
  owner,
  spender,
  chainId,
  enabled = true,
}: {
  token: Address;
  owner?: Address;
  spender: Address;
  chainId: SupportedChainId;
  enabled?: boolean;
}) {
  const query = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: token, abi: ERC20_ABI, functionName: "decimals", chainId },
      { address: token, abi: ERC20_ABI, functionName: "symbol", chainId },
      {
        address: token,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: owner ? [owner] : undefined,
        chainId,
      },
      {
        address: token,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: owner ? [owner, spender] : undefined,
        chainId,
      },
    ],
    query: { enabled: enabled && !!owner, refetchOnWindowFocus: false },
  });

  const [decimals, symbol, balance, allowance] = query.data ?? [];

  return {
    ...query,
    decimals: decimals?.status === "success" ? Number(decimals.result) : undefined,
    symbol: symbol?.status === "success" ? (symbol.result as string) : undefined,
    balance: balance?.status === "success" ? (balance.result as bigint) : undefined,
    allowance: allowance?.status === "success" ? (allowance.result as bigint) : undefined,
  };
}
