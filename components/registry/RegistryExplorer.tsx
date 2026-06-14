"use client";

import { useMemo, useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { getNetwork } from "@/lib/networks";
import type { EnrichedPair } from "@/lib/registry/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Address } from "@/components/ui/Address";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIdentity } from "./TokenIdentity";
import { AnimatedNumber } from "@/components/fx/AnimatedNumber";
import { useFlip } from "@/lib/hooks/useFlip";
import { useActiveRect } from "@/lib/hooks/useActiveRect";
import { cn } from "@/lib/cn";

type Filter = "all" | "active" | "revoked";

/** Action tabs a row can deep-link straight into on the token page. */
export type TokenAction = "wrap" | "unwrap" | "reveal" | "faucet";

export function RegistryExplorer({
  onOpenPair,
}: {
  onOpenPair: (p: EnrichedPair, action?: TokenAction) => void;
}) {
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { data: pairs, isLoading, isError, error, refetch, isFetching } = useRegistryPairs(chainId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const valid = pairs?.filter((p) => p.isValid).length ?? 0;
    const revoked = (pairs?.length ?? 0) - valid;
    return { total: pairs?.length ?? 0, valid, revoked };
  }, [pairs]);

  const visible = useMemo(() => {
    if (!pairs) return [];
    const q = query.trim().toLowerCase();
    return pairs.filter((p) => {
      if (filter === "active" && !p.isValid) return false;
      if (filter === "revoked" && p.isValid) return false;
      if (!q) return true;
      return [
        p.underlying.symbol,
        p.underlying.name,
        p.wrapper.symbol,
        p.wrapper.name,
        p.token,
        p.confidentialToken,
      ]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [pairs, query, filter]);

  return (
    <div className="space-y-5">
      <StatStrip
        network={net.name}
        isTestnet={net.isTestnet}
        counts={counts}
        loading={isLoading}
      />

      <Card>
        <Toolbar
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          onRefresh={() => refetch()}
          refreshing={isFetching && !isLoading}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} networkName={net.name} />
        ) : counts.total === 0 ? (
          <EmptyRegistry networkName={net.name} />
        ) : visible.length === 0 ? (
          <NoMatches query={query} onClear={() => { setQuery(""); setFilter("all"); }} />
        ) : (
          <PairTable pairs={visible} chainId={chainId} onManage={onOpenPair} />
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ stats */

function StatStrip({
  network,
  isTestnet,
  counts,
  loading,
}: {
  network: string;
  isTestnet: boolean;
  counts: { total: number; valid: number; revoked: number };
  loading: boolean;
}) {
  const total = Math.max(1, counts.total);
  const activePct = (counts.valid / total) * 100;
  const revokedPct = (counts.revoked / total) * 100;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Network" value={network} sub={isTestnet ? "Testnet" : "Mainnet"} tone="accent" />
        <Stat label="Registered pairs" value={loading ? null : String(counts.total)} />
        <Stat label="Active" value={loading ? null : String(counts.valid)} tone="valid" />
        <Stat label="Revoked" value={loading ? null : String(counts.revoked)} tone="revoked" />
      </div>
      {/* Composition meter — at-a-glance registry health, muted on-theme tones. */}
      {!loading && counts.total > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-1 flex-1 overflow-hidden rounded-pill bg-elevate/[0.05]">
            <div className="bg-accent/45 transition-all duration-500" style={{ width: `${activePct}%` }} />
            <div className="bg-ink-faint/30 transition-all duration-500" style={{ width: `${revokedPct}%` }} />
          </div>
          <div className="flex items-center gap-3 text-2xs text-ink-faint shrink-0">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-pill bg-accent/70" />{counts.valid} active</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-pill bg-ink-faint/50" />{counts.revoked} revoked</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | null;
  sub?: string;
  tone?: "neutral" | "accent" | "valid" | "revoked";
}) {
  const valueColor =
    tone === "accent" ? "text-accent" : tone === "valid" ? "text-ok" : tone === "revoked" ? "text-danger" : "text-ink";
  const numeric = value !== null && /^\d[\d,]*$/.test(value);
  return (
    <Card className="px-4 py-3">
      <div className="text-2xs text-ink-faint uppercase tracking-wide">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        {value === null ? (
          <Skeleton className="h-6 w-14" />
        ) : (
          <span className={cn("font-mono text-xl tabular-nums", valueColor)}>
            {numeric ? <AnimatedNumber value={Number(value.replace(/,/g, ""))} /> : value}
          </span>
        )}
        {sub && <span className="text-2xs text-ink-faint">{sub}</span>}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- toolbar */

function Toolbar({
  query,
  setQuery,
  filter,
  setFilter,
  counts,
  onRefresh,
  refreshing,
}: {
  query: string;
  setQuery: (v: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  counts: { total: number; valid: number; revoked: number };
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.total },
    { key: "active", label: "Active", count: counts.valid },
    { key: "revoked", label: "Revoked", count: counts.revoked },
  ];

  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const filterInd = useActiveRect(tabsRef, [filter]);
  // "/" focuses search (when not already typing somewhere).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-line">
      <div className="relative flex-1 min-w-0">
        <svg viewBox="0 0 16 16" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol, name, or address…"
          aria-label="Search registry"
          className="w-full h-9 pl-9 pr-9 rounded-input bg-base border border-line text-13 text-ink placeholder:text-ink-ghost focus-visible:border-accent/50 transition-colors"
        />
        {!query && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-2xs text-ink-ghost border border-line rounded-[3px] px-1 py-0.5 pointer-events-none">
            /
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div ref={tabsRef} role="tablist" className="relative inline-flex items-center p-0.5 rounded-input border border-line glass-soft">
          <span
            className="absolute rounded-[5px] bg-raised transition-all duration-250 ease-out"
            style={{ left: filterInd.left, top: filterInd.top, width: filterInd.width, height: filterInd.height, opacity: filterInd.visible ? 1 : 0 }}
            aria-hidden="true"
          />
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              data-active={filter === t.key ? "true" : undefined}
              aria-selected={filter === t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-2xs font-medium transition-colors duration-150",
                filter === t.key ? "text-ink" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              {t.label}
              <span className="font-mono tabular-nums text-ink-faint">{t.count}</span>
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Refresh registry" loading={refreshing}>
          {!refreshing && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path d="M13 8a5 5 0 1 1-1.46-3.54M13 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ table */

function PairTable({
  pairs,
  chainId,
  onManage,
}: {
  pairs: EnrichedPair[];
  chainId: number;
  onManage: (p: EnrichedPair, action?: TokenAction) => void;
}) {
  const [active, setActive] = useState(-1);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  // Surviving rows glide to fill gaps when filtering, so the table never jumps.
  useFlip(bodyRef, [pairs.map((p) => p.index).join(",")]);

  // Keep the active index in range as the filtered list changes.
  useEffect(() => {
    setActive((a) => (a >= pairs.length ? pairs.length - 1 : a));
  }, [pairs.length]);

  function onKeyDown(e: ReactKeyboardEvent) {
    const key = e.key;
    if (key === "ArrowDown" || key === "j") {
      e.preventDefault();
      setActive((a) => Math.min((a < 0 ? -1 : a) + 1, pairs.length - 1));
    } else if (key === "ArrowUp" || key === "k") {
      e.preventDefault();
      setActive((a) => Math.max((a < 0 ? 0 : a) - 1, 0));
    } else if (key === "Enter" && active >= 0) {
      e.preventDefault();
      onManage(pairs[active]);
    } else if (key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (key === "End") {
      e.preventDefault();
      setActive(pairs.length - 1);
    }
  }

  // Scroll the active row into view when navigating by keyboard.
  useEffect(() => {
    if (active < 0) return;
    const row = bodyRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      {/* Desktop table */}
      <div
        id="registry-table"
        className="hidden md:block focus-visible:ring-2 focus-visible:ring-accent rounded-card scroll-mt-24"
        tabIndex={0}
        role="grid"
        aria-label="Wrapper pairs — use arrow keys to navigate, Enter to open"
        onKeyDown={onKeyDown}
        onBlur={() => setActive(-1)}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="text-2xs text-ink-faint uppercase tracking-wide">
              <th className="font-medium px-4 py-2 w-10">#</th>
              <th className="font-medium px-4 py-2">Underlying ERC-20</th>
              <th className="font-medium px-4 py-2">Confidential wrapper</th>
              <th className="font-medium px-4 py-2 text-right">Decimals</th>
              <th className="font-medium px-4 py-2">Status</th>
              <th className="font-medium px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {pairs.map((p, i) => (
              <tr
                key={p.index}
                data-row={i}
                data-flip={p.index}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "border-t border-line group transition-colors animate-rise-in",
                  active === i ? "bg-raised/50" : "hover:bg-raised/40",
                  !p.isValid && "opacity-70",
                )}
                style={{ animationDelay: `${Math.min(i * 22, 320)}ms` }}
              >
                <td className="relative px-4 py-3 font-mono text-2xs text-ink-ghost tabular-nums">
                  {/* Accent indicator — on hover or keyboard-active. */}
                  <span
                    className={cn(
                      "absolute left-0 inset-y-0 w-[2px] bg-accent origin-top transition-all duration-200 ease-out group-hover:scale-y-100 group-hover:opacity-100",
                      active === i ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
                    )}
                  />
                  {p.index}
                </td>
                <td className="px-4 py-3">
                  <TokenIdentity meta={p.underlying} address={p.token} />
                  <Address address={p.token} chainId={chainId} className="mt-1" />
                </td>
                <td className="px-4 py-3">
                  <TokenIdentity meta={p.wrapper} address={p.confidentialToken} confidential />
                  <Address address={p.confidentialToken} chainId={chainId} className="mt-1" />
                </td>
                <td className="px-4 py-3 text-right font-mono text-13 text-ink-muted tabular-nums">
                  {p.underlying.decimals ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {p.isValid ? (
                      <Badge tone="valid" dot>Active</Badge>
                    ) : (
                      <Badge tone="revoked" dot>Revoked</Badge>
                    )}
                    {p.source === "local" && <Badge tone="accent">Local</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {p.isValid ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => onManage(p, "wrap")}>
                          Wrap
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => onManage(p, "reveal")}>
                          Reveal
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label="Open token details"
                          className="!px-2"
                          onClick={() => onManage(p)}
                        >
                          <OpenIcon />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => onManage(p)}>
                        Inspect
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-line">
        {pairs.map((p) => (
          <div key={p.index} className={cn("p-4 space-y-3", !p.isValid && "opacity-70")}>
            <div className="flex items-center justify-between">
              <TokenIdentity meta={p.underlying} address={p.token} />
              <div className="flex items-center gap-1.5">
                {p.isValid ? <Badge tone="valid" dot>Active</Badge> : <Badge tone="revoked" dot>Revoked</Badge>}
                {p.source === "local" && <Badge tone="accent">Local</Badge>}
              </div>
            </div>
            <Address address={p.token} chainId={chainId} />
            <div className="flex items-center gap-2 text-ink-ghost text-2xs">
              <span className="h-px flex-1 bg-line" />
              wraps into
              <span className="h-px flex-1 bg-line" />
            </div>
            <TokenIdentity meta={p.wrapper} address={p.confidentialToken} confidential />
            <Address address={p.confidentialToken} chainId={chainId} />
            {p.isValid ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => onManage(p, "wrap")}>
                  Wrap
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => onManage(p, "reveal")}>
                  Reveal
                </Button>
                <Button size="sm" variant="secondary" aria-label="Open token details" className="!px-2.5" onClick={() => onManage(p)}>
                  <OpenIcon />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onManage(p)}>
                Inspect
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- empty/error */

function TableSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-4" />
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="h-8 w-8 rounded-pill" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="h-8 w-8 rounded-pill" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-pill" />
          <Skeleton className="h-8 w-20 rounded-input" />
        </div>
      ))}
    </div>
  );
}

function EmptyRegistry({ networkName }: { networkName: string }) {
  return (
    <div className="px-4 py-16 text-center">
      <GlyphCircle />
      <h3 className="mt-4 text-sm font-medium text-ink">No wrapper pairs registered yet</h3>
      <p className="mt-1.5 text-13 text-ink-faint max-w-sm mx-auto">
        The registry on {networkName} doesn&apos;t list any confidential wrappers right now. New
        pairs appear here automatically the moment they&apos;re registered on-chain.
      </p>
    </div>
  );
}

function NoMatches({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="px-4 py-16 text-center">
      <GlyphCircle />
      <h3 className="mt-4 text-sm font-medium text-ink">No pairs match your filters</h3>
      <p className="mt-1.5 text-13 text-ink-faint">
        {query ? <>Nothing matches “{query}”.</> : "Try a different status filter."}
      </p>
      <Button size="sm" variant="ghost" className="mt-3" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

function ErrorState({ message, onRetry, networkName }: { message?: string; onRetry: () => void; networkName: string }) {
  return (
    <div className="px-4 py-16 text-center">
      <div className="grid place-items-center h-12 w-12 mx-auto rounded-pill border border-danger/20 bg-danger/10">
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-danger" fill="none" aria-hidden="true">
          <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-medium text-ink">Couldn&apos;t reach the {networkName} registry</h3>
      <p className="mt-1.5 text-13 text-ink-faint max-w-md mx-auto">
        The RPC request failed. This is usually a transient public-RPC hiccup — retrying often
        fixes it.
      </p>
      {message && (
        <p className="mt-2 font-mono text-2xs text-ink-ghost max-w-md mx-auto truncate">{message}</p>
      )}
      <Button size="sm" variant="secondary" className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function GlyphCircle() {
  return (
    <div className="grid place-items-center h-12 w-12 mx-auto rounded-pill border border-line bg-raised">
      <svg viewBox="0 0 20 20" className="h-5 w-5 text-ink-faint" fill="none" aria-hidden="true">
        <rect x="4" y="9" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.5 9V7a3.5 3.5 0 1 1 7 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Compact "open full details" affordance used alongside the quick actions. */
function OpenIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M6 3.5h6.5V10M12.5 3.5 7 9M7 4.5H4.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
