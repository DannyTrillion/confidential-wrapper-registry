"use client";

import { useState, useRef, useEffect } from "react";
import { useExplorerNetwork, EXPLORER_NETWORKS } from "@/components/NetworkContext";
import { cn } from "@/lib/cn";
import type { SupportedChainId } from "@/lib/networks";

/** Segmented on desktop, compact dropdown on mobile. Chooses the browsed network. */
export function NetworkSwitcher() {
  const { chainId, setChainId } = useExplorerNetwork();
  return (
    <>
      <div
        key={chainId}
        role="tablist"
        aria-label="Registry network"
        className="hidden sm:inline-flex items-center p-0.5 rounded-input border border-line bg-raised/70 animate-fade-in"
      >
        {EXPLORER_NETWORKS.map((net) => {
          const active = net.chainId === chainId;
          return (
            <button
              key={net.chainId}
              role="tab"
              aria-selected={active}
              onClick={() => setChainId(net.chainId as SupportedChainId)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-2xs font-medium transition-colors duration-150",
                active ? "bg-surface text-ink" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-pill", active ? (net.isTestnet ? "bg-accent" : "bg-ok") : "bg-ink-ghost")} />
              {net.shortName}
            </button>
          );
        })}
      </div>
      <NetworkDropdown chainId={chainId} setChainId={setChainId} />
    </>
  );
}

function NetworkDropdown({ chainId, setChainId }: { chainId: SupportedChainId; setChainId: (id: SupportedChainId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const active = EXPLORER_NETWORKS.find((n) => n.chainId === chainId)!;
  return (
    <div className="relative sm:hidden" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Registry network"
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-input border border-line bg-raised text-2xs font-medium text-ink"
      >
        <span className={cn("h-1.5 w-1.5 rounded-pill", active.isTestnet ? "bg-accent" : "bg-ok")} />
        {active.shortName}
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-ink-faint" fill="none" aria-hidden="true">
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-card border border-line bg-surface p-1 animate-fade-in z-50">
          {EXPLORER_NETWORKS.map((net) => (
            <button
              key={net.chainId}
              onClick={() => {
                setChainId(net.chainId as SupportedChainId);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-[6px] text-13 transition-colors",
                net.chainId === chainId ? "text-ink bg-raised" : "text-ink-muted hover:bg-raised",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-pill", net.isTestnet ? "bg-accent" : "bg-ok")} />
              {net.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
