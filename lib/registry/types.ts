import type { Address } from "viem";

/** Raw on-chain pair as returned by the registry slice. */
export interface TokenWrapperPair {
  tokenAddress: Address;
  confidentialTokenAddress: Address;
  isValid: boolean;
}

/** ERC-20 / ERC-7984 metadata resolved per token (may partially fail). */
export interface TokenMeta {
  name?: string;
  symbol?: string;
  decimals?: number;
  /** True when at least symbol+decimals resolved. */
  resolved: boolean;
}

/** A registry pair enriched with both sides' metadata, ready for the UI. */
export interface EnrichedPair {
  index: number;
  token: Address;
  confidentialToken: Address;
  isValid: boolean;
  /** Where this pair came from — the onchain registry, or local config. */
  source: "onchain" | "local";
  underlying: TokenMeta;
  wrapper: TokenMeta;
}

export function pairKey(p: { token: string; confidentialToken: string }): string {
  return `${p.token.toLowerCase()}:${p.confidentialToken.toLowerCase()}`;
}
