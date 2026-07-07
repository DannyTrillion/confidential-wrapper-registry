"use client";

import { useMemo, useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { useMyBalances } from "@/lib/fhevm/useMyBalances";
import { useSelectedPair } from "@/components/SelectedPairContext";
import { getNetwork } from "@/lib/networks";
import type { EnrichedPair } from "@/lib/registry/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIcon } from "@/components/fx/TokenIcon";
import { AnimatedNumber } from "@/components/fx/AnimatedNumber";
import { useFlip } from "@/lib/hooks/useFlip";
import { cn } from "@/lib/cn";

type Filter = "all" | "active" | "revoked";

/** Action tabs a row can deep-link straight into on the token page. */
export type TokenAction = "wrap" | "unwrap" | "reveal" | "faucet";

/**
 * jup.ag-style market list: a flat stat strip, a two-line section header with
 * the toolbar inline, then borderless hover rows where each pair reads like a
 * market — identity left, right-aligned stat stacks, actions on the end.
 */
export function RegistryExplorer({
  onOpenPair,
}: {
  onOpenPair: (p: EnrichedPair, action?: TokenAction) => void;
}) {
  const { chainId } = useExplorerNetwork();
  const net = getNetwork(chainId)!;
  const { address, isConnected } = useAccount();
  const { data: pairs, isLoading, isError, error, refetch, isFetching } = useRegistryPairs(chainId);
  const { data: holdings } = useMyBalances(chainId, address, pairs ?? []);
  const { selected, setSelected } = useSelectedPair();

  // Which pair indices the connected wallet holds a confidential balance in.
  const heldIdx = useMemo(
    () => new Set((holdings ?? []).map((h) => h.pair.index)),
    [holdings],
  );

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
        holdingsCount={isConnected ? (holdings?.length ?? 0) : null}
      />

      <section className="space-y-5">
        {/* Manifesto header — app-header scale, not marketing hero. */}
        <div className="relative pt-1 sm:pt-2">
          <span
            className="pointer-events-none absolute -top-14 -left-20 h-[240px] w-[480px] rounded-full blur-3xl bg-[radial-gradient(closest-side,rgb(var(--overlay)/0.045),transparent)]"
            aria-hidden="true"
          />
          <h2 className="relative text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink text-balance">
            Every balance encrypted.
            <br />
            <span className="text-ink-faint">Until you reveal.</span>
          </h2>
          <p className="relative mt-2 text-13 text-ink-faint">
            The onchain Wrapper Registry
            <span className="text-ink-ghost"> · all wrappers redeem 1:1</span>
          </p>
          {/* Lifecycle coverage — the whole loop lives here, receipted. */}
          <div className="relative mt-3.5 flex items-center gap-2 flex-wrap font-mono text-2xs uppercase tracking-[0.08em]">
            {["Discover", "Wrap", "Reveal", "Unwrap"].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-ink-ghost" aria-hidden="true">→</span>}
                <span className="text-ink-muted">{step}</span>
              </span>
            ))}
            <span className="text-ink-ghost" aria-hidden="true">·</span>
            <Link
              href="/developers#proof"
              className="normal-case tracking-normal text-ink-faint hover:text-ink transition-colors"
            >
              full lifecycle, verified on Sepolia →
            </Link>
          </div>
        </div>

        <Toolbar
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          onRefresh={() => refetch()}
          refreshing={isFetching && !isLoading}
        />

        <Card className="overflow-hidden">
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} networkName={net.name} />
          ) : counts.total === 0 ? (
            <EmptyRegistry networkName={net.name} />
          ) : visible.length === 0 ? (
            <NoMatches query={query} onClear={() => { setQuery(""); setFilter("all"); }} />
          ) : (
            <PairList
              pairs={visible}
              onManage={onOpenPair}
              onSelect={setSelected}
              selectedIndex={selected?.index ?? null}
              heldIdx={heldIdx}
            />
          )}
        </Card>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ stats */

/** Flat hairline stat strip — the page's compact header: network identity, the
 *  headline registry numbers, and (when connected) a one-line portfolio link. */
