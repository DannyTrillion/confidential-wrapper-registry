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
    // Demo of the hybrid registry — a pair that is NOT in the onchain registry.
    // Generate a real one in seconds:
    //   cd contracts && SEPOLIA_RPC_URL=... DEPLOYER_PRIVATE_KEY=0x... npm run deploy:custom
    // then paste the two printed addresses below and reload. It appears tagged
    // "Local" and is fully wrappable / unwrappable / revealable.
    // { token: "0xYourErc20…", confidentialToken: "0xYourErc7984Wrapper…" },
  ],
  [mainnet.id]: [],
};

export function getCustomPairs(chainId: SupportedChainId): CustomPair[] {
  return CUSTOM_PAIRS[chainId] ?? [];
}
