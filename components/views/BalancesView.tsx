"use client";

import { useRouter } from "next/navigation";
import { Portfolio } from "@/components/registry/Portfolio";
import { PageGuide } from "@/components/learn/PageGuide";
import type { EnrichedPair } from "@/lib/registry/types";

export function BalancesView() {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <PageHeader
        title="My Balances"
        subtitle="Every confidential balance you hold across the registry — reveal them all with one approval."
      />
      <PageGuide
        id="balances"
        points={[
          {
            label: "Hidden until you reveal",
            body: "On-chain, every amount is scrambled. We can see which confidential tokens you hold a balance in, but the numbers stay hidden until you choose to reveal them.",
          },
          {
            label: "One approval for all",
            body: "Hit “Reveal all” to approve once with your wallet (a free signature, no fee); every balance then unlocks at once — no approving them one by one.",
          },
          {
            label: "Reveal any confidential token",
            body: "Use the “Reveal a balance” page to unlock your amount for any confidential token by address — even ones outside this registry.",
          },
        ]}
      />
      <Portfolio
        onOpenPair={(p: EnrichedPair) => router.push(`/token/${p.confidentialToken}`)}
        onBrowse={() => router.push("/")}
      />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  center,
}: {
  title: string;
  subtitle: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : undefined}>
      <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">{title}</h1>
      <p className={`mt-1 text-13 text-ink-faint max-w-2xl leading-relaxed${center ? " mx-auto" : ""}`}>
        {subtitle}
      </p>
    </div>
  );
}
