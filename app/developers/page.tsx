import type { Metadata } from "next";
import { DevelopersView } from "@/components/views/DevelopersView";

export const metadata: Metadata = {
  title: "Developer Kit — Confidential Wrapper Registry",
  description:
    "Build on the official Zama Confidential Token Wrappers Registry: copy-paste-accurate wagmi/viem + relayer-SDK snippets for reading pairs, wrapping, revealing balances, and unwrapping on Sepolia and Ethereum mainnet.",
};

export default function Page() {
  return <DevelopersView />;
}
