import type { Metadata } from "next";
import { DecryptView } from "@/components/views/DecryptView";

export const metadata: Metadata = {
  title: "Reveal a balance — Confidential Wrapper Registry",
  description:
    "Privately reveal your balance for any ERC-7984 confidential token — registered or not. Approve once with your wallet; only you see the result.",
};

export default function Page() {
  return <DecryptView />;
}
