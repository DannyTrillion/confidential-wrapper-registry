import type { Metadata } from "next";
import { DocsView } from "@/components/views/DocsView";

export const metadata: Metadata = {
  title: "Guide — Confidential Wrapper Registry",
  description: "A plain-English guide to confidential tokens: what a wrapper registry is, how wrapping and revealing work, and why your balances stay confidential.",
};

export default function Page() {
  return <DocsView />;
}
