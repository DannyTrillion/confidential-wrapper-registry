"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import type { EnrichedPair } from "@/lib/registry/types";
import { EXPLORER_NETWORKS } from "./NetworkContext";
import { type SupportedChainId } from "@/lib/networks";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/format";

/** Dispatch this to open the palette from anywhere (e.g. the header hint). */
export const CMDK_OPEN_EVENT = "cmdk:open";

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: "token" | "network" | "wallet" | "link";
  run: () => void;
};

export function CommandPalette({
  pairs,
  chainId,
  onOpenPair,
  setChainId,
}: {
  pairs: EnrichedPair[];
  chainId: SupportedChainId;
  onOpenPair: (p: EnrichedPair) => void;
  setChainId: (id: SupportedChainId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Open/close wiring: ⌘K / Ctrl+K and a custom event.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(CMDK_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(CMDK_OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Defer focus to next frame so the element exists.
      requestAnimationFrame(() => inputRef.current?.focus());
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const tokenItems: Item[] = pairs.map((p) => ({
      id: `pair-${p.index}`,
      group: "Tokens",
      label: `${p.underlying.symbol ?? truncateAddress(p.token)} → ${p.wrapper.symbol ?? "cToken"}`,
      hint: p.isValid ? "Manage" : "Revoked",
      keywords: `${p.underlying.symbol} ${p.underlying.name} ${p.wrapper.symbol} ${p.token} ${p.confidentialToken}`,
      icon: "token",
      run: () => onOpenPair(p),
    }));

    const networkItems: Item[] = EXPLORER_NETWORKS.filter((n) => n.chainId !== chainId).map((n) => ({
      id: `net-${n.chainId}`,
      group: "Network",
      label: `Switch registry to ${n.name}`,
      hint: n.isTestnet ? "Testnet" : "Mainnet",
      keywords: `network ${n.name} ${n.shortName}`,
      icon: "network",
      run: () => setChainId(n.chainId as SupportedChainId),
    }));

    const walletItems: Item[] = [
      isConnected
        ? {
            id: "wallet-disconnect",
            group: "Wallet",
            label: "Disconnect wallet",
            keywords: "disconnect logout wallet",
            icon: "wallet",
            run: () => disconnect(),
          }
        : {
            id: "wallet-connect",
            group: "Wallet",
            label: "Connect wallet",
            keywords: "connect wallet metamask",
            icon: "wallet",
            run: () => connectors[0] && connect({ connector: connectors[0] }),
          },
    ];

    const linkItems: Item[] = [
      {
        id: "link-docs",
        group: "Links",
        label: "Open registry docs",
        keywords: "docs documentation zama registry",
        icon: "link",
        run: () =>
          window.open(
            "https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry",
            "_blank",
          ),
      },
    ];

    return [...tokenItems, ...networkItems, ...walletItems, ...linkItems];
  }, [pairs, chainId, isConnected, connect, connectors, disconnect, onOpenPair, setChainId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => `${it.label} ${it.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  // Group while preserving order.
  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flat = filtered; // index space for keyboard nav

  useEffect(() => {
    if (active >= flat.length) setActive(Math.max(0, flat.length - 1));
  }, [flat.length, active]);

  function choose(i: number) {
    const it = flat[i];
    if (!it) return;
    setOpen(false);
    it.run();
  }

  function onListKey(e: ReactKeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    }
  }

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div className="absolute left-1/2 top-[12vh] w-[min(92vw,560px)] -translate-x-1/2 animate-rise-in">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="rounded-card border border-line-strong bg-surface/85 backdrop-blur-2xl overflow-hidden outline-none"
        >
          {/* Search */}
          <div className="flex items-center gap-2.5 px-4 h-12 border-b border-line">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-faint shrink-0" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onListKey}
              placeholder="Search tokens, switch network, run an action…"
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-listbox"
              aria-activedescendant={flat[active] ? `cmdk-opt-${active}` : undefined}
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-ghost outline-none"
            />
            <kbd className="text-2xs font-mono text-ink-ghost border border-line rounded-[4px] px-1.5 py-0.5">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} id="cmdk-listbox" role="listbox" aria-label="Results" className="max-h-[52vh] overflow-y-auto py-1.5">
            {flat.length === 0 ? (
              <div className="px-4 py-8 text-center text-13 text-ink-faint">No matches.</div>
            ) : (
              groups.map(([group, gItems]) => (
                <div key={group} className="px-1.5 pb-1">
                  <div className="px-2.5 pt-2 pb-1 text-2xs uppercase tracking-wide text-ink-ghost">{group}</div>
                  {gItems.map((it) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const isActive = idx === active;
                    return (
                      <button
                        key={it.id}
                        id={`cmdk-opt-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => choose(idx)}
                        className={cn(
                          "relative w-full flex items-center gap-3 px-2.5 py-2 rounded-[6px] text-left transition-colors duration-150",
                          isActive ? "bg-raised" : "hover:bg-raised/60",
                        )}
                      >
                        {isActive && <span className="absolute left-0 inset-y-1.5 w-[2px] rounded-pill bg-accent" />}
                        <ItemIcon kind={it.icon} active={isActive} />
                        <span className={cn("flex-1 text-13 truncate", isActive ? "text-ink" : "text-ink-muted")}>
                          {it.label}
                        </span>
                        {it.hint && (
                          <span
                            className={cn(
                              "text-2xs font-mono shrink-0",
                              it.hint === "Revoked" ? "text-danger" : "text-ink-ghost",
                            )}
                          >
                            {it.hint}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-3 px-4 h-9 border-t border-line text-2xs text-ink-ghost">
            <span className="flex items-center gap-1">
              <Key>↑</Key>
              <Key>↓</Key> navigate
            </span>
            <span className="flex items-center gap-1">
              <Key>↵</Key> open
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Key>⌘</Key>
              <Key>K</Key> toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid place-items-center min-w-4 h-4 px-1 font-mono text-2xs text-ink-faint border border-line rounded-[3px]">
      {children}
    </kbd>
  );
}

function ItemIcon({ kind, active }: { kind: Item["icon"]; active: boolean }) {
  const cls = cn("h-3.5 w-3.5 shrink-0", active ? "text-accentInk" : "text-ink-faint");
  if (kind === "network")
    return (
      <svg viewBox="0 0 16 16" className={cls} fill="none" aria-hidden="true">
        <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2C6 4 6 12 8 14" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  if (kind === "wallet")
    return (
      <svg viewBox="0 0 16 16" className={cls} fill="none" aria-hidden="true">
        <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M11 8.5h.01M2 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (kind === "link")
    return (
      <svg viewBox="0 0 16 16" className={cls} fill="none" aria-hidden="true">
        <path d="M9 3h4v4M13 3 7 9M7 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  // token — a small seal
  return (
    <svg viewBox="0 0 16 16" className={cls} fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7V5.5a3 3 0 0 1 6 0V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
