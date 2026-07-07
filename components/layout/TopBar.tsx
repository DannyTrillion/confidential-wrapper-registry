"use client";

import Link from "next/link";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { BrandGlyph } from "./BrandGlyph";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CMDK_OPEN_EVENT } from "@/components/CommandPalette";

/**
 * jup.ag-style top bar: a wide search field leads (the sidebar carries all
 * navigation) and a muted wallet cluster sits right. Nothing here is bright —
 * the page's one accent CTA lives in the content.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30">
      <div className="h-14 border-b border-line bg-base/80 backdrop-blur-xl">
        <div className="h-full px-3 sm:px-5 flex items-center gap-3">
          {/* Mobile brand (sidebar hidden < lg) */}
          <Link href="/" className="lg:hidden grid place-items-center h-8 w-8 rounded-input bg-raised shrink-0" aria-label="Home">
            <BrandGlyph className="h-4 w-4 text-accentInk" />
          </Link>

          <button
            data-tour="search"
            onClick={() => window.dispatchEvent(new Event(CMDK_OPEN_EVENT))}
            className="group flex items-center gap-2.5 h-9 flex-1 max-w-sm px-3.5 rounded-input border border-line bg-well text-13 text-ink-ghost hover:border-line-strong hover:text-ink-faint transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:block truncate">Search tokens, jump anywhere…</span>
            <span className="ml-auto font-mono text-2xs border border-line rounded-[4px] px-1 py-0.5 shrink-0 transition-colors duration-200 group-hover:border-line-strong group-hover:text-ink-muted">
              ⌘K
            </span>
          </button>

          <div data-tour="connect" className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <NetworkSwitcher />
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
