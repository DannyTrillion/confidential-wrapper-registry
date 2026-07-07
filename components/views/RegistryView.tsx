"use client";

import { useRouter } from "next/navigation";
import { RegistryExplorer, type TokenAction } from "@/components/registry/RegistryExplorer";
import { ProductDeck } from "@/components/registry/ProductDeck";
import type { EnrichedPair } from "@/lib/registry/types";

/**
 * Registry — one job: browsing pairs. The stat strip is the page header, the
 * pair table starts within the first screen, and everything personal lives on
 * /portfolio (linked from a single summary line inside the strip).
 */
export function RegistryView() {
  const router = useRouter();
  const open = (p: EnrichedPair, action?: TokenAction) =>
    router.push(`/token/${p.confidentialToken}${action ? `?action=${action}` : ""}`);

  return (
    <>
      <h1 className="sr-only">Confidential Wrapper Registry</h1>
      <RegistryExplorer onOpenPair={open} />
      <ProductDeck />
    </>
  );
}