function StatStrip({
  network,
  isTestnet,
  counts,
  loading,
  holdingsCount,
}: {
  network: string;
  isTestnet: boolean;
  counts: { total: number; valid: number; revoked: number };
  loading: boolean;
  /** Connected wallet's encrypted-balance count; null when disconnected. */
  holdingsCount: number | null;
}) {
  return (
    <div className="flex items-center gap-x-8 sm:gap-x-10 pt-1 overflow-x-auto">
      <div className="flex items-center gap-2.5 shrink-0">
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-cipher shrink-0" fill="none" aria-hidden="true">
          <rect x="4" y="9" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 9V7a3.5 3.5 0 1 1 7 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div>
          <div className="font-mono text-sm text-ink leading-tight">{network}</div>
          <div className="text-2xs text-ink-ghost uppercase tracking-wide whitespace-nowrap">
            {isTestnet ? "Testnet" : "Mainnet"} · Onchain registry
          </div>
        </div>
      </div>
      <Stat label="Wrapper pairs" value={counts.total} loading={loading} />
      <Stat label="Active" value={counts.valid} loading={loading} tone="valid" />
      <Stat label="Revoked" value={counts.revoked} loading={loading} tone="revoked" />

      {holdingsCount != null && holdingsCount > 0 && (
        <Link
          href="/portfolio"
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-13 text-ink-faint hover:text-ink transition-colors whitespace-nowrap"
        >
          <span className="font-mono tabular-nums text-ink-muted">{holdingsCount}</span>
          encrypted {holdingsCount === 1 ? "balance" : "balances"}
          <span className="text-ink-muted">→ Open Portfolio</span>
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
  tone = "neutral",
}: {
  label: string;
  value: number;
  loading: boolean;
  tone?: "neutral" | "valid" | "revoked";
}) {
  const color =
    tone === "valid"
      ? "text-accentInk"
      : tone === "revoked"
        ? value > 0
          ? "text-danger"
          : "text-ink-muted"
        : "text-ink";
  return (
    <div className="flex flex-col gap-0.5 shrink-0">
      {loading ? (
        <Skeleton className="h-5 w-8" />
      ) : (
        <span className={cn("font-mono text-lg tabular-nums leading-none font-medium", color)}>
          <AnimatedNumber value={value} />
        </span>
      )}
      <span className="text-2xs text-ink-faint uppercase tracking-wide whitespace-nowrap">{label}</span>
    </div>
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      <div className="relative flex-1 sm:flex-none sm:w-72 min-w-0">
        <svg viewBox="0 0 16 16" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol, name, or address…"
          aria-label="Search registry"
          className="w-full h-9 pl-9 pr-9 rounded-input bg-well border border-line text-13 text-ink placeholder:text-ink-ghost focus-visible:border-ink/40 transition-colors"
        />
        {!query && (
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-2xs text-ink-ghost border border-line rounded-[3px] px-1 py-0.5 pointer-events-none">
            /
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-5 sm:gap-6 sm:pl-3">
        <div role="tablist" className="flex items-center gap-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={filter === t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "inline-flex items-baseline gap-1.5 text-13 transition-colors duration-150 rounded-[4px]",
                filter === t.key ? "text-ink font-semibold" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              {t.label}
              <span className="font-mono text-2xs tabular-nums font-normal text-ink-ghost">{t.count}</span>
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

/* ------------------------------------------------------------------- rows */

function PairList({
  pairs,
  onManage,
  onSelect,
  selectedIndex,
  heldIdx,
}: {
  pairs: EnrichedPair[];
  onManage: (p: EnrichedPair, action?: TokenAction) => void;
  onSelect: (p: EnrichedPair) => void;
  selectedIndex: number | null;
  heldIdx: Set<number>;
}) {
  const [active, setActive] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Surviving rows glide to fill gaps when filtering, so the list never jumps.
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
      onSelect(pairs[active]);
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
      {/* Desktop market list */}
      <div
        id="registry-table"
        ref={bodyRef}
        className="hidden md:block focus-visible:ring-2 focus-visible:ring-accent rounded-card scroll-mt-28 [mask-image:linear-gradient(to_bottom,black_calc(100%-88px),rgb(0_0_0/0.55))] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-88px),rgb(0_0_0/0.55))]"
        tabIndex={0}
        role="grid"
        aria-label="Wrapper pairs — use arrow keys to navigate, Enter to open in the side panel"
        onKeyDown={onKeyDown}
        onBlur={() => setActive(-1)}
      >
        {pairs.map((p, i) => {
          const isSel = selectedIndex === p.index;
          const held = heldIdx.has(p.index);
          return (
            <div
              key={p.index}
              role="row"
              data-row={i}
              data-flip={p.index}
              onMouseEnter={() => setActive(i)}
              onClick={() => onSelect(p)}
              className={cn(
                "relative grid items-center gap-3 px-4 py-4 cursor-pointer group transition-colors animate-rise-in",
                "grid-cols-[minmax(0,1fr)_120px_130px_300px]",
                i > 0 && "border-t border-elevate/[0.05]",
                isSel ? "bg-accent/[0.05]" : active === i ? "bg-raised/50" : "hover:bg-raised/40",
                !p.isValid && "opacity-70",
              )}
              style={{ animationDelay: `${Math.min(i * 22, 320)}ms` }}
            >
              {/* Accent bar — cipher when selected, neutral on hover/active. */}
              <span
                className={cn(
                  "absolute left-0 inset-y-2 w-[2px] rounded-pill origin-top transition-all duration-200 ease-out",
                  isSel
                    ? "bg-accent scale-y-100 opacity-100"
                    : active === i
                      ? "bg-ink/40 scale-y-100 opacity-100"
                      : "bg-ink/40 scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100",
                )}
                aria-hidden="true"
              />

              <PairIdentity pair={p} index={p.index} />

              {/* Encrypted handle → masked dots, never a number. No handle (or no
                  wallet) → muted em-dash — a confident 0 would be a lie here. */}
              <StatCell
                value={held ? <HeldMask /> : <span className="text-ink-ghost">—</span>}
                label="Balance"
              />

              <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                {p.isValid ? (
                  <Badge tone="valid" dot>Active</Badge>
                ) : (
                  <Badge tone="revoked" dot>Revoked</Badge>
                )}
                {p.source === "local" && <Badge tone="accent">Local</Badge>}
              </div>

              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                {p.isValid ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => onManage(p, "wrap")}>
                      Wrap
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onManage(p, "unwrap")}>
                      Unwrap
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
            </div>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-line">
        {pairs.map((p) => {
          const held = heldIdx.has(p.index);
          return (
            <div
              key={p.index}
              onClick={() => onSelect(p)}
              className={cn(
                "p-4 space-y-3 transition-colors",
                selectedIndex === p.index && "bg-cipher-faint",
                !p.isValid && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <PairIdentity pair={p} index={p.index} />
                <div className="flex items-center gap-1 whitespace-nowrap">
                  {p.isValid ? <Badge tone="valid" dot>Active</Badge> : <Badge tone="revoked" dot>Revoked</Badge>}
                  {p.source === "local" && <Badge tone="accent">Local</Badge>}
                </div>
              </div>
              <MobileStat
                value={held ? <HeldMask symbol={p.wrapper.symbol} /> : <span className="text-ink-ghost">—</span>}
                label="Balance"
              />
              <div onClick={(e) => e.stopPropagation()}>
                {p.isValid ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => onManage(p, "wrap")}>
                      Wrap
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => onManage(p, "unwrap")}>
                      Unwrap
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
            </div>
          );
        })}
      </div>
    </>
  );
}

/** jup.ag-style pair identity: one token avatar with a small lock badge (the
 *  wrapper is the same asset, made confidential), the pair spelled as
 *  `PUB → cPRIV` in mono, the full token name beneath. */
function PairIdentity({ pair, index }: { pair: EnrichedPair; index: number }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className="relative flex shrink-0 transition-transform duration-200 ease-out group-hover:scale-105"
        aria-hidden="true"
      >
        <TokenIcon symbol={pair.underlying.symbol} size={32} />
        <span className="absolute -bottom-0.5 -right-1 grid place-items-center h-4 w-4 rounded-pill bg-surface border border-line transition-transform duration-200 ease-out group-hover:scale-110">
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-cipher" fill="none">
            <rect x="2.5" y="5" width="7" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
            <path d="M4 5V3.8a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        </span>
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-mono text-13 leading-tight min-w-0">
          <span className="text-ink truncate">{pair.underlying.symbol ?? "ERC-20"}</span>
          <span className="text-ink-ghost shrink-0" aria-hidden="true">→</span>
          <span className="text-ink-muted truncate">{pair.wrapper.symbol ?? "cToken"}</span>
          <span className="hidden lg:inline font-mono text-2xs text-ink-ghost shrink-0">#{index}</span>
        </div>
        <div className="mt-0.5 text-2xs text-ink-faint truncate">
          {pair.underlying.name ?? "—"}
        </div>
      </div>
    </div>
  );
}

/** Right-aligned value-over-label stack, jup.ag market-row style. */
function StatCell({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-right">
      <div className="font-mono text-13 text-ink-muted tabular-nums leading-tight">{value}</div>
      <div className="mt-0.5 text-2xs text-ink-ghost uppercase tracking-wide">{label}</div>
    </div>
  );
}

function MobileStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-mono text-13 text-ink-muted tabular-nums">{value}</div>
      <div className="text-2xs text-ink-ghost uppercase tracking-wide">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------- empty/error */

function ListSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="h-8 w-12 rounded-pill" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <Skeleton className="hidden md:block h-8 w-16" />
          <Skeleton className="hidden md:block h-8 w-20" />
          <Skeleton className="h-5 w-16 rounded-pill" />
          <Skeleton className="h-8 w-24 rounded-input" />
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

/** Compact masked balance for the market list — signals "you hold this, and it
 *  stays encrypted until you reveal" without the full-size BalanceReveal. */
function HeldMask({ symbol }: { symbol?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-13 text-cipher [text-shadow:0_0_8px_rgb(var(--cipher)/0.45)]"
      title="You hold an encrypted balance — reveal it to see the amount"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none" aria-hidden="true">
        <rect x="3.5" y="7" width="9" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 7V5.4a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="tracking-[0.16em] select-none">•••</span>
      {symbol && <span className="text-ink-ghost tracking-normal">{symbol}</span>}
    </span>
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
