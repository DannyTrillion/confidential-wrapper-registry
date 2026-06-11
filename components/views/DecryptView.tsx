"use client";

import { ArbitraryDecrypt } from "@/components/registry/ArbitraryDecrypt";
import { PageGuide } from "@/components/learn/PageGuide";
import { PageHeader } from "./BalancesView";

export function DecryptView() {
  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Reveal a balance"
        subtitle="Check your amount for any confidential token — whether it's in the registry or not. Paste an address; you approve once, and only you see the result."
      />
      <PageGuide
        id="decrypt"
        intro="A confidential token's amount is hidden on-chain. To see your own, you prove it's yours with a quick wallet approval — the value is never made public."
        points={[
          {
            label: "Paste an address",
            body: "Any confidential token works (ERC-7984) — a registry pair or your own. We look up your hidden balance for it.",
          },
          {
            label: "Approve, just once",
            body: "You sign a free, gas-less request from your wallet. That lets the value be unlocked to you alone — never on-chain, never to anyone else.",
          },
          {
            label: "Stay unlocked for a while",
            body: "Your approval is remembered, so further reveals — here or on any token page — need no new signature until the session expires.",
          },
        ]}
      />
      <ArbitraryDecrypt />
    </div>
  );
}
