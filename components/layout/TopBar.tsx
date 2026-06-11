"use client";

import { NetworkSwitcher } from "./NetworkSwitcher";
import { BrandGlyph } from "./BrandGlyph";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { SessionChip } from "@/components/SessionChip";
import { CMDK_OPEN_EVENT } from "@/components/CommandPalette";

/** Sticky top bar (alongside the sidebar): command search + network + wallet. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-line bg-base/70 backdrop-blur-xl">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Mobile logo (sidebar hidden on small screens) */}
        <div className="lg:hidden grid place-items-center h-9 w-9 rounded-input bg-accent shrink-0">
          <BrandGlyph className="h-[18px] w-[18px] text-base" />
        </div>

        <button
          data-tour="search"
          onClick={() => window.dispatchEvent(new Event(CMDK_OPEN_EVENT))}
          className="hidden md:flex items-center gap-2 h-9 w-72 px-3 rounded-pill border border-line bg-white/[0.03] text-13 text-ink-faint hover:border-line-strong hover:text-ink-muted transition-colors"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Search tokens, jump anywhere…
          <span className="ml-auto font-mono text-2xs border border-line rounded-[4px] px-1 py-0.5">⌘K</span>
        </button>

        <div data-tour="connect" className="flex items-center gap-2 sm:gap-3 ml-auto">
          <SessionChip />
          <NetworkSwitcher />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
