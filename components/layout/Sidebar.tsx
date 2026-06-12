"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navItems";
import { BrandGlyph } from "./BrandGlyph";
import { TOUR_START_EVENT } from "@/components/onboarding/OnboardingTour";
import { useActiveRect } from "@/lib/hooks/useActiveRect";
import { cn } from "@/lib/cn";

/** Desktop left rail — primary navigation. Glass, with a yellow indicator that
 *  glides to the active item. */
export function Sidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const ind = useActiveRect(navRef, [pathname]);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-line bg-surface/50 backdrop-blur-xl z-30">
      <Link href="/" className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
        <span className="grid place-items-center h-9 w-9 rounded-input bg-accent shrink-0">
          <BrandGlyph className="h-[18px] w-[18px] text-base" />
        </span>
        <div className="leading-none">
          <div className="text-sm font-semibold text-ink">Wrapper Registry</div>
          <div className="text-[10px] text-ink-faint mt-1 uppercase tracking-[0.12em]">Confidential · FHE</div>
        </div>
      </Link>

      <nav ref={navRef} className="relative flex-1 px-3 py-4 space-y-1">
        <span
          className="absolute left-3 w-[2px] rounded-pill bg-accent transition-all duration-300 ease-out"
          style={{ top: ind.top + 6, height: Math.max(0, ind.height - 12), opacity: ind.visible ? 1 : 0 }}
          aria-hidden="true"
        />
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active ? "true" : undefined}
              data-tour={`nav-${item.href}`}
              className={cn(
                "relative flex items-center gap-3 h-10 px-3 rounded-input text-sm font-medium transition-colors duration-200",
                active ? "text-ink bg-white/[0.04]" : "text-ink-faint hover:text-ink hover:bg-white/[0.025]",
              )}
            >
              <span className={cn("transition-colors duration-200", active ? "text-accent" : "")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/docs"
          data-active={pathname === "/docs" ? "true" : undefined}
          className={cn(
            "relative flex items-center gap-3 h-10 px-3 rounded-input text-sm font-medium transition-colors duration-200",
            pathname === "/docs" ? "text-ink bg-white/[0.04]" : "text-ink-faint hover:text-ink hover:bg-white/[0.025]",
          )}
        >
          <span className={cn("transition-colors", pathname === "/docs" ? "text-accent" : "")}>
            <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
              <path d="M3.5 3.5h7a2 2 0 0 1 2 2v9H5.5a2 2 0 0 1-2-2v-9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M12.5 5.5h2v9H5.5M6 6.5h4M6 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
          Guide
        </Link>

        <Link
          href="/extend"
          data-active={pathname === "/extend" ? "true" : undefined}
          className={cn(
            "relative flex items-center gap-3 h-10 px-3 rounded-input text-sm font-medium transition-colors duration-200",
            pathname === "/extend" ? "text-ink bg-white/[0.04]" : "text-ink-faint hover:text-ink hover:bg-white/[0.025]",
          )}
        >
          <span className={cn("transition-colors", pathname === "/extend" ? "text-accent" : "")}>
            <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
              <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          Add a pair
        </Link>
      </nav>

      <div className="px-3 py-3 border-t border-line space-y-1">
        <button
          onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
          className="w-full flex items-center gap-3 h-9 px-3 rounded-input text-13 font-medium text-ink-faint hover:text-accent hover:bg-white/[0.025] transition-colors"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5.2v.01M7 7.4h1v3.4M6.8 10.8h2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Take a tour
        </button>
        <a
          href="https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 h-9 px-3 rounded-input text-13 text-ink-faint hover:text-accent hover:bg-white/[0.025] transition-colors"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M9 3h4v4M13 3 7 9M7 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Developer docs
        </a>
      </div>
    </aside>
  );
}
