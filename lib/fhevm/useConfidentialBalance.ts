"use client";

import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { ERC7984_WRAPPER_ABI, ZERO_HANDLE } from "@/lib/abis";
import type { SupportedChainId } from "@/lib/networks";

/**
 * Reads the user's confidential balance HANDLE (bytes32) from a wrapper.
 * The handle is opaque — decryption is a separate, signature-gated step.
 * A zero handle means the balance slot was never initialized ("no balance yet").
 */
export function useConfidentialBalance({
  wrapper,
  account,
  chainId,
  enabled = true,
}: {
  wrapper: Address;
  account?: Address;
  chainId: SupportedChainId;
  enabled?: boolean;
}) {
  const query = useReadContract({
    address: wrapper,
    abi: ERC7984_WRAPPER_ABI,
    functionName: "confidentialBalanceOf",
    args: account ? [account] : undefined,
    chainId,
    query: { enabled: enabled && !!account, refetchOnWindowFocus: false },
  });

  const handle = query.data as string | undefined;
  const isUninitialized = handle === ZERO_HANDLE;

  return { ...query, handle, isUninitialized };
}
