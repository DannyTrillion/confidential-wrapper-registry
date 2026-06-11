"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useActiveRect } from "@/lib/hooks/useActiveRect";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { getNetwork } from "@/lib/networks";
import { sameAddress } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Address } from "@/components/ui/Address";
import { Skeleton } from "@/components/ui/Skeleton";
import { NetworkGuard } from "@/components/NetworkGuard";
import { PairFlow } from "@/components/fx/PairFlow";
import { TokenIdentity } from "@/components/registry/TokenIdentity";
import { TokenActivity } from "@/components/registry/TokenActivity";
import { PageGuide } from "@/components/learn/PageGuide";
import { DecryptPanel } from "@/components/registry/DecryptPanel";
import { WrapPanel } from "@/components/registry/WrapPanel";
import { UnwrapPanel } from "@/components/registry/UnwrapPanel";
import { FaucetPanel } from "@/components/registry/FaucetPanel";

type Tab = "decrypt" | "wrap" | "unwrap" | "faucet";

export function TokenDetail({ address }: { address: string }) {
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { data: pairs, isLoading } = useRegistryPairs(chainId);

  const pair = useMemo(
    () =>
      (pairs ?? []).find(
        (p) => sameAddress(p.confidentialToken, address) || sameAddress(p.token, address),
      ),
    [pairs, address],
  );

  // Deep link: rows in the registry link to ?action=wrap|unwrap|reveal|faucet so
  // a user lands straight on the right tab.
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const [tab, setTab] = useState<Tab>(() => actionToTab(actionParam, net.supportsFaucet) ?? "decrypt");
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabInd = useActiveRect(tabBarRef, [tab, pair?.confidentialToken]);

  useEffect(() => {
    const t = actionToTab(actionParam, net.supportsFaucet);
    if (t) setTab(t);
  }, [actionParam, net.supportsFaucet]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!pair) {
    return (
      <Card className="px-4 py-12 text-center">
        <h2 className="text-sm font-medium text-ink">Not a registered pair on {net.name}</h2>
        <p className="mt-1.5 text-13 text-ink-faint max-w-md mx-auto">
          This address isn&apos;t in the {net.name} registry. You can still decrypt any ERC-7984
          balance you hold from the Decrypt page.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link href="/" className="text-13 text-accent hover:underline">← Registry</Link>
          <span className="text-ink-ghost">·</span>
          <Link href="/decrypt" className="text-13 text-accent hover:underline">Decrypt any token →</Link>
        </div>
      </Card>
    );
  }

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "decrypt", label: "Reveal", show: true },
    { key: "wrap", label: "Wrap", show: true },
    { key: "unwrap", label: "Unwrap", show: true },
    { key: "faucet", label: "Faucet", show: net.supportsFaucet },
  ];

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1.5 text-13 text-ink-faint hover:text-ink transition-colors">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="M10 4 6 8l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Registry
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg text-ink">{pair.underlying.symbol ?? "ERC-20"}</span>
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-ghost" fill="none" aria-hidden="true">
            <path d="M3 8h9M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-lg text-accent">{pair.wrapper.symbol ?? "cToken"}</span>
        </div>
        <div className="flex items-center gap-2">
          {pair.isValid ? <Badge tone="valid" dot>Active</Badge> : <Badge tone="revoked" dot>Revoked</Badge>}
          {pair.source === "local" && <Badge tone="accent">Local</Badge>}
          <span className="text-2xs text-ink-faint">{net.name}</span>
        </div>
      </div>

      <PageGuide
        id="token"
        intro={`Everything you can do with this pair — wrap ${pair.underlying.symbol ?? "the public token"} into ${pair.wrapper.symbol ?? "its confidential twin"}, move it confidentially, then unwrap it back.`}
        points={[
          {
            label: "Get test tokens",
            body: `Need some to play with? Claim free ${pair.underlying.symbol ?? "tokens"} from the Faucet tab, then come back to wrap.`,
          },
          {
            label: "Wrap",
            body: "Approve an exact amount, then deposit. You get back an equal confidential balance that only you can read.",
          },
          {
            label: "Reveal",
            body: "Your balance is hidden by default. Unlock it with one quick wallet approval in the Reveal tab — only you can see it.",
          },
          {
            label: "Unwrap",
            body: "Turn the confidential token back into the public one. Only the exact amount you withdraw is revealed, to release your funds.",
          },
        ]}
      />

      {/* Two columns on desktop: overview + actions */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
        <div className="space-y-3">
          <PairFlow pair={pair} />
          <Card className="p-4 space-y-3">
            <SectionLabel>Public token (ERC-20)</SectionLabel>
            <TokenIdentity meta={pair.underlying} address={pair.token} />
            <Row label="Address" value={<Address address={pair.token} chainId={chainId} />} />
            <Row label="Decimals" value={<Mono>{pair.underlying.decimals ?? "—"}</Mono>} />
            <div className="h-px bg-line" />
            <SectionLabel>Confidential twin (ERC-7984)</SectionLabel>
            <TokenIdentity meta={pair.wrapper} address={pair.confidentialToken} confidential />
            <Row label="Address" value={<Address address={pair.confidentialToken} chainId={chainId} />} />
            <Row label="Decimals" value={<Mono>{pair.wrapper.decimals ?? "—"}</Mono>} />
            <Row label="Balances" value={<span className="text-13 text-ink-muted">Hidden (encrypted)</span>} />
          </Card>
          <TokenActivity
            wrapper={pair.confidentialToken as `0x${string}`}
            chainId={chainId}
            decimals={pair.wrapper.decimals ?? 6}
            symbol={pair.wrapper.symbol}
          />
        </div>

        <Card className="overflow-hidden">
          {pair.isValid ? (
            <>
              <div ref={tabBarRef} className="relative px-2 pt-1.5 border-b border-line flex items-center gap-1 overflow-x-auto">
                {tabs.filter((t) => t.show).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    data-active={tab === t.key ? "true" : undefined}
                    className={cn(
                      "relative px-3.5 py-2.5 text-13 font-medium whitespace-nowrap transition-colors duration-200",
                      tab === t.key ? "text-ink" : "text-ink-faint hover:text-ink-muted",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
                {/* Underline that glides to the active tab. */}
                <span
                  className="absolute bottom-0 h-0.5 rounded-pill bg-accent transition-all duration-250 ease-out"
                  style={{ left: tabInd.left + 14, width: Math.max(0, tabInd.width - 28), opacity: tabInd.visible ? 1 : 0 }}
                  aria-hidden="true"
                />
              </div>
              <div key={tab} className="p-5 animate-rise-in">
                {tab === "decrypt" && <DecryptPanel pair={pair} chainId={chainId} />}
                {tab === "wrap" && (
                  <NetworkGuard targetChainId={chainId} action={`wrap ${pair.underlying.symbol ?? "tokens"}`}>
                    <WrapPanel pair={pair} chainId={chainId} />
                  </NetworkGuard>
                )}
                {tab === "unwrap" && (
                  <NetworkGuard targetChainId={chainId} action={`unwrap ${pair.wrapper.symbol ?? "tokens"}`}>
                    <UnwrapPanel pair={pair} chainId={chainId} />
                  </NetworkGuard>
                )}
                {tab === "faucet" && (
                  <NetworkGuard targetChainId={chainId} action="claim test tokens">
                    <FaucetPanel pair={pair} chainId={chainId} />
                  </NetworkGuard>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Badge tone="revoked" dot>Revoked</Badge>
              <p className="mt-3 text-13 text-ink-muted max-w-sm mx-auto">
                This pair was revoked in the registry. Wrapping and unwrapping are disabled to protect
                users; the record stays on-chain and you can still decrypt any existing balance.
              </p>
              <div className="mt-4 max-w-sm mx-auto text-left">
                <DecryptPanel pair={pair} chainId={chainId} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Map a ?action= deep-link value to a tab, honouring faucet availability. */
function actionToTab(action: string | null, supportsFaucet: boolean): Tab | null {
  switch (action) {
    case "wrap":
      return "wrap";
    case "unwrap":
      return "unwrap";
    case "faucet":
      return supportsFaucet ? "faucet" : "decrypt";
    case "reveal":
    case "decrypt":
      return "decrypt";
    default:
      return null;
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-2xs text-ink-faint uppercase tracking-wide">{children}</div>;
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-13 text-ink-faint">{label}</span>
      <span className="min-w-0">{value}</span>
    </div>
  );
}
function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-13 text-ink-muted tabular-nums">{children}</span>;
}
