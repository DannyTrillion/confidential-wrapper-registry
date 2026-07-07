"use client";

import { useMemo, useState } from "react";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { useGlobalActivity, type GlobalActivityItem } from "@/lib/registry/useGlobalActivity";
import { getNetwork, explorerTxUrl, explorerAddressUrl } from "@/lib/networks";
import { formatAmount, truncateAddress } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageGuide } from "@/components/learn/PageGuide";
import { PageHeader } from "./PageHeader";
import { cn } from "@/lib/cn";

type Filter = "all" | "wrap" | "transfer" | "unwrap" | "registry";

const FILTERS: { key: Filter; label: string; match: (t: GlobalActivityItem["type"]) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "wrap", label: "Wraps", match: (t) => t === "wrap" },
  { key: "transfer", label: "Transfers", match: (t) => t === "transfer" },
  { key: "unwrap", label: "Unwraps", match: (t) => t === "unwrap" },
  { key: "registry", label: "Registry", match: (t) => t === "registered" || t === "revoked" },
];

export function ActivityView() {
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { data: pairs, isLoading: pairsLoading } = useRegistryPairs(chainId);
  const { data, isLoading, isError } = useGlobalActivity(chainId, pairs ?? []);
  const loading = pairsLoading || isLoading;
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c = { wrap: 0, transfer: 0, unwrap: 0, registry: 0 };
    for (const it of data ?? []) {
      if (it.type === "registered" || it.type === "revoked") c.registry++;
      else c[it.type]++;
    }
    return c;
  }, [data]);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return (data ?? []).filter((it) => f.match(it.type));
  }, [data, filter]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Live feed"
        title="Activity"
        subtitle={`A live feed of what's happening across the ${net.name} registry — every wrap, confidential send, unwrap, and registry change, read straight from the blockchain.`}
      />

      <PageGuide
        id="activity"
        intro="This feed is rebuilt live from recent blockchain activity — nothing is stored off-chain."
        points={[
          {
            label: "Amounts stay hidden",
            body: (
              <>
                <span className="text-ink-muted">Wrapped</span> and{" "}
                <span className="text-ink-muted">Confidential send</span> rows show that something moved —
                but the amount is encrypted, so it appears as <em>hidden amount</em>. Only the sender
                and receiver can ever reveal it.
              </>
            ),
          },
          {
            label: "Unwraps show a public amount",
            body: (
              <>
                An <span className="text-ink-muted">Unwrapped</span> row is someone turning a confidential token back into a public one. Only the exact amount withdrawn is revealed (nothing
                else), so that number is public — you&apos;ll see it here.
              </>
            ),
          },
          {
            label: "Registry changes too",
            body: (
              <>
                <span className="text-ink-muted">Registered</span> / <span className="text-ink-muted">Revoked</span>{" "}
                rows are the directory&apos;s own updates — when a new public-to-confidential pair is added
                or retired. Filter by type with the tabs below.
              </>
            ),
          },
        ]}
      />

      {/* Type filter */}
      {!loading && (data?.length ?? 0) > 0 && (
        <div role="tablist" className="inline-flex items-center p-0.5 rounded-pill border border-line bg-base">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? data!.length
                : f.key === "registry"
                  ? counts.registry
                  : counts[f.key as "wrap" | "transfer" | "unwrap"];
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-3 rounded-pill text-2xs font-medium transition-colors duration-150",
                  filter === f.key ? "bg-elevate/[0.10] text-ink" : "text-ink-faint hover:text-ink-muted",
                )}
              >
                {f.label}
                <span className="font-mono tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <Card className="p-2 sm:p-3">
        {loading ? (
          <div className="p-2 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Empty text="Couldn't load activity from the RPC right now. Try again in a moment." />
        ) : !data || data.length === 0 ? (
          <Empty text="No activity in the recent block window. Wrap or unwrap a token to be the first." />
        ) : visible.length === 0 ? (
          <Empty text={`No ${filter} activity in this window.`} />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((item, i) => (
              <Row key={`${item.txHash}-${i}`} item={item} chainId={chainId} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ item, chainId }: { item: GlobalActivityItem; chainId: number }) {
  return (
    <li className="flex items-center gap-3 px-2.5 py-3 transition-colors hover:bg-elevate/[0.015] rounded-input">
      <Glyph type={item.type} />
      <div className="min-w-0 flex-1">
        <div className="text-13 text-ink">
          {item.type === "unwrap" ? (
            <>
              Unwrapped{" "}
              <span className="font-mono tabular-nums">{formatAmount(item.amount, item.decimals)}</span>{" "}
              <span className="text-ink-muted">{item.symbol ?? "cToken"}</span>
            </>
          ) : item.type === "wrap" ? (
            <>
              Wrapped <span className="text-ink-muted">{item.symbol ?? "cToken"}</span>{" "}
              <span className="text-2xs text-ink-faint">· hidden amount</span>
            </>
          ) : item.type === "transfer" ? (
            <>
              Confidential send <span className="text-ink-muted">{item.symbol ?? "cToken"}</span>{" "}
              <span className="text-2xs text-ink-faint">· hidden amount</span>
            </>
          ) : item.type === "registered" ? (
            <>
              Registered <span className="text-ink-muted">{item.symbol ?? "wrapper"}</span>
            </>
          ) : (
            <>
              Revoked <span className="text-ink-muted">{item.symbol ?? "wrapper"}</span>
            </>
          )}
        </div>
        <div className="text-2xs text-ink-faint mt-0.5 font-mono">
          {item.type === "unwrap" ? (
            <Addr chainId={chainId} addr={item.receiver} prefix="→ " />
          ) : item.type === "wrap" ? (
            <Addr chainId={chainId} addr={item.to} prefix="→ " />
          ) : item.type === "transfer" ? (
            <>
              <Addr chainId={chainId} addr={item.from} /> <span className="text-ink-ghost">→</span>{" "}
              <Addr chainId={chainId} addr={item.to} />
            </>
          ) : item.type === "registered" || item.type === "revoked" ? (
            <Addr chainId={chainId} addr={item.confidential} />
          ) : null}
          <span className="text-ink-ghost"> · block {item.blockNumber.toString()}</span>
        </div>
      </div>
      <a
        href={explorerTxUrl(chainId, item.txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-2xs text-ink-faint hover:text-ink transition-colors shrink-0"
      >
        tx ↗
      </a>
    </li>
  );
}

function Addr({ chainId, addr, prefix }: { chainId: number; addr: string; prefix?: string }) {
  return (
    <a
      href={explorerAddressUrl(chainId, addr)}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-ink transition-colors"
      title={addr}
    >
      {prefix}
      {truncateAddress(addr)}
    </a>
  );
}

function Glyph({ type }: { type: GlobalActivityItem["type"] }) {
  const cls = cn(
    "grid place-items-center h-8 w-8 rounded-pill border shrink-0",
    type === "revoked" ? "border-danger/25 bg-danger/10 text-danger" : "border-line-strong bg-elevate/[0.06] text-ink",
  );
  return (
    <span className={cls}>
      {type === "unwrap" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M8 3v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : type === "wrap" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M8 13V5M5 8l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : type === "transfer" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : type === "registered" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-12 text-center text-13 text-ink-faint">{text}</div>;
}
