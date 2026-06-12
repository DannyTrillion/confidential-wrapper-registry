import type { Address } from "viem";
import { mainnet, sepolia } from "wagmi/chains";
import type { SupportedChainId } from "@/lib/networks";

/**
 * Local / dev-only ERC-20 ↔ ERC-7984 pairs.
 *
 * The app is a HYBRID registry: the onchain Wrappers Registry is the source of
 * truth, and these entries are merged in on top so teams can surface custom or
 * not-yet-registered pairs without redeploying. Onchain pairs win on conflicts;
 * local-only pairs are tagged "Local" in the UI.
 *
 * To add a pair: drop an entry under the right chain id and reload — metadata is
 * resolved on-chain automatically. Example (commented) below.
 */
export interface CustomPair {
  /** Underlying ERC-20 token address. */
  token: Address;
  /** ERC-7984 confidential wrapper address. */
  confidentialToken: Address;
}

export const CUSTOM_PAIRS: Record<SupportedChainId, CustomPair[]> = {
  [sepolia.id]: [
    // Demo of the hybrid registry — a real pair that is NOT in the onchain
    // registry, surfaced locally and tagged "Local" in the UI. Fully wrappable /
    // unwrappable / revealable. Deployed with `npm run deploy:custom` (see
    // contracts/scripts/deploy-custom-pair.ts) — add your own the same way.
    { token: "0x2035eab6DCfDb55DA1b737c07d340205e3BE3707", confidentialToken: "0xBe27b34855a9c7FFcDd068B34b2Fe303F82BdF26" },
  ],
  [mainnet.id]: [],
};

export function getCustomPairs(chainId: SupportedChainId): CustomPair[] {
  return CUSTOM_PAIRS[chainId] ?? [];
}
