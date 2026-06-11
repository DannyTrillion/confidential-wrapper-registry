import { http, createConfig, fallback } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

/**
 * wagmi v2 config. Injected connector keeps the wallet layer dependency-light
 * (MetaMask / Rabbit / any EIP-1193 provider). Public RPCs are used by default;
 * set NEXT_PUBLIC_*_RPC_URL to point at a private endpoint for production.
 */

const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const mainnetRpc = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Injected (MetaMask/Rabby/…) always; WalletConnect when a project id is set
// (for mobile + non-injected wallets). Get a free id at cloud.walletconnect.com.
const connectors = [
  injected(),
  ...(wcProjectId
    ? [
        walletConnect({
          projectId: wcProjectId,
          showQrModal: true,
          metadata: {
            name: "Confidential Wrapper Registry",
            description: "Wrap, unwrap, and decrypt ERC-7984 confidential tokens.",
            url: "https://localhost",
            icons: [],
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  connectors,
  transports: {
    [sepolia.id]: fallback([
      ...(sepoliaRpc ? [http(sepoliaRpc)] : []),
      http("https://ethereum-sepolia-rpc.publicnode.com"),
      http("https://rpc.sepolia.org"),
    ]),
    [mainnet.id]: fallback([
      ...(mainnetRpc ? [http(mainnetRpc)] : []),
      http("https://ethereum-rpc.publicnode.com"),
      http("https://eth.llamarpc.com"),
    ]),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
