"use client";

import { useRouter } from "next/navigation";
import { Intro } from "@/components/Intro";
import { RegistryExplorer, type TokenAction } from "@/components/registry/RegistryExplorer";
import { PageGuide } from "@/components/learn/PageGuide";
import type { EnrichedPair } from "@/lib/registry/types";

export function RegistryView() {
  const router = useRouter();
  const open = (p: EnrichedPair, action?: TokenAction) =>
    router.push(`/token/${p.confidentialToken}${action ? `?action=${action}` : ""}`);
  return (
    <>
      <Intro />
      <div className="mb-5">
        <PageGuide
          id="registry"
          intro="The registry is the official directory of public tokens that have an approved confidential twin. This page reads it live from the blockchain — nothing is hardcoded."
          points={[
            {
              label: "Always live",
              body: "Every pair comes straight from the official on-chain registry on both networks. New ones show up here on their own — switch networks with the toggle up top.",
            },
            {
              label: "Active vs Revoked",
              body: "Retired pairs stay listed for history but are flagged, and wrapping is turned off for them. Filter and search to find a token fast (press / to search).",
            },
            {
              label: "Open a token",
              body: "Click Manage on any row to wrap, unwrap, reveal your balance, or claim test tokens for that pair. ⌘K jumps to any token from anywhere.",
            },
          ]}
        />
      </div>
      <RegistryExplorer onOpenPair={open} />
    </>
  );
}
