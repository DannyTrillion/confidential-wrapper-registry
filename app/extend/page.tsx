import type { Metadata } from "next";
import { ExtendView } from "@/components/views/ExtendView";

export const metadata: Metadata = {
  title: "Add a pair — Confidential Wrapper Registry",
  description:
    "Extend the registry: register an ERC-20 ↔ ERC-7984 pair on-chain, or declare a custom one locally. An interactive builder verifies the addresses and gives you the exact config line.",
};

export default function Page() {
  return <ExtendView />;
}
